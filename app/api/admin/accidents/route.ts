import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(
  req: NextRequest
) {
  try {
    const cookieStore = await cookies();

    const auth = clean(
      cookieStore.get(
        "dsec_admin_auth"
      )?.value ||
        cookieStore.get(
          "dsec_user_auth"
        )?.value
    );

    const role = clean(
      cookieStore.get(
        "dsec_admin_role"
      )?.value ||
        cookieStore.get(
          "dsec_user_role"
        )?.value
    );

    const userId = clean(
      cookieStore.get(
        "dsec_user_id"
      )?.value
    );

    const companyIdFromCookie =
      clean(
        cookieStore.get(
          "dsec_company_id"
        )?.value
      );

    const firmIdParam = clean(
      req.nextUrl.searchParams.get(
        "firmId"
      )
    );

    const employeeIdParam = clean(
      req.nextUrl.searchParams.get(
        "employeeId"
      )
    );

    const employeeNameParam =
      clean(
        req.nextUrl.searchParams.get(
          "employeeName"
        )
      );

    const allowedRoles = [
      "admin",
      "super_admin",
      "company_admin",
      "demo_user",
    ];

    if (
      auth !== "ok" ||
      !allowedRoles.includes(role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const companyScoped =
      role === "company_admin" ||
      role === "demo_user";

    let selectedCompanyId: string | null =
      firmIdParam &&
      firmIdParam !== "all"
        ? firmIdParam
        : null;

    /*
     * Demo ve firma yöneticisinin firma kapsamı
     * URL parametresinden değil kullanıcı kaydından alınır.
     */
    if (companyScoped) {
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
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
          "accidents user scope error:",
          userError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Kullanıcı firma bilgisi alınamadı.",
          },
          { status: 500 }
        );
      }

      if (!userRow) {
        return NextResponse.json(
          {
            success: false,
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
            success: false,
            error:
              "Kullanıcı pasif durumda.",
          },
          { status: 403 }
        );
      }

      if (
        clean(userRow.role) !== role
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Oturum rolü ile kullanıcı rolü uyuşmuyor.",
          },
          { status: 403 }
        );
      }

      selectedCompanyId = clean(
        userRow.company_id
      );

      if (!selectedCompanyId) {
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

        selectedCompanyId = clean(
          primaryAccess?.firm_id
        );
      }

      if (!selectedCompanyId) {
        selectedCompanyId =
          companyIdFromCookie;
      }

      if (
        !selectedCompanyId ||
        selectedCompanyId === "ALL"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Kullanıcı için firma bilgisi bulunamadı.",
          },
          { status: 403 }
        );
      }
    }

    /*
     * UUID şirket kaydı yanında mobil uygulamanın
     * kullandığı local_firm_id değerini de bul.
     */
    let localFirmId: string | null =
      null;

    if (selectedCompanyId) {
      const {
        data: companyRow,
        error: companyError,
      } = await supabase
        .from("companies")
        .select(
          "id, local_firm_id"
        )
        .eq(
          "id",
          selectedCompanyId
        )
        .maybeSingle();

      if (companyError) {
        console.error(
          "accidents company scope error:",
          companyError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Firma bilgisi alınamadı.",
          },
          { status: 500 }
        );
      }

      if (!companyRow) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Firma bulunamadı.",
          },
          { status: 404 }
        );
      }

      localFirmId = clean(
        companyRow.local_firm_id
      ) || null;
    }

    let query = supabase
      .from("accident_records")
      .select(`
        id,
        app_record_id,
        firm_id,
        web_firm_id,
        employee_id,
        event_type,
        event_date,
        title,
        description,
        location,
        severity,
        lost_work_days,
        employee_name,
        department,
        shift,
        injury_body_part,
        injury_type,
        root_cause_category,
        event_hour,
        event_week_day,
        incident_photo_path,
        root_cause_photo_path,
        correction_photo_path,
        is_active,
        is_deleted,
        deleted_at,
        source,
        created_at,
        updated_at,
        created_at_server
      `)
      .or(
        "is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"
      );

    /*
     * Firma UUID'si web_firm_id alanında;
     * mobil yerel kimlik firm_id alanında tutuluyor.
     */
    if (selectedCompanyId) {
      const numericLocalFirmId =
        Number(localFirmId);

      if (
        localFirmId &&
        Number.isFinite(
          numericLocalFirmId
        )
      ) {
        query = query.or(
          `web_firm_id.eq.${selectedCompanyId},firm_id.eq.${numericLocalFirmId}`
        );
      } else {
        query = query.eq(
          "web_firm_id",
          selectedCompanyId
        );
      }
    }

    if (employeeNameParam) {
      query = query.ilike(
        "employee_name",
        `%${employeeNameParam}%`
      );
    }

    if (employeeIdParam) {
      /*
       * employee_id gerçek çalışan UUID'sidir.
       * app_record_id yalnızca sayısal değer gönderilmişse
       * karşılaştırılır.
       */
      const numericEmployeeId =
        Number(employeeIdParam);

      if (
        Number.isFinite(
          numericEmployeeId
        )
      ) {
        query = query.or(
          `employee_id.eq.${employeeIdParam},app_record_id.eq.${numericEmployeeId}`
        );
      } else {
        query = query.eq(
          "employee_id",
          employeeIdParam
        );
      }
    }

    const {
      data,
      error,
    } = await query.order(
      "event_date",
      {
        ascending: false,
      }
    );

    if (error) {
      console.error(
        "accidents GET error:",
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

    const rows = (
      data || []
    ).map((item: any) => ({
      id: item.id,

      appRecordId:
        item.app_record_id,

      firmId:
        item.firm_id,

      webFirmId:
        item.web_firm_id,

      employeeId:
        item.employee_id,

      title:
        item.title || "-",

      employeeName:
        item.employee_name || "-",

      eventType:
        item.event_type || "-",

      location:
        item.location || "-",

      severity:
        item.severity ?? 0,

      lostWorkDays:
        item.lost_work_days ?? 0,

      eventDate:
        item.event_date ?? null,

      createdAt:
        item.created_at ?? null,

      updatedAt:
        item.updated_at ?? null,

      createdAtServer:
        item.created_at_server ??
        null,

      description:
        item.description || "",

      department:
        item.department || "",

      shift:
        item.shift || "",

      injuryBodyPart:
        item.injury_body_part ||
        "",

      injuryType:
        item.injury_type || "",

      rootCauseCategory:
        item.root_cause_category ||
        "",

      eventHour:
        item.event_hour ?? null,

      eventWeekDay:
        item.event_week_day || "",

      incidentPhotoPath:
        item.incident_photo_path ||
        "",

      rootCausePhotoPath:
        item.root_cause_photo_path ||
        "",

      correctionPhotoPath:
        item.correction_photo_path ||
        "",

      isActive:
        item.is_active ?? 1,

      isDeleted:
        item.is_deleted ?? 0,

      deletedAt:
        item.deleted_at ?? null,

      source:
        item.source || "APP",
    }));

    return NextResponse.json({
      success: true,
      role,
      readOnly:
        role === "demo_user",
      selectedCompanyId:
        selectedCompanyId || null,
      rows,
    });
  } catch (errorValue: unknown) {
    console.error(
      "accidents GET general error:",
      errorValue
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Sunucu hatası.",
      },
      { status: 500 }
    );
  }
}