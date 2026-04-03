import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trainingId = params.id;
    const url = new URL(req.url);
    const examType = url.searchParams.get("type");

    if (!trainingId) {
      return NextResponse.json(
        { error: "training id gerekli" },
        { status: 400 }
      );
    }

    if (!examType || !["pre", "final"].includes(examType)) {
      return NextResponse.json(
        { error: "geçerli exam_type gerekli: pre | final" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("training_exam_questions")
      .select("*")
      .eq("training_id", trainingId)
      .eq("exam_type", examType)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "sunucu hatası" },
      { status: 500 }
    );
  }
}