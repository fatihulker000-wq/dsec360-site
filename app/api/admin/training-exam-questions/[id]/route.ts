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

function parseCorrectOption(
  value: unknown
): CorrectOption | null {
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

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    if (!(await allowed())) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const questionId = String(id || "").trim();

    if (!questionId) {
      return NextResponse.json(
        { error: "Soru kimliği gerekli." },
        { status: 400 }
      );
    }

    const body = await request.json();

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
            "Soru bilgileri eksik veya geçersiz.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from("training_exam_questions")
      .update({
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
      .eq("id", questionId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: `Soru güncellenemedi: ${error.message}`,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Soru bulunamadı." },
        { status: 404 }
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

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    if (!(await allowed())) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const questionId = String(id || "").trim();

    if (!questionId) {
      return NextResponse.json(
        { error: "Soru kimliği gerekli." },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from("training_exam_questions")
      .delete()
      .eq("id", questionId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: `Soru silinemedi: ${error.message}`,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Soru bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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