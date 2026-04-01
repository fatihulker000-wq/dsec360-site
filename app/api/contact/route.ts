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

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const company_name = String(body?.company_name || "").trim();
    const phone = String(body?.phone || "").trim();
    const employee_count = String(body?.employee_count || "").trim();
    const demo_type = String(body?.demo_type || "limited_demo").trim();
    const message = String(body?.message || "").trim();

    if (!full_name || !email || !message) {
      return Response.json(
        { error: "Zorunlu alanlar boş olamaz." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const composedMessage = [
      `Demo Türü: ${demo_type}`,
      company_name ? `Firma: ${company_name}` : "",
      phone ? `Telefon: ${phone}` : "",
      employee_count ? `Çalışan Sayısı: ${employee_count}` : "",
      "",
      "Mesaj:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const insertPayload = {
      full_name,
      email,
      message: composedMessage,
    };

    const { data, error } = await supabase
      .from("contact_messages")
      .insert([insertPayload])
      .select("id, full_name, email, message, created_at")
      .single();

    if (error) {
      console.error("Contact DB kayıt hatası:", error);
      return Response.json(
        { error: "DB kayıt hatası." },
        { status: 500 }
      );
    }

    const resend = getResend();
    const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const openDemoUrl = `${appUrl}/demo`;
    const loginUrl = `${appUrl}/login`;

    const limitedDemoEmail =
      process.env.LIMITED_DEMO_EMAIL || "demo@dsec360.com";
    const limitedDemoPassword =
      process.env.LIMITED_DEMO_PASSWORD || "123456";

    if (resend && notifyEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [notifyEmail],
          subject: `Yeni Demo Talebi #${data.id}`,
          html: `
            <h2>Yeni Demo Talebi</h2>
            <p><strong>ID:</strong> #${data.id}</p>
            <p><strong>Ad Soyad:</strong> ${escapeHtml(full_name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Demo Türü:</strong> ${escapeHtml(demo_type)}</p>
            <p><strong>Firma:</strong> ${escapeHtml(company_name || "-")}</p>
            <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
            <p><strong>Çalışan Sayısı:</strong> ${escapeHtml(employee_count || "-")}</p>
            <p><strong>Tarih:</strong> ${escapeHtml(String(data.created_at || ""))}</p>
            <hr />
            <p><strong>Mesaj:</strong></p>
            <p>${escapeHtml(composedMessage).replace(/\n/g, "<br/>")}</p>
          `,
        });
      } catch (mailError) {
        console.error("Admin notification mail hatası:", mailError);
      }
    }

    if (resend) {
      try {
        const safeName = escapeHtml(full_name);
        const safeOpenDemoUrl = escapeHtml(openDemoUrl);
        const safeLoginUrl = escapeHtml(loginUrl);
        const safeDemoEmail = escapeHtml(limitedDemoEmail);
        const safeDemoPassword = escapeHtml(limitedDemoPassword);

        const replyHtml =
          demo_type === "full_demo"
            ? `
              <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#111827;">
                <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                  <div style="background:linear-gradient(135deg,#111827,#1f2937);padding:24px 28px;color:#ffffff;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;opacity:.9;">D-SEC FULL DEMO</div>
                    <div style="font-size:28px;font-weight:800;margin-top:8px;">Talebiniz Alındı</div>
                  </div>

                  <div style="padding:28px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
                      Merhaba <strong>${safeName}</strong>,
                    </p>

                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
                      Full demo talebiniz alınmıştır. Ekibimiz işletmenize uygun daha geniş kapsamlı demo planı için sizinle iletişime geçecektir.
                    </p>

                    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
                      Bu sırada açık demoyu inceleyebilirsiniz:
                    </p>

                    <a href="${safeOpenDemoUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;">
                      Açık Demoyu Gör
                    </a>
                  </div>
                </div>
              </div>
            `
            : `
              <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#111827;">
                <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                  <div style="background:linear-gradient(135deg,#111827,#1f2937);padding:24px 28px;color:#ffffff;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;opacity:.9;">D-SEC KISITLI DEMO</div>
                    <div style="font-size:28px;font-weight:800;margin-top:8px;">Demo Bilgileriniz Hazır</div>
                  </div>

                  <div style="padding:28px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
                      Merhaba <strong>${safeName}</strong>,
                    </p>

                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">
                      Kısıtlı demo talebiniz alınmıştır. Aşağıdaki bilgilerle demo ortamını inceleyebilirsiniz.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:18px 0;">
                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Açık Demo</div>
                      <div style="font-size:15px;font-weight:700;color:#111827;word-break:break-all;">${safeOpenDemoUrl}</div>

                      <div style="height:14px;"></div>

                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Kısıtlı Demo Giriş</div>
                      <div style="font-size:15px;font-weight:700;color:#111827;word-break:break-all;">${safeLoginUrl}</div>

                      <div style="height:14px;"></div>

                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Demo Kullanıcı</div>
                      <div style="font-size:16px;font-weight:800;color:#111827;">${safeDemoEmail}</div>

                      <div style="height:10px;"></div>

                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Demo Şifre</div>
                      <div style="font-size:18px;font-weight:800;color:#166534;">${safeDemoPassword}</div>
                    </div>

                    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
                      Kısıtlı demo ortamında bazı işlemler yalnızca görüntüleme amaçlıdır. Full demo için ekibimizle iletişime geçebilirsiniz.
                    </p>

                    <a href="${safeLoginUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;">
                      Demo Girişine Git
                    </a>
                  </div>
                </div>
              </div>
            `;

        await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject:
            demo_type === "full_demo"
              ? "D-SEC Full Demo Talebiniz Alındı"
              : "D-SEC Kısıtlı Demo Bilgileriniz",
          html: replyHtml,
        });
      } catch (replyError) {
        console.error("Auto reply mail hatası:", replyError);
      }
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Contact API genel hata:", error);
    return Response.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
