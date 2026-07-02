import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const adminAuth =
      cookieStore.get("dsec_admin_auth")?.value;

    const firmIdParam =
      req.nextUrl.searchParams.get("firmId");

      const employeeIdParam =
  req.nextUrl.searchParams.get("employeeId");

    if (!adminAuth) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz erişim",
        },
        { status: 401 }
      );
    }

    const selectedFirmId =
      firmIdParam &&
      firmIdParam !== "all" &&
      firmIdParam.trim() !== ""
        ? firmIdParam.trim()
        : null;

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

      // 🔥 SADECE AKTİF / SİLİNMEMİŞLER
      .or(
        "is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"
      );

    if (selectedFirmId) {

      const numericFirmId =
        Number(selectedFirmId);

      if (Number.isFinite(numericFirmId)) {

        query = query.or(
          `
          web_firm_id.eq.${selectedFirmId},
          firm_id.eq.${numericFirmId}
          `
            .replace(/\n/g, "")
            .replace(/\s+/g, "")
        );

      } else {

        query = query.eq(
          "web_firm_id",
          selectedFirmId
        );
      }
    }


const selectedEmployeeId =
  employeeIdParam && employeeIdParam.trim() !== ""
    ? employeeIdParam.trim()
    : null;

if (selectedEmployeeId) {
  query = query.eq("employee_id", selectedEmployeeId);
}

    const { data, error } =
      await query.order(
        "event_date",
        {
          ascending: false,
        }
      );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const rows = (data || []).map(
      (item: any) => ({

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
          item.created_at_server ?? null,

        description:
          item.description || "",

        department:
          item.department || "",

        shift:
          item.shift || "",

        injuryBodyPart:
          item.injury_body_part || "",

        injuryType:
          item.injury_type || "",

        rootCauseCategory:
          item.root_cause_category || "",

        eventHour:
          item.event_hour ?? null,

        eventWeekDay:
          item.event_week_day || "",

        incidentPhotoPath:
          item.incident_photo_path || "",

        rootCausePhotoPath:
          item.root_cause_photo_path || "",

        correctionPhotoPath:
          item.correction_photo_path || "",

        isActive:
          item.is_active ?? 1,

        isDeleted:
          item.is_deleted ?? 0,

        deletedAt:
          item.deleted_at ?? null,

        source:
          item.source || "APP",
      })
    );

    return NextResponse.json({
      success: true,
      rows,
    });

  } catch (e: any) {

    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          "Sunucu hatası",
      },
      { status: 500 }
    );
  }
}
