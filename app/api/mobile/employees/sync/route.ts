import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function authorized(req: Request) {
  return String(req.headers.get("x-api-key") || "").trim() === MOBILE_API_KEY;
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

function clean(value: any) {
  const v = String(value ?? "").trim();
  return v || null;
}

function buildPayload(body: any) {
  return {
    firm_id: String(body?.firm_id || "").trim(),
    full_name: String(body?.full_name || "").trim(),
    job_title: clean(body?.job_title),
    start_date: clean(body?.start_date),
    exit_date: clean(body?.exit_date),
    active: Boolean(body?.active ?? true),
    registry_no: clean(body?.registry_no),
    birth_date: clean(body?.birth_date),
    disability_status: clean(body?.disability_status),
    gender: clean(body?.gender),
    education_level: clean(body?.education_level),
    phone: clean(body?.phone),
    email: clean(body?.email),
    blood_type: clean(body?.blood_type),
    tc_no: clean(body?.tc_no),
    updated_at: new Date().toISOString(),
  };
}

async function findDuplicate(supabase: any, payload: any) {
  let query = supabase
    .from("employees")
    .select("id")
    .eq("firm_id", payload.firm_id)
    .limit(1);

  if (payload.tc_no) query = query.eq("tc_no", payload.tc_no);
  else if (payload.registry_no) query = query.eq("registry_no", payload.registry_no);
  else if (payload.email) query = query.eq("email", payload.email);
  else query = query.eq("full_name", payload.full_name);

  const { data } = await query.maybeSingle();
  return data?.id || null;
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();

    if (!firmId) {
      return NextResponse.json({ error: "firmId zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
  .from("employees")
  .select("*")
  .eq("firm_id", firmId)
  .order("full_name", { ascending: true })
  .range(0, 5000);

    if (error) {
      return NextResponse.json(
        { error: "Çalışanlar alınamadı.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();

    const body = await req.json();
    const supabase = getSupabase();

    // ✅ BULK SYNC: 1000+ çalışan tek istekle gelir
    if (Array.isArray(body?.employees)) {
      const results: any[] = [];

      for (const item of body.employees) {
        const payload = buildPayload(item);
        const localId = String(item?.local_id || "").trim();
        const remoteId = String(item?.id || item?.remote_id || "").trim();

        if (!payload.firm_id || !payload.full_name) {
          results.push({
            localId,
            success: false,
            error: "firm_id/full_name eksik",
          });
          continue;
        }

        if (remoteId) {
          const { error } = await supabase
            .from("employees")
            .update(payload)
            .eq("id", remoteId);

          results.push({
            localId,
            remoteId,
            success: !error,
            error: error?.message || null,
          });

          continue;
        }

        const duplicateId = await findDuplicate(supabase, payload);

        if (duplicateId) {
          const { error } = await supabase
            .from("employees")
            .update(payload)
            .eq("id", duplicateId);

          results.push({
            localId,
            remoteId: duplicateId,
            success: !error,
            duplicateProtected: true,
            error: error?.message || null,
          });

          continue;
        }

        const { data, error } = await supabase
          .from("employees")
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select("id")
          .single();

        results.push({
          localId,
          remoteId: data?.id || null,
          success: !error && !!data?.id,
          error: error?.message || null,
        });
      }

      return NextResponse.json({
        success: true,
        bulk: true,
        count: results.length,
        results,
      });
    }

    // ✅ Tek çalışan eski yapı bozulmasın
    const payload = buildPayload(body);

    if (!payload.firm_id || !payload.full_name) {
      return NextResponse.json(
        { error: "firm_id ve full_name zorunlu." },
        { status: 400 }
      );
    }

    const duplicateId = await findDuplicate(supabase, payload);

    if (duplicateId) {
      return NextResponse.json({
        success: true,
        remoteId: duplicateId,
        duplicateProtected: true,
      });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Çalışan oluşturulamadı.", detail: error?.message || null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remoteId: data.id,
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
    if (!authorized(req)) return unauthorized();

    const body = await req.json();
    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();
    const payload = buildPayload(body);

    const { error } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Çalışan güncellenemedi.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}