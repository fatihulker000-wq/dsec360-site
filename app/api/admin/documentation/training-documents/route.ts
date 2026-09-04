import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

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

function toMillis(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return null;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value > 100000000000
      ? value
      : value * 1000;
  }

  const raw = clean(value);
  const numeric = Number(raw);

  if (Number.isFinite(numeric)) {
    return numeric > 100000000000
      ? numeric
      : numeric * 1000;
  }

  const parsed = Date.parse(raw);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function isCompleted(
  assignment: AnyRow,
  training: AnyRow
): boolean {
  const status =
    clean(assignment.status)
      .toLowerCase();

  const type =
    clean(training.type)
      .toLowerCase();

  const isPortalTraining =
    type.includes("online") ||
    type.includes("asenkron") ||
    type.includes("senkron");

  if (isPortalTraining) {
    return (
      status === "completed" &&
      assignment.watch_completed === true &&
      assignment.final_exam_passed === true
    );
  }

  return status === "completed";
}

function buildSessionKey(
  trainingId: string
): string {
  /*
   * Eğitim Arşivinde oturum anahtarı katılımcının tamamlama tarihi değildir.
   * Aynı eğitim 20 çalışana atanmışsa tek eğitim oturumu altında 20 katılımcı
   * görünür. Böylece asenkron eğitimlerde farklı bitiş tarihleri oturum sayısını
   * yapay olarak artırmaz.
   */
  return `WEB-TRAINING-${trainingId}`;
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

    /*
     * ============================================================
     * D-SEC EĞİTİM ARŞİVİ TEK KAYNAK KURALI
     * ============================================================
     *
     * Dokümantasyon > Eğitim Dokümanları, mobil kopyayı değil Web Eğitimler
     * Modülünün gerçek veri omurgasını okur:
     *
     * companies
     *   -> users.company_id
     *   -> training_assignments
     *   -> trainings
     *   -> training_certificates_v2
     *   -> training_archive_files
     *
     * Böylece bir firmaya gerçekten atanmış/verilmiş eğitim neyse arşivde
     * aynı kayıtlar görünür.
     */

    const [
      employeesResult,
      usersResult,
      archiveFilesResult,
      certificatesResult,
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
        .order(
          "full_name",
          { ascending: true }
        ),

      supabase
        .from("users")
        .select(
          `
          id,
          employee_id,
          full_name,
          email,
          company_id,
          is_active
          `
        )
        .eq("company_id", firmId)
        .eq("is_active", true),

      supabase
        .from("training_archive_files")
        .select(
          `
          id,
          firm_id,
          document_type,
          session_key,
          employee_remote_id,
          training_title,
          file_name,
          public_url,
          mime_type,
          file_size,
          updated_at
          `
        )
        .eq("firm_id", firmId),

      supabase
        .from("training_certificates_v2")
        .select("*")
        .eq("company_id", firmId)
        .neq("status", "REVOKED")
        .order(
          "issued_at",
          { ascending: false }
        ),
    ]);

    if (employeesResult.error) {
      throw new Error(
        `Çalışanlar alınamadı: ${employeesResult.error.message}`
      );
    }

    if (usersResult.error) {
      throw new Error(
        `Eğitim kullanıcıları alınamadı: ${usersResult.error.message}`
      );
    }

    /*
     * Eski kurulumlarda training_archive_files veya training_certificates_v2
     * henüz yoksa oturum/katılımcı arşivini tamamen çökertmeyelim.
     */
    const archiveFiles: AnyRow[] =
      archiveFilesResult.error
        ? []
        : (
            archiveFilesResult.data ??
            []
          );

    const certificateRows: AnyRow[] =
      certificatesResult.error
        ? []
        : (
            certificatesResult.data ??
            []
          );

    const employees = (
      employeesResult.data ??
      []
    ).map((row: AnyRow) => ({
      id:
        clean(row.id),

      fullName:
        clean(row.full_name) ||
        "Çalışan",

      registryNo:
        clean(row.registry_no),

      jobTitle:
        clean(row.job_title),
    }));

    const employeeMap =
      new Map(
        employees.map(
          (employee) => [
            employee.id,
            employee,
          ]
        )
      );

    const users: AnyRow[] =
      usersResult.data ??
      [];

    const userIds =
      users
        .map(
          (row) =>
            clean(row.id)
        )
        .filter(Boolean);

    const userMap =
      new Map(
        users.map(
          (row) => [
            clean(row.id),
            row,
          ]
        )
      );

    let assignments: AnyRow[] = [];

    if (userIds.length > 0) {
      const assignmentResult =
        await supabase
          .from("training_assignments")
          .select(
            `
            id,
            user_id,
            training_id,
            status,
            watch_completed,
            final_exam_passed,
            started_at,
            completed_at,
            final_exam_score
            `
          )
          .in("user_id", userIds);

      if (assignmentResult.error) {
        throw new Error(
          `Eğitim atamaları alınamadı: ${assignmentResult.error.message}`
        );
      }

      assignments =
        assignmentResult.data ??
        [];
    }

    const trainingIds =
      Array.from(
        new Set(
          assignments
            .map(
              (row) =>
                clean(
                  row.training_id
                )
            )
            .filter(Boolean)
        )
      );

    let trainingRows: AnyRow[] = [];

    if (trainingIds.length > 0) {
      const trainingResult =
        await supabase
          .from("trainings")
          .select(
            `
            id,
            title,
            type,
            duration_minutes,
            description,
            topics_text,
            created_at
            `
          )
          .in(
            "id",
            trainingIds
          );

      if (trainingResult.error) {
        throw new Error(
          `Eğitim detayları alınamadı: ${trainingResult.error.message}`
        );
      }

      trainingRows =
        trainingResult.data ??
        [];
    }

    const trainingMap =
      new Map(
        trainingRows.map(
          (row) => [
            clean(row.id),
            row,
          ]
        )
      );

    /*
     * Her assignment için yalnızca en güncel/aktif sertifikayı kullan.
     * certificatesResult zaten issued_at DESC sıralı geldiği için ilk kayıt
     * assignment'ın güncel sertifikasıdır.
     */
    const certificateByAssignment =
      new Map<string, AnyRow>();

    certificateRows.forEach(
      (certificate) => {
        const assignmentId =
          clean(
            certificate.assignment_id
          );

        if (
          assignmentId &&
          !certificateByAssignment.has(
            assignmentId
          )
        ) {
          certificateByAssignment.set(
            assignmentId,
            certificate
          );
        }
      }
    );

    const archiveFileKey = (
      documentType: string,
      sessionKey: string,
      employeeRemoteId = ""
    ) =>
      [
        documentType,
        sessionKey,
        employeeRemoteId,
      ].join("|");

    const archiveFileMap =
      new Map<string, AnyRow>();

    archiveFiles.forEach(
      (file) => {
        const type =
          clean(
            file.document_type
          );

        const key =
          clean(
            file.session_key
          );

        const employeeId =
          clean(
            file.employee_remote_id
          );

        if (!key) {
          return;
        }

        archiveFileMap.set(
          archiveFileKey(
            type,
            key,
            employeeId
          ),
          file
        );
      }
    );

    const trainings =
      assignments
        .map(
          (
            assignment: AnyRow,
            index: number
          ) => {
            const trainingId =
              clean(
                assignment.training_id
              );

            const training =
              trainingMap.get(
                trainingId
              );

            if (!training) {
              return null;
            }

            const user =
              userMap.get(
                clean(
                  assignment.user_id
                )
              );

            const employeeRemoteId =
              clean(
                user?.employee_id
              );

            const employee =
              employeeMap.get(
                employeeRemoteId
              );

            const key =
              buildSessionKey(
                trainingId
              );

            const certificate =
              certificateByAssignment.get(
                clean(
                  assignment.id
                )
              );

            const trainingDocument =
              archiveFileMap.get(
                archiveFileKey(
                  "TRAINING_DOCUMENT",
                  key
                )
              );

            const attendanceFile =
              archiveFileMap.get(
                archiveFileKey(
                  "ATTENDANCE_SIGNED",
                  key
                )
              );

            const certificateFile =
              archiveFileMap.get(
                archiveFileKey(
                  "CERTIFICATE_SIGNED",
                  key,
                  employeeRemoteId
                )
              );

            const completed =
              isCompleted(
                assignment,
                training
              );

            const completedAt =
              toMillis(
                assignment.completed_at
              );

            const startedAt =
              toMillis(
                assignment.started_at
              );

            const issuedAt =
              toMillis(
                certificate?.issued_at
              );

            const validUntil =
              toMillis(
                certificate?.valid_until
              );

            const rawType =
              clean(training.type);

            const normalizedType =
              rawType.toLowerCase();

            return {
              id:
                clean(
                  assignment.id
                ) ||
                `assignment-${index}`,

              sessionKey:
                key,

              trainingId,

              employeeRemoteId:
                employeeRemoteId ||
                clean(user?.id),

              employeeName:
                employee?.fullName ||
                clean(
                  user?.full_name
                ) ||
                "Çalışan",

              employeeRegistryNo:
                employee
                  ?.registryNo ||
                "",

              employeeJobTitle:
                employee
                  ?.jobTitle ||
                "",

              trainingTitle:
                clean(
                  training.title
                ) ||
                "Eğitim",

              trainingType:
                rawType,

              deliveryMode:
                normalizedType.includes(
                  "asenkron"
                )
                  ? "ASENKRON"
                  : normalizedType.includes(
                      "senkron"
                    )
                  ? "SENKRON"
                  : "ÖRGÜN",

              trainingDate:
                completedAt ||
                startedAt ||
                issuedAt ||
                toMillis(
                  training.created_at
                ),

              validUntil,

              trainingTimeText:
                "",

              durationMinutes:
                Number(
                  training.duration_minutes ??
                    0
                ) || 0,

              trainerName:
                "",

              trainerRole:
                "",

              trainerOrg:
                "",

              trainingPlace:
                normalizedType.includes(
                  "asenkron"
                )
                  ? "D-SEC Asenkron Eğitim Portalı"
                  : "",

              onlineUrl:
                "",

              completionNote:
                completed
                  ? "Eğitim tamamlandı."
                  : clean(
                      assignment.status
                    ),

              completed,

              assignmentStatus:
                clean(
                  assignment.status
                ),

              finalScore:
                assignment.final_exam_score ===
                  null ||
                assignment.final_exam_score ===
                  undefined
                  ? null
                  : Number(
                      assignment.final_exam_score
                    ),

              documentUri:
                clean(
                  trainingDocument
                    ?.public_url
                ),

              attendanceUri:
                clean(
                  attendanceFile
                    ?.public_url
                ),

              certificateUri:
                clean(
                  certificateFile
                    ?.public_url
                ),
            };
          }
        )
        .filter(Boolean);

    const certificates =
      certificateRows.map(
        (
          row: AnyRow,
          index: number
        ) => {
          const employeeRemoteId =
            clean(
              row.employee_id
            );

          const employee =
            employeeMap.get(
              employeeRemoteId
            );

          const key =
            buildSessionKey(
              clean(
                row.training_id
              )
            );

          const signedFile =
            archiveFileMap.get(
              archiveFileKey(
                "CERTIFICATE_SIGNED",
                key,
                employeeRemoteId
              )
            );

          const verificationCode =
            clean(
              row.verification_code
            );

          return {
            id:
              clean(row.id) ||
              `certificate-${index}`,

            employeeRemoteId:
              employeeRemoteId ||
              clean(
                row.user_id
              ),

            employeeName:
              employee?.fullName ||
              clean(
                row.employee_name
              ) ||
              "Çalışan",

            employeeRegistryNo:
              employee
                ?.registryNo ||
              "",

            trainingTitle:
              clean(
                row.training_title
              ) ||
              clean(
                trainingMap.get(
                  clean(
                    row.training_id
                  )
                )?.title
              ) ||
              "Eğitim Sertifikası",

            certificateNo:
              clean(
                row.certificate_no
              ),

            issueDate:
              toMillis(
                row.issued_at
              ),

            validUntil:
              toMillis(
                row.valid_until
              ),

            status:
              clean(
                row.status
              ) ||
              "ISSUED",

            remoteFileUrl:
              clean(
                signedFile
                  ?.public_url
              ) ||
              (
                verificationCode
                  ? `/certificate/verify/${encodeURIComponent(
                      verificationCode
                    )}`
                  : ""
              ),
          };
        }
      );

    const sessionCount =
      new Set(
        trainings.map(
          (item: any) =>
            item.sessionKey
        )
      ).size;

    const participantCount =
      new Set(
        trainings
          .map(
            (item: any) =>
              item.employeeRemoteId
          )
          .filter(Boolean)
      ).size;

    const attendanceFormCount =
      new Set(
        trainings
          .map(
            (item: any) =>
              item.attendanceUri
          )
          .filter(Boolean)
      ).size;

    const trainingDocumentCount =
      new Set(
        trainings
          .map(
            (item: any) =>
              item.documentUri
          )
          .filter(Boolean)
      ).size;

    const now = Date.now();

    const warningLimit =
      now +
      30 * 86400000;

    const warningCount =
      certificates.filter(
        (item: any) =>
          item.validUntil &&
          item.validUntil <=
            warningLimit
      ).length;

    return NextResponse.json({
      success: true,
      firmId,

      source:
        "WEB_NATIVE_TRAINING_ARCHIVE",

      employees,
      trainings,
      certificates,

      metrics: {
        sessionCount,
        participantCount,

        /*
         * Katılım kaydı = eğitim ataması / kişi-eğitim ilişkisi.
         */
        attendanceCount:
          trainings.length,

        attendanceFormCount,
        trainingDocumentCount,

        certificateCount:
          certificates.length,

        warningCount,
      },

      diagnostics: {
        activeEmployees:
          employees.length,

        companyUsers:
          users.length,

        assignments:
          assignments.length,

        assignedTrainings:
          trainingIds.length,

        certificates:
          certificateRows.length,

        archiveFiles:
          archiveFiles.length,
      },
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
