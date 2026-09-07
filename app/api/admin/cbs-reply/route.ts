import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Role =
  | "super_admin"
  | "company_admin";

type Session = {
  role: Role;
  activeFirmId: string;
};

type CbsReplyRow = {
  id: number;
  firm_id: string | null;
  reference_no: string | null;
  email: string | null;
  privacy_mode: string | null;
  status: string | null;
  first_response_at: string | null;
  mail_sent_count: number | null;
};

function db() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase yapılandırması eksik."
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(
  value: unknown
) {
  return String(value ?? "").trim();
}

function uuid(
  value: unknown
) {
  const candidate =
    clean(value);

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : "";
}

function escapeHtml(
  value: unknown
) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, max-age=0",
  };
}

async function getSession():
  Promise<Session | null> {
  const cookieStore =
    await cookies();

  const auth =
    clean(
      cookieStore.get(
        "dsec_admin_auth"
      )?.value ||
        cookieStore.get(
          "dsec_user_auth"
        )?.value
    );

  const role =
    clean(
      cookieStore.get(
        "dsec_admin_role"
      )?.value ||
        cookieStore.get(
          "dsec_user_role"
        )?.value
    ) as Role;

  /*
   * Canonical tenant:
   * aktif remote firma UUID.
   *
   * users.company_id / primary firm /
   * firma adı fallback kullanılmaz.
   */
  const activeFirmId =
    uuid(
      cookieStore.get(
        "dsec_company_id"
      )?.value
    );

  if (
    auth !== "ok" ||
    ![
      "super_admin",
      "company_admin",
    ].includes(role)
  ) {
    return null;
  }

  if (
    role === "company_admin" &&
    !activeFirmId
  ) {
    return null;
  }

  return {
    role,
    activeFirmId,
  };
}

export async function POST(
  request: Request
) {
  try {
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        }
      );
    }

    const body =
      await request.json();

    const id =
      Number(body?.id);

    /*
     * Mevcut admin ekranıyla
     * uyumlu replyMessage alanı.
     */
    const replyMessage =
      clean(
        body?.replyMessage
      ).slice(0, 5000);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !replyMessage
    ) {
      return NextResponse.json(
        {
          error:
            "ID ve cevap metni zorunludur.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        }
      );
    }

    const supabase =
      db();

    /*
     * Company Admin:
     * yalnız aktif remote firma UUID'sindeki
     * kayda erişebilir.
     *
     * Super Admin:
     * kayıt ID'si üzerinden erişebilir.
     */
    let query =
      supabase
        .from("cbs_forms")
        .select(
          "id,firm_id,reference_no,email,privacy_mode,status,first_response_at,mail_sent_count"
        )
        .eq("id", id);

    if (
      session.role ===
      "company_admin"
    ) {
      query =
        query.eq(
          "firm_id",
          session.activeFirmId
        );
    }

    const {
      data: rawData,
      error,
    } =
      await query.maybeSingle();

    const data =
      rawData as CbsReplyRow | null;

    if (
      error ||
      !data
    ) {
      if (error) {
        console.error(
          "CBS reply kayıt sorgusu:",
          error
        );
      }

      return NextResponse.json(
        {
          error:
            "Kayıt bulunamadı veya yetkiniz yok.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        }
      );
    }

    const recordFirmId =
      uuid(data.firm_id);

    /*
     * Defense-in-depth:
     * DB kaydında geçerli remote UUID yoksa
     * mutation yapma.
     */
    if (!recordFirmId) {
      return NextResponse.json(
        {
          error:
            "Kayıt firma bilgisi geçersiz.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        }
      );
    }

    if (
      session.role ===
        "company_admin" &&
      recordFirmId !==
        session.activeFirmId
    ) {
      return NextResponse.json(
        {
          error:
            "Bu kayıt için yetkiniz yok.",
        },
        {
          status: 403,
          headers:
            noStoreHeaders(),
        }
      );
    }

    const privacyMode =
      clean(
        data.privacy_mode ||
          "identified"
      ).toLowerCase();

    const recipientEmail =
      privacyMode ===
      "anonymous"
        ? ""
        : clean(
            data.email
          ).toLowerCase();

    const mailer =
      process.env.RESEND_API_KEY
        ? new Resend(
            process.env
              .RESEND_API_KEY
          )
        : null;

    const from =
      process.env
        .RESEND_FROM_EMAIL ||
      "onboarding@resend.dev";

    let mailStatus:
      | "sent"
      | "failed"
      | "skipped" =
      "skipped";

    let mailError = "";

    /*
     * Gizli başvuru:
     * admin API'de kimlik maskeli olsa da
     * backend mevcut e-posta adresine
     * cevabı iletebilir.
     *
     * Anonim başvuru:
     * hiçbir e-posta gönderilmez.
     */
    if (
      mailer &&
      recipientEmail
    ) {
      try {
        await mailer.emails.send({
          from,
          to: [
            recipientEmail,
          ],
          subject:
            `Başvurunuz hakkında geri dönüş • ${
              data.reference_no ||
              `#${data.id}`
            }`,
          html:
            `<h2>Başvurunuza Yanıt</h2>` +
            `<p>${escapeHtml(
              replyMessage
            ).replace(
              /\n/g,
              "<br/>"
            )}</p>` +
            `<hr/>` +
            `<p><strong>Başvuru No:</strong> ${escapeHtml(
              data.reference_no ||
                `#${data.id}`
            )}</p>`,
        });

        mailStatus =
          "sent";
      } catch (error) {
        mailStatus =
          "failed";

        mailError =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "CBS reply mail:",
          error
        );
      }
    }

    const now =
      new Date().toISOString();

    /*
     * Mevcut iş akışı korunuyor:
     * cevap verildiğinde kayıt kapanır.
     *
     * Public takip endpoint'i
     * resolution_note alanını
     * latest_response olarak gösterir.
     */
    const updatePayload:
      Record<
        string,
        unknown
      > = {
      status:
        "closed",
      resolution_note:
        replyMessage,
      closed_at:
        now,
      updated_at:
        now,
      last_status_at:
        now,
      first_response_at:
        data.first_response_at ||
        now,
    };

    if (
      mailStatus === "sent"
    ) {
      updatePayload.mail_sent_count =
        Number(
          data.mail_sent_count ||
            0
        ) + 1;

      updatePayload.last_mail_sent_at =
        now;
    }

    /*
     * Mutation yalnız ID ile değil,
     * ID + canonical firm UUID ile kilitli.
     */
    const {
      error:
        updateError,
    } =
      await supabase
        .from("cbs_forms")
        .update(
          updatePayload
        )
        .eq("id", id)
        .eq(
          "firm_id",
          recordFirmId
        );

    if (updateError) {
      console.error(
        "CBS reply update:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Kayıt güncellenemedi.",
        },
        {
          status: 500,
          headers:
            noStoreHeaders(),
        }
      );
    }

    /*
     * Mail log tablosu opsiyonel.
     * Log hatası ana ÇBS cevabını bozmaz.
     *
     * Gizli başvuruda recipient email'i
     * loga açık şekilde yazmıyoruz.
     */
    try {
      const logRecipient =
        privacyMode ===
          "identified"
          ? recipientEmail ||
            null
          : null;

      const {
        error:
          logError,
      } =
        await supabase
          .from(
            "cbs_mail_logs"
          )
          .insert({
            cbs_form_id:
              id,
            direction:
              "outbound",
            subject:
              "Admin cevap",
            recipient_email:
              logRecipient,
            status:
              mailStatus,
            ...(mailError
              ? {
                  error_message:
                    mailError,
                }
              : {}),
          });

      if (logError) {
        console.warn(
          "CBS mail log yazılamadı:",
          logError.message
        );
      }
    } catch (logError) {
      console.warn(
        "CBS mail log atlandı:",
        logError
      );
    }

    if (
      mailStatus === "failed"
    ) {
      return NextResponse.json(
        {
          success: true,
          warning:
            "Kayıt kapatıldı ancak cevap e-postası gönderilemedi.",
        },
        {
          headers:
            noStoreHeaders(),
        }
      );
    }

    if (
      mailStatus === "skipped"
    ) {
      return NextResponse.json(
        {
          success: true,
          warning:
            privacyMode ===
            "anonymous"
              ? "Anonim başvuru cevaplanarak kapatıldı. Anonim başvuruda e-posta gönderilmez."
              : "Kayıt kapatıldı. E-posta servisi/adresi bulunmadığı için mail gönderilmedi.",
        },
        {
          headers:
            noStoreHeaders(),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        headers:
          noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error(
      "CBS reply:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      }
    );
  }
}
