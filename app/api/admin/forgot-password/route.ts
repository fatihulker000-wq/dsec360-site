import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, is_active")
      .ilike("email", email)
      .in("role", ["super_admin", "company_admin"])
      .maybeSingle();

    if (error) {
      console.error("forgot-password user read error:", error);
      return NextResponse.json(
        { error: "Kullanıcı okunamadı." },
        { status: 500 }
      );
    }

    // güvenlik için kullanıcı yoksa da success dönüyoruz
    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (user.is_active === false) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expireDate = new Date(Date.now() + 1000 * 60 * 30); // 30 dk

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: token,
        reset_token_expires_at: expireDate.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("forgot-password token update error:", updateError);
      return NextResponse.json(
        { error: "Reset bilgisi kaydedilemedi." },
        { status: 500 }
      );
    }

   const resetUrl = '${req.nextUrl.origin}/admin/reset-password?token=${token}';

  await resend.emails.send({
  from: "DSEC <noreply@dsec360.com>",
  to: email,
  subject: "Şifre Yenileme",
  html: `
    <h2>Şifre Yenileme</h2>
    <p>Şifrenizi yenilemek için aşağıdaki butona tıklayın:</p>

    <a href="${resetUrl}" 
       style="
         display:inline-block;
         padding:12px 18px;
         background:#c62828;
         color:#fff;
         text-decoration:none;
         border-radius:8px;
         font-weight:bold;
       ">
       Şifreyi Yenile
    </a>

    <p>Bu bağlantı 30 dakika geçerlidir.</p>
  `,
});

return NextResponse.json({
  success: true,
});
  } catch (error) {
    console.error("forgot-password general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}