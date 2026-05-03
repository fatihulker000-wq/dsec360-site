import crypto from "crypto";
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

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

async function ensureTrainingUserForEmployee(params: {
  supabase: ReturnType<typeof getSupabase>;
  employee: any;
}) {
  const { supabase, employee } = params;

  const email = clean(employee.email);
  const fullName = clean(employee.full_name);
  const firmId = clean(employee.firm_id);

  if (!email || !fullName || !firmId || !employee.id) {
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, employee_id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingUser?.id) {
    await supabase
      .from("users")
      .update({
        employee_id: employee.id,
        company_id: firmId,
        role: "training_user",
        is_active: employee.active !== false,
      })
      .eq("id", existingUser.id);

    return;
  }

  const tempPassword = generatePassword();

  const { data: insertedUser, error: userError } = await supabase
    .from("users")
    .insert({
      full_name: fullName,
      email: normalizedEmail,
      password_hash: sha256(tempPassword),
      role: "training_user",
      company_id: firmId,
      employee_id: employee.id,
      is_active: employee.active !== false,
    })
    .select("id")
    .single();

  if (userError) {
    console.error("AUTO TRAINING USER CREATE ERROR:", userError);
    return;
  }

  if (insertedUser?.id) {
    await supabase.from("user_firm_access").insert({
      user_id: insertedUser.id,
      firm_id: firmId,
      role: "training_user",
      is_primary: true,
    });
  }
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

// ✅ OTOMATİK USER OLUŞTUR
if (data?.email) {
  const email = data.email.toLowerCase();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!existingUser) {
    const password = Math.random().toString(36).slice(-8);

    const { data: newUser } = await supabase
      .from("users")
      .insert({
        full_name: data.full_name,
        email,
        password_hash: sha256(password),
        role: "training_user",
        company_id: firmId,
        employee_id: data.id,
        is_active: true,
      })
      .select("id, company_id")
      .single();

    if (newUser?.id) {
      await supabase.from("user_firm_access").insert({
        user_id: newUser.id,
        firm_id: newUser.company_id,
        role: "training_user",
        is_primary: true,
      });
    }
  }
}

    if (error) {
      return NextResponse.json(
        { error: "Çalışan eklenemedi.", detail: error.message },
        { status: 500 }
      );
    }

await ensureTrainingUserForEmployee({
  supabase,
  employee: data,
});

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
    const mode = clean(searchParams.get("mode"));

    if (!id) {
      return NextResponse.json(
        { error: "id zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // ✅ Kalıcı silme
    if (mode === "hard") {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: "Çalışan kalıcı olarak silinemedi.", detail: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deleted: true,
      });
    }

    // ✅ Normal silme = pasife alma
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