import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type ModuleStatus = "CRITICAL" | "WARNING" | "GOOD" | "UNAVAILABLE";
type AnyRow = Record<string, any>;

type DoraFinding = {
  id: string;
  module: string;
  moduleLabel: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  sourceUrl: string;
  evidence: string[];
  count?: number;
};

type ModuleResult = {
  key: string;
  label: string;
  available: boolean;
  status: ModuleStatus;
  summary: string;
  total: number;
  findings: number;
  warning?: string;
};


type ManagementTopic = {
  id: string;
  score: number;
  severity: Severity;
  title: string;
  interpretation: string;
  recommendation: string;
  evidence: string[];
  modules: string[];
};

type CrossAnalysis = {
  id: string;
  title: string;
  status: "SIGNAL" | "LIMITED" | "POSITIVE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  interpretation: string;
  evidence: string[];
  recommendation: string;
  modules: string[];
};

type DataQualityItem = {
  key: string;
  label: string;
  score: number;
  status: "GOOD" | "WARNING" | "POOR";
  interpretation: string;
  evidence: string[];
};

type XrayCategory = {
  key: string;
  label: string;
  status: ModuleStatus;
  headline: string;
  detail: string;
  sourceUrl: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type HorizonItem = {
  id: string;
  module: string;
  label: string;
  days: number;
  date?: string;
  sourceUrl: string;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value: unknown) {
  return text(value)
    .toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I")
    .replaceAll("Ş", "S")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C")
    .replace(/[^A-Z0-9]+/g, "_");
}

function safeDateMillis(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 100000000000) return numeric;
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function daysUntil(value: unknown) {
  const target = safeDateMillis(value);
  if (target === null) return null;
  return Math.ceil((target - Date.now()) / 86400000);
}

function severityRank(severity: Severity) {
  return { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 }[severity];
}

function moduleStatus(findings: DoraFinding[]): ModuleStatus {
  if (findings.some((x) => x.severity === "CRITICAL")) return "CRITICAL";
  if (findings.some((x) => x.severity === "HIGH" || x.severity === "MEDIUM")) return "WARNING";
  return "GOOD";
}

async function safeRows(
  label: string,
  query: PromiseLike<{ data: AnyRow[] | null; error: any }>
): Promise<{ rows: AnyRow[]; warning?: string }> {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`DORA V2 ${label} sorgu hatası`, error);
      return { rows: [], warning: "Veri alınamadı." };
    }
    return { rows: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.warn(`DORA V2 ${label} sorgu hatası`, error);
    return { rows: [], warning: "Veri alınamadı." };
  }
}

function finding(
  module: string,
  moduleLabel: string,
  severity: Severity,
  code: string,
  title: string,
  description: string,
  recommendation: string,
  sourceUrl: string,
  evidence: string[],
  count?: number
): DoraFinding {
  return {
    id: `${module}:${code}`,
    module,
    moduleLabel,
    severity,
    title,
    description,
    recommendation,
    sourceUrl,
    evidence,
    count,
  };
}

function isAuditCompleted(row: AnyRow) {
  const s = normalize(row.status || row.state);
  return ["COMPLETED", "COMPLETE", "DONE", "TAMAMLANDI", "KAPALI", "CLOSED"].includes(s);
}

function isRiskClosed(row: AnyRow) {
  const s = normalize(row.dof_status || row.status || row.state);
  return ["CLOSED", "KAPALI", "DONE", "COMPLETED", "TAMAMLANDI"].includes(s);
}

function riskSeverity(row: AnyRow): Severity {
  const explicit = normalize(row.risk_level || row.level || row.priority || row.riskLevel);
  if (explicit.includes("CRITICAL") || explicit.includes("KRITIK") || explicit.includes("INTOLERABLE") || explicit.includes("TOLERE_EDILEMEZ")) return "CRITICAL";
  if (explicit.includes("HIGH") || explicit.includes("YUKSEK") || explicit.includes("SIGNIFICANT")) return "HIGH";
  if (explicit.includes("MEDIUM") || explicit.includes("ORTA")) return "MEDIUM";

  const score = numberValue(row.score ?? row.risk_score ?? row.total_score ?? row.riskScore, 0);
  if (score > 0 && score <= 25) {
    if (score >= 20) return "CRITICAL";
    if (score >= 15) return "HIGH";
    if (score >= 8) return "MEDIUM";
    return "LOW";
  }
  if (score >= 400) return "CRITICAL";
  if (score >= 200) return "HIGH";
  if (score >= 70) return "MEDIUM";
  return "LOW";
}

function incidentType(row: AnyRow) {
  return normalize(row.event_type || row.eventType || row.incident_type || row.type);
}


function firstText(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = text(row?.[key]);
    if (value) return value;
  }
  return "";
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function qualityStatus(score: number): DataQualityItem["status"] {
  if (score >= 85) return "GOOD";
  if (score >= 60) return "WARNING";
  return "POOR";
}

function topicSeverity(score: number): Severity {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

export async function GET(req: NextRequest) {
  try {
    const companyId = text(req.nextUrl.searchParams.get("companyId"));
    if (!companyId || companyId === "ALL") {
      return NextResponse.json(
        { success: false, error: "DORA analizi için tek firma seçilmelidir." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const auth = await resolveReportScope(supabase, companyId);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const effectiveCompanyId = auth.scope.selectedCompanyId;
    if (effectiveCompanyId === "ALL") {
      return NextResponse.json(
        { success: false, error: "DORA ilk aşamada firma bazlı analiz yapar." },
        { status: 400 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id,name,local_firm_id,calisan_sayisi,nace_kodu,tehlike_sinifi,sektor")
      .eq("id", effectiveCompanyId)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: companyError?.message || "Firma bulunamadı." },
        { status: companyError ? 500 : 404 }
      );
    }

    const localFirmId = text(company.local_firm_id);

    const employeesResult = await safeRows(
      "Çalışanlar",
      supabase
        .from("employees")
        .select("id,full_name,email,job_title,active,firm_id")
        .eq("firm_id", effectiveCompanyId)
        .limit(10000)
    );

    const employees = employeesResult.rows;
    const activeEmployees = employees.filter((x) => x.active !== false);
    const employeeIds = activeEmployees.map((x) => text(x.id)).filter(Boolean);

    const trainingUsersResult = employeeIds.length
      ? await safeRows(
          "Eğitim kullanıcıları",
          supabase
            .from("users")
            .select("id,employee_id,company_id,role,is_active")
            .eq("role", "training_user")
            .in("employee_id", employeeIds)
        )
      : { rows: [] as AnyRow[] };

    const trainingUserIds = trainingUsersResult.rows.map((x) => text(x.id)).filter(Boolean);
    const assignmentsResult = trainingUserIds.length
      ? await safeRows(
          "Eğitim atamaları",
          supabase
            .from("training_assignments")
            .select("id,user_id,training_id,status,watch_completed,video_chain_completed,final_exam_passed,started_at,completed_at,created_at")
            .in("user_id", trainingUserIds)
        )
      : { rows: [] as AnyRow[] };

    const [matrixRiskResult, fineRiskResult, healthResult, periodicResult, measurementResult] = await Promise.all([
      safeRows(
        "5x5 Risk",
        supabase.from("risk_items").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false")
      ),
      safeRows(
        "Fine Kinney Risk",
        supabase.from("fine_kinney_risks").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false")
      ),
      safeRows(
        "Sağlık",
        supabase.from("health_examinations").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false")
      ),
      safeRows(
        "Periyodik Kontrol",
        supabase.from("periodic_control_equipments").select("*").eq("firm_id", effectiveCompanyId).eq("deleted", false)
      ),
      safeRows(
        "Ortam Ölçümleri",
        supabase.from("environment_measurements").select("*").eq("firm_id", effectiveCompanyId).eq("deleted", false)
      ),
    ]);

    const auditRunsResult = await safeRows(
      "Denetimler",
      supabase.from("denetim_runs").select("*").order("created_at_millis", { ascending: false }).limit(5000)
    );

    const auditRuns = auditRunsResult.rows.filter((run) => {
      const firmId = text(run.firm_id);
      const firmName = normalize(run.firm_name);
      return (
        firmId === effectiveCompanyId ||
        (!!localFirmId && firmId === localFirmId) ||
        (!!firmName && firmName === normalize(company.name))
      );
    });

    const runIds = auditRuns.map((x) => x.id).filter((x) => x !== null && x !== undefined);
    const auditAnswersResult = runIds.length
      ? await safeRows(
          "Denetim cevapları",
          supabase.from("denetim_answers").select("*").in("run_remote_id", runIds)
        )
      : { rows: [] as AnyRow[] };

    let accidentQuery = supabase
      .from("accident_records")
      .select("*")
      .or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0");

    const numericLocalFirmId = Number(localFirmId);
    if (localFirmId && Number.isFinite(numericLocalFirmId) && numericLocalFirmId > 0) {
      accidentQuery = accidentQuery.eq("firm_id", numericLocalFirmId);
    } else {
      accidentQuery = accidentQuery.eq("web_firm_id", effectiveCompanyId);
    }
    const accidentsResult = await safeRows("Kaza/Olay", accidentQuery);

    const findings: DoraFinding[] = [];

    // ÇALIŞAN ANALİZİ
    const missingJobTitle = activeEmployees.filter((x) => !text(x.job_title)).length;
    if (missingJobTitle > 0) {
      findings.push(
        finding(
          "EMPLOYEE",
          "Çalışanlar",
          "LOW",
          "MISSING_JOB_TITLE",
          `${missingJobTitle} çalışanın görev/unvan bilgisi eksik`,
          "Eksik görev bilgisi eğitim, risk ve sağlık analizlerinin doğruluğunu azaltabilir.",
          "Çalışan kartlarındaki görev/unvan alanlarının tamamlanması önerilir.",
          "/admin/employees",
          [`Aktif çalışan: ${activeEmployees.length}`, `Görev/unvanı eksik: ${missingJobTitle}`],
          missingJobTitle
        )
      );
    }

    // EĞİTİM ANALİZİ
    const unlinkedTrainingUsers = Math.max(0, activeEmployees.length - trainingUsersResult.rows.length);
    if (unlinkedTrainingUsers > 0) {
      findings.push(
        finding(
          "TRAINING",
          "Eğitim",
          "HIGH",
          "UNLINKED_TRAINING_USER",
          `${unlinkedTrainingUsers} çalışan eğitim kullanıcısına bağlı değil`,
          "Bu çalışanların eğitim atama ve tamamlama durumu DORA tarafından güvenilir biçimde izlenemiyor.",
          "Çalışan-eğitim kullanıcı eşleşmelerinin kontrol edilmesi önerilir.",
          "/admin/trainings",
          [`Aktif çalışan: ${activeEmployees.length}`, `Bağlı eğitim kullanıcısı: ${trainingUsersResult.rows.length}`],
          unlinkedTrainingUsers
        )
      );
    }

    const incompleteAssignments = assignmentsResult.rows.filter((x) => {
      const s = normalize(x.status);
      return !["COMPLETED", "TAMAMLANDI"].includes(s);
    });
    const notStarted = incompleteAssignments.filter((x) => ["NOT_STARTED", "BASLAMADI", "BASLAMADI"].includes(normalize(x.status))).length;
    const inProgress = incompleteAssignments.length - notStarted;
    if (incompleteAssignments.length > 0) {
      findings.push(
        finding(
          "TRAINING",
          "Eğitim",
          notStarted > 0 ? "HIGH" : "MEDIUM",
          "INCOMPLETE_ASSIGNMENTS",
          `${incompleteAssignments.length} eğitim ataması tamamlanmamış`,
          "Tamamlanmamış eğitimler çalışan bazında takip edilmelidir.",
          "Eksik ve devam eden eğitimlerin planlı şekilde tamamlanması önerilir.",
          "/admin/trainings",
          [`Başlamadı: ${notStarted}`, `Devam ediyor/diğer: ${inProgress}`],
          incompleteAssignments.length
        )
      );
    }

    // RİSK ANALİZİ
    const riskRows = [...matrixRiskResult.rows, ...fineRiskResult.rows];
    const openRisks = riskRows.filter((x) => !isRiskClosed(x));
    const criticalRisks = openRisks.filter((x) => riskSeverity(x) === "CRITICAL");
    const highRisks = openRisks.filter((x) => riskSeverity(x) === "HIGH");
    if (criticalRisks.length > 0) {
      findings.push(
        finding(
          "RISK",
          "Risk Yönetimi",
          "CRITICAL",
          "OPEN_CRITICAL_RISK",
          `${criticalRisks.length} kritik risk açık durumda`,
          "Kritik seviyedeki risk kayıtları kapatılmamış veya kapanış durumu doğrulanmamış görünüyor.",
          "Kritik risklerin mevcut kontrol tedbirleri ve terminleri öncelikli olarak gözden geçirilmelidir.",
          "/admin/risk-management",
          [`Toplam risk: ${riskRows.length}`, `Açık kritik risk: ${criticalRisks.length}`],
          criticalRisks.length
        )
      );
    }
    if (highRisks.length > 0) {
      findings.push(
        finding(
          "RISK",
          "Risk Yönetimi",
          "HIGH",
          "OPEN_HIGH_RISK",
          `${highRisks.length} yüksek risk açık durumda`,
          "Yüksek risklerin açık kalması operasyonel öncelik gerektirir.",
          "Yüksek risklerin aksiyon planı, sorumlusu ve termin bilgilerinin kontrol edilmesi önerilir.",
          "/admin/risk-management",
          [`Açık yüksek risk: ${highRisks.length}`],
          highRisks.length
        )
      );
    }

    // SAĞLIK ANALİZİ
    const latestExamByEmployee = new Map<string, AnyRow>();
    for (const exam of healthResult.rows) {
      const employeeId = text(exam.employee_id);
      if (!employeeId) continue;
      const current = latestExamByEmployee.get(employeeId);
      const currentTime = safeDateMillis(current?.exam_date || current?.created_at) || 0;
      const incomingTime = safeDateMillis(exam.exam_date || exam.created_at) || 0;
      if (!current || incomingTime >= currentTime) latestExamByEmployee.set(employeeId, exam);
    }

    const employeesWithoutExam = activeEmployees.filter((x) => !latestExamByEmployee.has(text(x.id))).length;
    if (employeesWithoutExam > 0) {
      findings.push(
        finding(
          "HEALTH",
          "Sağlık",
          "HIGH",
          "MISSING_EXAM",
          `${employeesWithoutExam} aktif çalışan için sağlık muayenesi kaydı bulunamadı`,
          "DORA yalnızca sistemde kayıtlı muayene verisini değerlendirebilir.",
          "Çalışanların muayene kayıtlarının Sağlık modülünde kontrol edilmesi önerilir.",
          "/admin/health",
          [`Aktif çalışan: ${activeEmployees.length}`, `Muayene kaydı bulunmayan: ${employeesWithoutExam}`],
          employeesWithoutExam
        )
      );
    }

    const latestExams = [...latestExamByEmployee.values()];
    const expiredExams = latestExams.filter((x) => {
      const d = daysUntil(x.next_exam_date || x.next_examination_date);
      return d !== null && d < 0;
    });
    const upcomingExams = latestExams.filter((x) => {
      const d = daysUntil(x.next_exam_date || x.next_examination_date);
      return d !== null && d >= 0 && d <= 30;
    });
    if (expiredExams.length > 0) {
      findings.push(
        finding(
          "HEALTH",
          "Sağlık",
          "CRITICAL",
          "EXPIRED_EXAM",
          `${expiredExams.length} sağlık muayenesinin yenileme tarihi geçmiş`,
          "Sistemde kayıtlı sonraki muayene tarihine göre yenileme gecikmesi bulunuyor.",
          "Gecikmiş muayenelerin Sağlık modülünde öncelikli olarak kontrol edilmesi önerilir.",
          "/admin/health",
          [`Süresi geçen: ${expiredExams.length}`],
          expiredExams.length
        )
      );
    }
    if (upcomingExams.length > 0) {
      findings.push(
        finding(
          "HEALTH",
          "Sağlık",
          "MEDIUM",
          "UPCOMING_EXAM",
          `${upcomingExams.length} sağlık muayenesi 30 gün içinde yenilenecek`,
          "Yaklaşan sağlık muayeneleri planlama gerektiriyor.",
          "Muayene planının şimdiden gözden geçirilmesi önerilir.",
          "/admin/health",
          [`30 gün içinde: ${upcomingExams.length}`],
          upcomingExams.length
        )
      );
    }

    // DENETİM + DÖF
    const incompleteAudits = auditRuns.filter((x) => !isAuditCompleted(x));
    const answers = auditAnswersResult.rows;
    const nonconformingAnswers = answers.filter((x) => {
      const r = normalize(x.result);
      return r.includes("UYGUNSUZ") || r.includes("KISMEN") || r.includes("EKSIK") || r.includes("YETERSIZ");
    });
    const openDofs = answers.filter((x) => {
      const s = normalize(x.dof_status);
      if (["OPEN", "ACIK", "IN_PROGRESS", "DEVAM_EDIYOR"].includes(s)) return true;
      return !s && nonconformingAnswers.includes(x);
    });

    if (incompleteAudits.length > 0) {
      findings.push(
        finding(
          "AUDIT",
          "Denetim & DÖF",
          "MEDIUM",
          "INCOMPLETE_AUDIT",
          `${incompleteAudits.length} denetim tamamlanmamış`,
          "Başlatılmış ancak tamamlanmamış denetim kayıtları bulunuyor.",
          "Açık denetimlerin durumunun ve tamamlanma planının kontrol edilmesi önerilir.",
          "/admin/denetimler",
          [`Toplam denetim: ${auditRuns.length}`, `Tamamlanmamış: ${incompleteAudits.length}`],
          incompleteAudits.length
        )
      );
    }
    if (openDofs.length > 0) {
      findings.push(
        finding(
          "AUDIT",
          "Denetim & DÖF",
          "HIGH",
          "OPEN_DOF",
          `${openDofs.length} açık DÖF/uygunsuzluk bulunuyor`,
          "Denetim cevaplarında açık veya kapanışı doğrulanmamış uygunsuzluklar mevcut.",
          "Açık DÖF kayıtlarının termin ve kapanış kanıtlarının gözden geçirilmesi önerilir.",
          "/admin/denetimler",
          [`Uygunsuz/kısmen uygun cevap: ${nonconformingAnswers.length}`, `Açık DÖF: ${openDofs.length}`],
          openDofs.length
        )
      );
    }

    // KAZA / OLAY
    const accidentRows = accidentsResult.rows;
    const workAccidents = accidentRows.filter((x) => {
      const t = incidentType(x);
      return t.includes("IS_KAZASI") || t === "KAZA" || t.includes("WORK_ACCIDENT");
    });
    const nearMisses = accidentRows.filter((x) => {
      const t = incidentType(x);
      return t.includes("RAMAK") || t.includes("NEAR_MISS");
    });
    if (workAccidents.length > 0) {
      findings.push(
        finding(
          "ACCIDENT",
          "Kaza / Olay",
          "HIGH",
          "WORK_ACCIDENT_EXISTS",
          `${workAccidents.length} iş kazası kaydı analiz kapsamına girdi`,
          "İş kazası kayıtları yalnızca sayısal olarak değil; eğitim, risk, denetim ve ekipman verileriyle birlikte değerlendirilmelidir.",
          "Kazaların ortak kök nedenleri ve tekrar eden örüntülerinin incelenmesi önerilir.",
          "/admin/accidents",
          [`İş kazası: ${workAccidents.length}`, `Ramak kala: ${nearMisses.length}`, `Toplam olay: ${accidentRows.length}`],
          workAccidents.length
        )
      );
    } else if (nearMisses.length > 0) {
      findings.push(
        finding(
          "ACCIDENT",
          "Kaza / Olay",
          "MEDIUM",
          "NEAR_MISS_EXISTS",
          `${nearMisses.length} ramak kala kaydı bulunuyor`,
          "Ramak kala kayıtları gerçekleşmiş kazadan önce erken uyarı niteliğinde değerlendirilebilir.",
          "Tekrarlayan ramak kala nedenlerinin Risk ve Denetim kayıtlarıyla karşılaştırılması önerilir.",
          "/admin/accidents",
          [`Ramak kala: ${nearMisses.length}`],
          nearMisses.length
        )
      );
    }

    // PERİYODİK KONTROL
    const overduePeriodic = periodicResult.rows.filter((x) => {
      const d = daysUntil(x.next_due_millis);
      return d !== null && d < 0;
    });
    const due7Periodic = periodicResult.rows.filter((x) => {
      const d = daysUntil(x.next_due_millis);
      return d !== null && d >= 0 && d <= 7;
    });
    const due30Periodic = periodicResult.rows.filter((x) => {
      const d = daysUntil(x.next_due_millis);
      return d !== null && d > 7 && d <= 30;
    });
    if (overduePeriodic.length > 0) {
      findings.push(
        finding(
          "PERIODIC",
          "Periyodik Kontrol",
          "CRITICAL",
          "OVERDUE_PERIODIC",
          `${overduePeriodic.length} periyodik kontrolün tarihi geçmiş`,
          "Ekipman kayıtlarında sonraki kontrol tarihi geçmiş görünüyor.",
          "Gecikmiş kontrollerin kayıt ve raporlarının öncelikli olarak incelenmesi önerilir.",
          "/admin/documentation/periodic-controls",
          [`Geciken: ${overduePeriodic.length}`],
          overduePeriodic.length
        )
      );
    }
    if (due7Periodic.length > 0 || due30Periodic.length > 0) {
      findings.push(
        finding(
          "PERIODIC",
          "Periyodik Kontrol",
          due7Periodic.length > 0 ? "HIGH" : "MEDIUM",
          "UPCOMING_PERIODIC",
          `${due7Periodic.length + due30Periodic.length} periyodik kontrol 30 gün içinde`,
          "Yaklaşan periyodik kontroller planlama gerektiriyor.",
          "7 gün içindeki kayıtlar öncelikli olmak üzere kontrol takviminin gözden geçirilmesi önerilir.",
          "/admin/documentation/periodic-controls",
          [`0-7 gün: ${due7Periodic.length}`, `8-30 gün: ${due30Periodic.length}`],
          due7Periodic.length + due30Periodic.length
        )
      );
    }

    // ORTAM ÖLÇÜMLERİ
    const overdueMeasurements = measurementResult.rows.filter((x) => {
      const d = daysUntil(x.next_due_millis);
      return d !== null && d < 0;
    });
    const upcomingMeasurements = measurementResult.rows.filter((x) => {
      const d = daysUntil(x.next_due_millis);
      return d !== null && d >= 0 && d <= 30;
    });
    if (overdueMeasurements.length > 0) {
      findings.push(
        finding(
          "ENVIRONMENT",
          "Ortam Ölçümleri",
          "HIGH",
          "OVERDUE_MEASUREMENT",
          `${overdueMeasurements.length} ortam ölçümünün yenileme tarihi geçmiş`,
          "Ortam ölçümü kayıtlarında sonraki yenileme tarihi geçmiş görünüyor.",
          "Gecikmiş ölçümlerin kapsam ve yenileme planının kontrol edilmesi önerilir.",
          "/admin/documentation/periodic-controls",
          [`Geciken ortam ölçümü: ${overdueMeasurements.length}`],
          overdueMeasurements.length
        )
      );
    }
    if (upcomingMeasurements.length > 0) {
      findings.push(
        finding(
          "ENVIRONMENT",
          "Ortam Ölçümleri",
          "MEDIUM",
          "UPCOMING_MEASUREMENT",
          `${upcomingMeasurements.length} ortam ölçümü 30 gün içinde yenilenecek`,
          "Yaklaşan ölçümler planlama gerektiriyor.",
          "Ölçüm hizmeti ve kapsam planının önceden gözden geçirilmesi önerilir.",
          "/admin/documentation/periodic-controls",
          [`30 gün içinde: ${upcomingMeasurements.length}`],
          upcomingMeasurements.length
        )
      );
    }

    findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

    // ------------------------------------------------------------
    // DORA DERİN ANALİZ KATMANI
    // Faz 1 kuralı: yalnızca OKU -> İLİŞKİLENDİR -> ANALİZ ET -> YORUMLA -> ÖNER.
    // Aşağıdaki hesapların hiçbiri kaynak modüllere yazma işlemi yapmaz.
    // ------------------------------------------------------------
    const employeeById = new Map(activeEmployees.map((x) => [text(x.id), x]));
    const trainingUserByEmployee = new Map(
      trainingUsersResult.rows.map((x) => [text(x.employee_id), x])
    );
    const assignmentsByUser = new Map<string, AnyRow[]>();
    for (const assignment of assignmentsResult.rows) {
      const userId = text(assignment.user_id);
      if (!userId) continue;
      assignmentsByUser.set(userId, [...(assignmentsByUser.get(userId) || []), assignment]);
    }

    const accidentsWithEmployee = accidentRows.filter((x) => text(x.employee_id));
    const accidentsMatchedToEmployee = accidentsWithEmployee.filter((x) => employeeById.has(text(x.employee_id)));
    const accidentEmployeesWithExam = accidentsMatchedToEmployee.filter((x) => latestExamByEmployee.has(text(x.employee_id)));
    const accidentEmployeesWithTrainingLink = accidentsMatchedToEmployee.filter((x) => trainingUserByEmployee.has(text(x.employee_id)));
    const accidentEmployeesWithIncompleteTraining = accidentsMatchedToEmployee.filter((x) => {
      const user = trainingUserByEmployee.get(text(x.employee_id));
      if (!user) return false;
      const rows = assignmentsByUser.get(text(user.id)) || [];
      return rows.some((a) => !["COMPLETED", "TAMAMLANDI"].includes(normalize(a.status)));
    });

    const accidentRootCauseFilled = accidentRows.filter((x) => firstText(x, ["root_cause_category", "root_cause", "rootCause"])).length;
    const accidentLocationFilled = accidentRows.filter((x) => firstText(x, ["location", "area_name", "areaName"])).length;
    const accidentDepartmentFilled = accidentRows.filter((x) => firstText(x, ["department", "department_name", "departmentName"])).length;

    const riskLocations = new Set(
      riskRows.map((x) => normalize(firstText(x, ["location", "area", "area_name", "department", "work_area"]))).filter(Boolean)
    );
    const auditLocations = new Set(
      auditRuns.map((x) => normalize(firstText(x, ["location", "area", "department"]))).filter(Boolean)
    );
    const periodicLocations = new Set(
      periodicResult.rows.map((x) => normalize(firstText(x, ["location", "area_name", "areaName"]))).filter(Boolean)
    );
    const accidentLocations = accidentRows
      .map((x) => normalize(firstText(x, ["location", "area_name", "areaName"])))
      .filter(Boolean);

    const accidentRiskLocationMatches = accidentLocations.filter((x) => riskLocations.has(x)).length;
    const accidentAuditLocationMatches = accidentLocations.filter((x) => auditLocations.has(x)).length;
    const accidentPeriodicLocationMatches = accidentLocations.filter((x) => periodicLocations.has(x)).length;

    const crossAnalyses: CrossAnalysis[] = [];

    if (workAccidents.length > 0) {
      if (accidentsMatchedToEmployee.length > 0) {
        crossAnalyses.push({
          id: "ACCIDENT_EMPLOYEE_READINESS",
          title: "Kaza ↔ Çalışan uygunluk ilişkisi",
          status: accidentEmployeesWithIncompleteTraining.length > 0 || accidentEmployeesWithExam.length < accidentsMatchedToEmployee.length ? "SIGNAL" : "POSITIVE",
          confidence: accidentsMatchedToEmployee.length === workAccidents.length ? "HIGH" : "MEDIUM",
          interpretation:
            `${workAccidents.length} iş kazasının ${accidentsMatchedToEmployee.length} kaydı aktif çalışanlarla eşleştirilebildi. ` +
            `${accidentEmployeesWithExam.length} eşleşmede sağlık muayenesi kaydı, ${accidentEmployeesWithTrainingLink.length} eşleşmede eğitim kullanıcı bağlantısı görüldü. ` +
            `${accidentEmployeesWithIncompleteTraining.length} eşleşmede en az bir tamamlanmamış eğitim ataması var.`,
          evidence: [
            `İş kazası: ${workAccidents.length}`,
            `Çalışanla eşleşen: ${accidentsMatchedToEmployee.length}`,
            `Sağlık kaydı olan eşleşme: ${accidentEmployeesWithExam.length}`,
            `Tamamlanmamış eğitimi olan eşleşme: ${accidentEmployeesWithIncompleteTraining.length}`,
          ],
          recommendation: "Kaza kayıtları ile çalışan eğitim/sağlık durumlarının olay bazında birlikte incelenmesi; eşleşmeyen kayıtların önce veri bütünlüğü açısından doğrulanması önerilir.",
          modules: ["Kaza / Olay", "Çalışanlar", "Eğitim", "Sağlık"],
        });
      } else {
        crossAnalyses.push({
          id: "ACCIDENT_EMPLOYEE_LINK_LIMITED",
          title: "Kaza ↔ Çalışan ilişkisi kurulamadı",
          status: "LIMITED",
          confidence: "LOW",
          interpretation: `${workAccidents.length} iş kazası bulunmasına rağmen aktif çalışan kaydıyla güvenilir eşleşme kurulamadı. Bu nedenle kişi bazlı eğitim ve sağlık korelasyonu üretmek doğru olmaz.`,
          evidence: [`İş kazası: ${workAccidents.length}`, `Çalışanla eşleşen: ${accidentsMatchedToEmployee.length}`],
          recommendation: "Kaza kayıtlarındaki employee_id eşleşmelerinin doğrulanması önerilir.",
          modules: ["Kaza / Olay", "Çalışanlar"],
        });
      }

      if (accidentLocations.length > 0) {
        crossAnalyses.push({
          id: "ACCIDENT_LOCATION_CORRELATION",
          title: "Kaza ↔ Risk / Denetim / Ekipman lokasyon ilişkisi",
          status: accidentRiskLocationMatches + accidentAuditLocationMatches + accidentPeriodicLocationMatches > 0 ? "SIGNAL" : "LIMITED",
          confidence: accidentLocationFilled === accidentRows.length ? "HIGH" : "MEDIUM",
          interpretation:
            `Lokasyon bilgisi bulunan olaylarda ${accidentRiskLocationMatches} risk, ${accidentAuditLocationMatches} denetim ve ${accidentPeriodicLocationMatches} periyodik kontrol lokasyon eşleşmesi yakalandı. ` +
            `Bu eşleşmeler nedensellik kanıtı değildir; aynı çalışma alanlarında kayıt yoğunlaşmasını gösteren inceleme sinyalidir.`,
          evidence: [
            `Lokasyonu dolu olay: ${accidentLocationFilled}/${accidentRows.length}`,
            `Risk lokasyon eşleşmesi: ${accidentRiskLocationMatches}`,
            `Denetim lokasyon eşleşmesi: ${accidentAuditLocationMatches}`,
            `Periyodik kontrol lokasyon eşleşmesi: ${accidentPeriodicLocationMatches}`,
          ],
          recommendation: "Eşleşen lokasyonlarda kaza tarihi öncesi risk, denetim ve ekipman kontrol kayıtlarının kronolojik olarak birlikte incelenmesi önerilir.",
          modules: ["Kaza / Olay", "Risk Yönetimi", "Denetim & DÖF", "Periyodik Kontrol"],
        });
      }
    }

    const riskAuditLocationOverlap = [...riskLocations].filter((x) => auditLocations.has(x)).length;
    if (riskLocations.size > 0 && auditLocations.size > 0) {
      crossAnalyses.push({
        id: "RISK_AUDIT_LOCATION_OVERLAP",
        title: "Risk ↔ Denetim ortak çalışma alanları",
        status: riskAuditLocationOverlap > 0 ? "SIGNAL" : "LIMITED",
        confidence: "MEDIUM",
        interpretation: `${riskAuditLocationOverlap} lokasyon/alan hem risk hem denetim kayıtlarında ortak görünüyor. Açık yüksek/kritik risklerle denetim uygunsuzluklarının aynı alanlarda yoğunlaşıp yoğunlaşmadığı detay incelemeye değer.`,
        evidence: [`Risk lokasyonu: ${riskLocations.size}`, `Denetim lokasyonu: ${auditLocations.size}`, `Ortak lokasyon: ${riskAuditLocationOverlap}`],
        recommendation: "Ortak lokasyonlardaki yüksek/kritik risklerin açık DÖF ve uygunsuzluk kayıtlarıyla kayıt bazında karşılaştırılması önerilir.",
        modules: ["Risk Yönetimi", "Denetim & DÖF"],
      });
    }

    const dataQuality: DataQualityItem[] = [];
    const jobTitleScore = activeEmployees.length ? pct(activeEmployees.length - missingJobTitle, activeEmployees.length) : 100;
    dataQuality.push({
      key: "EMPLOYEE_IDENTITY",
      label: "Çalışan temel veri bütünlüğü",
      score: jobTitleScore,
      status: qualityStatus(jobTitleScore),
      interpretation: `Aktif çalışanların %${jobTitleScore} oranında görev/unvan bilgisi mevcut.`,
      evidence: [`Aktif çalışan: ${activeEmployees.length}`, `Görev/unvan eksik: ${missingJobTitle}`],
    });

    const trainingLinkScore = activeEmployees.length ? pct(trainingUsersResult.rows.length, activeEmployees.length) : 100;
    dataQuality.push({
      key: "TRAINING_LINK",
      label: "Çalışan ↔ Eğitim eşleşmesi",
      score: trainingLinkScore,
      status: qualityStatus(trainingLinkScore),
      interpretation: `Aktif çalışanların %${trainingLinkScore} oranı eğitim kullanıcısıyla eşleştirilebildi.`,
      evidence: [`Aktif çalışan: ${activeEmployees.length}`, `Eğitim kullanıcısı eşleşen: ${trainingUsersResult.rows.length}`],
    });

    const healthCoverageScore = activeEmployees.length ? pct(activeEmployees.length - employeesWithoutExam, activeEmployees.length) : 100;
    dataQuality.push({
      key: "HEALTH_COVERAGE",
      label: "Sağlık kayıt kapsaması",
      score: healthCoverageScore,
      status: qualityStatus(healthCoverageScore),
      interpretation: `Aktif çalışanların %${healthCoverageScore} oranında en az bir sağlık muayenesi kaydı eşleştirilebildi. Bu oran doğrudan “muayene yapılmadı” anlamına gelmez; sistemdeki kayıt kapsamasını gösterir.`,
      evidence: [`Aktif çalışan: ${activeEmployees.length}`, `Muayene kaydı eşleşen: ${activeEmployees.length - employeesWithoutExam}`],
    });

    const rootCauseScore = accidentRows.length ? pct(accidentRootCauseFilled, accidentRows.length) : 100;
    dataQuality.push({
      key: "ACCIDENT_ROOT_CAUSE",
      label: "Kaza kök neden veri kalitesi",
      score: rootCauseScore,
      status: qualityStatus(rootCauseScore),
      interpretation: accidentRows.length
        ? `Olay kayıtlarının %${rootCauseScore} oranında kök neden kategorisi dolu. Derin örüntü analizinin güvenilirliği bu kapsama bağlıdır.`
        : "Analiz döneminde olay kaydı bulunmadı.",
      evidence: [`Toplam olay: ${accidentRows.length}`, `Kök nedeni dolu: ${accidentRootCauseFilled}`],
    });

    const accidentContextFields = accidentRows.length * 2;
    const accidentContextFilled = accidentLocationFilled + accidentDepartmentFilled;
    const accidentContextScore = accidentContextFields ? pct(accidentContextFilled, accidentContextFields) : 100;
    dataQuality.push({
      key: "ACCIDENT_CONTEXT",
      label: "Kaza lokasyon/departman kapsaması",
      score: accidentContextScore,
      status: qualityStatus(accidentContextScore),
      interpretation: `Olayların lokasyon ve departman alanlarının toplam doluluk oranı %${accidentContextScore}.`,
      evidence: [`Lokasyon dolu: ${accidentLocationFilled}/${accidentRows.length}`, `Departman dolu: ${accidentDepartmentFilled}/${accidentRows.length}`],
    });

    const overallDataQuality = dataQuality.length
      ? Math.round(dataQuality.reduce((sum, x) => sum + x.score, 0) / dataQuality.length)
      : 100;

    const managementTopics: ManagementTopic[] = [];
    if (criticalRisks.length + highRisks.length > 0) {
      const ratio = riskRows.length ? (criticalRisks.length + highRisks.length) / riskRows.length : 0;
      const score = Math.min(100, Math.round(55 + ratio * 35 + (criticalRisks.length > 0 ? 10 : 0)));
      managementTopics.push({
        id: "RISK_CONCENTRATION",
        score,
        severity: topicSeverity(score),
        title: "Açık kritik/yüksek risk yoğunluğu",
        interpretation: `${riskRows.length} risk kaydının ${criticalRisks.length + highRisks.length} adedi açık kritik/yüksek seviyede (%${pct(criticalRisks.length + highRisks.length, riskRows.length)}). Bu oran, yalnız toplam risk sayısından daha önemli bir yönetim sinyalidir.`,
        recommendation: "Öncelikle kritik/yüksek risklerin termin, kontrol tedbiri ve kapanış kanıtı kalitesinin örneklem bazlı doğrulanması önerilir.",
        evidence: [`Kritik: ${criticalRisks.length}`, `Yüksek: ${highRisks.length}`, `Toplam risk: ${riskRows.length}`],
        modules: ["Risk Yönetimi"],
      });
    }

    if (workAccidents.length > 0) {
      const score = Math.min(100, 65 + Math.min(25, workAccidents.length * 3) + (nearMisses.length === 0 ? 10 : 0));
      managementTopics.push({
        id: "ACCIDENT_PATTERN",
        score,
        severity: topicSeverity(score),
        title: "Kazalarda tekrar ve önleyici veri ilişkisi incelenmeli",
        interpretation: `${workAccidents.length} iş kazası kaydı bulunuyor. Ramak kala sayısı ${nearMisses.length}. ${nearMisses.length === 0 ? "Kaza varken ramak kala kaydının bulunmaması, bildirim kültürü/veri kaydı açısından ayrıca incelenmesi gereken bir sinyaldir; tek başına ramak kala yaşanmadığını kanıtlamaz." : "Ramak kala kayıtları kazalarla birlikte örüntü analizi için kullanılabilir."}`,
        recommendation: "Kaza kayıtlarını kök neden, lokasyon, departman, eğitim ve risk verileriyle birlikte inceleyin.",
        evidence: [`İş kazası: ${workAccidents.length}`, `Ramak kala: ${nearMisses.length}`, `Kök nedeni dolu olay: ${accidentRootCauseFilled}/${accidentRows.length}`],
        modules: ["Kaza / Olay", "Risk Yönetimi", "Eğitim", "Sağlık"],
      });
    }

    if (healthCoverageScore < 85) {
      const score = Math.min(95, 50 + Math.round((100 - healthCoverageScore) * 0.5));
      managementTopics.push({
        id: "HEALTH_DATA_GAP",
        score,
        severity: topicSeverity(score),
        title: "Sağlık uygunluğu analizinde ciddi veri kapsama boşluğu",
        interpretation: `Aktif çalışanların yalnızca %${healthCoverageScore} oranında sağlık muayenesi kaydı eşleştirilebildi. Bu nedenle DORA sağlık uygunluğu hakkında kesin hüküm vermek yerine önce veri bütünlüğünü işaretliyor.`,
        recommendation: "Sağlık kayıtlarının çalışanlarla eşleşmesini doğrulayın; gerçek eksiklik ile kayıt/entegrasyon eksikliğini birbirinden ayırın.",
        evidence: [`Aktif çalışan: ${activeEmployees.length}`, `Muayene kaydı bulunmayan: ${employeesWithoutExam}`],
        modules: ["Sağlık", "Çalışanlar"],
      });
    }

    if (incompleteAssignments.length > 0) {
      const score = Math.min(90, 45 + Math.round(pct(incompleteAssignments.length, Math.max(assignmentsResult.rows.length, 1)) * 0.45));
      managementTopics.push({
        id: "TRAINING_COMPLETION",
        score,
        severity: topicSeverity(score),
        title: "Eğitim tamamlama yükü operasyonel risk oluşturuyor",
        interpretation: `${assignmentsResult.rows.length} eğitim atamasının ${incompleteAssignments.length} adedi tamamlanmamış (%${pct(incompleteAssignments.length, assignmentsResult.rows.length)}). Bu sayı, kaza ve yüksek risk bulunan bir ortamda daha anlamlı hale gelir.`,
        recommendation: "Tamamlanmamış eğitimleri yalnız sayı olarak değil; yüksek riskli görevler ve kaza geçmişiyle birlikte önceliklendirin.",
        evidence: [`Tamamlanmamış: ${incompleteAssignments.length}`, `Başlamadı: ${notStarted}`, `Devam/diğer: ${inProgress}`],
        modules: ["Eğitim", "Risk Yönetimi", "Kaza / Olay"],
      });
    }

    const overdueObligations = overduePeriodic.length + overdueMeasurements.length + expiredExams.length;
    if (overdueObligations > 0 || due7Periodic.length > 0) {
      const score = Math.min(95, 55 + overdueObligations * 8 + due7Periodic.length * 4);
      managementTopics.push({
        id: "TIME_CRITICAL_OBLIGATIONS",
        score,
        severity: topicSeverity(score),
        title: "Takvim bazlı yükümlülüklerde gecikme/yaklaşan termin",
        interpretation: `${overdueObligations} kayıt tarihi geçmiş durumda; ayrıca ${due7Periodic.length} periyodik kontrol 7 gün içinde yaklaşıyor.`,
        recommendation: "Gecikmiş kayıtların gerçek durumunu doğrulayın; 7 günlük pencereye giren kontrolleri yönetim takibine alın.",
        evidence: [`Gecikmiş periyodik kontrol: ${overduePeriodic.length}`, `Gecikmiş ortam ölçümü: ${overdueMeasurements.length}`, `Süresi geçmiş sağlık: ${expiredExams.length}`, `0-7 gün periyodik: ${due7Periodic.length}`],
        modules: ["Periyodik Kontrol", "Ortam Ölçümleri", "Sağlık"],
      });
    }

    if (openDofs.length > 0) {
      const score = Math.min(90, 50 + Math.min(40, openDofs.length * 2));
      managementTopics.push({
        id: "AUDIT_CLOSURE",
        score,
        severity: topicSeverity(score),
        title: "Denetim bulgularının kapanış kalitesi izlenmeli",
        interpretation: `${openDofs.length} açık/kapanışı doğrulanmamış DÖF veya uygunsuzluk sinyali var. Açık risk yoğunluğuyla birlikte ele alındığında kontrol tedbirlerinin sahadaki kapanış etkinliği ayrıca incelenmeli.`,
        recommendation: "Açık DÖF'lerin termin ve kapanış kanıtlarını yüksek/kritik risklerle ortak alan bazında karşılaştırın.",
        evidence: [`Açık DÖF: ${openDofs.length}`, `Uygunsuz/kısmen uygun cevap: ${nonconformingAnswers.length}`],
        modules: ["Denetim & DÖF", "Risk Yönetimi"],
      });
    }

    managementTopics.sort((a, b) => b.score - a.score);
    const topManagementTopics = managementTopics.slice(0, 5);

    const executiveCommentary: string[] = [];
    if (topManagementTopics.length) {
      executiveCommentary.push(`DORA, 8 modülün verisini birlikte değerlendirerek yönetim açısından ${topManagementTopics.length} öncelikli konu belirledi.`);
      executiveCommentary.push(`En güçlü sinyal “${topManagementTopics[0].title}” başlığında ${topManagementTopics[0].score}/100 öncelik puanıyla oluştu.`);
    } else {
      executiveCommentary.push("DORA mevcut veride belirgin bir yönetim önceliği üretmedi; bu sonuç yalnızca okunabilen sistem verisi kapsamındadır.");
    }
    if (overallDataQuality < 70) {
      executiveCommentary.push(`Veri güvenilirliği ${overallDataQuality}/100 seviyesinde. Bazı sonuçlar operasyonel eksiklikten çok kayıt/entegrasyon boşluğunu yansıtıyor olabilir.`);
    } else {
      executiveCommentary.push(`Analiz veri kapsama puanı ${overallDataQuality}/100. Yine de korelasyonlar nedensellik değil, inceleme sinyali olarak yorumlanmalıdır.`);
    }
    if (workAccidents.length > 0 && criticalRisks.length + highRisks.length > 0) {
      executiveCommentary.push(`${workAccidents.length} iş kazası ile ${criticalRisks.length + highRisks.length} açık kritik/yüksek risk aynı yönetim görünümünde bulunduğu için kaza-risk-eğitim ilişkisi öncelikli çapraz inceleme alanıdır.`);
    }

    const moduleDefinitions = [
      { key: "EMPLOYEE", label: "Çalışanlar", result: employeesResult, total: activeEmployees.length },
      { key: "TRAINING", label: "Eğitim", result: assignmentsResult, total: assignmentsResult.rows.length },
      { key: "RISK", label: "Risk Yönetimi", result: matrixRiskResult.warning && fineRiskResult.warning ? { warning: "Veri alınamadı." } : {}, total: riskRows.length },
      { key: "HEALTH", label: "Sağlık", result: healthResult, total: healthResult.rows.length },
      { key: "AUDIT", label: "Denetim & DÖF", result: auditRunsResult, total: auditRuns.length },
      { key: "ACCIDENT", label: "Kaza / Olay", result: accidentsResult, total: accidentRows.length },
      { key: "PERIODIC", label: "Periyodik Kontrol", result: periodicResult, total: periodicResult.rows.length },
      { key: "ENVIRONMENT", label: "Ortam Ölçümleri", result: measurementResult, total: measurementResult.rows.length },
    ];

    const modules: ModuleResult[] = moduleDefinitions.map((m) => {
      const own = findings.filter((x) => x.module === m.key);
      const unavailable = Boolean((m.result as any)?.warning);
      return {
        key: m.key,
        label: m.label,
        available: !unavailable,
        status: unavailable ? "UNAVAILABLE" : moduleStatus(own),
        summary: unavailable ? "Veri alınamadı" : own.length ? `${own.length} analiz bulgusu` : "Belirgin bulgu yok",
        total: m.total,
        findings: own.length,
        warning: unavailable ? "Veri alınamadı." : undefined,
      };
    });

    const severityCounts = {
      critical: findings.filter((x) => x.severity === "CRITICAL").length,
      high: findings.filter((x) => x.severity === "HIGH").length,
      medium: findings.filter((x) => x.severity === "MEDIUM").length,
      low: findings.filter((x) => x.severity === "LOW").length,
      info: findings.filter((x) => x.severity === "INFO").length,
    };

    const xrayCategories: XrayCategory[] = modules.map((m) => {
      const own = findings.filter((f) => f.module === m.key);
      const counts = {
        critical: own.filter((f) => f.severity === "CRITICAL").length,
        high: own.filter((f) => f.severity === "HIGH").length,
        medium: own.filter((f) => f.severity === "MEDIUM").length,
        low: own.filter((f) => f.severity === "LOW").length,
      };
      const first = own[0];
      return {
        key: m.key,
        label: m.label,
        status: m.status,
        headline: first?.title || (m.available ? "Belirgin kritik sinyal görülmedi" : "Veri okunamadı"),
        detail: first?.description || (m.available ? "DORA bu alanda mevcut veriler içinde öncelikli bir eksiklik üretmedi." : "Bu alan için analiz güvenilir biçimde tamamlanamadı."),
        sourceUrl: first?.sourceUrl || "/admin/dora",
        ...counts,
      };
    });

    const horizonItems: HorizonItem[] = [];
    const pushHorizon = (rows: AnyRow[], module: string, sourceUrl: string, dateKeys: string[], labelKeys: string[]) => {
      rows.forEach((row, index) => {
        const raw = dateKeys.map((k) => row?.[k]).find((v) => v !== null && v !== undefined && v !== "");
        const days = daysUntil(raw);
        if (days === null || days < 0 || days > 90) return;
        const millis = safeDateMillis(raw);
        horizonItems.push({
          id: `${module}:${text(row.id) || index}:${days}`,
          module,
          label: firstText(row, labelKeys) || `${module} kaydı`,
          days,
          date: millis ? new Date(millis).toISOString() : undefined,
          sourceUrl,
        });
      });
    };
    pushHorizon(latestExams, "Sağlık", "/admin/health", ["next_exam_date", "next_examination_date"], ["employee_name", "full_name", "exam_type"]);
    pushHorizon(periodicResult.rows, "Periyodik Kontrol", "/admin/documentation/periodic-controls", ["next_due_millis", "next_due_date"], ["equipment_name", "equipmentName", "equipment_type", "equipmentType"]);
    pushHorizon(measurementResult.rows, "Ortam Ölçümü", "/admin/documentation/periodic-controls", ["next_due_millis", "next_due_date"], ["measurement_type", "measurementType", "area_name", "areaName"]);
    horizonItems.sort((a, b) => a.days - b.days);

    const horizon = {
      due7: horizonItems.filter((x) => x.days <= 7).length,
      due15: horizonItems.filter((x) => x.days <= 15).length,
      due30: horizonItems.filter((x) => x.days <= 30).length,
      due60: horizonItems.filter((x) => x.days <= 60).length,
      due90: horizonItems.length,
      items: horizonItems.slice(0, 30),
    };

    const weightedPenalty = findings.reduce((sum, f) => sum + ({ CRITICAL: 12, HIGH: 7, MEDIUM: 4, LOW: 1, INFO: 0 }[f.severity]), 0);
    const unavailablePenalty = modules.filter((m) => !m.available).length * 4;
    const xrayScore = Math.max(0, Math.min(100, 100 - weightedPenalty - unavailablePenalty));
    const xrayStatus = xrayScore >= 85 ? "İYİ" : xrayScore >= 70 ? "İZLE" : xrayScore >= 50 ? "DİKKAT" : "KRİTİK";
    const xray = {
      score: xrayScore,
      status: xrayStatus,
      criticalIssues: severityCounts.critical,
      highSignals: severityCounts.high,
      upcoming30: horizon.due30,
      systemicSignals: crossAnalyses.filter((x) => x.status === "SIGNAL").length,
      categories: xrayCategories,
    };

    return NextResponse.json({
      success: true,
      mode: "READ_ONLY_ANALYSIS",
      generatedAt: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        localFirmId: company.local_firm_id,
        employeeCount: activeEmployees.length,
        dangerClass: company.tehlike_sinifi,
        naceCode: company.nace_kodu,
        sector: company.sektor,
      },
      summary: {
        scannedModules: modules.filter((x) => x.available).length,
        unavailableModules: modules.filter((x) => !x.available).length,
        totalFindings: findings.length,
        ...severityCounts,
      },
      modules,
      findings,
      executiveCommentary,
      managementTopics: topManagementTopics,
      crossAnalyses,
      dataQuality: { overallScore: overallDataQuality, items: dataQuality },
      xray,
      horizon,
      guardrails: {
        readOnly: true,
        writesToModules: false,
        createsActions: false,
        closesRecords: false,
        assignsTasks: false,
      },
    });
  } catch (error) {
    console.error("DORA V2 ANALYSIS ERROR", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "DORA analizi oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}
