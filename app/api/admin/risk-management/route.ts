import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   TYPES
============================================================ */

type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH"
  | "INTOLERABLE";

type RiskMethod = "MATRIX_5X5" | "FINE_KINNEY";

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

type RiskWritePayload = {
  id?: string;

  method?: "MATRIX" | "MATRIX_5X5" | "FINE_KINNEY";

  firmId?: string;
  companyId?: string;
  company?: string;

  localFirmId?: number | null;
  syncKey?: string;

  title?: string;
  activity?: string;
  process?: string;

  hazard?: string;
  consequence?: string | null;

  control?: string | null;
  existingControl?: string | null;
  proposedControl?: string | null;

  probability?: number | null;
  severity?: number | null;
  frequency?: number | null;

  probabilityValue?: number | null;
  frequencyValue?: number | null;
  severityValue?: number | null;

  level?: string | null;
  action?: string | null;

  department?: string | null;
  location?: string | null;
  machine?: string | null;
  responsible?: string | null;

  completed?: boolean;
  dofStatus?: "OPEN" | "CLOSED";
  dofAction?: string | null;
  dofResponsible?: string | null;

  dueDateMillis?: number | null;
  dofDueDate?: string | null;

  dofClosedDate?: string | null;
  dofNote?: string | null;

  photoUrl?: string | null;
  attachmentUrl?: string | null;
};

type AdminContext = {
  allowed: boolean;
  adminRole?: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

/* ============================================================
   HELPERS
============================================================ */

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ENV bulunamadı.");
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

function cleanText(value?: string | null) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

function isoToMillis(value?: string | null) {
  if (!value) return null;

  const millis = new Date(value).getTime();
  return Number.isNaN(millis) ? null : millis;
}

function dateToMillis(
  millisValue?: number | null,
  isoValue?: string | null
) {
  if (
    typeof millisValue === "number" &&
    Number.isFinite(millisValue)
  ) {
    return millisValue;
  }

  return isoToMillis(isoValue);
}

function timestampToMillis(value?: string | null) {
  if (!value) return Date.now();

  const millis = new Date(value).getTime();
  return Number.isNaN(millis) ? Date.now() : millis;
}

function matrixLevel(score: number): RiskLevel {
  if (score >= 25) return "INTOLERABLE";
  if (score >= 20) return "VERY_HIGH";
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

function fineKinneyLevel(score: number): RiskLevel {
  if (score >= 400) return "INTOLERABLE";
  if (score >= 200) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

function fineKinneyLevelText(score: number) {
  if (score >= 400) return "Tolerans Gösterilemez Risk";
  if (score >= 200) return "Esaslı Risk";
  if (score >= 70) return "Önemli Risk";
  if (score >= 20) return "Olası Risk";
  return "Önemsiz Risk";
}

function fineKinneyActionText(score: number) {
  if (score >= 400) {
    return "Faaliyet derhal durdurulmalı ve risk kabul edilebilir seviyeye indirilmeden işe başlanmamalıdır.";
  }

  if (score >= 200) {
    return "Kısa vadeli iyileştirme planı hazırlanmalı ve önlemler öncelikli olarak uygulanmalıdır.";
  }

  if (score >= 70) {
    return "Planlı düzeltici faaliyet oluşturulmalı ve belirlenen termin içinde tamamlanmalıdır.";
  }

  if (score >= 20) {
    return "Mevcut kontroller sürdürülmeli ve ilave iyileştirmeler değerlendirilmelidir.";
  }

  return "Mevcut kontroller korunmalı ve periyodik izleme yapılmalıdır.";
}

function normalizeMethod(
  value?: RiskWritePayload["method"]
): RiskMethod {
  return value === "FINE_KINNEY"
    ? "FINE_KINNEY"
    : "MATRIX_5X5";
}

function normalizeDofStatus(
  payload: RiskWritePayload
): "OPEN" | "CLOSED" {
  if (typeof payload.completed === "boolean") {
    return payload.completed ? "CLOSED" : "OPEN";
  }

  return payload.dofStatus === "CLOSED"
    ? "CLOSED"
    : "OPEN";
}

function titleFromPayload(payload: RiskWritePayload) {
  return String(
    payload.title ||
      payload.activity ||
      payload.process ||
      ""
  ).trim();
}

function existingControlFromPayload(
  payload: RiskWritePayload
) {
  return cleanText(
    payload.existingControl ?? payload.control
  );
}

function proposedControlFromPayload(
  payload: RiskWritePayload
) {
  return cleanText(
    payload.proposedControl ?? payload.dofAction
  );
}

function matrixRecord(
  row: MatrixRiskRow,
  companyMap: Record<string, string>
) {
  const companyId = String(row.company_id || "").trim();
  const score = Number(
    row.score ||
      Number(row.probability || 0) *
        Number(row.severity || 0)
  );

  return {
    id: row.id,
    firmId: companyId,
    localFirmId: row.local_firm_id,
    syncKey: row.sync_key,

    company: companyMap[companyId] || "Firma",
    department: row.department || "",
    process: row.location || "",
    activity: row.title || "",
    title: row.title || "",

    hazard: row.hazard || "",
    consequence: row.consequence || "",
    existingControl: row.control || "",
    control: row.control || "",
    proposedControl: row.dof_action || "",

    responsible: row.responsible || "",
    dueDateMillis: row.dof_due_date_millis,
    completed: row.dof_status === "CLOSED",

    probability: Number(row.probability || 0),
    frequency: 1,
    severity: Number(row.severity || 0),

    score,
    method: "MATRIX_5X5" as const,
    level: matrixLevel(score),

    photoUrl: null,
    attachmentUrl: null,

    dofStatus: row.dof_status,
    dofAction: row.dof_action || "",
    dofResponsible: row.dof_responsible || "",
    dofNote: row.dof_note || "",

    source: row.source,
    syncStatus: row.sync_status,

    createdAtMillis: timestampToMillis(row.created_at),
    updatedAtMillis: timestampToMillis(row.updated_at),
  };
}

function fineKinneyRecord(
  row: FineKinneyRiskRow,
  companyMap: Record<string, string>
) {
  const companyId = String(row.company_id || "").trim();

  const score = Number(
    row.score ||
      Number(row.probability_value || 0) *
        Number(row.frequency_value || 0) *
        Number(row.severity_value || 0)
  );

  return {
    id: row.id,
    firmId: companyId,
    localFirmId: row.local_firm_id,
    syncKey: row.sync_key,

    company: companyMap[companyId] || "Firma",
    department: row.department || "",
    process: row.location || "",
    activity: row.title || "",
    title: row.title || "",

    hazard: row.hazard || "",
    consequence: row.consequence || "",
    existingControl: row.control || "",
    control: row.control || "",
    proposedControl:
      row.action || row.dof_action || "",

    responsible: row.responsible || "",
    dueDateMillis: row.dof_due_date_millis,
    completed: row.dof_status === "CLOSED",

    probability: Number(
      row.probability_value || 0
    ),
    frequency: Number(
      row.frequency_value || 0
    ),
    severity: Number(
      row.severity_value || 0
    ),

    probabilityValue: Number(
      row.probability_value || 0
    ),
    frequencyValue: Number(
      row.frequency_value || 0
    ),
    severityValue: Number(
      row.severity_value || 0
    ),

    score,
    method: "FINE_KINNEY" as const,
    level: fineKinneyLevel(score),

    photoUrl: null,
    attachmentUrl: null,

    action: row.action || "",
    dofStatus: row.dof_status,
    dofAction: row.dof_action || "",
    dofResponsible: row.dof_responsible || "",
    dofNote: row.dof_note || "",

    source: row.source,
    syncStatus: row.sync_status,

    createdAtMillis: timestampToMillis(row.created_at),
    updatedAtMillis: timestampToMillis(row.updated_at),
  };
}

/* ============================================================
   ADMIN CONTEXT
============================================================ */

async function getAdminContext(): Promise<AdminContext> {
  const cookieStore = await cookies();

  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value;

  const adminRole =
    cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value;

  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  return {
    allowed:
      adminAuth === "ok" &&
      (adminRole === "super_admin" ||
        adminRole === "company_admin" ||
        adminRole === "demo_user"),

    adminRole,
    companyId,

    companyScoped:
      adminRole === "company_admin" ||
      adminRole === "demo_user",

    readOnly: adminRole === "demo_user",
  };
}

async function resolveCompanyId(
  requestedCompany: string | undefined,
  context: AdminContext
) {
  if (context.companyScoped) {
    return context.companyId;
  }

  const requested = String(
    requestedCompany || ""
  ).trim();

  if (!requested) return "";

  const supabase = getSupabase();

  const { data: directCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("id", requested)
    .maybeSingle<{ id: string }>();

  if (directCompany?.id) {
    return directCompany.id;
  }

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id,name")
    .returns<CompanyRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const normalizedRequested =
    normalizeCompanyKey(requested);

  return (
    (companies || []).find(
      (company) =>
        normalizeCompanyKey(company.name) ===
        normalizedRequested
    )?.id || ""
  );
}

/* ============================================================
   VALIDATION
============================================================ */

function validateRiskPayload(payload: RiskWritePayload) {
  const title = titleFromPayload(payload);
  const hazard = String(
    payload.hazard || ""
  ).trim();

  if (!title) {
    return "Risk başlığı veya faaliyet alanı zorunludur.";
  }

  if (!hazard) {
    return "Tehlike alanı zorunludur.";
  }

  const method = normalizeMethod(payload.method);

  if (method === "FINE_KINNEY") {
    const probability = Number(
      payload.probabilityValue ??
        payload.probability ??
        0
    );

    const frequency = Number(
      payload.frequencyValue ??
        payload.frequency ??
        0
    );

    const severity = Number(
      payload.severityValue ??
        payload.severity ??
        0
    );

    if (
      !Number.isFinite(probability) ||
      !Number.isFinite(frequency) ||
      !Number.isFinite(severity)
    ) {
      return "Fine-Kinney değerleri geçersizdir.";
    }

    if (
      probability < 0 ||
      frequency < 0 ||
      severity < 0
    ) {
      return "Fine-Kinney değerleri negatif olamaz.";
    }
  } else {
    const probability = Number(
      payload.probability ?? 1
    );

    const severity = Number(
      payload.severity ?? 1
    );

    if (
      !Number.isFinite(probability) ||
      !Number.isFinite(severity)
    ) {
      return "5x5 risk değerleri geçersizdir.";
    }

    if (
      probability < 1 ||
      probability > 5 ||
      severity < 1 ||
      severity > 5
    ) {
      return "5x5 olasılık ve şiddet değerleri 1-5 arasında olmalıdır.";
    }
  }

  return "";
}

/* ============================================================
   GET
============================================================ */

export async function GET(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const requestUrl = new URL(request.url);

    const requestedFirm = String(
      requestUrl.searchParams.get("firmId") ||
        requestUrl.searchParams.get("firm") ||
        ""
    ).trim();

    const supabase = getSupabase();

    let companiesQuery = supabase
      .from("companies")
      .select("id,name")
      .order("name");

    if (ctx.companyScoped) {
      companiesQuery = companiesQuery.eq(
        "id",
        ctx.companyId
      );
    }

    const {
      data: companies,
      error: companyError,
    } = await companiesQuery.returns<
      CompanyRow[]
    >();

    if (companyError) {
      return NextResponse.json(
        {
          success: false,
          message: companyError.message,
        },
        { status: 500 }
      );
    }

    const companyMap: Record<string, string> =
      Object.fromEntries(
        (companies || []).map((company) => [
          company.id,
          company.name || "Firma",
        ])
      );

    let selectedCompany = "";

    if (ctx.companyScoped) {
      selectedCompany = ctx.companyId;
    } else if (requestedFirm) {
      selectedCompany =
        (companies || []).find(
          (company) =>
            company.id === requestedFirm ||
            normalizeCompanyKey(company.name) ===
              normalizeCompanyKey(requestedFirm)
        )?.id || "";
    }

    let matrixQuery = supabase
      .from("risk_items")
      .select("*")
      .eq("is_deleted", false)
      .order("score", { ascending: false });

    let fineQuery = supabase
      .from("fine_kinney_risks")
      .select("*")
      .eq("is_deleted", false)
      .order("score", { ascending: false });

    if (selectedCompany) {
      matrixQuery = matrixQuery.eq(
        "company_id",
        selectedCompany
      );

      fineQuery = fineQuery.eq(
        "company_id",
        selectedCompany
      );
    }

    const [matrixResult, fineResult] =
      await Promise.all([
        matrixQuery.returns<MatrixRiskRow[]>(),
        fineQuery.returns<FineKinneyRiskRow[]>(),
      ]);

    if (matrixResult.error) {
      return NextResponse.json(
        {
          success: false,
          message: matrixResult.error.message,
        },
        { status: 500 }
      );
    }

    if (fineResult.error) {
      return NextResponse.json(
        {
          success: false,
          message: fineResult.error.message,
        },
        { status: 500 }
      );
    }

    const matrixRecords = (
      matrixResult.data || []
    ).map((row) =>
      matrixRecord(row, companyMap)
    );

    const fineRecords = (
      fineResult.data || []
    ).map((row) =>
      fineKinneyRecord(row, companyMap)
    );

    const records = [
      ...matrixRecords,
      ...fineRecords,
    ].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        b.updatedAtMillis - a.updatedAtMillis
      );
    });

    const totalRisk = records.length;

    const criticalRisk = records.filter(
      (record) =>
        record.level === "VERY_HIGH" ||
        record.level === "INTOLERABLE"
    ).length;

    const intolerableRisk = records.filter(
      (record) =>
        record.level === "INTOLERABLE"
    ).length;

    const highRisk = records.filter(
      (record) => record.level === "HIGH"
    ).length;

    const mediumRisk = records.filter(
      (record) => record.level === "MEDIUM"
    ).length;

    const lowRisk = records.filter(
      (record) => record.level === "LOW"
    ).length;

    const openDof = records.filter(
      (record) => !record.completed
    ).length;

    const closedDof = records.filter(
      (record) => record.completed
    ).length;

    const averageScore =
      totalRisk > 0
        ? Math.round(
            records.reduce(
              (sum, record) =>
                sum + Number(record.score || 0),
              0
            ) / totalRisk
          )
        : 0;

    const riskScore = Math.max(
      0,
      Math.min(
        100,
        100 -
          (intolerableRisk * 20 +
            (criticalRisk - intolerableRisk) *
              12 +
            highRisk * 6 +
            mediumRisk * 2)
      )
    );

    const totals = {
      totalRisk,
      criticalRisk,
      intolerableRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      averageScore,
      openDof,
      closedDof,
    };

    return NextResponse.json({
      success: true,
      records,
      companies: (companies || []).map(
        (company) => ({
          id: company.id,
          name: company.name || "Firma",
        })
      ),
      totals,
      summary: {
        ...totals,
        matrixCount: matrixRecords.length,
        fineKinneyCount: fineRecords.length,
        riskScore,
      },
    });
  } catch (error) {
    console.error(
      "risk management GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Risk verileri okunamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — CREATE
============================================================ */

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı risk kaydı oluşturamaz.",
        },
        { status: 403 }
      );
    }

    const payload: RiskWritePayload =
      await request.json().catch(() => ({}));

    const validationError =
      validateRiskPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 }
      );
    }

    const companyId = await resolveCompanyId(
      payload.firmId ||
        payload.companyId ||
        payload.company,
      ctx
    );

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma seçilmelidir.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const method = normalizeMethod(
      payload.method
    );

    const syncKey =
      String(payload.syncKey || "").trim() ||
      crypto.randomUUID();

    const title = titleFromPayload(payload);
    const dofStatus =
      normalizeDofStatus(payload);

    if (method === "FINE_KINNEY") {
      const probability = Number(
        payload.probabilityValue ??
          payload.probability ??
          0
      );

      const frequency = Number(
        payload.frequencyValue ??
          payload.frequency ??
          0
      );

      const severity = Number(
        payload.severityValue ??
          payload.severity ??
          0
      );

      const score =
        probability * frequency * severity;

      const { data, error } = await supabase
        .from("fine_kinney_risks")
        .insert({
          sync_key: syncKey,
          company_id: companyId,
          local_firm_id:
            payload.localFirmId ?? null,

          title,
          hazard: String(
            payload.hazard || ""
          ).trim(),

          consequence: cleanText(
            payload.consequence
          ),

          control:
            existingControlFromPayload(
              payload
            ),

          probability_value: probability,
          frequency_value: frequency,
          severity_value: severity,

          level:
            cleanText(payload.level) ||
            fineKinneyLevelText(score),

          action:
            cleanText(payload.action) ||
            proposedControlFromPayload(
              payload
            ) ||
            fineKinneyActionText(score),

          department: cleanText(
            payload.department
          ),

          location: cleanText(
            payload.location ||
              payload.process
          ),

          machine: cleanText(
            payload.machine
          ),

          responsible: cleanText(
            payload.responsible
          ),

          dof_status: dofStatus,

          dof_action:
            proposedControlFromPayload(
              payload
            ) || "",

          dof_responsible:
            cleanText(
              payload.dofResponsible
            ) || "",

          dof_due_date_millis:
            dateToMillis(
              payload.dueDateMillis,
              payload.dofDueDate
            ),

          dof_closed_at_millis:
            dofStatus === "CLOSED"
              ? isoToMillis(
                  payload.dofClosedDate
                ) || Date.now()
              : null,

          dof_note:
            cleanText(payload.dofNote) || "",

          source: "WEB",
          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at:
            new Date().toISOString(),
          is_deleted: false,
          deleted_at: null,
        })
        .select("*")
        .single<FineKinneyRiskRow>();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Fine-Kinney kaydı oluşturulamadı.",
            detail: error?.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        record: fineKinneyRecord(data, {
          [companyId]:
            payload.company || "Firma",
        }),
        message:
          "Fine-Kinney kaydı oluşturuldu.",
      });
    }

    const probability = Math.min(
      5,
      Math.max(
        1,
        Number(payload.probability ?? 1)
      )
    );

    const severity = Math.min(
      5,
      Math.max(
        1,
        Number(payload.severity ?? 1)
      )
    );

    const { data, error } = await supabase
      .from("risk_items")
      .insert({
        sync_key: syncKey,
        company_id: companyId,
        local_firm_id:
          payload.localFirmId ?? null,

        title,
        hazard: String(
          payload.hazard || ""
        ).trim(),

        consequence: cleanText(
          payload.consequence
        ),

        control:
          existingControlFromPayload(
            payload
          ),

        probability,
        severity,

        department: cleanText(
          payload.department
        ),

        location: cleanText(
          payload.location ||
            payload.process
        ),

        machine: cleanText(
          payload.machine
        ),

        responsible: cleanText(
          payload.responsible
        ),

        dof_status: dofStatus,

        dof_action:
          proposedControlFromPayload(
            payload
          ) || "",

        dof_responsible:
          cleanText(
            payload.dofResponsible
          ) || "",

        dof_due_date_millis:
          dateToMillis(
            payload.dueDateMillis,
            payload.dofDueDate
          ),

        dof_closed_at_millis:
          dofStatus === "CLOSED"
            ? isoToMillis(
                payload.dofClosedDate
              ) || Date.now()
            : null,

        dof_note:
          cleanText(payload.dofNote) || "",

        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at:
          new Date().toISOString(),
        is_deleted: false,
        deleted_at: null,
      })
      .select("*")
      .single<MatrixRiskRow>();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "5x5 risk kaydı oluşturulamadı.",
          detail: error?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: matrixRecord(data, {
        [companyId]:
          payload.company || "Firma",
      }),
      message: "5x5 risk kaydı oluşturuldu.",
    });
  } catch (error) {
    console.error(
      "risk create error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı oluşturulurken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH — UPDATE
============================================================ */

export async function PATCH(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı risk kaydı düzenleyemez.",
        },
        { status: 403 }
      );
    }

    const payload: RiskWritePayload =
      await request.json().catch(() => ({}));

    const id = String(
      payload.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const validationError =
      validateRiskPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const method = normalizeMethod(
      payload.method
    );

    const title = titleFromPayload(payload);
    const dofStatus =
      normalizeDofStatus(payload);

    if (method === "FINE_KINNEY") {
      const probability = Number(
        payload.probabilityValue ??
          payload.probability ??
          0
      );

      const frequency = Number(
        payload.frequencyValue ??
          payload.frequency ??
          0
      );

      const severity = Number(
        payload.severityValue ??
          payload.severity ??
          0
      );

      const score =
        probability * frequency * severity;

      let query = supabase
        .from("fine_kinney_risks")
        .update({
          title,
          hazard: String(
            payload.hazard || ""
          ).trim(),

          consequence: cleanText(
            payload.consequence
          ),

          control:
            existingControlFromPayload(
              payload
            ),

          probability_value: probability,
          frequency_value: frequency,
          severity_value: severity,

          level:
            cleanText(payload.level) ||
            fineKinneyLevelText(score),

          action:
            cleanText(payload.action) ||
            proposedControlFromPayload(
              payload
            ) ||
            fineKinneyActionText(score),

          department: cleanText(
            payload.department
          ),

          location: cleanText(
            payload.location ||
              payload.process
          ),

          machine: cleanText(
            payload.machine
          ),

          responsible: cleanText(
            payload.responsible
          ),

          dof_status: dofStatus,

          dof_action:
            proposedControlFromPayload(
              payload
            ) || "",

          dof_responsible:
            cleanText(
              payload.dofResponsible
            ) || "",

          dof_due_date_millis:
            dateToMillis(
              payload.dueDateMillis,
              payload.dofDueDate
            ),

          dof_closed_at_millis:
            dofStatus === "CLOSED"
              ? isoToMillis(
                  payload.dofClosedDate
                ) || Date.now()
              : null,

          dof_note:
            cleanText(payload.dofNote) || "",

          source: "WEB",
          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .eq("is_deleted", false);

      if (ctx.companyScoped) {
        query = query.eq(
          "company_id",
          ctx.companyId
        );
      }

      const { data, error } = await query
        .select("*")
        .maybeSingle<FineKinneyRiskRow>();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Fine-Kinney kaydı güncellenemedi.",
            detail: error.message,
          },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Fine-Kinney kaydı bulunamadı.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        record: fineKinneyRecord(data, {}),
        message:
          "Fine-Kinney kaydı güncellendi.",
      });
    }

    const probability = Math.min(
      5,
      Math.max(
        1,
        Number(payload.probability ?? 1)
      )
    );

    const severity = Math.min(
      5,
      Math.max(
        1,
        Number(payload.severity ?? 1)
      )
    );

    let query = supabase
      .from("risk_items")
      .update({
        title,
        hazard: String(
          payload.hazard || ""
        ).trim(),

        consequence: cleanText(
          payload.consequence
        ),

        control:
          existingControlFromPayload(
            payload
          ),

        probability,
        severity,

        department: cleanText(
          payload.department
        ),

        location: cleanText(
          payload.location ||
            payload.process
        ),

        machine: cleanText(
          payload.machine
        ),

        responsible: cleanText(
          payload.responsible
        ),

        dof_status: dofStatus,

        dof_action:
          proposedControlFromPayload(
            payload
          ) || "",

        dof_responsible:
          cleanText(
            payload.dofResponsible
          ) || "",

        dof_due_date_millis:
          dateToMillis(
            payload.dueDateMillis,
            payload.dofDueDate
          ),

        dof_closed_at_millis:
          dofStatus === "CLOSED"
            ? isoToMillis(
                payload.dofClosedDate
              ) || Date.now()
            : null,

        dof_note:
          cleanText(payload.dofNote) || "",

        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false);

    if (ctx.companyScoped) {
      query = query.eq(
        "company_id",
        ctx.companyId
      );
    }

    const { data, error } = await query
      .select("*")
      .maybeSingle<MatrixRiskRow>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            "5x5 risk kaydı güncellenemedi.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "5x5 risk kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record: matrixRecord(data, {}),
      message: "5x5 risk kaydı güncellendi.",
    });
  } catch (error) {
    console.error(
      "risk update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı güncellenirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — SOFT DELETE
============================================================ */

export async function DELETE(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı risk kaydı silemez.",
        },
        { status: 403 }
      );
    }

    const requestUrl = new URL(request.url);

    const id = String(
      requestUrl.searchParams.get("id") ||
        ""
    ).trim();

    const method = normalizeMethod(
      String(
        requestUrl.searchParams.get(
          "method"
        ) || "MATRIX_5X5"
      ) as RiskWritePayload["method"]
    );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const table =
      method === "FINE_KINNEY"
        ? "fine_kinney_risks"
        : "risk_items";

    let query = supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at:
          new Date().toISOString(),
        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false);

    if (ctx.companyScoped) {
      query = query.eq(
        "company_id",
        ctx.companyId
      );
    }

    const { data, error } = await query
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Risk kaydı silinemedi.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Risk kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      method,
      message: "Risk kaydı silindi.",
    });
  } catch (error) {
    console.error(
      "risk delete error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı silinirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}