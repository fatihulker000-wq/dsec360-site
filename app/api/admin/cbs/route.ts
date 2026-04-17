import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
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

type AdminSession = {
  userId: string;
  role: "super_admin" | "company_admin";
  companyId: string;
};

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
  status: string | null;
  category: string | null;
  firm_id: string | number | null;
  assigned_to: string | null;
  resolution_note: string | null;
  firma_adi: string | null;
  priority: string | null;
  sla_due_at: string | null;
  closed_at: string | null;
};

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

  const isAllowedRole =
    adminRole === "super_admin" || adminRole === "company_admin";

  if (adminAuth !== "ok" || !isAllowedRole || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const role =
    String(data.role || "").trim() === "super_admin"
      ? "super_admin"
      : "company_admin";

  return {
    userId: String(data.id || "").trim(),
    role,
    companyId: String(data.company_id || "").trim(),
  };
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
}

async function getAuthorizedRecord(
  id: number,
  session: AdminSession
): Promise<{
  id: number;
  firm_id: string | number | null;
} | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("cbs_forms")
    .select("id, firm_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  if (session.role === "super_admin") {
    return data;
  }

  const recordFirmId = String(data.firm_id || "").trim();
  if (!recordFirmId || recordFirmId !== session.companyId) {
    return null;
  }

  return data;
}

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

/* =========================
   GET
========================= */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const supabase = getSupabase();

    const [{ data: companies, error: companiesError }, { data, error }] =
      await Promise.all([
        supabase.from("companies").select("id, name").limit(5000),
        supabase
          .from("cbs_forms")
          .select(`
            id,
            full_name,
            email,
            message,
            created_at,
            status,
            category,
            firm_id,
            assigned_to,
            resolution_note,
            firma_adi,
            priority,
            sla_due_at,
            closed_at
          `)
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

    if (companiesError) {
      console.error("CBS GET companies hatası:", companiesError);
      return NextResponse.json(
        { error: "Firma listesi alınamadı." },
        { status: 500 }
      );
    }
console.log("COMPANIES:", companies);

    if (error) {
      console.error("CBS GET hatası:", error);
      return NextResponse.json(
        { error: "Kayıtlar alınamadı." },
        { status: 500 }
      );
    }

    const companyList: CompanyRow[] = companies || [];
    const sessionCompanyId = String(session.companyId || "").trim();

    const formatted = ((data || []) as CbsRow[])
      .map((item) => {
        const directFirmId = String(item.firm_id ?? "").trim() || null;

        const { suggestedFirmId, suggestedFirmName } = findSuggestedCompany(
          item,
          companyList
        );

        return {
          id: item.id,
          full_name: item.full_name,
          email: item.email,
          message: item.message,
          created_at: item.created_at,
          status: item.status,
          category: item.category,
          firmId: directFirmId,
          assignedTo: item.assigned_to,
          resolutionNote: item.resolution_note,
          firma_adi: item.firma_adi,
          priority: item.priority,
          sla_due_at: item.sla_due_at,
          closed_at: item.closed_at,
          suggestedFirmId,
          suggestedFirmName,
        };
      })
      .filter((item) => {
        if (session.role === "super_admin") return true;

        return (
          String(item.firmId || "").trim() === sessionCompanyId ||
          String(item.suggestedFirmId || "").trim() === sessionCompanyId
        );
      });

    return NextResponse.json({
  data: formatted,
  companies: (companies || []).map((company) => ({
    id: String(company.id || "").trim(),
    name: String(company.name || "").trim(),
  })),
});
  } catch (error) {
    console.error("CBS GET genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH (STATUS)
========================= */
export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);
    const status = String(body?.status || "").trim();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID ve durum zorunludur." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["new", "read", "processing", "closed"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz durum değeri." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    } else {
      updatePayload.closed_at = null;
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("CBS PATCH hatası:", error);
      return NextResponse.json(
        { error: "Durum güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS PATCH genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   PUT (DETAY GÜNCELLE)
========================= */
export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);
    const { category, assignedTo, resolutionNote, priority, firmId } = body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: "ID zorunludur." },
        { status: 400 }
      );
    }

    const allowedPriorities = ["low", "normal", "high", "critical"];
    if (priority && !allowedPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Geçersiz öncelik değeri." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      category: category ?? null,
      assigned_to: assignedTo ?? null,
      resolution_note: resolutionNote ?? null,
      updated_at: new Date().toISOString(),
    };

    if (priority) {
      updatePayload.priority = priority;
    }

    if (firmId !== undefined) {
      const cleanFirmId = String(firmId || "").trim() || null;

      if (
        session.role === "company_admin" &&
        cleanFirmId &&
        cleanFirmId !== session.companyId
      ) {
        return NextResponse.json(
          { error: "Sadece kendi firmanı bağlayabilirsin." },
          { status: 403 }
        );
      }

      updatePayload.firm_id = cleanFirmId;
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("CBS PUT hatası:", error);
      return NextResponse.json(
        { error: "Güncelleme yapılamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS PUT genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */
export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID zorunludur." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("cbs_forms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CBS DELETE hatası:", error);
      return NextResponse.json(
        { error: "Kayıt silinemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS DELETE genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}