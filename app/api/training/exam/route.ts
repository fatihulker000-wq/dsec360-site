import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { assignmentId, answers } = body;

    if (!assignmentId || !answers) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
    }

    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/training_exam_questions`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const questions = await res.json();

    let correct = 0;

    questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_option) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);

    return NextResponse.json({
      success: true,
      score,
      passed: score >= 60,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}