import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ExamType = "pre" | "final";

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı yok." },
        { status: 401 }
      );
    }

    const assignmentId = params.id;
    const url = new URL(req.url);
    const examType = url.searchParams.get("type") as ExamType | null;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignment id gerekli" },
        { status: 400 }
      );
    }

    if (!examType || !["pre", "final"].includes(examType)) {
      return NextResponse.json(
        { error: "geçerli exam_type gerekli: pre | final" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id")
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .single<AssignmentRow>();

    if (assignmentError || !assignment) {
      console.error("assignment fetch hatası:", assignmentError);
      return NextResponse.json(
        { error: "Eğitim ataması bulunamadı." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("training_exam_questions")
      .select("*")
      .eq("training_id", assignment.training_id)
      .eq("exam_type", examType)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("exam question fetch hatası:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("exam get genel hata:", error);
    return NextResponse.json(
      { error: error?.message || "sunucu hatası" },
      { status: 500 }
    );
  }
}