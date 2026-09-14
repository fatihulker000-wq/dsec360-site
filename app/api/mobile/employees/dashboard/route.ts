import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function authorized(req: Request) {
  return String(req.headers.get("x-api-key") || "").trim() === MOBILE_API_KEY;
}

function clean(value: unknown) {
  const v = String(value ?? "").trim();
  return v || null;
}

function norm(value: unknown) {
  return String(value ?? "").trim().toLocaleUpperCase("tr-TR");
}

async function safeRows(label: string, promise: PromiseLike<any>) {
  try {
    const { data, error } = await promise;
    if (error) {
      console.warn(`[mobile employees/dashboard] ${label}:`, error.message);
      return [] as any[];
    }
    return (data || []) as any[];
  } catch (error: any) {
    console.warn(`[mobile employees/dashboard] ${label}:`, error?.message || error);
    return [] as any[];
  }
}

function groupByEmployee(rows: any[]) {
  const map = new Map<string, any[]>();
  for (const row of rows || []) {
    const id = String(row?.employee_id || "").trim();
    if (!id) continue;
    const list = map.get(id) || [];
    list.push(row);
    map.set(id, list);
  }
  return map;
}

function normalizeHazardClass(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

function getLegalTrainingRule(hazardClass: unknown) {
  const normalized = normalizeHazardClass(hazardClass);

  if (
    normalized.includes("ÇOK TEHLİKELİ") ||
    normalized.includes("COK TEHLIKELI")
  ) {
    return { requiredMinutes: 16 * 60, validityYears: 1, label: "Çok Tehlikeli" };
  }

  if (
    normalized.includes("AZ TEHLİKELİ") ||
    normalized.includes("AZ TEHLIKELI")
  ) {
    return { requiredMinutes: 8 * 60, validityYears: 3, label: "Az Tehlikeli" };
  }

  if (
    normalized.includes("TEHLİKELİ") ||
    normalized.includes("TEHLIKELI")
  ) {
    return { requiredMinutes: 12 * 60, validityYears: 2, label: "Tehlikeli" };
  }

  return { requiredMinutes: 0, validityYears: 0, label: "" };
}

function isTrainingCompleted(row: any) {
  const status = norm(row?.status);
  if (["COMPLETED", "TAMAMLANDI", "BAŞARILI", "BASARILI", "PASSED"].includes(status)) {
    return true;
  }
  if (row?.completed_at) return true;
  return row?.watch_completed === true && row?.final_exam_passed === true;
}

function getTrainingCompletionDate(row: any) {
  const raw = row?.completed_at || row?.date || row?.started_at || row?.created_at || null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTrainingLegallyValid(row: any, validityYears: number, now = new Date()) {
  if (!isTrainingCompleted(row) || validityYears <= 0) return false;
  const completedAt = getTrainingCompletionDate(row);
  if (!completedAt) return false;
  const validUntil = new Date(completedAt);
  validUntil.setFullYear(validUntil.getFullYear() + validityYears);
  return validUntil >= now;
}

function calculateLegalTrainingSummary(rows: any[], hazardClass: unknown) {
  const rule = getLegalTrainingRule(hazardClass);

  if (rule.requiredMinutes <= 0) {
    return {
      status: "UNKNOWN" as const,
      completionRate: 0,
      completedMinutes: 0,
      requiredMinutes: 0,
      missingMinutes: 0,
      validityYears: 0,
      hazardClass: normalizeHazardClass(hazardClass),
      validTrainingCount: 0,
    };
  }

  const validRows = (rows || []).filter((row) =>
    isTrainingLegallyValid(row, rule.validityYears)
  );

  const completedMinutes = validRows.reduce(
    (sum, row) => sum + Math.max(0, Number(row?.duration_minutes ?? 0) || 0),
    0
  );

  const completionRate = Math.max(
    0,
    Math.min(100, Math.round((completedMinutes / rule.requiredMinutes) * 100))
  );

  const missingMinutes = Math.max(0, rule.requiredMinutes - completedMinutes);

  return {
    status: completedMinutes >= rule.requiredMinutes ? ("COMPLETE" as const) : ("MISSING" as const),
    completionRate,
    completedMinutes,
    requiredMinutes: rule.requiredMinutes,
    missingMinutes,
    validityYears: rule.validityYears,
    hazardClass: rule.label,
    validTrainingCount: validRows.length,
  };
}

function moduleStatus(rows: any[]) {
  if (!rows.length) return "UNKNOWN";
  const statuses = rows.map((row) => norm(row?.status));
  if (statuses.some((s) => ["EXPIRED", "MISSING", "OVERDUE", "RED", "KIRMIZI"].includes(s))) {
    return "MISSING";
  }
  if (statuses.some((s) => ["EXPIRING", "WARNING", "YELLOW", "SARI"].includes(s))) {
    return "EXPIRING";
  }
  return "COMPLETE";
}

function healthStatus(rows: any[]) {
  if (!rows.length) return "UNKNOWN";
  const now = Date.now();
  let hasDueSoon = false;
  let hasOverdue = false;

  for (const row of rows) {
    const raw = row?.next_due_millis || row?.next_due_at || row?.next_exam_date;
    if (!raw) continue;
    const numeric = Number(raw);
    const date = Number.isFinite(numeric) && numeric > 10000000000
      ? numeric
      : new Date(String(raw)).getTime();
    if (!Number.isFinite(date)) continue;
    if (date < now) hasOverdue = true;
    else if (date <= now + 30 * 24 * 60 * 60 * 1000) hasDueSoon = true;
  }

  if (hasOverdue) return "MISSING";
  if (hasDueSoon) return "EXPIRING";
  return "COMPLETE";
}

function riskStatus(rows: any[]) {
  if (!rows.length) return "UNKNOWN";
  const high = rows.some((row) => {
    const score = Number(row?.score ?? row?.risk_score ?? 0) || 0;
    const level = norm(row?.risk_level);
    return score >= 200 || ["HIGH", "CRITICAL", "YÜKSEK", "YUKSEK", "ÇOK YÜKSEK", "COK YUKSEK"].includes(level);
  });
  return high ? "HIGH" : "COMPLETE";
}

function missingDataCount(employee: any) {
  const fields = [
    employee?.blood_type,
    employee?.birth_date,
    employee?.start_date,
    employee?.department ?? employee?.department_name ?? employee?.birim,
    employee?.job_title ?? employee?.title ?? employee?.position,
  ];
  return fields.filter((v) => !clean(v)).length;
}

function years(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, (Date.now() - d.getTime()) / 31557600000);
}

function age(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a >= 0 && a < 100 ? a : null;
}

function countBy(rows: any[], getter: (row: any) => unknown, unknown = "Bilinmiyor") {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = String(getter(row) ?? "").trim();
    const key = raw || unknown;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }

    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();
    if (!firmId) {
      return NextResponse.json({ error: "firmId zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const employees = await safeRows(
      "employees",
      supabase.from("employees").select("*").eq("firm_id", firmId).order("full_name", { ascending: true })
    );

    const employeeIds = employees.map((e) => String(e.id)).filter(Boolean);
    if (employeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        firmId,
        generatedAt: new Date().toISOString(),
        stats: { total: 0, active: 0, passive: 0, trainingAction: 0, healthAction: 0, ppeAction: 0, documentAction: 0, riskAction: 0, dataMissing: 0, dataQuality: 100, newStarts: 0, highRisk: 0, accidentPeople: 0, accidentRecords: 0 },
        dataQualityDetails: { bloodMissing: 0, birthMissing: 0, startMissing: 0, orgMissing: 0 },
        distributions: { department: [], jobTitle: [], seniority: [], age: [], blood: [], education: [], gender: [] },
        employees: [],
      });
    }

    const [users, companyRows, healthRows, examRows, ek2Rows, ppeRows, documentRows, riskRows, accidentRows] = await Promise.all([
      safeRows("users", supabase.from("users").select("id,employee_id,company_id").in("employee_id", employeeIds)),
      safeRows("company hazard", supabase.from("companies").select("id,tehlike_sinifi").eq("id", firmId)),
      safeRows("health_records", supabase.from("health_records").select("id,employee_id,status,exam_date_millis,next_due_millis").in("employee_id", employeeIds)),
      safeRows("health_examinations", supabase.from("health_examinations").select("id,employee_id,exam_date,next_exam_date,decision,is_deleted").in("employee_id", employeeIds).eq("is_deleted", false)),
      safeRows("health_ek2_forms", supabase.from("health_ek2_forms").select("id,employee_id,status,exam_date,next_exam_date,is_active,created_at").in("employee_id", employeeIds).or("is_active.is.null,is_active.eq.true")),
      safeRows("ppe", supabase.from("employee_ppe_assignments").select("id,employee_id,status").in("employee_id", employeeIds)),
      safeRows("documents", supabase.from("employee_document_assignments").select("id,employee_id,status,is_cancelled").in("employee_id", employeeIds).or("is_cancelled.is.null,is_cancelled.eq.false")),
      safeRows("risks", supabase.from("employee_risks").select("id,employee_id,status,score,risk_score,risk_level").in("employee_id", employeeIds)),
      safeRows(
        "accidents",
        supabase
          .from("accident_records")
          .select("id,web_employee_id,web_firm_id,is_deleted")
          .in("web_employee_id", employeeIds)
          .eq("web_firm_id", firmId)
          .or("is_deleted.is.null,is_deleted.eq.false")
      ),
    ]);

    const hazardClass = companyRows[0]?.tehlike_sinifi ?? null;

    const userToEmployee = new Map<string, string>();
    for (const user of users) {
      const employeeId = String(user?.employee_id || "").trim();
      if (employeeId) userToEmployee.set(String(user.id), employeeId);
    }

    const userIds = Array.from(userToEmployee.keys());
    let trainingRows: any[] = [];

    if (userIds.length > 0) {
      const assignments = await safeRows(
        "training_assignments",
        supabase
          .from("training_assignments")
          .select("id,user_id,training_id,status,watch_completed,final_exam_passed,completed_at,started_at,created_at")
          .in("user_id", userIds)
      );

      const trainingIds = Array.from(
        new Set(
          assignments
            .map((row) => String(row.training_id || "").trim())
            .filter(Boolean)
        )
      );

      const definitions = trainingIds.length > 0
        ? await safeRows(
            "training definitions",
            supabase
              .from("trainings")
              .select("id,title,duration_minutes,type,created_at")
              .in("id", trainingIds)
          )
        : [];

      const definitionMap = new Map(definitions.map((row) => [String(row.id), row]));

      trainingRows = assignments
        .map((row) => {
          const employeeId = userToEmployee.get(String(row.user_id));
          if (!employeeId) return null;
          const training = definitionMap.get(String(row.training_id));
          return {
            ...row,
            employee_id: employeeId,
            duration_minutes: Number(training?.duration_minutes ?? 0) || 0,
            title: training?.title || "Eğitim",
            type: training?.type || "EĞİTİM",
            date: row.completed_at || row.started_at || row.created_at || training?.created_at || null,
          };
        })
        .filter(Boolean) as any[];
    }

    const healthByEmployee = groupByEmployee([
      ...healthRows,
      ...examRows.map((row) => ({ ...row, next_due_at: row.next_exam_date })),
      ...ek2Rows.map((row) => ({ ...row, next_due_at: row.next_exam_date })),
    ]);
    const trainingByEmployee = groupByEmployee(trainingRows);
    const ppeByEmployee = groupByEmployee(ppeRows);
    const documentByEmployee = groupByEmployee(documentRows);
    const riskByEmployee = groupByEmployee(riskRows);
    // Web Çalışanlar ekranıyla aynı kanonik ilişki:
    // accident_records.web_employee_id -> employees.id
    const canonicalAccidentRows = accidentRows.map((row) => ({
      ...row,
      employee_id: String(row?.web_employee_id || "").trim(),
    }));
    const accidentByEmployee = groupByEmployee(canonicalAccidentRows);

    const summaries = employees.map((employee) => {
      const employeeId = String(employee.id);
      const legalTraining = calculateLegalTrainingSummary(
        trainingByEmployee.get(employeeId) || [],
        hazardClass
      );
      const health = healthStatus(healthByEmployee.get(employeeId) || []);
      const ppe = moduleStatus(ppeByEmployee.get(employeeId) || []);
      const documents = moduleStatus(documentByEmployee.get(employeeId) || []);
      const risk = riskStatus(riskByEmployee.get(employeeId) || []);
      const missing = missingDataCount(employee);

      return {
        id: employeeId,
        full_name: String(employee.full_name || "").trim(),
        department: clean(employee.department ?? employee.department_name ?? employee.departmentName ?? employee.birim ?? employee.unit_name),
        job_title: clean(employee.job_title ?? employee.title ?? employee.position ?? employee.position_name),
        start_date: clean(employee.start_date),
        birth_date: clean(employee.birth_date),
        gender: clean(employee.gender),
        education_level: clean(employee.education_level),
        blood_type: clean(employee.blood_type),
        active: Boolean(employee.active ?? true) && !clean(employee.exit_date),

        // CANONICAL: Web ile aynı yasal eğitim hesabı
        training_status: legalTraining.status,
        training_completion_rate: legalTraining.completionRate,
        legal_training_completed_minutes: legalTraining.completedMinutes,
        legal_training_required_minutes: legalTraining.requiredMinutes,
        legal_training_missing_minutes: legalTraining.missingMinutes,
        legal_training_validity_years: legalTraining.validityYears,
        legal_training_hazard_class: legalTraining.hazardClass,
        legal_training_valid_count: legalTraining.validTrainingCount,

        health_status: health,
        ppe_status: ppe,
        document_status: documents,
        risk_status: risk,
        accident_count: (accidentByEmployee.get(employeeId) || []).length,
        missing_data_count: missing,
      };
    });

    const activeRows = summaries.filter((e) => e.active);
    const actionStatus = (v: string) => ["MISSING", "EXPIRING", "HIGH", "CRITICAL"].includes(v);

    const totalFields = activeRows.length * 5;
    const missingFields = activeRows.reduce((sum, e) => sum + Number(e.missing_data_count || 0), 0);
    const dataQuality = totalFields <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(((totalFields - missingFields) * 100) / totalFields)));

    const bloodMissing = activeRows.filter((e) => !clean(e.blood_type)).length;
    const birthMissing = activeRows.filter((e) => !clean(e.birth_date)).length;
    const startMissing = activeRows.filter((e) => !clean(e.start_date)).length;
    const orgMissing = activeRows.filter((e) => !clean(e.department) || !clean(e.job_title)).length;
    const highRisk = activeRows.filter((e) => ["HIGH", "CRITICAL"].includes(String(e.risk_status))).length;
    const accidentPeople = activeRows.filter((e) => Number(e.accident_count || 0) > 0).length;
    const accidentRecords = activeRows.reduce((sum, e) => sum + Math.max(0, Number(e.accident_count || 0)), 0);
    const newStarts = activeRows.filter((e) => {
      const y = years(e.start_date);
      return y !== null && y <= 0.25;
    }).length;

    // EmployeeExecutiveDashboard.tsx ile birebir aynı Workforce Score formülü.
    const trainingAction = activeRows.filter((e) => actionStatus(e.training_status)).length;
    const healthAction = activeRows.filter((e) => actionStatus(e.health_status)).length;
    const ppeAction = activeRows.filter((e) => actionStatus(e.ppe_status)).length;
    const documentAction = activeRows.filter((e) => actionStatus(e.document_status)).length;
    const compliancePenalty =
      trainingAction * 1.05 +
      healthAction * 1.15 +
      ppeAction * 0.8 +
      documentAction * 0.65 +
      highRisk * 2.1 +
      accidentPeople * 1.4 +
      activeRows.filter((e) => Number(e.missing_data_count || 0) > 0).length * 0.45;
    const workforceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (activeRows.length > 0
              ? (compliancePenalty / activeRows.length) * 12
              : 0)
        )
      )
    );

    const ageBuckets: Record<string, number> = {
      "18–24": 0, "25–34": 0, "35–44": 0, "45–54": 0, "55+": 0, "Bilinmiyor": 0,
    };
    for (const employee of activeRows) {
      const a = age(employee.birth_date);
      if (a === null) ageBuckets["Bilinmiyor"]++;
      else if (a < 25) ageBuckets["18–24"]++;
      else if (a < 35) ageBuckets["25–34"]++;
      else if (a < 45) ageBuckets["35–44"]++;
      else if (a < 55) ageBuckets["45–54"]++;
      else ageBuckets["55+"]++;
    }

    const seniorityBuckets: Record<string, number> = {
      "0–1 yıl": 0, "1–3 yıl": 0, "3–5 yıl": 0, "5–10 yıl": 0, "10+ yıl": 0, "Bilinmiyor": 0,
    };
    for (const employee of activeRows) {
      const y = years(employee.start_date);
      if (y === null) seniorityBuckets["Bilinmiyor"]++;
      else if (y < 1) seniorityBuckets["0–1 yıl"]++;
      else if (y < 3) seniorityBuckets["1–3 yıl"]++;
      else if (y < 5) seniorityBuckets["3–5 yıl"]++;
      else if (y < 10) seniorityBuckets["5–10 yıl"]++;
      else seniorityBuckets["10+ yıl"]++;
    }

    const distributions = {
      department: countBy(activeRows, (e) => e.department),
      jobTitle: countBy(activeRows, (e) => e.job_title),
      seniority: Object.entries(seniorityBuckets).filter(([, count]) => count > 0).map(([label, count]) => ({ label, count })),
      age: Object.entries(ageBuckets).filter(([, count]) => count > 0).map(([label, count]) => ({ label, count })),
      blood: countBy(activeRows, (e) => e.blood_type),
      education: countBy(activeRows, (e) => e.education_level),
      gender: countBy(activeRows, (e) => e.gender),
    };

    return NextResponse.json({
      success: true,
      firmId,
      generatedAt: new Date().toISOString(),
      stats: {
        total: summaries.length,
        active: activeRows.length,
        passive: summaries.length - activeRows.length,
        trainingAction,
        healthAction,
        ppeAction,
        documentAction,
        riskAction: activeRows.filter((e) => actionStatus(e.risk_status)).length,
        dataMissing: activeRows.filter((e) => Number(e.missing_data_count || 0) > 0).length,
        dataQuality,
        newStarts,
        highRisk,
        accidentPeople,
        accidentRecords,
        workforceScore,
      },
      dataQualityDetails: { bloodMissing, birthMissing, startMissing, orgMissing },
      distributions,
      employees: summaries,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}
