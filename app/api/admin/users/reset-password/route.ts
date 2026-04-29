import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();

  const email = body.email;
  const newPassword = body.newPassword;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const hashed = sha256(newPassword);

  await supabase
    .from("users")
    .update({ password_hash: hashed })
    .ilike("email", email);

  return NextResponse.json({ success: true });
}