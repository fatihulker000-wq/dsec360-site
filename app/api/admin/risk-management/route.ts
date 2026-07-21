import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"

type MatrixRiskRow = {
  id: string;
  sync_key: string;
  company_id: string | null;
  local_firm_id: number | null;

  title: string;
  hazard: string;
  consequence: string | null;
  control: string | null;

  probability: number;
  severity: number;
  score: number;

  department: string | null;
  location: string | null;
  machine: string | null;
  responsible: string | null;

  dof_status: "OPEN" | "CLOSED";
  dof_action: string;
  dof_responsible: string;
  dof_due_date_millis: number | null;
  dof_closed_at_millis: number | null;
  dof_note: string;

  source: "APP" | "WEB" | "MERGED" | "SYSTEM";
  sync_status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  sync_error: string | null;
  last_synced_at: string | null;

  is_deleted: boolean;
  deleted_at: string | null;

  created_at: string;
  updated_at: string;
};

type FineKinneyRiskRow = {
  id: string;
  sync_key: string;
  company_id: string | null;
  local_firm_id: number | null;

  title: string;
  hazard: string;
  consequence: string | null;
  control: string | null;

  probability_value: number;
  frequency_value: number;
  severity_value: number;
  score: number;

  level: string;
  action: string;

  department: string | null;
  location: string | null;
  machine: string | null;
  responsible: string | null;

  dof_status: "OPEN" | "CLOSED";
  dof_action: string;
  dof_responsible: string;
  dof_due_date_millis: number | null;
  dof_closed_at_millis: number | null;
  dof_note: string;

  source: "APP" | "WEB" | "MERGED" | "SYSTEM";
  sync_status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  sync_error: string | null;
  last_synced_at: string | null;

  is_deleted: boolean;
  deleted_at: string | null;

  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeCompanyKey(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function matrixLevel(score: number): RiskLevel {
  if (score >= 20) return "CRITICAL";
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

function fineKinneyLevel(score: number): RiskLevel {
  if (score >= 400) return "CRITICAL";
  if (score >= 200) return "HIGH";
  if (score >= 70) return "MEDIUM";
  return "LOW";
}

function levelLabel(level: RiskLevel) {
  if (level === "CRITICAL") return "Kritik";
  if (level === "HIGH") return "Yüksek";
  if (level === "MEDIUM") return "Orta";
  return "Düşük";
}

function millisToIso(value?: number | null) {
  if (!value || value <= 0) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isOverdue(
  status: "OPEN" | "CLOSED",
  dueDateMillis: number | null
) {
  return (
    status === "OPEN" &&
    typeof dueDateMillis === "number" &&
    dueDateMillis > 0 &&
    dueDateMillis < Date.now()
  );
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();

    const adminAuth =
      cookieStore.get("dsec_admin_auth")?.value ||
      cookieStore.get("dsec_user_auth")?.value;

    const adminRole =
      cookieStore.get("dsec_admin_role")?.value ||
      cookieStore.get("dsec_user_role")?.value;

    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" ||
      adminRole === "company_admin" ||
      adminRole === "demo_user";

    const isCompanyScoped =
      adminRole === "company_admin" || adminRole === "demo_user";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (isCompanyScoped && !companyIdFromCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma bilgisi bulunamadı.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const firmParam = String(url.searchParams.get("firm") || "").trim();

    const supabase = getSupabase();

    let companiesQuery = supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (isCompanyScoped) {
      companiesQuery = companiesQuery.eq("id", companyIdFromCookie);
    }

    const { data: companies, error: companiesError } =
      await companiesQuery.returns<CompanyRow[]>();

    if (companiesError) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma listesi alınamadı.",
          detail: companiesError.message,
        },
        { status: 500 }
      );
    }

    const companyRows = companies || [];

    const companyMap = Object.fromEntries(
      companyRows.map((company) => [
        String(company.id || "").trim(),
        String(company.name || "Firma Yok").trim() || "Firma Yok",
      ])
    );

    let selectedCompanyId = "";

    if (isCompanyScoped) {
      selectedCompanyId = companyIdFromCookie;
    } else if (firmParam) {
      const normalizedFirm = normalizeCompanyKey(firmParam);

      selectedCompanyId =
        companyRows.find(
          (company) =>
            normalizeCompanyKey(company.name) === normalizedFirm ||
            String(company.id || "").trim() === firmParam
        )?.id || "";
    }

    let matrixQuery = supabase
      .from("risk_items")
      .select(
        [
          "id",
          "sync_key",
          "company_id",
          "local_firm_id",
          "title",
          "hazard",
          "consequence",
          "control",
          "probability",
          "severity",
          "score",
          "department",
          "location",
          "machine",
          "responsible",
          "dof_status",
          "dof_action",
          "dof_responsible",
          "dof_due_date_millis",
          "dof_closed_at_millis",
          "dof_note",
          "source",
          "sync_status",
          "sync_error",
          "last_synced_at",
          "is_deleted",
          "deleted_at",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .eq("is_deleted", false)
      .order("score", { ascending: false })
      .order("updated_at", { ascending: false });

    let fineQuery = supabase
      .from("fine_kinney_risks")
      .select(
        [
          "id",
          "sync_key",
          "company_id",
          "local_firm_id",
          "title",
          "hazard",
          "consequence",
          "control",
          "probability_value",
          "frequency_value",
          "severity_value",
          "score",
          "level",
          "action",
          "department",
          "location",
          "machine",
          "responsible",
          "dof_status",
          "dof_action",
          "dof_responsible",
          "dof_due_date_millis",
          "dof_closed_at_millis",
          "dof_note",
          "source",
          "sync_status",
          "sync_error",
          "last_synced_at",
          "is_deleted",
          "deleted_at",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .eq("is_deleted", false)
      .order("score", { ascending: false })
      .order("updated_at", { ascending: false });

    if (selectedCompanyId) {
      matrixQuery = matrixQuery.eq("company_id", selectedCompanyId);
      fineQuery = fineQuery.eq("company_id", selectedCompanyId);
    }

    const [
      { data: matrixRows, error: matrixError },
      { data: fineRows, error: fineError },
    ] = await Promise.all([
      matrixQuery.returns<MatrixRiskRow[]>(),
      fineQuery.returns<FineKinneyRiskRow[]>(),
    ]);

    if (matrixError) {
      return NextResponse.json(
        {
          success: false,
          message: "5x5 risk kayıtları alınamadı.",
          detail: matrixError.message,
        },
        { status: 500 }
      );
    }

    if (fineError) {
      return NextResponse.json(
        {
          success: false,
          message: "Fine-Kinney kayıtları alınamadı.",
          detail: fineError.message,
        },
        { status: 500 }
      );
    }

    const matrixRecords = (matrixRows || []).map((row) => {
      const level = matrixLevel(Number(row.score || 0));
      const companyId = String(row.company_id || "").trim();

      return {
        id: row.id,
        localId: row.local_firm_id,
        remoteId: row.id,
        syncKey: row.sync_key,

        firmId: String(row.local_firm_id || ""),
        webFirmId: companyId || null,
        company: companyMap[companyId] || "Firma Yok",

        method: "MATRIX" as const,

        title: row.title,
        hazard: row.hazard,
        consequence: row.consequence,
        control: row.control,

        probability: row.probability,
        severity: row.severity,

        probabilityValue: null,
        frequencyValue: null,
        severityValue: null,

        score: Number(row.score || 0),
        level,
        levelLabel: levelLabel(level),
        action: row.dof_action || null,

        department: row.department,
        location: row.location,
        machine: row.machine,
        responsible: row.responsible || row.dof_responsible || null,

        dofStatus: row.dof_status,
        dofAction: row.dof_action || null,
        dofResponsible: row.dof_responsible || null,
        dofDueDate: millisToIso(row.dof_due_date_millis),
        dofClosedDate: millisToIso(row.dof_closed_at_millis),
        dofNote: row.dof_note || null,

        source:
          row.source === "APP" ||
          row.source === "MERGED"
            ? row.source
            : "WEB",

        syncStatus: row.sync_status,
        syncError: row.sync_error,
        lastSyncedAt: row.last_synced_at,

        isDeleted: row.is_deleted,
        deletedAt: row.deleted_at,

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        overdue: isOverdue(
          row.dof_status,
          row.dof_due_date_millis
        ),
      };
    });

    const fineRecords = (fineRows || []).map((row) => {
      const level = fineKinneyLevel(Number(row.score || 0));
      const companyId = String(row.company_id || "").trim();

      return {
        id: row.id,
        localId: row.local_firm_id,
        remoteId: row.id,
        syncKey: row.sync_key,

        firmId: String(row.local_firm_id || ""),
        webFirmId: companyId || null,
        company: companyMap[companyId] || "Firma Yok",

        method: "FINE_KINNEY" as const,

        title: row.title,
        hazard: row.hazard,
        consequence: row.consequence,
        control: row.control,

        probability: null,
        severity: null,

        probabilityValue: Number(row.probability_value || 0),
        frequencyValue: Number(row.frequency_value || 0),
        severityValue: Number(row.severity_value || 0),

        score: Number(row.score || 0),
        level,
        levelLabel: row.level || levelLabel(level),
        action: row.action || null,

        department: row.department,
        location: row.location,
        machine: row.machine,
        responsible: row.responsible || row.dof_responsible || null,

        dofStatus: row.dof_status,
        dofAction: row.dof_action || null,
        dofResponsible: row.dof_responsible || null,
        dofDueDate: millisToIso(row.dof_due_date_millis),
        dofClosedDate: millisToIso(row.dof_closed_at_millis),
        dofNote: row.dof_note || null,

        source:
          row.source === "APP" ||
          row.source === "MERGED"
            ? row.source
            : "WEB",

        syncStatus: row.sync_status,
        syncError: row.sync_error,
        lastSyncedAt: row.last_synced_at,

        isDeleted: row.is_deleted,
        deletedAt: row.deleted_at,

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        overdue: isOverdue(
          row.dof_status,
          row.dof_due_date_millis
        ),
      };
    });

    const records = [...matrixRecords, ...fineRecords].sort(
      (a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        return (
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
        );
      }
    );

    const summary = {
      total: records.length,
      critical: records.filter(
        (record) => record.level === "CRITICAL"
      ).length,
      high: records.filter(
        (record) => record.level === "HIGH"
      ).length,
      medium: records.filter(
        (record) => record.level === "MEDIUM"
      ).length,
      low: records.filter(
        (record) => record.level === "LOW"
      ).length,
      openDof: records.filter(
        (record) => record.dofStatus === "OPEN"
      ).length,
      closedDof: records.filter(
        (record) => record.dofStatus === "CLOSED"
      ).length,
      overdueDof: records.filter(
        (record) => record.overdue
      ).length,
      matrixCount: matrixRecords.length,
      fineKinneyCount: fineRecords.length,
    };

    const weightedPenalty =
      summary.critical * 18 +
      summary.high * 9 +
      summary.medium * 4 +
      summary.overdueDof * 6;

    const riskScore =
      records.length === 0
        ? 100
        : Math.max(0, Math.min(100, 100 - weightedPenalty));

    return NextResponse.json({
      success: true,
      records,
      companies: Object.values(companyMap).sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
      summary: {
        ...summary,
        riskScore,
      },
    });
  } catch (error) {
    console.error("risk management route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Risk verileri alınırken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}