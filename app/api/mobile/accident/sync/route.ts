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
      return NextResponse.json({ success: false, error: "record missing" }, { status: 400 });
    }

    const appRunId = record.localId?.toString();

    if (!appRunId) {
      return NextResponse.json({ success: false, error: "localId missing" }, { status: 400 });
    }

    const payload = mapRecord(record);

    const { data: existing } = await supabase
      .from("accident_records")
      .select("id")
      .eq("app_record_id", appRunId)
      .maybeSingle();

    const result = existing
      ? await supabase
          .from("accident_records")
          .update(payload)
          .eq("app_record_id", appRunId)
          .select()
          .single()
      : await supabase
          .from("accident_records")
          .insert({
            ...payload,
            app_record_id: appRunId,
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

function mapRecord(r: any) {
  return {
    // ✅ ASIL ÇÖZÜM:
    // firm_id bigint olduğu için APP local firmId burada kalacak.
    // webFirmId UUID/text olduğu için firm_id içine yazılmayacak.
    firm_id: Number(r.firmId || 0),

    employee_id: Number(r.employeeId || 0),

    event_type: r.eventType,
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
    event_hour: Number(r.eventHour || 0),
    event_week_day: r.eventWeekDay || "",

    incident_photo_path: r.incidentPhotoPath || "",
    root_cause_photo_path: r.rootCausePhotoPath || "",
    correction_photo_path: r.correctionPhotoPath || "",

    is_active: Number(r.isActive ?? 1),
    created_at: Number(r.createdAt || Date.now()),
    updated_at: Number(r.updatedAt || Date.now()),

    source: "APP",
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
        created_at,
        updated_at,
        source
      `)
      .order("event_date", { ascending: false });

    if (firmId && firmId !== "all") {
      query = query.eq("firm_id", Number(firmId));
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