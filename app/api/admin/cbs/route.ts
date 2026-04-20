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
    const firmIdParam = String(url.searchParams.get("firmId") || "").trim();
    const firmaAdiParam = String(url.searchParams.get("firmaAdi") || "").trim();
    const normalizedFirmaAdi = normalizeFirmName(firmaAdiParam);

    const supabase = getSupabase();

    const [
      { data: companies, error: companiesError },
      { data, error }
    ] = await Promise.all([
      supabase.from("companies").select("id, name").limit(5000),
      supabase
        .from("cbs_forms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    if (companiesError) {
      console.error("mobile-sync GET companies hatası:", companiesError);
      return NextResponse.json(
        { error: "Firma listesi alınamadı." },
        { status: 500 }
      );
    }

    if (error) {
      console.error("mobile-sync GET hata detayı:", error);
      return NextResponse.json(
        {
          error: "Kayıtlar alınamadı.",
          detail: error.message ?? null,
          code: (error as any)?.code ?? null,
          hint: (error as any)?.hint ?? null,
          details: (error as any)?.details ?? null,
        },
        { status: 500 }
      );
    }

    const companyList: CompanyRow[] = companies || [];

    let requestedCompanyId: string | null = null;

    if (firmIdParam) {
      const exactCompanyById = companyList.find(
        (company) => String(company.id || "").trim() === firmIdParam
      );

      requestedCompanyId = exactCompanyById
        ? String(exactCompanyById.id || "").trim()
        : firmIdParam;
    }

    if (!requestedCompanyId && normalizedFirmaAdi) {
      const exactByName = companyList.find(
        (company) =>
          normalizeFirmName(String(company.name || "")) === normalizedFirmaAdi
      );

      const includesByName =
        exactByName ||
        companyList.find((company) => {
          const dbName = normalizeFirmName(String(company.name || ""));
          return (
            dbName.includes(normalizedFirmaAdi) ||
            normalizedFirmaAdi.includes(dbName)
          );
        });

      if (includesByName?.id) {
        requestedCompanyId = String(includesByName.id || "").trim();
      }
    }

    const allRows = (data || []) as CbsRow[];

// 🔥 PARAMETRE YOKSA HER ŞEYİ DÖN
if (!firmIdParam && !normalizedFirmaAdi) {
  return NextResponse.json({
    success: true,
    count: allRows.length,
    data: allRows,
  });
}

// 🔥 PARAMETRE VARSA FİLTRELE
const filtered = allRows.filter((row) => {
  const rowFirmId = String(row?.firm_id || "").trim();
  const rowFirmaAdiRaw = String(row?.firma_adi || "").trim();
  const rowFirmaAdi = normalizeFirmName(rowFirmaAdiRaw);

  const { suggestedFirmId } = findSuggestedCompany(row, companyList);

  const byDirectFirmId =
    firmIdParam &&
    rowFirmId &&
    rowFirmId === firmIdParam;

  const bySuggested =
    requestedCompanyId &&
    (rowFirmId === requestedCompanyId ||
      String(suggestedFirmId || "").trim() === requestedCompanyId);

  const byName =
    normalizedFirmaAdi &&
    rowFirmaAdi &&
    (
      rowFirmaAdi === normalizedFirmaAdi ||
      rowFirmaAdi.includes(normalizedFirmaAdi) ||
      normalizedFirmaAdi.includes(rowFirmaAdi)
    );

  return byDirectFirmId || bySuggested || byName;
});

return NextResponse.json({
  success: true,
  count: filtered.length,
  data: filtered,
});

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (e: any) {
    console.error("mobile-sync GET catch hata:", e);

    return NextResponse.json(
      {
        error: "Sunucu hatası.",
        detail: e?.message ?? null,
      },
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
    const assigned_role =
      String(body?.assigned_role || "").trim() || null;
    const target_role =
      String(body?.target_role || "").trim() || null;
    const opened_by_email =
      String(body?.opened_by_email || "").trim() || null;
    const mail_subject =
      String(body?.mail_subject || "").trim() || null;
    const mail_message_id =
      String(body?.mail_message_id || "").trim() || null;
    const first_receiver_username =
      String(body?.first_receiver_username || "").trim() || null;
    const forwarded_by =
      String(body?.forwarded_by || "").trim() || null;
    const response_note =
      String(body?.response_note || "").trim() || null;
    const rejected_reason =
      String(body?.rejected_reason || "").trim() || null;
    const created_by =
      String(body?.created_by || "").trim() || null;

    if (!full_name || !message || (!firm_id && !firma_adi)) {
      return NextResponse.json(
        { error: "Eksik alan var." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    const insertPayload = {
      full_name,
      email: email || null,
      message,
      firm_id: firm_id || null,
      category,
      priority,
      assigned_to,
      assigned_username,
      assigned_role,
      target_role,
      resolution_note,
      response_note,
      rejected_reason,
      opened_by_email,
      mail_subject,
      mail_message_id,
      first_receiver_username,
      forwarded_by,
      created_by,
      status,
      firma_adi,
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

    if (!id) {
      return NextResponse.json({ error: "ID zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body?.status != null) {
      updatePayload.status = String(body.status).trim();
    }

    if (body?.category != null) {
      updatePayload.category = String(body.category).trim() || null;
    }

    if (body?.priority != null) {
      updatePayload.priority = String(body.priority).trim() || null;
    }

    if (body?.assigned_to != null) {
      updatePayload.assigned_to = String(body.assigned_to).trim() || null;
    }

    if (body?.resolution_note != null) {
      updatePayload.resolution_note =
        String(body.resolution_note).trim() || null;
    }

    if (body?.message != null) {
      updatePayload.message = String(body.message).trim() || null;
    }

    if (body?.full_name != null) {
      updatePayload.full_name = String(body.full_name).trim() || null;
    }

    if (body?.email != null) {
      updatePayload.email = String(body.email).trim() || null;
    }

    if (body?.assigned_username != null) {
      updatePayload.assigned_username =
        String(body.assigned_username).trim() || null;
    }

    if (body?.assigned_role != null) {
      updatePayload.assigned_role =
        String(body.assigned_role).trim() || null;
    }

    if (body?.target_role != null) {
      updatePayload.target_role =
        String(body.target_role).trim() || null;
    }

    if (body?.opened_by_email != null) {
      updatePayload.opened_by_email =
        String(body.opened_by_email).trim() || null;
    }

    if (body?.mail_subject != null) {
      updatePayload.mail_subject =
        String(body.mail_subject).trim() || null;
    }

    if (body?.mail_message_id != null) {
      updatePayload.mail_message_id =
        String(body.mail_message_id).trim() || null;
    }

    if (body?.first_receiver_username != null) {
      updatePayload.first_receiver_username =
        String(body.first_receiver_username).trim() || null;
    }

    if (body?.forwarded_by != null) {
      updatePayload.forwarded_by =
        String(body.forwarded_by).trim() || null;
    }

    if (body?.response_note != null) {
      updatePayload.response_note =
        String(body.response_note).trim() || null;
    }

    if (body?.rejected_reason != null) {
      updatePayload.rejected_reason =
        String(body.rejected_reason).trim() || null;
    }

    if (body?.created_by != null) {
      updatePayload.created_by =
        String(body.created_by).trim() || null;
    }

    if (body?.firma_adi != null) {
      updatePayload.firma_adi = String(body.firma_adi).trim() || null;
    }

    if (body?.firm_id != null) {
      updatePayload.firm_id = String(body.firm_id).trim() || null;
    }

    if (String(body?.status || "").trim() === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("mobile-sync PUT supabase hata:", error);
      return NextResponse.json(
        { error: "Güncelleme yapılamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("mobile-sync PUT hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}