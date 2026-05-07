import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const appKey = req.headers.get("x-app-key");

    if (appKey !== "DSEC_APP_2026") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const body = await req.json();

    const remoteId = String(body.remoteId || "").trim();
    const localFirmId = Number(body.localFirmId || 0);

    if (!remoteId || !localFirmId) {
      return NextResponse.json(
        { error: "remoteId veya localFirmId eksik." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("companies")
      .update({ local_firm_id: localFirmId })
      .eq("id", remoteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Sunucu hatası" },
      { status: 500 }
    );
  }
}