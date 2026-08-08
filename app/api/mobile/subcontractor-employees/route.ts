import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY = "dsec_mobile_123";

// =========================================================
// HELPERS
// =========================================================

function checkApiKey(req: NextRequest) {
  return req.headers.get("x-api-key") === API_KEY;
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Yetkisiz istek.",
    },
    {
      status: 401,
    }
  );
}

function stringValue(
  value: unknown,
  fallback = ""
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const result =
    String(value).trim();

  if (
    !result ||
    result.toLowerCase() === "null"
  ) {
    return fallback;
  }

  return result;
}

function nullableString(
  value: unknown
): string | null {
  const valueText =
    stringValue(value);

  return valueText || null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
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

  const parsed =
    Number(value);

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
    const normalized =
      value
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

// =========================================================
// GET
// WEB -> APP
//
// /api/mobile/subcontractor-employees?firmId=...
// =========================================================

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

    const companyId =
      searchParams
        .get("companyId")
        ?.trim();

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    let query =
      supabase
        .from(
          "subcontractor_employees"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .order(
          "full_name",
          {
            ascending: true,
          }
        );

    /*
     * İstenirse sadece belirli
     * taşeron firmanın çalışanları.
     */
    if (companyId) {
      query =
        query.eq(
          "company_id",
          companyId
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "[SUB_EMP_GET]",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,

      data:
        data ?? [],

      employees:
        data ?? [],

      subcontractorEmployees:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "[SUB_EMP_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Taşeron çalışanları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================================
// POST
// APP -> WEB
// =========================================================

export async function POST(
  req: NextRequest
) {
  try {
    if (!checkApiKey(req)) {
      return unauthorized();
    }

    const body =
      await req.json();

    const employees =
      Array.isArray(
        body?.employees
      )
        ? body.employees
        : Array.isArray(
              body?.subcontractorEmployees
            )
          ? body.subcontractorEmployees
          : Array.isArray(
                body?.data
              )
            ? body.data
            : [];

    if (
      employees.length === 0
    ) {
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

    for (
      const item of employees
    ) {
      const localId =
        numberValue(
          item.localId ??
            item.local_id ??
            item.app_local_id,
          0
        );

      try {
        // =================================================
        // FIRMA ID
        // =================================================

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

        // =================================================
        // TAŞERON WEB ID
        // =================================================

        const companyId =
          stringValue(
            item.company_id ??
              item.companyId ??
              item.company_remote_id ??
              item.companyRemoteId
          );

        if (!companyId) {
          throw new Error(
            "company_id / taşeron Web ID bilgisi eksik."
          );
        }

        // =================================================
        // APP LOCAL COMPANY ID
        // =================================================

        const appCompanyLocalId =
          numberValue(
            item.app_company_local_id ??
              item.appCompanyLocalId ??
              item.localCompanyId,
            0
          );

        // =================================================
        // SYNC KEY
        // =================================================

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

        // =================================================
        // REMOTE ID
        // =================================================

        const suppliedRemoteId =
          stringValue(
            item.remote_id ??
              item.remoteId ??
              item.id
          );

        // =================================================
        // DELETE
        // =================================================

        const isDeleted =
          booleanValue(
            item.is_deleted ??
              item.isDeleted,
            false
          );

        // =================================================
        // VAR OLAN KAYDI BUL
        // =================================================

        let existingId:
          string | null = null;

        /*
         * Öncelik 1:
         * remote ID
         */
        if (
          suppliedRemoteId
        ) {
          const {
            data: remoteMatch,
            error: remoteError,
          } =
            await supabase
              .from(
                "subcontractor_employees"
              )
              .select("id")
              .eq(
                "id",
                suppliedRemoteId
              )
              .maybeSingle();

          if (remoteError) {
            throw remoteError;
          }

          existingId =
            remoteMatch?.id ??
            null;
        }

        /*
         * Öncelik 2:
         * syncKey
         */
        if (!existingId) {
          const {
            data: syncMatch,
            error: syncError,
          } =
            await supabase
              .from(
                "subcontractor_employees"
              )
              .select("id")
              .eq(
                "sync_key",
                syncKey
              )
              .maybeSingle();

          if (syncError) {
            throw syncError;
          }

          existingId =
            syncMatch?.id ??
            null;
        }

        const now =
          Date.now();

        // =================================================
        // SOFT DELETE
        // =================================================

        if (isDeleted) {
          if (existingId) {
            const {
              error: deleteError,
            } =
              await supabase
                .from(
                  "subcontractor_employees"
                )
                .update({
                  is_deleted: true,

                  deleted_at_millis:
                    now,

                  is_inside: false,

                  entry_permission:
                    false,

                  source: "APP",

                  updated_at_millis:
                    now,
                })
                .eq(
                  "id",
                  existingId
                );

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

        // =================================================
        // NORMAL INSERT / UPDATE PAYLOAD
        // =================================================

        const payload = {
          firm_id:
            firmId,

          /*
           * DİKKAT:
           *
           * Bu Android local companyId DEĞİL.
           * Web'deki subcontractor_companies.id değeridir.
           */
          company_id:
            companyId,

          app_local_id:
            localId > 0
              ? localId
              : null,

          app_company_local_id:
            appCompanyLocalId > 0
              ? appCompanyLocalId
              : null,

          sync_key:
            syncKey,

          full_name:
            stringValue(
              item.full_name ??
                item.fullName
            ),

          tc_no:
            stringValue(
              item.tc_no ??
                item.tcNo
            ),

          position:
            stringValue(
              item.position
            ),

          phone:
            stringValue(
              item.phone
            ),

          entry_card_no:
            stringValue(
              item.entry_card_no ??
                item.entryCardNo
            ),

          photo_url:
            nullableString(
              item.photo_url ??
                item.photoUrl ??
                item.photoUri
            ),

          is_inside:
            booleanValue(
              item.is_inside ??
                item.isInside,
              false
            ),

          sgk_entry_ok:
            booleanValue(
              item.sgk_entry_ok ??
                item.sgkEntryOk,
              false
            ),

          isg_training_ok:
            booleanValue(
              item.isg_training_ok ??
                item.isgTrainingOk,
              false
            ),

          health_report_ok:
            booleanValue(
              item.health_report_ok ??
                item.healthReportOk,
              false
            ),

          myk_certificate_ok:
            booleanValue(
              item.myk_certificate_ok ??
                item.mykCertificateOk,
              false
            ),

          kkd_delivery_ok:
            booleanValue(
              item.kkd_delivery_ok ??
                item.kkdDeliveryOk,
              false
            ),

          site_orientation_ok:
            booleanValue(
              item.site_orientation_ok ??
                item.siteOrientationOk,
              false
            ),

          work_at_height_ok:
            booleanValue(
              item.work_at_height_ok ??
                item.workAtHeightOk,
              false
            ),

          access_blocked_note:
            stringValue(
              item.access_blocked_note ??
                item.accessBlockedNote
            ),

          employee_status:
            stringValue(
              item.employee_status ??
                item.employeeStatus,
              "TASLAK"
            ),

          approval_status:
            stringValue(
              item.approval_status ??
                item.approvalStatus,
              "BEKLIYOR"
            ),

          entry_permission:
            booleanValue(
              item.entry_permission ??
                item.entryPermission,
              false
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

          is_deleted:
            false,

          deleted_at_millis:
            null,

          source:
            stringValue(
              item.source,
              "APP"
            ),

          updated_at_millis:
            nullableNumber(
              item.updated_at_millis ??
                item.updatedAtMillis
            ) ?? now,

          created_at_millis:
            nullableNumber(
              item.created_at_millis ??
                item.createdAtMillis
            ) ?? now,
        };

        if (
          !payload.full_name
        ) {
          throw new Error(
            "full_name zorunludur."
          );
        }

        let remoteId:
          string;

        // =================================================
        // UPDATE
        // =================================================

        if (existingId) {
          /*
           * created_at_millis mevcut kayıtta
           * korunmalı.
           */
          const {
            created_at_millis:
              _createdAt,

            ...updatePayload
          } = payload;

          const {
            data: updated,
            error: updateError,
          } =
            await supabase
              .from(
                "subcontractor_employees"
              )
              .update(
                updatePayload
              )
              .eq(
                "id",
                existingId
              )
              .select("id")
              .single();

          if (updateError) {
            throw updateError;
          }

          remoteId =
            updated.id;
        }

        // =================================================
        // INSERT
        // =================================================

        else {
          const {
            data: inserted,
            error: insertError,
          } =
            await supabase
              .from(
                "subcontractor_employees"
              )
              .insert(
                payload
              )
              .select("id")
              .single();

          if (insertError) {
            throw insertError;
          }

          remoteId =
            inserted.id;
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
          "[SUB_EMP_POST_ITEM]",
          itemError
        );

        results.push({
          success: false,

          localId,
          local_id: localId,

          error:
            itemError instanceof Error
              ? itemError.message
              : "Taşeron çalışanı senkronize edilemedi.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "[SUB_EMP_POST_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Taşeron çalışan senkronizasyonu başarısız.",
      },
      {
        status: 500,
      }
    );
  }
}