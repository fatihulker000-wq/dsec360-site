import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function diffDays(from: string) {
  const today = new Date();
  const target = new Date(from);
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin" || !adminRole;

    if (adminAuth !== "ok" && adminRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    if (!isAllowedRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const today = new Date();
const todayStr = toDateOnly(today);

const next30 = new Date();
next30.setDate(today.getDate() + 90);
const next30Str = toDateOnly(next30);

const nextCritical = new Date();
nextCritical.setDate(today.getDate() + 30);
const nextCriticalStr = toDateOnly(nextCritical);

const supabase = getSupabase();

    let employeesQuery = supabase
      .from("employees")
      .select("id, full_name, firm_id, job_title")
      .limit(10000);

    if (adminRole === "company_admin" && companyIdFromCookie) {
      employeesQuery = employeesQuery.eq("firm_id", companyIdFromCookie);
    }

    const { data: employees, error: employeesError } = await employeesQuery;

    if (employeesError) {
      return NextResponse.json(
        { error: employeesError.message },
        { status: 500 }
      );
    }

    const employeeIds = (employees || []).map((e) => String(e.id));

    let examsQuery = supabase
  .from("health_examinations")
  .select(
    "id, employee_id, company_id, exam_type, exam_date, next_exam_date, decision, bmi, systolic, diastolic, spo2, created_at, is_deleted"
  )
  .or("is_deleted.eq.false,is_deleted.is.null")
  .order("created_at", { ascending: false })
  .limit(1000);

    if (adminRole === "company_admin" && companyIdFromCookie) {
      examsQuery = examsQuery.eq("company_id", companyIdFromCookie);
    }

    const { data: exams, error: examsError } = await examsQuery;

    if (examsError) {
      return NextResponse.json({ error: examsError.message }, { status: 500 });
    }

    let prescriptionsQuery = supabase
  .from("health_prescriptions")
  .select(`
    id,
    employee_id,
    company_id,
    created_at,
    health_prescription_items(id)
  `)
  .eq("is_active", true)
  .order("created_at", { ascending: false })
  .limit(100);

if (adminRole === "company_admin" && companyIdFromCookie) {
  prescriptionsQuery = prescriptionsQuery.eq("company_id", companyIdFromCookie);
}

const {
  data: prescriptions,
  error: prescriptionsError,
} = await prescriptionsQuery;

if (prescriptionsError) {
  return NextResponse.json(
    { error: prescriptionsError.message },
    { status: 500 }
  );
}

    const employeeMap = Object.fromEntries(
      (employees || []).map((e) => [
        String(e.id),
        {
          name: e.full_name || "Çalışan",
          companyId: e.firm_id || "",
          jobTitle: e.job_title || "",
        },
      ])
    );

    const companyIds = Array.from(
      new Set(
        [
          ...(employees || []).map((e) => String(e.firm_id || "")),
          ...(exams || []).map((x) => String(x.company_id || "")),
        ].filter(Boolean)
      )
    );

    let companyMap: Record<string, string> = {};

    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      companyMap = Object.fromEntries(
        (companies || []).map((c) => [
          String(c.id),
          String(c.name || "Firma Yok"),
        ])
      );
    }

    const todayExams = (exams || []).filter(
      (e) => e.exam_date === todayStr
    ).length;

    const upcomingRaw = (exams || []).filter(
      (e) =>
        e.next_exam_date &&
        e.next_exam_date >= todayStr &&
        e.next_exam_date <= next30Str
    );

const criticalUpcoming = (exams || []).filter(
  (e) =>
    e.next_exam_date &&
    e.next_exam_date >= todayStr &&
    e.next_exam_date <= nextCriticalStr
);

    const overdueRaw = (exams || []).filter(
      (e) => e.next_exam_date && e.next_exam_date < todayStr
    );

    const criticalRaw = (exams || []).filter((e) => {
      const bmi = Number(e.bmi || 0);
      const sys = Number(e.systolic || 0);
      const dia = Number(e.diastolic || 0);
      const spo2 = Number(e.spo2 || 0);

      return (
        e.decision === "Uygun Değil" ||
        e.decision === "Kısıtlı Uygun" ||
        bmi >= 30 ||
        sys >= 140 ||
        dia >= 90 ||
        (spo2 > 0 && spo2 < 92)
      );
    });

    const upcomingExams = upcomingRaw.slice(0, 10).map((e) => {
      const emp = employeeMap[String(e.employee_id)] || {
        name: "Çalışan",
        companyId: e.company_id || "",
      };

      return {
     id: e.id,
     employeeName: emp.name,
     companyName: companyMap[String(e.company_id || emp.companyId)] || "Firma Yok",
     examType: e.exam_type,
     dueDate: e.next_exam_date,
     decision: e.decision,
     jobTitle: emp.jobTitle || "",
     daysLeft: diffDays(e.next_exam_date),
};

    });

    const recentExaminations = [...(exams || [])]
  .sort(
    (a, b) =>
      new Date(b.exam_date).getTime() -
      new Date(a.exam_date).getTime()
  )
  .slice(0, 10)
  .map((e) => {
    const emp = employeeMap[String(e.employee_id)] || {
      name: "Çalışan",
      companyId: e.company_id || "",
      jobTitle: "",
    };

    return {
      id: e.id,
      employeeName: emp.name,
      companyName:
        companyMap[String(e.company_id || emp.companyId)] || "Firma Yok",
      examDate: e.exam_date,
      decision: e.decision,
      examType: e.exam_type,
      jobTitle: emp.jobTitle,
    };
  });
    
const recentPrescriptions = (prescriptions || [])
  .slice(0, 10)
  .map((p: any) => {
    const emp = employeeMap[String(p.employee_id)] || {
      name: "Çalışan",
      companyId: p.company_id || "",
    };

    return {
      id: p.id,
      employeeName: emp.name,
      companyName:
        companyMap[String(p.company_id || emp.companyId)] || "Firma Yok",
      medicineCount: p.health_prescription_items?.length || 0,
      createdAt: p.created_at,
    };
  });

    const alerts = [
      ...overdueRaw.slice(0, 5).map((e) => {
        const emp = employeeMap[String(e.employee_id)] || { name: "Çalışan" };

        return {
          id: `overdue-${e.id}`,
          level: "Kritik",
          title: "Muayene süresi geçmiş",
          desc: `${emp.name} için planlanan muayene tarihi geçti: ${e.next_exam_date}`,
        };
      }),
      ...criticalRaw.slice(0, 5).map((e) => {
        const emp = employeeMap[String(e.employee_id)] || { name: "Çalışan" };

        return {
          id: `critical-${e.id}`,
          level: "Uyarı",
          title: "Sağlık uyarısı",
          desc: `${emp.name} için karar/bulgular takip gerektiriyor. Karar: ${
            e.decision || "Normal"
          }`,
        };
      }),
    ];

    return NextResponse.json({
      success: true,

      summary: {
        todayExams,
        upcomingExams: upcomingRaw.length,
        criticalUpcomingExams: criticalUpcoming.length,
        overdueExams: overdueRaw.length,
        todayPrescriptions: (prescriptions || []).filter(
  (p: any) => p.created_at?.slice(0, 10) === todayStr
).length,
        openAccidents: 0,
        upcomingVaccines: 0,
        criticalAlerts: alerts.length,
        riskyEmployees: criticalRaw.length,
      },

      upcomingExams,

recentExaminations,

recentPrescriptions,

recentEk2: [],

      alerts:
        alerts.length > 0
          ? alerts
          : [
              {
                id: "health-ok",
                level: "Bilgi",
                title: "Sağlık kayıtları izleniyor",
                desc: "Muayene verileri dashboard'a başarıyla bağlandı.",
              },
            ],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Health dashboard could not be loaded." },
      { status: 500 }
    );
  }
}