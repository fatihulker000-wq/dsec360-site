import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOBILE_API_KEY = "dsec_mobile_123";

type JsonRecord = Record<string, unknown>;

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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(
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
  value: unknown
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized =
    clean(value).toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "completed"
  );
}

function arrayOf(
  value: unknown
): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          !!item &&
          typeof item === "object"
      )
    : [];
}

async function fetchMobileApi(
  origin: string,
  path: string
): Promise<JsonRecord> {
  const response = await fetch(
    `${origin}${path}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-api-key": MOBILE_API_KEY,
        Accept: "application/json",
      },
    }
  );

  const json =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      clean(json?.detail) ||
        clean(json?.error) ||
        `${path} isteği başarısız: ${response.status}`
    );
  }

  return json as JsonRecord;
}

export async function GET(req: Request) {
  try {
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
    const origin = url.origin;
    const encodedFirmId =
      encodeURIComponent(firmId);

    const [
      employeeResult,
      trainingJson,
      certificateJson,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select(
          `
          id,
          full_name,
          registry_no,
          job_title,
          active,
          firm_id
          `
        )
        .eq("firm_id", firmId)
        .eq("active", true)
        .order("full_name", {
          ascending: true,
        }),

      fetchMobileApi(
        origin,
        `/api/mobile/training/sync?firmId=${encodedFirmId}`
      ),

      fetchMobileApi(
        origin,
        `/api/mobile/certificates/sync?firmId=${encodedFirmId}`
      ),
    ]);

    if (employeeResult.error) {
      throw new Error(
        `Çalışanlar alınamadı: ${employeeResult.error.message}`
      );
    }

    const employees = (
      Array.isArray(employeeResult.data)
        ? employeeResult.data
        : []
    ).map((row) => ({
      id: clean(row.id),
      fullName:
        clean(row.full_name) ||
        "Çalışan",
      registryNo:
        clean(row.registry_no),
      jobTitle:
        clean(row.job_title),
    }));

    const employeeMap = new Map(
      employees.map((employee) => [
        employee.id,
        employee,
      ])
    );

    const trainingRows = arrayOf(
      trainingJson.data ??
        trainingJson.records ??
        trainingJson.assignments
    );

    const trainings = trainingRows
      .filter(
        (row) =>
          !booleanValue(
            row.deleted ??
              row.is_deleted ??
              row.isDeleted
          )
      )
      .map((row, index) => {
        const employeeRemoteId =
          clean(
            row.employee_remote_id ??
              row.employeeRemoteId
          );

        const employee =
          employeeMap.get(
            employeeRemoteId
          );

        return {
          id:
            clean(
              row.assignment_id ??
                row.id ??
                row.remote_id ??
                row.remoteId
            ) ||
            `training-${index}`,

          employeeRemoteId,

          employeeName:
            employee?.fullName ||
            clean(row.employee_name) ||
            clean(row.employeeName) ||
            "Çalışan",

          employeeRegistryNo:
            employee?.registryNo ||
            "",

          employeeJobTitle:
            employee?.jobTitle ||
            "",

          trainingTitle:
            clean(
              row.title ??
                row.training_title ??
                row.trainingTitle
            ) ||
            "Eğitim",

          trainingType:
            clean(
              row.type ??
                row.training_type ??
                row.trainingType
            ),

          deliveryMode:
            clean(
              row.delivery_mode ??
                row.deliveryMode
            ),

          trainingDate:
            numberValue(
              row.training_date ??
                row.trainingDate ??
                row.completed_at_millis ??
                row.completedAt
            ),

          validUntil:
            numberValue(
              row.valid_until ??
                row.validUntil
            ),

          trainingTimeText:
            clean(
              row.training_time_text ??
                row.trainingTimeText
            ),

          durationMinutes:
            Number(
              row.duration_minutes ??
                row.durationMinutes ??
                0
            ) || 0,

          trainerName:
            clean(
              row.trainer_name ??
                row.trainerName
            ),

          trainerRole:
            clean(
              row.trainer_role ??
                row.trainerRole
            ),

          trainerOrg:
            clean(
              row.trainer_org ??
                row.trainerOrg
            ),

          trainingPlace:
            clean(
              row.training_place ??
                row.trainingPlace
            ),

          onlineUrl:
            clean(
              row.online_url ??
                row.onlineUrl
            ),

          completionNote:
            clean(
              row.completion_note ??
                row.completionNote
            ),

          completed:
            booleanValue(
              row.completed ??
                row.status
            ),

          documentUri:
            clean(
              row.document_uri ??
                row.documentUri
            ),

          attendanceUri:
            clean(
              row.attendance_uri ??
                row.attendanceUri
            ),

          certificateUri:
            clean(
              row.certificate_uri ??
                row.certificateUri
            ),
        };
      });

    const certificateRows = arrayOf(
      certificateJson.data ??
        certificateJson.certificates
    );

    const certificates =
      certificateRows
        .filter(
          (row) =>
            !booleanValue(
              row.deleted ??
                row.is_deleted ??
                row.isDeleted
            )
        )
        .map((row, index) => {
          const employeeRemoteId =
            clean(
              row.employee_remote_id ??
                row.employeeRemoteId
            );

          const employee =
            employeeMap.get(
              employeeRemoteId
            );

          return {
            id:
              clean(
                row.id ??
                  row.remote_id ??
                  row.remoteId
              ) ||
              `certificate-${index}`,

            employeeRemoteId,

            employeeName:
              employee?.fullName ||
              clean(row.employee_name) ||
              clean(row.employeeName) ||
              "Çalışan",

            employeeRegistryNo:
              employee?.registryNo ||
              "",

            trainingTitle:
              clean(
                row.training_title ??
                  row.trainingTitle
              ) ||
              "Eğitim Sertifikası",

            certificateNo:
              clean(
                row.certificate_no ??
                  row.certificateNo
              ),

            issueDate:
              numberValue(
                row.issue_date ??
                  row.issueDate
              ),

            validUntil:
              numberValue(
                row.valid_until ??
                  row.validUntil
              ),

            remoteFileUrl:
              clean(
                row.remote_file_url ??
                  row.remoteFileUrl ??
                  row.file_url ??
                  row.fileUrl
              ),
          };
        });

    return NextResponse.json({
      success: true,
      firmId,
      employees,
      trainings,
      certificates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Eğitim arşivi alınamadı.",
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