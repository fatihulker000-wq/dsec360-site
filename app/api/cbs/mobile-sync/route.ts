import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_SYNC_KEY = "dsec_mobile_123456";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function isAuthorized(req: Request): boolean {
  const serverKey = (
    process.env.CBS_MOBILE_SYNC_KEY || FALLBACK_SYNC_KEY
  ).trim();

  const requestKey = (
    req.headers.get("x-dsec-sync-key") ||
    req.headers.get("X-DSEC-SYNC-KEY") ||
    ""
  ).trim();

  return requestKey === serverKey;
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function normalizeFirmName(value: string) {
  return normalizeKey(value)
    .replace(/\s+/g, " ")
    .replace(/a\.s\./g, "as")
    .replace(/a\.ş\./g, "as")
    .replace(/anonim sirketi/g, "")
    .replace(/limited sirketi/g, "")
    .replace(/ltd\.sti\./g, "")
    .replace(/ltd/g, "")
    .replace(/sti/g, "")
    .trim();
}

type CompanyRow = {
  id: string | number;
  name: string | null;
};

type CbsRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  message: string | null;
  created_at: string | null;
  updated_at?: string | null;
  status: string | null;
  category: string | null;
  firm_id: string | number | null;
  assigned_to?: string | null;
  assigned_username?: string | null;
  assigned_role?: string | null;
  target_role?: string | null;
  resolution_note?: string | null;
  response_note?: string | null;
  rejected_reason?: string | null;
  opened_by_email?: string | null;
  mail_subject?: string | null;
  mail_message_id?: string | null;
  first_receiver_username?: string | null;
  forwarded_by?: string | null;
  created_by?: string | null;
  firma_adi: string | null;
  priority?: string | null;
  closed_at?: string | null;
};

function findSuggestedCompany(
  item: Pick<CbsRow, "firma_adi" | "firm_id">,
  companies: CompanyRow[]
) {
  const rawFirmId = String(item.firm_id ?? "").trim();
  const rawFirmaAdi = String(item.firma_adi ?? "").trim();

  if (rawFirmId) {
    const exactIdMatch = companies.find(
      (company) => String(company.id || "").trim() === rawFirmId
    );

    if (exactIdMatch) {
      return {
        suggestedFirmId: String(exactIdMatch.id || "").trim(),
        suggestedFirmName: String(exactIdMatch.name || "").trim() || null,
      };
    }
  }

  const normalizedInput = normalizeFirmName(rawFirmaAdi);
  if (!normalizedInput) {
    return {
      suggestedFirmId: null,
      suggestedFirmName: null,
    };
  }

  const exact = companies.find((company) => {
    return normalizeFirmName(String(company.name || "")) === normalizedInput;
  });

  const includes =
    exact ||
    companies.find((company) => {
      const dbName = normalizeFirmName(String(company.name || ""));
      return (
        dbName.includes(normalizedInput) || normalizedInput.includes(dbName)
      );
    });

  if (includes?.id) {
    return {
      suggestedFirmId: String(includes.id || "").trim(),
      suggestedFirmName: String(includes.name || "").trim() || null,
    };
  }

  return {
    suggestedFirmId: null,
    suggestedFirmName: null,
  };
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();
    if (!firmId) {
      return NextResponse.json({ error: "firmId UUID zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", firmId)
      .maybeSingle();

    if (companyError || !company?.id) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("cbs_forms")
      .select("*")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json(
        { error: "Kayıtlar alınamadı.", detail: error.message ?? null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      firmId,
      count: (data || []).length,
      data: data || [],
      fallback_used: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message ?? null },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();

    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();
    const firm_id = String(body?.firm_id || "").trim();

    const category = String(body?.category || "").trim() || "Şikayet";
    const priority = String(body?.priority || "").trim() || "normal";
    const assigned_to = String(body?.assigned_to || "").trim() || null;
    const resolution_note = String(body?.resolution_note || "").trim() || null;
    const status = String(body?.status || "").trim() || "new";
    const firma_adi = String(body?.firma_adi || "").trim() || null;

    const assigned_username =
      String(body?.assigned_username || "").trim() || null;
    const assigned_role = String(body?.assigned_role || "").trim() || null;
    const target_role = String(body?.target_role || "").trim() || null;
    const opened_by_email =
      String(body?.opened_by_email || "").trim() || null;
    const mail_subject = String(body?.mail_subject || "").trim() || null;
    const mail_message_id =
      String(body?.mail_message_id || "").trim() || null;
    const first_receiver_username =
      String(body?.first_receiver_username || "").trim() || null;
    const forwarded_by = String(body?.forwarded_by || "").trim() || null;
    const response_note = String(body?.response_note || "").trim() || null;
    const rejected_reason =
      String(body?.rejected_reason || "").trim() || null;
    const created_by = String(body?.created_by || "").trim() || null;

    if (!full_name || !message || !firm_id) {
      return NextResponse.json(
        { error: "Eksik alan var." },
        { status: 400 }
      );
    }

   const supabase = getSupabase();

const { data: company, error: companyError } = await supabase
  .from("companies")
  .select("id")
  .eq("id", firm_id)
  .maybeSingle();

if (companyError || !company?.id) {
  return NextResponse.json({ error: "Geçersiz firm_id." }, { status: 400 });
}

const now = new Date().toISOString();

// ✅ CBS KALICI KORUMA:
// Aynı app kaydı tekrar gönderilirse web'de ikinci kayıt açılmasın.
const duplicateQuery = supabase
  .from("cbs_forms")
  .select("id")
  .eq("firm_id", firm_id || "")
  .eq("created_by", created_by || "")
  .eq("message", message)
  .order("created_at", { ascending: false })
  .limit(1);

const { data: duplicateData } = await duplicateQuery.maybeSingle();

if (duplicateData?.id) {
  return NextResponse.json({
    success: true,
    remoteId: duplicateData.id,
    duplicateProtected: true,
  });
}

// ✅ CBS KESİN AKIŞ: App kaydı onay beklemeden web'e düşer.
// Supabase cbs_forms tablosunda olmayan alanlar gönderilmez.
// Böylece POST 500 ve çift kayıt riski azaltılır.
const insertPayload = {
  full_name,
  email: email || null,
  message,
  firm_id: firm_id || null,
  firma_adi,
  category,
  priority,
  assigned_to,
  resolution_note,
  status: "new",
  created_at: now,
  updated_at: now,
};

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("id")
      .single();

    if (error || !data) {
      console.error("mobile-sync POST supabase hata detayı:", {
        error,
        insertPayload,
      });

      return NextResponse.json(
        {
          error: "Kayıt oluşturulamadı.",
          detail: error?.message || error || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, remoteId: data.id });
  } catch (e) {
    console.error("mobile-sync POST hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);

    const firmId = String(body?.firm_id || "").trim();
    if (!id || !firmId) {
      return NextResponse.json({ error: "ID ve firm_id zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    // ✅ CBS STABİL PUT:
    // Sadece cbs_forms tablosunda kesin olan alanlar güncellenir.
    // Eksik kolon kaynaklı 500 hatalarını engeller.
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body?.status !== undefined) {
      updatePayload.status = String(body.status).trim() || "new";
    }

    if (body?.category !== undefined) {
      updatePayload.category = String(body.category).trim() || null;
    }

    if (body?.priority !== undefined) {
      updatePayload.priority = String(body.priority).trim() || "normal";
    }

    if (body?.assigned_to !== undefined) {
      updatePayload.assigned_to = String(body.assigned_to).trim() || null;
    }

    if (body?.resolution_note !== undefined) {
      updatePayload.resolution_note = String(body.resolution_note).trim() || null;
    }

    if (body?.message !== undefined) {
      updatePayload.message = String(body.message).trim() || null;
    }

    if (body?.full_name !== undefined) {
      updatePayload.full_name = String(body.full_name).trim() || null;
    }

    if (body?.email !== undefined) {
      updatePayload.email = String(body.email).trim() || null;
    }

    if (body?.firma_adi !== undefined) {
      updatePayload.firma_adi = String(body.firma_adi).trim() || null;
    }

    if (body?.firm_id !== undefined) {
      updatePayload.firm_id = String(body.firm_id).trim() || null;
    }

    const nextStatus = String(body?.status || "").trim().toLowerCase();

    if (nextStatus === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    } else if (body?.status !== undefined) {
      updatePayload.closed_at = null;
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id)
      .eq("firm_id", firmId);

    if (error) {
      console.error("mobile-sync PUT supabase hata:", {
        error,
        updatePayload,
      });

      return NextResponse.json(
        {
          error: "Güncelleme yapılamadı.",
          detail: error.message ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("mobile-sync PUT hata:", e);
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message ?? null },
      { status: 500 }
    );
  }
}