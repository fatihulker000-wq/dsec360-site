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
        { error: "record missing" },
        { status: 400 }
      );
    }

    // 🔑 unique kontrol (çakışmayı önler)
    const appRunId = record.localId?.toString();

    const { data: existing } = await supabase
      .from("accident_records")
      .select("id")
      .eq("app_record_id", appRunId)
      .maybeSingle();

    let result;

    if (existing) {
      // UPDATE
      result = await supabase
        .from("accident_records")
        .update(mapRecord(record))
        .eq("app_record_id", appRunId)
        .select()
        .single();
    } else {
      // INSERT
      result = await supabase
        .from("accident_records")
        .insert({
          ...mapRecord(record),
          app_record_id: appRunId
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remoteId: result.data.id
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "unknown error" },
      { status: 500 }
    );
  }
}


// 📦 MAP (APP → DB)
function mapRecord(r: any) {
  return {
    firm_id: r.firmId,
    employee_id: r.employeeId,

    event_type: r.eventType,
    event_date: r.eventDate,
    title: r.title,
    description: r.description,
    location: r.location,
    severity: r.severity,
    lost_work_days: r.lostWorkDays,

    employee_name: r.employeeName,
    department: r.department,
    shift: r.shift,
    injury_body_part: r.injuryBodyPart,
    injury_type: r.injuryType,
    root_cause_category: r.rootCauseCategory,
    event_hour: r.eventHour,
    event_week_day: r.eventWeekDay,

    incident_photo_path: r.incidentPhotoPath,
    root_cause_photo_path: r.rootCausePhotoPath,
    correction_photo_path: r.correctionPhotoPath,

    is_active: r.isActive,
    created_at: r.createdAt,
    updated_at: r.updatedAt,

    source: "APP"
  };
}