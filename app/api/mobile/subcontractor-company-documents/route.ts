import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY = "dsec_mobile_123";

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

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableText(
  value: unknown
): string | null {
  const result = text(value);
  return result || null;
}

function num(
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

function bool(
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
      value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "evet"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === "hayır" ||
      normalized === "hayir"
    ) {
      return false;
    }
  }

  return fallback;
}

// =========================================================
// GET
// WEB -> APP
// =========================================================

export async function GET(
  req: NextRequest
) {
  try {
    if (!checkApiKey(req)) {
      return unauthorized();
    }

    const firmId =
      text(
        req.nextUrl.searchParams.get(
          "firmId"
        )
      );

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

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_company_documents"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .order(
          "updated_at_millis",
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      documents: data ?? [],
      companyDocuments:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "[SUB_COMP_DOC_GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Firma evrakları alınamadı.",
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

    const documents =
      Array.isArray(body?.documents)
        ? body.documents
        : Array.isArray(body?.data)
          ? body.data
          : [];

    const results: Array<{
      success: boolean;
      localId: number;
      local_id: number;
      remoteId?: string;
      remote_id?: string;
      error?: string;
    }> = [];

    for (const item of documents) {
      const localId =
        Number(
          item.localId ??
            item.local_id ??
            item.app_local_id ??
            0
        ) || 0;

      try {
        const firmId =
          text(
            item.firm_id ??
              item.firmId
          );

        const companyId =
          text(
            item.company_id ??
              item.companyId
          );

        const syncKey =
          text(
            item.sync_key ??
              item.syncKey
          );

        if (!firmId) {
          throw new Error(
            "firm_id eksik."
          );
        }

        if (!companyId) {
          throw new Error(
            "company_id eksik."
          );
        }

        if (!syncKey) {
          throw new Error(
            "sync_key eksik."
          );
        }

        const suppliedRemoteId =
          text(
            item.remote_id ??
              item.remoteId ??
              item.id
          );

        let existingId:
          string | null = null;

        if (suppliedRemoteId) {
          const {
            data: remoteMatch,
            error: remoteError,
          } =
            await supabase
              .from(
                "subcontractor_company_documents"
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

        if (!existingId) {
          const {
            data: syncMatch,
            error: syncError,
          } =
            await supabase
              .from(
                "subcontractor_company_documents"
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

        const isDeleted =
          bool(
            item.is_deleted ??
              item.isDeleted,
            false
          );

        if (isDeleted) {
          if (existingId) {
            const {
              error: deleteError,
            } =
              await supabase
                .from(
                  "subcontractor_company_documents"
                )
                .update({
                  is_deleted: true,
                  deleted_at_millis:
                    now,
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

        const payload = {
          firm_id:
            firmId,

          company_id:
            companyId,

          app_local_id:
            localId > 0
              ? localId
              : null,

          sync_key:
            syncKey,

          doc_key:
            text(
              item.doc_key ??
                item.docKey
            ),

          doc_title:
            text(
              item.doc_title ??
                item.docTitle
            ),

          is_required:
            bool(
              item.is_required ??
                item.isRequired,
              true
            ),

          status:
            text(
              item.status
            ) || "EKSIK",

          file_url:
            nullableText(
              item.file_url ??
                item.fileUrl ??
                item.fileUri
            ),

          valid_until_millis:
            num(
              item.valid_until_millis ??
                item.validUntilMillis
            ),

          note:
            text(
              item.note
            ),

          is_deleted:
            false,

          deleted_at_millis:
            null,

          source:
            "APP",

          updated_at_millis:
            num(
              item.updated_at_millis ??
                item.updatedAtMillis
            ) ?? now,

          created_at_millis:
            num(
              item.created_at_millis ??
                item.createdAtMillis
            ) ?? now,
        };

        let remoteId:
          string;

        if (existingId) {
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
                "subcontractor_company_documents"
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
        } else {
          const {
            data: inserted,
            error: insertError,
          } =
            await supabase
              .from(
                "subcontractor_company_documents"
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
        results.push({
          success: false,
          localId,
          local_id: localId,
          error:
            itemError instanceof Error
              ? itemError.message
              : "Firma evrağı senkronize edilemedi.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "[SUB_COMP_DOC_POST]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Firma evrak senkronizasyonu başarısız.",
      },
      {
        status: 500,
      }
    );
  }
}