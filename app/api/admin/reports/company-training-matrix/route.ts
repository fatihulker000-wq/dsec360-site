import { createClient } from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type CompanyAnyRow =
  Record<string, unknown>;

type EmployeeRow = {
  id: string;
  firm_id: string | null;
  full_name: string | null;
  email: string | null;
  active: boolean | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
  employee_id: string | null;
  role: string | null;
  is_active: boolean | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  type: string | null;
  duration_minutes?: number | null;
};

type AssignmentRow = {
  user_id: string;
  training_id: string;
  status: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  watch_completed?: boolean | null;
  video_chain_completed?: boolean | null;
  final_exam_passed?: boolean | null;
};

function pickText(
  row: CompanyAnyRow,
  keys: string[]
) {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "-";
}

export async function GET(
  req: NextRequest
) {
  try {
    const cookieStore = await cookies();

    const auth = String(
      cookieStore.get(
        "dsec_admin_auth"
      )?.value ||
        cookieStore.get(
          "dsec_user_auth"
        )?.value ||
        ""
    ).trim();

    const resolvedRole = String(
      cookieStore.get(
        "dsec_admin_role"
      )?.value ||
        cookieStore.get(
          "dsec_user_role"
        )?.value ||
        ""
    ).trim();

    const userId = String(
      cookieStore.get(
        "dsec_user_id"
      )?.value || ""
    ).trim();

    const companyIdFromCookie =
      String(
        cookieStore.get(
          "dsec_company_id"
        )?.value || ""
      ).trim();

    if (auth !== "ok" || !resolvedRole) {
      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const allowedRoles = [
      "admin",
      "super_admin",
      "company_admin",
      "demo_user",
    ];

    if (
      !allowedRoles.includes(
        resolvedRole
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Bu rol raporlara erişemez.",
        },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    let requestedCompanyId =
      String(
        req.nextUrl.searchParams.get(
          "companyId"
        ) || ""
      ).trim();

    const companyScoped =
      resolvedRole ===
        "company_admin" ||
      resolvedRole === "demo_user";

    /*
     * Firma yöneticisi ve demo kullanıcısı
     * URL'den başka firma gönderse bile kendi
     * firmasına sabitlenir.
     */
    if (companyScoped) {
      if (!userId) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı bilgisi bulunamadı.",
          },
          { status: 401 }
        );
      }

      const {
        data: userRow,
        error: userError,
      } = await supabase
        .from("users")
        .select(
          "id, role, company_id, is_active"
        )
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        console.error(
          "training matrix user error:",
          userError
        );

        return NextResponse.json(
          {
            error:
              "Kullanıcı firma bilgisi alınamadı.",
          },
          { status: 500 }
        );
      }

      if (!userRow) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı bulunamadı.",
          },
          { status: 404 }
        );
      }

      if (
        userRow.is_active === false
      ) {
        return NextResponse.json(
          {
            error:
              "Kullanıcı pasif durumda.",
          },
          { status: 403 }
        );
      }

      if (
        String(
          userRow.role || ""
        ).trim() !== resolvedRole
      ) {
        return NextResponse.json(
          {
            error:
              "Oturum rolü uyuşmuyor.",
          },
          { status: 403 }
        );
      }

      let ownCompanyId = String(
        userRow.company_id || ""
      ).trim();

      if (!ownCompanyId) {
        const {
          data: primaryAccess,
        } = await supabase
          .from(
            "user_firm_access"
          )
          .select("firm_id")
          .eq("user_id", userId)
          .eq("is_primary", true)
          .limit(1)
          .maybeSingle();

        ownCompanyId = String(
          primaryAccess?.firm_id ||
            ""
        ).trim();
      }

      if (!ownCompanyId) {
        const {
          data: firstAccess,
        } = await supabase
          .from(
            "user_firm_access"
          )
          .select("firm_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        ownCompanyId = String(
          firstAccess?.firm_id || ""
        ).trim();
      }

      if (!ownCompanyId) {
        ownCompanyId =
          companyIdFromCookie;
      }

      if (
        !ownCompanyId ||
        ownCompanyId === "ALL"
      ) {
        return NextResponse.json(
          {
            error:
              "Bu kullanıcıya bağlı firma bulunamadı.",
          },
          { status: 403 }
        );
      }

      requestedCompanyId =
        ownCompanyId;
    }

    if (!requestedCompanyId) {
      return NextResponse.json(
        {
          error: "Firma seçilmedi.",
        },
        { status: 400 }
      );
    }

    /*
     * Demo ve firma yöneticisine ALL kapsamı
     * hiçbir durumda verilmez.
     */
    if (
      companyScoped &&
      requestedCompanyId === "ALL"
    ) {
      return NextResponse.json(
        {
          error:
            "Bu kullanıcı tüm firmaları görüntüleyemez.",
        },
        { status: 403 }
      );
    }

    let companyRow: CompanyAnyRow;

    if (
      requestedCompanyId === "ALL"
    ) {
      companyRow = {
        id: "ALL",
        name: "Tüm Firmalar",
      };
    } else {
      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq(
          "id",
          requestedCompanyId
        )
        .maybeSingle();

      if (companyError) {
        console.error(
          "training matrix company error:",
          companyError
        );

        return NextResponse.json(
          {
            error:
              "Firma bilgisi alınamadı.",
          },
          { status: 500 }
        );
      }

      if (!companyData) {
        return NextResponse.json(
          {
            error:
              "Firma bulunamadı.",
          },
          { status: 404 }
        );
      }

      companyRow =
        companyData as CompanyAnyRow;
    }

    /*
     * Çalışan sayısı users tablosundan değil,
     * gerçek employees tablosundan alınır.
     */
    let employeesQuery = supabase
      .from("employees")
      .select(
        "id, firm_id, full_name, email, active"
      )
      .order("full_name", {
        ascending: true,
      });

    if (
      requestedCompanyId !== "ALL"
    ) {
      employeesQuery =
        employeesQuery.eq(
          "firm_id",
          requestedCompanyId
        );
    }

    const {
      data: employeesData,
      error: employeesError,
    } = await employeesQuery;

    if (employeesError) {
      console.error(
        "training matrix employees error:",
        employeesError
      );

      return NextResponse.json(
        {
          error:
            "Firma çalışanları alınamadı.",
        },
        { status: 500 }
      );
    }

    const employeeRows =
      (employeesData ||
        []) as EmployeeRow[];

    const employeeIds =
      employeeRows
        .map((employee) =>
          String(
            employee.id || ""
          ).trim()
        )
        .filter(Boolean);

    /*
     * Çalışanlara bağlı eğitim kullanıcılarını bul.
     */
    let trainingUsers: UserRow[] =
      [];

    if (employeeIds.length > 0) {
      const {
        data: usersData,
        error: usersError,
      } = await supabase
        .from("users")
        .select(
          "id, full_name, email, company_id, employee_id, role, is_active"
        )
        .eq(
          "role",
          "training_user"
        )
        .in(
          "employee_id",
          employeeIds
        );

      if (usersError) {
        console.error(
          "training matrix users error:",
          usersError
        );

        return NextResponse.json(
          {
            error:
              "Eğitim kullanıcıları alınamadı.",
          },
          { status: 500 }
        );
      }

      trainingUsers =
        (usersData ||
          []) as UserRow[];
    }

    /*
     * Eski kayıtlarda employee_id bulunmayabilir.
     * Firma bağlantılı training_user kayıtlarını da al.
     */
    if (
      requestedCompanyId !== "ALL"
    ) {
      const {
        data: companyUsersData,
        error: companyUsersError,
      } = await supabase
        .from("users")
        .select(
          "id, full_name, email, company_id, employee_id, role, is_active"
        )
        .eq(
          "role",
          "training_user"
        )
        .eq(
          "company_id",
          requestedCompanyId
        );

      if (companyUsersError) {
        console.error(
          "training matrix company users error:",
          companyUsersError
        );
      } else {
        const userMap = new Map(
          trainingUsers.map(
            (user) => [
              String(user.id),
              user,
            ]
          )
        );

        (
          (companyUsersData ||
            []) as UserRow[]
        ).forEach((user) => {
          userMap.set(
            String(user.id),
            user
          );
        });

        trainingUsers =
          Array.from(
            userMap.values()
          );
      }
    }

    const userByEmployeeId =
      new Map<string, UserRow>();

    const userByEmail =
      new Map<string, UserRow>();

    trainingUsers.forEach(
      (user) => {
        const employeeId =
          String(
            user.employee_id || ""
          ).trim();

        const email = String(
          user.email || ""
        )
          .trim()
          .toLowerCase();

        if (employeeId) {
          userByEmployeeId.set(
            employeeId,
            user
          );
        }

        if (email) {
          userByEmail.set(
            email,
            user
          );
        }
      }
    );

    /*
     * Her gerçek çalışan rapor matrisine eklenir.
     * Eğitim hesabı olmayan çalışan da görünür.
     */
    const participants =
      employeeRows.map(
        (employee) => {
          const employeeId =
            String(employee.id);

          const email = String(
            employee.email || ""
          )
            .trim()
            .toLowerCase();

          const trainingUser =
            userByEmployeeId.get(
              employeeId
            ) ||
            (email
              ? userByEmail.get(
                  email
                )
              : undefined);

          return {
            employee_id:
              employeeId,
            assignment_user_id:
              trainingUser?.id
                ? String(
                    trainingUser.id
                  )
                : null,
            full_name:
              String(
                employee.full_name ||
                  trainingUser?.full_name ||
                  "Adsız Çalışan"
              ).trim(),
            email:
              String(
                employee.email ||
                  trainingUser?.email ||
                  ""
              ).trim(),
            is_active:
              employee.active !==
              false,
          };
        }
      );

    const participantUserIds =
      participants
        .map(
          (participant) =>
            participant.assignment_user_id
        )
        .filter(
          (
            id
          ): id is string =>
            Boolean(id)
        );

    let assignments: AssignmentRow[] =
      [];

    if (
      participantUserIds.length > 0
    ) {
      const {
        data: assignmentsData,
        error: assignmentsError,
      } = await supabase
        .from(
          "training_assignments"
        )
        .select(
          "user_id, training_id, status, started_at, completed_at, created_at, watch_completed, video_chain_completed, final_exam_passed"
        )
        .in(
          "user_id",
          participantUserIds
        );

      if (assignmentsError) {
        console.error(
          "training matrix assignments error:",
          assignmentsError
        );

        return NextResponse.json(
          {
            error:
              "Eğitim atama verileri alınamadı.",
          },
          { status: 500 }
        );
      }

      assignments =
        (assignmentsData ||
          []) as AssignmentRow[];
    }

    const assignedTrainingIds =
      Array.from(
        new Set(
          assignments
            .map((assignment) =>
              String(
                assignment.training_id ||
                  ""
              ).trim()
            )
            .filter(Boolean)
        )
      );

    let trainingsQuery = supabase
      .from("trainings")
      .select(
        "id, title, type, duration_minutes"
      )
      .order("title", {
        ascending: true,
      });

    /*
     * Firmaya atanmış eğitim varsa yalnızca onları;
     * henüz atama yoksa demo kataloğunu gösterebilmek
     * için mevcut eğitim listesini getirir.
     */
    if (
      requestedCompanyId !==
        "ALL" &&
      assignedTrainingIds.length >
        0
    ) {
      trainingsQuery =
        trainingsQuery.in(
          "id",
          assignedTrainingIds
        );
    }

    const {
      data: trainingsData,
      error: trainingsError,
    } = await trainingsQuery;

    if (trainingsError) {
      console.error(
        "training matrix trainings error:",
        trainingsError
      );

      return NextResponse.json(
        {
          error:
            "Eğitim listesi alınamadı.",
        },
        { status: 500 }
      );
    }

    const trainings =
      (
        (trainingsData ||
          []) as TrainingRow[]
      ).map((training) => ({
        id: String(training.id),
        title:
          String(
            training.title ||
              "Adsız Eğitim"
          ).trim(),
        type:
          String(
            training.type || ""
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ),
        duration_minutes:
          typeof training.duration_minutes ===
          "number"
            ? training.duration_minutes
            : 0,
      }));

    const trainingTypeMap =
      new Map<string, string>();

    const trainingMetaMap =
      new Map<
        string,
        (typeof trainings)[number]
      >();

    trainings.forEach(
      (training) => {
        trainingTypeMap.set(
          training.id,
          training.type
        );

        trainingMetaMap.set(
          training.id,
          training
        );
      }
    );

    function resolveTrainingStatus(
      assignment: AssignmentRow
    ) {
      const type =
        trainingTypeMap.get(
          String(
            assignment.training_id
          )
        ) || "";

      const isAppRecord = [
        "orgun",
        "örgün",
        "ozel",
        "özel",
      ].includes(type);

      if (isAppRecord) {
        return "App Kaydı";
      }

      const watched =
        assignment.video_chain_completed ===
          true ||
        assignment.watch_completed ===
          true;

      const isCompleted =
        assignment.status ===
          "completed" &&
        watched &&
        assignment.final_exam_passed ===
          true;

      if (isCompleted) {
        return "Tamamlandı";
      }

      if (
        assignment.status ===
        "in_progress"
      ) {
        return "Devam Ediyor";
      }

      return "Başlamadı";
    }

    const assignmentMap =
      new Map<
        string,
        {
          status: string;
          training_date:
            | string
            | null;
          duration_minutes: number;
          type: string;
        }
      >();

    assignments.forEach(
      (assignment) => {
        const key =
          `${assignment.user_id}__${assignment.training_id}`;

        const trainingMeta =
          trainingMetaMap.get(
            String(
              assignment.training_id
            )
          );

        assignmentMap.set(
          key,
          {
            status:
              resolveTrainingStatus(
                assignment
              ),
            training_date:
              assignment.completed_at ||
              assignment.started_at ||
              assignment.created_at ||
              null,
            duration_minutes:
              trainingMeta?.duration_minutes ||
              0,
            type:
              trainingMeta?.type ||
              "",
          }
        );
      }
    );

    const matrix =
      participants.map(
        (participant) => {
          const statuses =
            trainings.map(
              (training) => {
                const key =
                  participant.assignment_user_id
                    ? `${participant.assignment_user_id}__${training.id}`
                    : "";

                const found = key
                  ? assignmentMap.get(
                      key
                    )
                  : undefined;

                return {
                  training_id:
                    training.id,
                  status:
                    found?.status ||
                    "Atanmadı",
                  type:
                    found?.type ||
                    training.type ||
                    "",
                  duration_minutes:
                    found?.duration_minutes ||
                    training.duration_minutes ||
                    0,
                  training_date:
                    found?.training_date ||
                    null,
                };
              }
            );

          return {
            user_id:
              participant.assignment_user_id ||
              `employee:${participant.employee_id}`,
            full_name:
              participant.full_name,
            email:
              participant.email,
            is_active:
              participant.is_active,
            statuses,
          };
        }
      );

    const completedCount =
      assignments.filter(
        (assignment) => {
          const status =
            resolveTrainingStatus(
              assignment
            );

          return (
            status ===
              "Tamamlandı" ||
            status === "App Kaydı"
          );
        }
      ).length;

    const inProgressCount =
      assignments.filter(
        (assignment) =>
          resolveTrainingStatus(
            assignment
          ) === "Devam Ediyor"
      ).length;

    const appRecordCount =
      assignments.filter(
        (assignment) =>
          resolveTrainingStatus(
            assignment
          ) === "App Kaydı"
      ).length;

    const notStartedCount =
      assignments.filter(
        (assignment) =>
          resolveTrainingStatus(
            assignment
          ) === "Başlamadı"
      ).length;

    return NextResponse.json({
      success: true,
      role: resolvedRole,
      read_only:
        resolvedRole ===
        "demo_user",
      company: {
        id: String(
          companyRow.id ||
            requestedCompanyId
        ),
        name: pickText(
          companyRow,
          [
            "name",
            "company_name",
            "firma_adi",
          ]
        ),
        company_title: pickText(
          companyRow,
          [
            "company_title",
            "title",
            "unvan",
            "company_official_title",
          ]
        ),
        address: pickText(
          companyRow,
          [
            "address",
            "adres",
            "full_address",
          ]
        ),
        employer_representative:
          pickText(
            companyRow,
            [
              "employer_representative",
              "isveren_vekili",
              "authorized_person",
              "yetkili_kisi",
              "yetkili",
            ]
          ),
        employee_count:
          participants.length,
      },
      summary: {
        total_employees:
          participants.length,
        total_trainings:
          trainings.length,
        total_assignments:
          assignments.length,
        completed_count:
          completedCount,
        app_record_count:
          appRecordCount,
        in_progress_count:
          inProgressCount,
        not_started_count:
          notStartedCount,
      },
      trainings,
      matrix,
    });
  } catch (error) {
    console.error(
      "company training matrix error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}