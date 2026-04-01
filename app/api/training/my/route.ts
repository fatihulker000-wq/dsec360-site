import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value;

    console.log("USER ID FROM COOKIE:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı yok (cookie gelmedi)" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let user: any = null;

    if (userId === "admin-1") {
      user = {
        id: "admin-1",
        full_name: "Admin Kullanıcı",
      };
    } else {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userData) {
        return NextResponse.json(
          { error: "Kullanıcı DB'de yok" },
          { status: 401 }
        );
      }

      user = userData;
    }

    let assignmentsQuery = supabase
      .from("training_assignments")
      .select(`
        id,
        status,
        training_id
      `)
      .order("id", { ascending: false });

    if (userId !== "admin-1") {
      assignmentsQuery = assignmentsQuery.eq("user_id", userId);
    }

    const { data, error } = await assignmentsQuery;

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { error: "Eğitim verileri alınamadı" },
        { status: 500 }
      );
    }

    let trainingsMap: Record<string, any> = {};

    if (data && data.length > 0) {
      const trainingIds = data
        .map((x: any) => x.training_id)
        .filter(Boolean);

      if (trainingIds.length > 0) {
        const { data: trainings, error: trainingsError } = await supabase
          .from("trainings")
          .select("id, title, description, content_url, type")
          .in("id", trainingIds);

        if (trainingsError) {
          console.error("TRAININGS FETCH ERROR:", trainingsError);
          return NextResponse.json(
            { error: "Eğitim detayları alınamadı" },
            { status: 500 }
          );
        }

        trainingsMap = Object.fromEntries(
          (trainings || []).map((t: any) => [t.id, t])
        );
      }
    }

    const result = (data || []).map((item: any) => ({
      ...item,
      training: item.training_id ? trainingsMap[item.training_id] || null : null,
    }));

    return NextResponse.json({
      success: true,
      user,
      data: result,
    });
  } catch (err) {
    console.error("GENEL HATA:", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}