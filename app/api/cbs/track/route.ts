import {
  createHash,
  timingSafeEqual,
} from "crypto";
import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic =
  "force-dynamic";
export const runtime =
  "nodejs";


type CbsTrackRow = {
  reference_no: string | null;
  status: string | null;
  category: string | null;
  category_code: string | null;
  application_type: string | null;
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  privacy_mode: string | null;
  resolution_note: string | null;
  tracking_code_hash: string | null;
};

function db() {
  const url =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

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
  value: unknown,
  maxLength = 120
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function uuid(
  value: unknown
) {
  const candidate =
    clean(value, 80);

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    candidate
  )
    ? candidate
    : "";
}

function safeEqual(
  first: string,
  second: string
) {
  const a =
    Buffer.from(
      first,
      "utf8"
    );

  const b =
    Buffer.from(
      second,
      "utf8"
    );

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

function getClientIp(
  request: Request
) {
  return (
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ||
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    "unknown"
  );
}

function noStoreHeaders(
  extra: Record<string, string> = {}
) {
  return {
    "Cache-Control":
      "no-store, max-age=0",
    ...extra,
  };
}

function genericNotFound() {
  /*
   * Kayıt yok / yanlış firma /
   * yanlış takip kodu ayrımını
   * public tarafa vermiyoruz.
   */
  return Response.json(
    {
      error:
        "Başvuru bilgileri doğrulanamadı.",
    },
    {
      status: 404,
      headers:
        noStoreHeaders(),
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    /*
     * Canonical tenant:
     * yalnızca gerçek remote company UUID.
     * Firma adı / local ID / primary firm
     * fallback kullanılmaz.
     */
    const firmId =
      uuid(body?.firm_id);

    const referenceNo =
      clean(
        body?.reference_no,
        40
      ).toUpperCase();

    const trackingCode =
      clean(
        body?.tracking_code,
        40
      ).toUpperCase();

    if (
      !firmId ||
      !referenceNo ||
      !trackingCode
    ) {
      return Response.json(
        {
          error:
            "Firma, başvuru numarası ve takip kodu zorunludur.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        }
      );
    }

    /*
     * Referans formatını da sınırla.
     * Mevcut sistem CBS-2026-000084
     * biçimini kullanıyor.
     */
    if (
      !/^CBS-\d{4}-\d{6,}$/.test(
        referenceNo
      )
    ) {
      return genericNotFound();
    }

    /*
     * Tracking code randomBytes(6)
     * ile üretildiği için 12 hex
     * karakter beklenir.
     */
    if (
      !/^[A-F0-9]{12}$/.test(
        trackingCode
      )
    ) {
      return genericNotFound();
    }

    const supabase =
      db();

    /*
     * Public brute-force koruması:
     * IP + firma bazında
     * 15 dakikada 20 takip denemesi.
     */
    const clientIp =
      getClientIp(request);

    const rateKey =
      `cbs-track:${firmId}:${
        createHash("sha256")
          .update(clientIp)
          .digest("hex")
      }`;

    const {
      data: allowed,
      error: rateError,
    } = await supabase.rpc(
      "cbs_rate_limit_check",
      {
        p_key:
          rateKey,
        p_limit:
          20,
        p_window_seconds:
          15 * 60,
      }
    );

    if (
      rateError ||
      allowed !== true
    ) {
      if (rateError) {
        console.error(
          "CBS TRACK rate-limit:",
          rateError
        );
      }

      return Response.json(
        {
          error:
            "Çok fazla takip denemesi yapıldı. Daha sonra tekrar deneyin.",
        },
        {
          status: 429,
          headers:
            noStoreHeaders({
              "Retry-After":
                "900",
            }),
        }
      );
    }

    /*
     * Hash dahil tek sorgu.
     * Public takip için yalnız
     * gereken alanları seçiyoruz.
     *
     * ÖNEMLİ:
     * admin_reply yerine mevcut
     * şemadaki resolution_note
     * kullanılır.
     */
    const {
      data: rawData,
      error,
    } = await supabase
      .from("cbs_forms")
      .select(
        "reference_no,status,category,category_code,application_type,priority,created_at,updated_at,closed_at,sla_due_at,first_response_at,privacy_mode,resolution_note,tracking_code_hash"
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "reference_no",
        referenceNo
      )
      .maybeSingle();

    const data =
      rawData as CbsTrackRow | null;

    if (
      error ||
      !data ||
      !data.tracking_code_hash
    ) {
      if (error) {
        console.error(
          "CBS TRACK lookup:",
          error
        );
      }

      return genericNotFound();
    }

    const suppliedHash =
      createHash("sha256")
        .update(trackingCode)
        .digest("hex");

    const storedHash =
      String(
        data.tracking_code_hash
      );

    if (
      !safeEqual(
        suppliedHash,
        storedHash
      )
    ) {
      return genericNotFound();
    }

    /*
     * Public response:
     * full_name YOK
     * email YOK
     * assigned_to YOK
     * firma_adi YOK
     * internal admin alanları YOK
     * tracking_code_hash YOK
     *
     * Sadece başvuru sahibinin
     * takip için ihtiyaç duyduğu
     * güvenli alanlar döner.
     */
    return Response.json(
      {
        success: true,
        application: {
          reference_no:
            data.reference_no,
          status:
            data.status,
          category:
            data.category,
          category_code:
            data.category_code,
          application_type:
            data.application_type,
          priority:
            data.priority,
          created_at:
            data.created_at,
          updated_at:
            data.updated_at,
          closed_at:
            data.closed_at,
          sla_due_at:
            data.sla_due_at,
          first_response_at:
            data.first_response_at,
          privacy_mode:
            data.privacy_mode,

          /*
           * Kullanıcıya verilen
           * son resmi cevap.
           */
          latest_response:
            data.resolution_note ||
            null,
        },
      },
      {
        headers:
          noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error(
      "CBS TRACK:",
      error
    );

    return Response.json(
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
