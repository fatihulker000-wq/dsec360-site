import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function clean(value: any) {
  const v = String(value ?? "").trim();
  return v || null;
}

function buildEmployeePayload(body: any) {
  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (body?.firm_id !== undefined) payload.firm_id = clean(body.firm_id);
  if (body?.full_name !== undefined) payload.full_name = clean(body.full_name);
  if (body?.job_title !== undefined) payload.job_title = clean(body.job_title);
  if (body?.phone !== undefined) payload.phone = clean(body.phone);
  if (body?.email !== undefined) payload.email = clean(body.email);
  if (body?.registry_no !== undefined) payload.registry_no = clean(body.registry_no);
  if (body?.tc_no !== undefined) payload.tc_no = clean(body.tc_no);
  if (body?.start_date !== undefined) payload.start_date = clean(body.start_date);
  if (body?.exit_date !== undefined) payload.exit_date = clean(body.exit_date);
  if (body?.gender !== undefined) payload.gender = clean(body.gender);
  if (body?.disability_status !== undefined) payload.disability_status = clean(body.disability_status);
  if (body?.birth_date !== undefined) payload.birth_date = clean(body.birth_date);
  if (body?.education_level !== undefined) payload.education_level = clean(body.education_level);
  if (body?.blood_type !== undefined) payload.blood_type = clean(body.blood_type);

  if (body?.active !== undefined) {
    payload.active = Boolean(body.active);
  }

  return payload;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get("firmId");

    const supabase = getSupabase();

    let allEmployees: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
      let pagedQuery = supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true })
        .range(from, from + step - 1);

      if (firmId && firmId !== "all") {
        pagedQuery = pagedQuery.eq("firm_id", firmId);
      }

      const { data, error } = await pagedQuery;

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const rows = data || [];
      allEmployees = [...allEmployees, ...rows];

      if (rows.length < step) break;

      from += step;
    }

    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });

    return NextResponse.json({
      data: allEmployees,
      companies: companies || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = getSupabase();

    const firmId = clean(body?.firm_id);
    const fullName = clean(body?.full_name);

    if (!firmId || !fullName) {
      return NextResponse.json(
        { error: "firm_id ve full_name zorunlu." },
        { status: 400 }
      );
    }

    const payload = {
      ...buildEmployeePayload(body),
      firm_id: firmId,
      full_name: fullName,
      active: body?.active !== undefined ? Boolean(body.active) : true,
      exit_date: body?.exit_date !== undefined ? clean(body.exit_date) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("employees")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Çalışan eklenemedi.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const supabase = getSupabase();

    const id = clean(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "id zorunlu." },
        { status: 400 }
      );
    }

    const payload = buildEmployeePayload(body);

    const { data, error } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Çalışan güncellenemedi.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = clean(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { error: "id zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("employees")
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Çalışan pasife alınamadı.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}