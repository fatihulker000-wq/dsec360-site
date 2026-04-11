import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type ExamType = "pre" | "final";

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
};

type QuestionRow = {
  id: string;
  training_id: string;
  exam_type: ExamType;
  correct_option: "A" | "B" | "C" | "D";
  is_active?: boolean | null;
  sort_order?: number | null;
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı yok." }, { status: 401 });
    }

    const body = await req.json();

    const assignmentId = String(body?.assignmentId || "").trim();
    const examType =
      body?.examType === "pre" || body?.examType === "final"
        ? (body.examType as ExamType)
        : "final";

    const rawAnswers = body?.answers;

    if (!assignmentId || !rawAnswers) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id")
      .eq("id", assignmentId)
      .maybeSingle<AssignmentRow>();

    if (assignmentError) {
      console.error("legacy exam route assignment fetch hatası:", assignmentError);
      return NextResponse.json(
        { error: "Eğitim ataması okunamadı." },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "Eğitim ataması bulunamadı." },
        { status: 404 }
      );
    }

    if (userId !== "admin-1" && String(assignment.user_id).trim() !== userId) {
      return NextResponse.json(
        { error: "Bu eğitim atamasına erişim yetkiniz yok." },
        { status: 403 }
      );
    }

    const { data: questions, error: questionError } = await supabase
      .from("training_exam_questions")
      .select("id, training_id, exam_type, correct_option, is_active, sort_order")
      .eq("training_id", assignment.training_id)
      .eq("exam_type", examType)
      .order("sort_order", { ascending: true })
      .returns<QuestionRow[]>();

    if (questionError) {
      console.error("legacy exam route question fetch hatası:", questionError);
      return NextResponse.json(
        { error: "Sorular alınamadı." },
        { status: 500 }
      );
    }

    const safeQuestions = (questions || []).filter((q) => q.is_active !== false);

    if (safeQuestions.length === 0) {
      return NextResponse.json(
        { error: "Bu sınav için soru bulunamadı." },
        { status: 400 }
      );
    }

    const answerMap = new Map<string, string>();

    if (Array.isArray(rawAnswers)) {
      for (const item of rawAnswers) {
        const questionId = String(item?.questionId || item?.id || "").trim();
        const selected = String(
          item?.selected_option || item?.selectedOption || item?.answer || ""
        )
          .toUpperCase()
          .trim();

        if (questionId) {
          answerMap.set(questionId, selected);
        }
      }
    } else if (typeof rawAnswers === "object" && rawAnswers !== null) {
      for (const [questionId, value] of Object.entries(rawAnswers)) {
        answerMap.set(
          String(questionId).trim(),
          String(value || "").toUpperCase().trim()
        );
      }
    }

    let correct = 0;

    for (const q of safeQuestions) {
      const selected = String(answerMap.get(String(q.id)) || "")
        .toUpperCase()
        .trim();
      const correctOption = String(q.correct_option || "")
        .toUpperCase()
        .trim();

      if (selected && selected === correctOption) {
        correct += 1;
      }
    }

    const score = Math.round((correct / safeQuestions.length) * 100);

    return NextResponse.json({
      success: true,
      examType,
      totalQuestions: safeQuestions.length,
      correctCount: correct,
      score,
      passed: score >= 60,
    });
  } catch (err) {
    console.error("legacy exam route genel hata:", err);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}