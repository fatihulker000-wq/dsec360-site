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
        summary: unavailable
          ? "Veri alınamadı"
          : own.length
          ? `${own.length} analiz bulgusu`
          : "Belirgin bulgu yok",
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
