import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type TrainingStatus = "not_started" | "in_progress" | "completed";
type ExamType = "pre" | "final";

type AnswerItem = {
  questionId: string;
  selectedOption?: "A" | "B" | "C" | "D";
  selected_option?: "A" | "B" | "C" | "D";
};

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status: TrainingStatus;
  watch_completed: boolean | null;
  pre_exam_completed: boolean;
  pre_exam_score: number;
  final_exam_score: number;
  final_exam_attempts: number;
  final_exam_passed: boolean;
  training_reset_required: boolean;
  watch_seconds?: number | null;
  click_count?: number | null;
};

type QuestionRow = {
  id: string;
  training_id: string;
  exam_type: ExamType;
  correct_option: "A" | "B" | "C" | "D";
  is_active?: boolean | null;
};

type TrainingMetaRow = {
  id: string;
  type: string | null;
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();
  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";
  return "asenkron";
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı yok." }, { status: 401 });
    }

    const body = await request.json();
    const assignmentId = body?.assignmentId as string | undefined;
    const examType = body?.examType as ExamType | undefined;
    const answers = (body?.answers || []) as AnswerItem[];

    if (!assignmentId || !examType || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Eksik veri." }, { status: 400 });
    }

    if (examType !== "pre" && examType !== "final") {
      return NextResponse.json(
        { error: "Geçersiz sınav tipi." },
        { status: 400 }
      );
    }

    if (answers.length === 0) {
      return NextResponse.json(
        { error: "Cevaplar boş." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select(
        "id, user_id, training_id, status, watch_completed, pre_exam_completed, pre_exam_score, final_exam_score, final_exam_attempts, final_exam_passed, training_reset_required, watch_seconds, click_count"
      )
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .single<AssignmentRow>();

    if (assignmentError || !assignment) {
      console.error("assignment fetch hatası:", assignmentError);
      return NextResponse.json(
        { error: "Eğitim kaydı bulunamadı." },
        { status: 404 }
      );
    }

    const { data: trainingMeta } = await supabase
      .from("trainings")
      .select("id, type")
      .eq("id", assignment.training_id)
      .maybeSingle<TrainingMetaRow>();

    const trainingType = normalizeType(trainingMeta?.type);

    const { data: questions, error: questionError } = await supabase
      .from("training_exam_questions")
      .select("id, training_id, exam_type, correct_option, is_active")
      .eq("training_id", assignment.training_id)
      .eq("exam_type", examType)
      .order("sort_order", { ascending: true })
      .returns<QuestionRow[]>();

    if (questionError) {
      console.error("question fetch hatası:", questionError);
      return NextResponse.json(
        { error: "Sorular alınamadı." },
        { status: 500 }
      );
    }

    const safeQuestions = (questions || []).filter(
      (q) => q.is_active !== false
    );

    if (safeQuestions.length === 0) {
      return NextResponse.json(
        { error: "Bu sınav için soru bulunamadı." },
        { status: 400 }
      );
    }

    if (examType === "pre" && assignment.pre_exam_completed) {
      return NextResponse.json({
        success: true,
        examType: "pre",
        score: assignment.pre_exam_score || 0,
        passed: true,
        message: "Ön değerlendirme zaten tamamlanmış.",
      });
    }

    if (examType === "final") {
      if (!assignment.pre_exam_completed) {
        return NextResponse.json(
          { error: "Final için önce ön sınav tamamlanmalıdır." },
          { status: 400 }
        );
      }

      if (trainingType === "asenkron") {
        if (!assignment.watch_completed) {
          return NextResponse.json(
            { error: "Son değerlendirme için önce eğitimi tamamlamalısın." },
            { status: 400 }
          );
        }

        if ((assignment.watch_seconds || 0) <= 0) {
          return NextResponse.json(
            { error: "İzleme süresi kaydı bulunamadı." },
            { status: 400 }
          );
        }

        if ((assignment.click_count || 0) <= 0) {
          return NextResponse.json(
            { error: "Ekran başı doğrulama kaydı bulunamadı." },
            { status: 400 }
          );
        }
      }

      if ((assignment.final_exam_attempts || 0) >= 3) {
        return NextResponse.json(
          { error: "Final sınav hakkı bitmiş. Eğitim yeniden alınmalı." },
          { status: 400 }
        );
      }
    }

    const answerMap = new Map(
      answers.map((item) => [
        item.questionId,
        String(item.selected_option || item.selectedOption || "")
          .toUpperCase()
          .trim(),
      ])
    );

    let correctCount = 0;

    for (const q of safeQuestions) {
      const selected = answerMap.get(q.id);
      const correct = String(q.correct_option || "").toUpperCase().trim();

      if (selected && selected === correct) {
        correctCount += 1;
      }
    }

    const score = Math.round((correctCount / safeQuestions.length) * 100);

    if (examType === "pre") {
      const { error: updateError } = await supabase
        .from("training_assignments")
        .update({
          pre_exam_completed: true,
          pre_exam_score: score,
          training_reset_required: false,
          status: "in_progress",
        })
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("pre exam update hatası:", updateError);
        return NextResponse.json(
          { error: "Ön değerlendirme kaydedilemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        examType: "pre",
        score,
        passed: true,
        message: "Ön sınav tamamlandı. Eğitime devam edebilirsin.",
      });
    }

    const nextAttempt = (assignment.final_exam_attempts || 0) + 1;
    const passed = score >= 60;

    if (passed) {
      const { error: successError } = await supabase
        .from("training_assignments")
        .update({
          final_exam_score: score,
          final_exam_attempts: nextAttempt,
          final_exam_passed: true,
          training_reset_required: false,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (successError) {
        console.error("final exam success update hatası:", successError);
        return NextResponse.json(
          { error: "Sınav sonucu kaydedilemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        examType: "final",
        score,
        passed: true,
        attemptsUsed: nextAttempt,
        attemptsLeft: Math.max(0, 3 - nextAttempt),
        message: "Sınav başarılı. Eğitim tamamlandı.",
      });
    }

    if (nextAttempt >= 3) {
      const { error: failResetError } = await supabase
        .from("training_assignments")
        .update({
          final_exam_score: score,
          final_exam_attempts: nextAttempt,
          final_exam_passed: false,
          training_reset_required: true,
          status: "not_started",
          started_at: null,
          completed_at: null,
          watch_completed: false,
          pre_exam_completed: false,
          pre_exam_score: 0,
          watch_seconds: 0,
          click_count: 0,
        })
        .eq("id", assignmentId)
        .eq("user_id", userId);

      if (failResetError) {
        console.error("final exam reset update hatası:", failResetError);
        return NextResponse.json(
          { error: "Başarısızlık durumu kaydedilemedi." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        examType: "final",
        score,
        passed: false,
        attemptsUsed: nextAttempt,
        attemptsLeft: 0,
        resetRequired: true,
        message: "3 sınav hakkı bitti. Eğitim yeniden alınmalı.",
      });
    }

    const { error: failUpdateError } = await supabase
      .from("training_assignments")
      .update({
        final_exam_score: score,
        final_exam_attempts: nextAttempt,
        final_exam_passed: false,
        status: "in_progress",
      })
      .eq("id", assignmentId)
      .eq("user_id", userId);

    if (failUpdateError) {
      console.error("final exam fail update hatası:", failUpdateError);
      return NextResponse.json(
        { error: "Başarısız sınav sonucu kaydedilemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      examType: "final",
      score,
      passed: false,
      attemptsUsed: nextAttempt,
      attemptsLeft: Math.max(0, 3 - nextAttempt),
      resetRequired: false,
      message: "Sınav başarısız. Kalan hakkın var.",
    });
  } catch (err) {
    console.error("exam submit genel hata:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}