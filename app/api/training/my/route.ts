import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("ENV eksik");
  }

  return createClient(url, serviceRoleKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // 🔥 HARDCODE USER (TEST)
    const userId = "d13323a8-a148-43fb-89f5-054ae56666c8";

    // 🔥 1. assignments çek
    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("user_id", userId);

    if (assignmentsError) {
      return NextResponse.json(
        { error: "ASSIGNMENTS HATA", detail: assignmentsError },
        { status: 500 }
      );
    }

    // 🔥 2. trainings çek
    const { data: trainings, error: trainingsError } = await supabase
      .from("trainings")
      .select("*");

    if (trainingsError) {
      return NextResponse.json(
        { error: "TRAININGS HATA", detail: trainingsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignments,
      trainings,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "GENEL HATA", detail: String(err) },
      { status: 500 }
    );
  }
}