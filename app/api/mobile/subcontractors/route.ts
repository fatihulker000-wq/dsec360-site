import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY = "dsec_mobile_123";

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Yetkisiz istek",
    },
    { status: 401 }
  );
}

function checkApiKey(req: NextRequest) {
  return req.headers.get("x-api-key") === API_KEY;
}

function stringValue(
  value: unknown,
  fallback = ""
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function booleanValue(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "evet" ||
      normalized === "aktif"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === "hayır" ||
      normalized === "hayir" ||
      normalized === "pasif"
    ) {
      return false;
    }
  }

  return fallback;
}

/**
 * =========================================================
 * WEB -> APP
 * =========================================================
 *
 * GET /api/mobile/subcontractors?firmId=...
 */
export async function GET(
  req: NextRequest
) {
  try {
    if (!checkApiKey(req)) {
      return unauthorized();
    }

    const { searchParams } =
      new URL(req.url);

    const firmId =
      searchParams
        .get("firmId")
        ?.trim();

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunludur.",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabase
        .from("subcontractor_companies")
        .select("*")
        .eq("firm_id", firmId)
        .order("company_name", {
          ascending: true,
        });

    if (error) {
      console.error(
        "[SUBCONTRACTOR_GET]",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      subcontractors: data ?? [],
    });
  } catch (error) {
    console.error(
      "[SUBCONTRACTOR_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron kayıtları alınamadı.",
      },
      { status: 500 }
    );
  }
}

/**
 * =========================================================
 * APP -> WEB
 * =========================================================
 *
 * Android uygulamasından toplu kayıt kabul eder.
 *
 * Body:
 *
 * {
 *   "subcontractors": [...]
 * }
 */
export async function POST(
  req: NextRequest
) {
  try {
    if (!checkApiKey(req)) {
      return unauthorized();
    }

    const body = await req.json();

    const subcontractors =
      Array.isArray(body?.subcontractors)
        ? body.subcontractors
        : Array.isArray(body?.data)
          ? body.data
          : [];

    if (subcontractors.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const results: Array<{
      success: boolean;
      localId: number;
      local_id: number;
      remoteId?: string;
      remote_id?: string;
      error?: string;
    }> = [];

    for (const item of subcontractors) {
      const localId =
        Number(
          item.localId ??
            item.local_id ??
            0
        ) || 0;

      try {
        const firmId =
          stringValue(
            item.firm_id ??
              item.firmId
          );

        if (!firmId) {
          throw new Error(
            "firm_id bilgisi eksik."
          );
        }

        const syncKey =
          stringValue(
            item.sync_key ??
              item.syncKey
          );

        if (!syncKey) {
          throw new Error(
            "sync_key bilgisi eksik."
          );
        }

        const suppliedRemoteId =
          stringValue(
            item.remote_id ??
              item.remoteId ??
              item.id
          );

        const isDeleted =
          booleanValue(
            item.is_deleted ??
              item.isDeleted,
            false
          );

        /*
         * -------------------------------------------------
         * Önce mevcut kaydı bul.
         *
         * Öncelik:
         * 1. remote_id
         * 2. sync_key
         * -------------------------------------------------
         */

        let existingId: string | null =
          null;

        if (suppliedRemoteId) {
          const {
            data: remoteMatch,
            error: remoteMatchError,
          } = await supabase
            .from(
              "subcontractor_companies"
            )
            .select("id")
            .eq(
              "id",
              suppliedRemoteId
            )
            .maybeSingle();

          if (remoteMatchError) {
            throw remoteMatchError;
          }

          existingId =
            remoteMatch?.id ?? null;
        }

        if (!existingId) {
          const {
            data: syncMatch,
            error: syncMatchError,
          } = await supabase
            .from(
              "subcontractor_companies"
            )
            .select("id")
            .eq("sync_key", syncKey)
            .maybeSingle();

          if (syncMatchError) {
            throw syncMatchError;
          }

          existingId =
            syncMatch?.id ?? null;
        }

        const now = Date.now();

        /*
         * -------------------------------------------------
         * SOFT DELETE
         * -------------------------------------------------
         */
        if (isDeleted) {
          if (existingId) {
            const {
              error: deleteError,
            } = await supabase
              .from(
                "subcontractor_companies"
              )
              .update({
                is_deleted: true,
                is_active: false,
                updated_at_millis: now,
              })
              .eq("id", existingId);

            if (deleteError) {
              throw deleteError;
            }
          }

          results.push({
            success: true,
            localId,
            local_id: localId,
            remoteId:
              existingId ??
              suppliedRemoteId,
            remote_id:
              existingId ??
              suppliedRemoteId,
          });

          continue;
        }

        /*
         * -------------------------------------------------
         * INSERT / UPDATE verisi
         * -------------------------------------------------
         */
        const payload = {
          firm_id: firmId,

          sync_key: syncKey,

          company_name:
            stringValue(
              item.company_name ??
                item.companyName
            ),

          authorized_person:
            stringValue(
              item.authorized_person ??
                item.authorizedPerson
            ),

          phone:
            stringValue(item.phone),

          email:
            stringValue(item.email),

          tax_no:
            stringValue(
              item.tax_no ??
                item.taxNo
            ),

          work_scope:
            stringValue(
              item.work_scope ??
                item.workScope
            ),

          contract_start_millis:
            nullableNumber(
              item.contract_start_millis ??
                item.contractStartMillis
            ),

          contract_end_millis:
            nullableNumber(
              item.contract_end_millis ??
                item.contractEndMillis
            ),

          application_status:
            stringValue(
              item.application_status ??
                item.applicationStatus,
              "TASLAK"
            ),

          approval_status:
            stringValue(
              item.approval_status ??
                item.approvalStatus,
              "BEKLIYOR"
            ),

          approved_at_millis:
            nullableNumber(
              item.approved_at_millis ??
                item.approvedAtMillis
            ),

          approved_by:
            stringValue(
              item.approved_by ??
                item.approvedBy
            ),

          revision_note:
            stringValue(
              item.revision_note ??
                item.revisionNote
            ),

          is_active:
            booleanValue(
              item.is_active ??
                item.isActive,
              true
            ),

          is_deleted: false,

          created_at_millis:
            nullableNumber(
              item.created_at_millis ??
                item.createdAtMillis
            ) ?? now,

          updated_at_millis:
            nullableNumber(
              item.updated_at_millis ??
                item.updatedAtMillis
            ) ?? now,
        };

        if (!payload.company_name) {
          throw new Error(
            "company_name zorunludur."
          );
        }

        let remoteId: string;

        /*
         * -------------------------------------------------
         * UPDATE
         * -------------------------------------------------
         */
        if (existingId) {
          /*
           * Web'deki created_at_millis değerini
           * güncellemede ezmiyoruz.
           */
          const {
            created_at_millis: _created,
            ...updatePayload
          } = payload;

          const {
            data: updated,
            error: updateError,
          } = await supabase
            .from(
              "subcontractor_companies"
            )
            .update(updatePayload)
            .eq("id", existingId)
            .select("id")
            .single();

          if (updateError) {
            throw updateError;
          }

          remoteId = updated.id;
        } else {
          /*
           * -------------------------------------------------
           * INSERT
           * -------------------------------------------------
           */
          const {
            data: inserted,
            error: insertError,
          } = await supabase
            .from(
              "subcontractor_companies"
            )
            .insert(payload)
            .select("id")
            .single();

          if (insertError) {
            throw insertError;
          }

          remoteId = inserted.id;
        }

        results.push({
          success: true,
          localId,
          local_id: localId,
          remoteId,
          remote_id: remoteId,
        });
      } catch (itemError) {
        console.error(
          "[SUBCONTRACTOR_POST_ITEM]",
          itemError
        );

        results.push({
          success: false,
          localId,
          local_id: localId,
          error:
            itemError instanceof Error
              ? itemError.message
              : "Taşeron kaydı senkronize edilemedi.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "[SUBCONTRACTOR_POST_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron senkronizasyonu başarısız.",
      },
      { status: 500 }
    );
  }
}