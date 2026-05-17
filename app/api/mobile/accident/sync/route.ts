import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = body?.record;

    if (!record) {
      return NextResponse.json(
        { success: false, error: "record missing" },
        { status: 400 }
      );
    }

    const rawAppRecordId = record.localId?.toString();
    const localFirmId = Number(record.firmId || 0);
    const webFirmId = String(record.webFirmId || "").trim();

    if (!rawAppRecordId) {
      return NextResponse.json(
        { success: false, error: "localId missing" },
        { status: 400 }
      );
    }

    if (localFirmId <= 0) {
      return NextResponse.json(
        { success: false, error: "firmId missing" },
        { status: 400 }
      );
    }

    if (!webFirmId) {
      return NextResponse.json(
        { success: false, error: "webFirmId missing" },
        { status: 400 }
      );
    }

    const appRecordId = `${localFirmId}_${rawAppRecordId}`;

    const payload = mapRecord(record, localFirmId, webFirmId);

    let existingId: string | null = null;

    const { data: existingComposite, error: existingCompositeError } =
      await supabase
        .from("accident_records")
        .select("id")
        .eq("app_record_id", appRecordId)
        .eq("web_firm_id", webFirmId)
        .maybeSingle();

    if (existingCompositeError) {
      return NextResponse.json(
        { success: false, error: existingCompositeError.message },
        { status: 500 }
      );
    }

    existingId = existingComposite?.id ?? null;

    if (!existingId) {
      const { data: existingLegacy, error: existingLegacyError } =
        await supabase
          .from("accident_records")
          .select("id")
          .eq("app_record_id", rawAppRecordId)
          .eq("firm_id", localFirmId)
          .maybeSingle();

      if (existingLegacyError) {
        return NextResponse.json(
          { success: false, error: existingLegacyError.message },
          { status: 500 }
        );
      }

      existingId = existingLegacy?.id ?? null;
    }

    const result = existingId
      ? await supabase
          .from("accident_records")
          .update({
            ...payload,
            app_record_id: appRecordId,
          })
          .eq("id", existingId)
          .select()
          .single()
      : await supabase
          .from("accident_records")
          .insert({
            ...payload,
            app_record_id: appRecordId,
          })
          .select()
          .single();

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remoteId: result.data.id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "unknown error" },
      { status: 500 }
    );
  }
}

function mapRecord(r: any, localFirmId: number, webFirmId: string) {
  const isDeleted =
    r.isDeleted === true ||
    r.isDeleted === 1 ||
    r.isDeleted === "1" ||
    r.isDeleted === "true";

  const deletedAtValue = Number(r.deletedAt || 0);

  return {
    firm_id: localFirmId,
    web_firm_id: webFirmId,

    employee_id: Number(r.employeeId || 0),

    event_type: r.eventType || "KAZA",
    event_date: Number(r.eventDate || 0),

    title: r.title || "",
    description: r.description || "",
    location: r.location || "",

    severity: Number(r.severity || 0),
    lost_work_days: Number(r.lostWorkDays || 0),

    employee_name: r.employeeName || "",
    department: r.department || "",
    shift: r.shift || "",

    injury_body_part: r.injuryBodyPart || "",
    injury_type: r.injuryType || "",
    root_cause_category: r.rootCauseCategory || "",

    event_hour: Number(r.eventHour ?? -1),
    event_week_day: r.eventWeekDay || "",

    incident_photo_path: r.incidentPhotoPath || "",
    root_cause_photo_path: r.rootCausePhotoPath || "",
    correction_photo_path: r.correctionPhotoPath || "",

    is_active: Number(r.isActive ?? 1),

    is_deleted: isDeleted,
    deleted_at: deletedAtValue > 0 ? deletedAtValue : null,

    created_at: Number(r.createdAt || Date.now()),
    updated_at: Number(r.updatedAt || Date.now()),

    source: r.source || "APP",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const firmId = searchParams.get("firmId");

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
        created_at,
        updated_at,
        source
      `)
      .eq("is_deleted", false)
      .order("event_date", { ascending: false });

    if (firmId && firmId !== "all") {
      query = query.eq("web_firm_id", firmId.trim());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "pull error" },
      { status: 500 }
    );
  }
}