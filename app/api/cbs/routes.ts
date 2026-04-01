import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, message } = body ?? {};

    if (!full_name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const insertPayload = {
      full_name: full_name.trim(),
      email: email.trim(),
      message: message.trim(),
      status: "new",
    };

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("id, full_name, email, message, created_at, status")
      .single();

    if (error) {
      console.error("CBS kayıt hatası:", error);
      return Response.json(
        { error: "Kayıt oluşturulamadı." },
        { status: 500 }
      );
    }

    const resend = getResend();
    const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (resend && notifyEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [notifyEmail],
          subject: "Yeni ÇBS Başvurusu #${data.id}",
          html: `
            <h2>Yeni ÇBS Başvurusu</h2>
            <p><strong>ID:</strong> #${data.id}</p>
            <p><strong>Ad Soyad:</strong> ${data.full_name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Durum:</strong> ${data.status}</p>
            <p><strong>Tarih:</strong> ${data.created_at}</p>
            <hr />
            <p><strong>Mesaj:</strong></p>
            <p>${data.message.replace(/\n/g, "<br/>")}</p>
          `,
        });
      } catch (mailError) {
        console.error("CBS mail gönderim hatası:", mailError);
      }
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("CBS POST hata:", error);
    return Response.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}