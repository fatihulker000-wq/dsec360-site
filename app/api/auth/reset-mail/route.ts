import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const email = body.email;

  // 🔥 Şimdilik basit
  console.log("Reset mail gönderildi:", email);

  return NextResponse.json({ success: true });
}