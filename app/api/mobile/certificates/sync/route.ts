import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOBILE_API_KEY = "dsec_mobile_123";

type JsonRecord = Record<string, unknown>;

type CertificatePayload = {
  firm_id: string;
  employee_remote_id: string;
  training_title: string;
  certificate_no: string;
  issue_date: number;
  valid_until: number | null;
  remote_file_url: string | null;
  deleted: boolean;
  deleted_at: number | null;
  created_at_millis: number;
  updated_at_millis: number;
  updated_at: string;
};

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function authorized(req: Request): boolean {
  return (
    String(
      req.headers.get("x-api-key") || ""
    ).trim() === MOBILE_API_KEY
  );
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Yetkisiz.",
    },
    {
      status: 401,
    }
  );
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableText(
  value: unknown
): string | null {
  const result = clean(value);

  return result || null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

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
    value === "" ||
    value === "null"
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

  const normalized =
    clean(value).toLowerCase();

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

  return fallback;
}

function buildCertificatePayload(
  body: JsonRecord,
  firmIdOverride?: string
): CertificatePayload {
  const now = Date.now();

  return {
    firm_id:
      clean(firmIdOverride) ||
      clean(body.firm_id) ||
      clean(body.firmId),

    employee_remote_id:
      clean(body.employee_remote_id) ||
      clean(body.employeeRemoteId),

    training_title:
      clean(body.training_title) ||
      clean(body.trainingTitle),

    certificate_no:
      clean(body.certificate_no) ||
      clean(body.certificateNo),

    issue_date: numberValue(
      body.issue_date ??
        body.issueDate,
      now
    ),

    valid_until: nullableNumber(
      body.valid_until ??
        body.validUntil
    ),

    remote_file_url: nullableText(
      body.remote_file_url ??
        body.remoteFileUrl ??
        body.file_url ??
        body.fileUrl
    ),

    deleted: booleanValue(
      body.deleted ??
        body.is_deleted ??
        body.isDeleted,
      false
    ),

    deleted_at: nullableNumber(
      body.deleted_at ??
        body.deletedAt
    ),

    created_at_millis: numberValue(
      body.created_at_millis ??
        body.createdAt,
      now
    ),

    updated_at_millis: numberValue(
      body.updated_at_millis ??
        body.updatedAt,
      now
    ),

    updated_at:
      new Date().toISOString(),
  };
}

async function findDuplicateCertificate(
  supabase: ReturnType<
    typeof getSupabase
  >,
  payload: CertificatePayload
): Promise<string | null> {
  let query = supabase
    .from("employee_certificates")
    .select("id")
    .eq("firm_id", payload.firm_id)
    .eq(
      "employee_remote_id",
      payload.employee_remote_id
    )
    .eq(
      "training_title",
      payload.training_title
    )
    .eq("deleted", false)
    .limit(1);

  if (payload.certificate_no) {
    query = query.eq(
      "certificate_no",
      payload.certificate_no
    );
  } else {
    query = query.eq(
      "issue_date",
      payload.issue_date
    );
  }

  const { data, error } =
    await query.maybeSingle();

  if (error) {
    throw new Error(
      `Sertifika mükerrer kontrolü başarısız: ${error.message}`
    );
  }

  return data?.id
    ? String(data.id)
    : null;
}

/* =========================================================
   WEB → APP
   ========================================================= */

export async function GET(req: Request) {
  try {
    if (!authorized(req)) {
      return unauthorized();
    }

    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    /*
     * Silinen kayıtlar da App'e gönderilir.
     * Böylece Web'de silinen kayıt App'ten kaldırılabilir.
     */
    let allCertificates: JsonRecord[] = [];

    let from = 0;
    const step = 1000;

    while (true) {
      const { data, error } =
        await supabase
          .from("employee_certificates")
          .select("*")
          .eq("firm_id", firmId)
          .order(
            "updated_at_millis",
            {
              ascending: true,
            }
          )
          .range(
            from,
            from + step - 1
          );

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Sertifikalar alınamadı.",
            detail: error.message,
          },
          {
            status: 500,
          }
        );
      }

      const rows =
        Array.isArray(data)
          ? data
          : [];

      allCertificates = [
        ...allCertificates,
        ...rows,
      ];

      if (rows.length < step) {
        break;
      }

      from += step;
    }

    return NextResponse.json({
      success: true,
      firmId,
      count: allCertificates.length,

      /*
       * Android servis iki ismi de okuyabiliyor.
       * İkisini birlikte dönmek yerine "data"
       * kullanıyoruz.
       */
      data: allCertificates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu hatası.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   APP → WEB
   ========================================================= */

export async function POST(req: Request) {
  try {
    if (!authorized(req)) {
      return unauthorized();
    }

    const body = await req.json();

    const firmId = clean(
      body?.firmId
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const certificates: JsonRecord[] =
      Array.isArray(
        body?.certificates
      )
        ? body.certificates
        : [];

    const supabase = getSupabase();

    const results: Array<{
      localId: number;
      remoteId: string | null;
      success: boolean;
      deleted: boolean;
      duplicateProtected?: boolean;
      error: string | null;
    }> = [];

    for (const item of certificates) {
      const localId = numberValue(
        item.local_id ??
          item.localId,
        0
      );

      const remoteId =
        clean(item.remote_id) ||
        clean(item.remoteId) ||
        clean(item.id);

      const operation =
        clean(item.operation)
          .toUpperCase() ||
        "UPSERT";

      const deleted =
        operation === "DELETE" ||
        booleanValue(
          item.deleted ??
            item.is_deleted ??
            item.isDeleted,
          false
        );

      try {
        /*
         * App'te oluşturulup web'e gönderilmeden
         * silinen kayıtta remoteId bulunmayabilir.
         */
        if (
          deleted &&
          !remoteId
        ) {
          results.push({
            localId,
            remoteId: null,
            success: true,
            deleted: true,
            error: null,
          });

          continue;
        }

        /*
         * App → Web soft-delete
         */
        if (
          deleted &&
          remoteId
        ) {
          const deletedAt =
            numberValue(
              item.deleted_at ??
                item.deletedAt,
              Date.now()
            );

          const {
            data,
            error,
          } = await supabase
            .from(
              "employee_certificates"
            )
            .update({
              deleted: true,
              deleted_at: deletedAt,
              updated_at_millis:
                numberValue(
                  item.updated_at_millis ??
                    item.updatedAt,
                  deletedAt
                ),
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", remoteId)
            .select("id")
            .maybeSingle();

          if (error) {
            throw error;
          }

          /*
           * Kayıt zaten web'de yoksa da
           * App'in tombstone kaydı temizlenebilir.
           */
          results.push({
            localId,
            remoteId:
              data?.id
                ? String(data.id)
                : remoteId,
            success: true,
            deleted: true,
            error: null,
          });

          continue;
        }

        const payload =
          buildCertificatePayload(
            item,
            firmId
          );

        if (
          !payload.firm_id ||
          !payload.employee_remote_id ||
          !payload.training_title
        ) {
          results.push({
            localId,
            remoteId:
              remoteId || null,
            success: false,
            deleted: false,
            error:
              "firm_id, employee_remote_id veya training_title eksik.",
          });

          continue;
        }

        /*
         * Mevcut remoteId varsa güncelle.
         */
        if (remoteId) {
          const {
            data,
            error,
          } = await supabase
            .from(
              "employee_certificates"
            )
            .update({
              ...payload,
              deleted: false,
              deleted_at: null,
            })
            .eq("id", remoteId)
            .select("id")
            .maybeSingle();

          if (error) {
            throw error;
          }

          /*
           * App remoteId taşıyor fakat Supabase kaydı
           * bulunamıyorsa yeniden eklenir.
           */
          if (!data?.id) {
            const {
              data: inserted,
              error: insertError,
            } = await supabase
              .from(
                "employee_certificates"
              )
              .insert([
                {
                  ...payload,
                  deleted: false,
                  deleted_at: null,
                  created_at:
                    new Date().toISOString(),
                },
              ])
              .select("id")
              .single();

            if (
              insertError ||
              !inserted?.id
            ) {
              throw new Error(
                insertError?.message ||
                  "Sertifika oluşturulamadı."
              );
            }

            results.push({
              localId,
              remoteId:
                String(inserted.id),
              success: true,
              deleted: false,
              error: null,
            });
          } else {
            results.push({
              localId,
              remoteId:
                String(data.id),
              success: true,
              deleted: false,
              error: null,
            });
          }

          continue;
        }

        /*
         * remoteId yoksa mükerrer kayıt ara.
         */
        const duplicateId =
          await findDuplicateCertificate(
            supabase,
            payload
          );

        if (duplicateId) {
          const { error } =
            await supabase
              .from(
                "employee_certificates"
              )
              .update({
                ...payload,
                deleted: false,
                deleted_at: null,
              })
              .eq(
                "id",
                duplicateId
              );

          if (error) {
            throw error;
          }

          results.push({
            localId,
            remoteId: duplicateId,
            success: true,
            deleted: false,
            duplicateProtected: true,
            error: null,
          });

          continue;
        }

        /*
         * Yeni sertifika kaydı
         */
        const {
          data,
          error,
        } = await supabase
          .from(
            "employee_certificates"
          )
          .insert([
            {
              ...payload,
              deleted: false,
              deleted_at: null,
              created_at:
                new Date().toISOString(),
            },
          ])
          .select("id")
          .single();

        if (
          error ||
          !data?.id
        ) {
          throw new Error(
            error?.message ||
              "Sertifika oluşturulamadı."
          );
        }

        results.push({
          localId,
          remoteId:
            String(data.id),
          success: true,
          deleted: false,
          error: null,
        });
      } catch (error) {
        results.push({
          localId,
          remoteId:
            remoteId || null,
          success: false,
          deleted,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    const failedCount =
      results.filter(
        (item) =>
          !item.success
      ).length;

    return NextResponse.json({
      success:
        failedCount === 0,

      firmId,

      count:
        results.length,

      failedCount,

      /*
       * Android servis önce "results",
       * sonra "certificateResults" arıyor.
       */
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu hatası.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}