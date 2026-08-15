export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type ExamType = "pre" | "final";
type CorrectOption = "A" | "B" | "C" | "D";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase sunucu ortam değişkenleri eksik.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function allowed() {
  const store = await cookies();

  const auth = store.get("dsec_admin_auth")?.value;
  const role = store.get("dsec_admin_role")?.value;

  return (
    auth === "ok" &&
    ["super_admin", "company_admin"].includes(role || "")
  );
}

function parseExamType(value: unknown): ExamType | null {
  if (value === "pre" || value === "final") {
    return value;
  }

  return null;
}

function parseCorrectOption(value: unknown): CorrectOption | null {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (
    normalized === "A" ||
    normalized === "B" ||
    normalized === "C" ||
    normalized === "D"
  ) {
    return normalized;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await allowed())) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const trainingId = String(
      request.nextUrl.searchParams.get("trainingId") || ""
    ).trim();

    const requestedExamType = parseExamType(
      request.nextUrl.searchParams.get("examType")
    );

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId gerekli." },
        { status: 400 }
      );
    }

    let query = getSupabase()
      .from("training_exam_questions")
      .select("*")
      .eq("training_id", trainingId)
      .order("exam_type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (requestedExamType) {
      query = query.eq("exam_type", requestedExamType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          error: `Sorular alınamadı: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await allowed())) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const trainingId = String(body?.trainingId || "").trim();
    const examType = parseExamType(body?.examType);
    const question = String(body?.question || "").trim();

    const optionA = String(body?.optionA || "").trim();
    const optionB = String(body?.optionB || "").trim();
    const optionC = String(body?.optionC || "").trim();
    const optionD = String(body?.optionD || "").trim();

    const correctOption = parseCorrectOption(
      body?.correctOption
    );

    const sortOrder = Math.max(
      0,
      Math.floor(Number(body?.sortOrder || 0))
    );

    const isActive = body?.isActive !== false;

    if (
      !trainingId ||
      !examType ||
      !question ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !correctOption
    ) {
      return NextResponse.json(
        {
          error:
            "Soru, sınav türü, dört seçenek ve doğru cevap zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: training, error: trainingError } =
      await supabase
        .from("trainings")
        .select("id")
        .eq("id", trainingId)
        .maybeSingle();

    if (trainingError) {
      return NextResponse.json(
        {
          error: `Eğitim doğrulanamadı: ${trainingError.message}`,
        },
        { status: 500 }
      );
    }

    if (!training) {
      return NextResponse.json(
        { error: "Eğitim bulunamadı." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("training_exam_questions")
      .insert({
        training_id: trainingId,
        exam_type: examType,
        question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: `Soru eklenemedi: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}