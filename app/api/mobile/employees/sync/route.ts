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

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();

    if (!firmId) {
      return NextResponse.json(
        { error: "firmId zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("firm_id", firmId)
      .order("full_name", { ascending: true });

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

    const firm_id = String(body?.firm_id || "").trim();
    const full_name = String(body?.full_name || "").trim();

    if (!firm_id || !full_name) {
      return NextResponse.json(
        { error: "firm_id ve full_name zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const tc_no = String(body?.tc_no || "").trim();
    const registry_no = String(body?.registry_no || "").trim();
    const email = String(body?.email || "").trim();

    let duplicateQuery = supabase
      .from("employees")
      .select("id")
      .eq("firm_id", firm_id)
      .limit(1);

    if (tc_no) {
      duplicateQuery = duplicateQuery.eq("tc_no", tc_no);
    } else if (registry_no) {
      duplicateQuery = duplicateQuery.eq("registry_no", registry_no);
    } else if (email) {
      duplicateQuery = duplicateQuery.eq("email", email);
    } else {
      duplicateQuery = duplicateQuery.eq("full_name", full_name);
    }

    const { data: duplicate } = await duplicateQuery.maybeSingle();

    if (duplicate?.id) {
      return NextResponse.json({
        success: true,
        remoteId: duplicate.id,
        duplicateProtected: true,
      });
    }

    const now = new Date().toISOString();

    const payload = {
      firm_id,
      full_name,
      job_title: String(body?.job_title || "").trim() || null,
      start_date: String(body?.start_date || "").trim() || null,
      exit_date: String(body?.exit_date || "").trim() || null,
      active: Boolean(body?.active ?? true),
      registry_no: registry_no || null,
      birth_date: String(body?.birth_date || "").trim() || null,
      disability_status: String(body?.disability_status || "").trim() || null,
      gender: String(body?.gender || "").trim() || null,
      education_level: String(body?.education_level || "").trim() || null,
      phone: String(body?.phone || "").trim() || null,
      email: email || null,
      blood_type: String(body?.blood_type || "").trim() || null,
      tc_no: tc_no || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("employees")
      .insert([payload])
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
      return NextResponse.json(
        { error: "id zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const payload = {
      firm_id: String(body?.firm_id || "").trim() || null,
      full_name: String(body?.full_name || "").trim() || null,
      job_title: String(body?.job_title || "").trim() || null,
      start_date: String(body?.start_date || "").trim() || null,
      exit_date: String(body?.exit_date || "").trim() || null,
      active: Boolean(body?.active ?? true),
      registry_no: String(body?.registry_no || "").trim() || null,
      birth_date: String(body?.birth_date || "").trim() || null,
      disability_status: String(body?.disability_status || "").trim() || null,
      gender: String(body?.gender || "").trim() || null,
      education_level: String(body?.education_level || "").trim() || null,
      phone: String(body?.phone || "").trim() || null,
      email: String(body?.email || "").trim() || null,
      blood_type: String(body?.blood_type || "").trim() || null,
      tc_no: String(body?.tc_no || "").trim() || null,
      updated_at: new Date().toISOString(),
    };

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