import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APPLICATION_TYPES = new Set([
  "SIKAYET",
  "ONERI",
  "TALEP",
  "BILGI",
]);

const CATEGORY_CODES = new Set([
  "ISG",
  "CALISMA_KOSULLARI",
  "INSAN_KAYNAKLARI",
  "CEVRE",
  "TESIS_TEKNIK",
  "YEMEKHANE",
  "SERVIS_ULASIM",
  "DIGER",
]);

const PRIVACY_MODES = new Set([
  "identified",
  "confidential",
  "anonymous",
]);

const CATEGORY_LABELS: Record<string, string> = {
  ISG: "İSG",
  CALISMA_KOSULLARI: "Çalışma Koşulları",
  INSAN_KAYNAKLARI: "İnsan Kaynakları",
  CEVRE: "Çevre",
  TESIS_TEKNIK: "Tesis / Teknik",
  YEMEKHANE: "Yemekhane",
  SERVIS_ULASIM: "Servis / Ulaşım",
  DIGER: "Diğer",
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

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function resend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function clean(
  value: unknown,
  maxLength: number
) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 180);
}

function uuid(value: unknown) {
  const candidate =
    String(value ?? "").trim();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getClientIp(request: Request) {
  const forwarded =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  return (
    forwarded ||
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    "unknown"
  );
}

function hashKey(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

async function rateLimit(
  supabase: ReturnType<typeof db>,
  key: string,
  limit: number,
  windowSeconds: number
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "cbs_rate_limit_check",
    {
      p_key: key,
      p_limit: limit,
      p_window_seconds:
        windowSeconds,
    }
  );

  if (error) {
    console.error(
      "CBS rate-limit:",
      error
    );

    // Güvenlik mekanizması çalışmıyorsa
    // public endpoint fail-closed davranır.
    return false;
  }

  return data === true;
}

function calculatePriority(
  message: string,
  applicationType: string,
  categoryCode: string
) {
  const normalized =
    message.toLocaleLowerCase(
      "tr-TR"
    );

  if (
    [
      "ölüm",
      "yaralanma",
      "yangın",
      "patlama",
      "ciddi kaza",
    ].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    return "critical";
  }

  if (
    categoryCode === "ISG" &&
    [
      "acil",
      "risk",
      "tehlike",
      "ramak kala",
    ].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    return "high";
  }

  if (
    applicationType === "ONERI"
  ) {
    return "low";
  }

  return "normal";
}

function calculateSlaHours(
  priority: string,
  categoryCode: string
) {
  if (priority === "critical") {
    return 4;
  }

  if (priority === "high") {
    return 8;
  }

  if (categoryCode === "ISG") {
    return 8;
  }

  if (priority === "low") {
    return 48;
  }

  return 24;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const url =
      new URL(request.url);

    /*
     * Canonical tenant:
     * yalnızca gerçek remote company UUID.
     *
     * Firma adı, local numeric ID,
     * primary firm veya başka fallback yok.
     */
    const bodyFirm =
      uuid(body?.firm_id);

    const queryFirm =
      uuid(
        url.searchParams.get(
          "firm"
        )
      );

    if (
      bodyFirm &&
      queryFirm &&
      bodyFirm !== queryFirm
    ) {
      return Response.json(
        {
          error:
            "Firma doğrulaması başarısız.",
        },
        { status: 400 }
      );
    }

    const firmId =
      bodyFirm || queryFirm;

    if (!firmId) {
      return Response.json(
        {
          error:
            "Geçerli firma bağlantısı bulunamadı. Firmanıza ait ÇBS bağlantısını kullanın.",
        },
        { status: 400 }
      );
    }

    const supabase = db();

    /*
     * Public abuse koruması:
     * IP + firma bazında
     * 15 dakikada en fazla 8 kayıt.
     */
    const clientIp =
      getClientIp(request);

    const allowed =
      await rateLimit(
        supabase,
        `cbs-submit:${firmId}:${hashKey(
          clientIp
        )}`,
        8,
        15 * 60
      );

    if (!allowed) {
      return Response.json(
        {
          error:
            "Çok fazla başvuru denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "900",
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const applicationType =
      String(
        body?.application_type ||
          "SIKAYET"
      )
        .trim()
        .toUpperCase();

    const categoryCode =
      String(
        body?.category ||
          "DIGER"
      )
        .trim()
        .toUpperCase();

    const privacyMode =
      String(
        body?.privacy_mode ||
          "identified"
      )
        .trim()
        .toLowerCase();

    if (
      !APPLICATION_TYPES.has(
        applicationType
      )
    ) {
      return Response.json(
        {
          error:
            "Geçersiz başvuru türü.",
        },
        { status: 400 }
      );
    }

    if (
      !CATEGORY_CODES.has(
        categoryCode
      )
    ) {
      return Response.json(
        {
          error:
            "Geçersiz konu kategorisi.",
        },
        { status: 400 }
      );
    }

    if (
      !PRIVACY_MODES.has(
        privacyMode
      )
    ) {
      return Response.json(
        {
          error:
            "Geçersiz gizlilik seçimi.",
        },
        { status: 400 }
      );
    }

    const isAnonymous =
      privacyMode === "anonymous";

    const fullName =
      isAnonymous
        ? "Anonim Başvuru"
        : clean(
            body?.full_name,
            120
          );

    const email =
      isAnonymous
        ? ""
        : normalizeEmail(
            body?.email
          );

    const message =
      clean(
        body?.message,
        5000
      );

    if (
      !message ||
      message.length < 10
    ) {
      return Response.json(
        {
          error:
            "Başvuru açıklaması en az 10 karakter olmalıdır.",
        },
        { status: 400 }
      );
    }

    if (
      !isAnonymous &&
      fullName.length < 2
    ) {
      return Response.json(
        {
          error:
            "Ad Soyad zorunludur.",
        },
        { status: 400 }
      );
    }

    if (
      !isAnonymous &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return Response.json(
        {
          error:
            "Geçerli e-posta adresi girin.",
        },
        { status: 400 }
      );
    }

    /*
     * UUID gerçekten companies tablosunda
     * var mı, burada doğrulanır.
     */
    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id,name")
      .eq("id", firmId)
      .maybeSingle();

    if (
      companyError ||
      !company
    ) {
      return Response.json(
        {
          error:
            "Firma bulunamadı veya ÇBS bağlantısı geçersiz.",
        },
        { status: 404 }
      );
    }

    const priority =
      calculatePriority(
        message,
        applicationType,
        categoryCode
      );

    const trackingCode =
      randomBytes(6)
        .toString("hex")
        .toUpperCase();

    const trackingCodeHash =
      createHash("sha256")
        .update(trackingCode)
        .digest("hex");

    const now =
      new Date();

    const slaDueAt =
      new Date(
        now.getTime() +
          calculateSlaHours(
            priority,
            categoryCode
          ) *
            60 *
            60 *
            1000
      );

    /*
     * confidential:
     * kimlik DB'de korunur,
     * admin API katmanında yetkiye
     * göre maskelenir.
     *
     * anonymous:
     * gerçek isim/e-posta DB'ye
     * hiç yazılmaz.
     */
    const payload = {
      full_name:
        fullName,
      email:
        email || null,
      firma_adi:
        String(
          company.name || ""
        ).trim(),
      message,
      firm_id:
        firmId,
      status:
        "new",
      category:
        CATEGORY_LABELS[
          categoryCode
        ] || "Diğer",
      category_code:
        categoryCode,
      application_type:
        applicationType,
      privacy_mode:
        privacyMode,
      priority,
      sla_due_at:
        slaDueAt.toISOString(),
      source_type:
        "WEB",
      mail_sent_count:
        0,
      created_at:
        now.toISOString(),
      updated_at:
        now.toISOString(),
      last_status_at:
        now.toISOString(),
      tracking_code_hash:
        trackingCodeHash,
    };

    const {
      data,
      error,
    } = await supabase
      .from("cbs_forms")
      .insert(payload)
      .select(
        "id,reference_no,status,firm_id,category,application_type,priority,sla_due_at"
      )
      .single();

    if (
      error ||
      !data
    ) {
      console.error(
        "CBS insert:",
        error
      );

      return Response.json(
        {
          error:
            "Başvuru kaydedilemedi.",
        },
        { status: 500 }
      );
    }

    /*
     * reference_no trigger tarafından
     * üretilir. Eski/veri geçiş senaryosu
     * için aşağıdaki fallback korunur.
     */
    const referenceNo =
      String(
        data.reference_no ||
          `CBS-${now.getFullYear()}-${String(
            data.id
          ).padStart(6, "0")}`
      );

    if (
      !data.reference_no
    ) {
      const {
        error:
          referenceUpdateError,
      } = await supabase
        .from("cbs_forms")
        .update({
          reference_no:
            referenceNo,
        })
        .eq("id", data.id)
        .eq(
          "firm_id",
          firmId
        );

      if (
        referenceUpdateError
      ) {
        console.error(
          "CBS reference_no fallback:",
          referenceUpdateError
        );
      }
    }

    const mailer =
      resend();

    const from =
      process.env
        .RESEND_FROM_EMAIL ||
      "onboarding@resend.dev";

    const notify =
      process.env
        .ADMIN_NOTIFICATION_EMAIL;

    /*
     * Admin bildiriminde:
     * - identified olsa bile gereksiz kimlik
     *   verisini taşımıyoruz.
     * - confidential / anonymous zaten
     *   hiçbir kimlik bilgisi içermez.
     */
    if (
      mailer &&
      notify
    ) {
      try {
        await mailer.emails.send({
          from,
          to: [notify],
          subject:
            `Yeni ÇBS • ${referenceNo} • ${
              CATEGORY_LABELS[
                categoryCode
              ] ||
              categoryCode
            }`,
          html:
            `<h2>D-SEC ÇBS</h2>` +
            `<p><strong>Başvuru:</strong> ${escapeHtml(
              referenceNo
            )}</p>` +
            `<p><strong>Firma:</strong> ${escapeHtml(
              company.name
            )}</p>` +
            `<p><strong>Tür:</strong> ${escapeHtml(
              applicationType
            )}</p>` +
            `<p><strong>Kategori:</strong> ${escapeHtml(
              CATEGORY_LABELS[
                categoryCode
              ]
            )}</p>` +
            `<p><strong>Gizlilik:</strong> ${escapeHtml(
              privacyMode
            )}</p>` +
            `<p><strong>Öncelik:</strong> ${escapeHtml(
              priority
            )}</p>` +
            `<hr/>` +
            `<p>${escapeHtml(
              message
            )}</p>`,
        });
      } catch (error) {
        console.error(
          "CBS admin mail:",
          error
        );
      }
    }

    /*
     * Anonim kayıtta kullanıcı e-postası
     * bulunmadığından teyit maili gönderilmez.
     */
    if (
      mailer &&
      email
    ) {
      try {
        await mailer.emails.send({
          from,
          to: [email],
          subject:
            `Başvurunuz alındı • ${referenceNo}`,
          html:
            `<h2>Başvurunuz alındı</h2>` +
            `<p>Başvuru numaranız: <strong>${escapeHtml(
              referenceNo
            )}</strong></p>` +
            `<p>Durum: Yeni</p>`,
        });
      } catch (error) {
        console.error(
          "CBS kullanıcı mail:",
          error
        );
      }
    }

    /*
     * Tracking code sadece bu başarılı
     * response'ta ham olarak döner.
     * DB'de sadece SHA-256 hash saklanır.
     */
    return Response.json(
      {
        success: true,
        reference_no:
          referenceNo,
        tracking_code:
          trackingCode,
        data: {
          id:
            data.id,
          reference_no:
            referenceNo,
          status:
            "new",
          firm_id:
            firmId,
          category:
            CATEGORY_LABELS[
              categoryCode
            ],
          application_type:
            applicationType,
          priority,
          sla_due_at:
            slaDueAt.toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "CBS POST:",
      error
    );

    return Response.json(
      {
        error:
          "Sunucu hatası.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
