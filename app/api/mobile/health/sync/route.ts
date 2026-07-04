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

    const rawAppRecordId = record.localId?.toString();
    const localFirmId = Number(record.firmId || 0);
    const webFirmId = String(record.webFirmId || "").trim();

    if (!rawAppRecordId) {
      return NextResponse.json({ success: false, error: "localId missing" }, { status: 400 });
    }

    if (localFirmId <= 0) {
      return NextResponse.json({ success: false, error: "firmId missing" }, { status: 400 });
    }

    if (!webFirmId) {
      return NextResponse.json({ success: false, error: "webFirmId missing" }, { status: 400 });
    }

    const appRecordId = `${localFirmId}_${rawAppRecordId}`;
    const payload = mapRecord(record, localFirmId, webFirmId);

    const { data: existing, error: existingError } = await supabase
      .from("health_records")
      .select("id")
      .eq("app_record_id", appRecordId)
      .eq("web_firm_id", webFirmId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }

    const result = existing?.id
      ? await supabase
          .from("health_records")
          .update({
            ...payload,
            app_record_id: appRecordId,
          })
          .eq("id", existing.id)
          .select()
          .single()
      : await supabase
          .from("health_records")
          .insert({
            ...payload,
            app_record_id: appRecordId,
          })
          .select()
          .single();

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const firmId = searchParams.get("firmId");

    let query = supabase
      .from("health_records")
      .select(`
        id,
        app_record_id,
        firm_id,
        web_firm_id,
        employee_id,
        employee_name,
        role_or_unit,
        exam_type,
        exam_date_millis,
        next_due_millis,
        vaccine_note,
        general_note,
        is_deleted,
        deleted_at,
        created_at_millis,
        updated_at_millis,
        source
      `)
      .or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0")
      .order("exam_date_millis", { ascending: false });

    if (firmId && firmId !== "all") {
      query = query.eq("web_firm_id", firmId.trim());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    employee_name: r.employeeName || "",

    role_or_unit: r.roleOrUnit || null,
    exam_type: r.examType || "MUAYENE",

    exam_date_millis: Number(r.examDateMillis || Date.now()),
    next_due_millis: Number(r.nextDueMillis || 0) || null,

    vaccine_note: r.vaccineNote || null,
    general_note: r.generalNote || null,

    is_deleted: isDeleted,
    deleted_at: deletedAtValue > 0 ? deletedAtValue : null,

    created_at_millis: Number(r.createdAtMillis || Date.now()),
    updated_at_millis: Number(r.updatedAtMillis || Date.now()),

    source: r.source || "APP",
  };
}