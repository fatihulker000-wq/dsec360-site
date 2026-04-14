import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const { id, replyMessage } = await req.json();

    if (!id || !replyMessage?.trim()) {
      return NextResponse.json(
        { error: "Eksik veri" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("cbs_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Kayıt bulunamadı" },
        { status: 404 }
      );
    }

    const resend = getResend();

    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: [data.email],
        subject: "Başvurunuz hakkında geri dönüş",
        html: `
          <h2>Başvurunuza Yanıt</h2>
          <p>Sayın ${data.full_name},</p>
          <p>${replyMessage}</p>
          <hr/>
          <p><strong>Başvuru No:</strong> #${data.id}</p>
        `,
      });
    }

    await supabase
      .from("cbs_forms")
      .update({
        status: "closed",
        resolution_note: replyMessage,
        closed_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase.from("cbs_mail_logs").insert({
      cbs_form_id: id,
      direction: "outbound",
      subject: "Admin cevap",
      recipient_email: data.email,
      status: "sent",
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}