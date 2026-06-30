 import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type EmployeeLikeRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  identity_number?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  company_id?: string | null;
  firm_id?: string | null;
  job_title?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  start_date?: string | null;
  startDate?: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

type ExaminationRow = {
  id: string;
  employee_id: string;
  company_id: string;
  exam_date: string | null;
  exam_type?: string | null;
  next_exam_date: string | null;
  decision: string | null;
  is_deleted?: boolean | null;
};

function normalizeEmployee(
  u: EmployeeLikeRow,
  companyMap: Record<string, string>,
 examMap: Record<
  string,
  {
    examination_count: number;
    last_examination_date: string;
    last_examination_decision: string;
    next_examination_date: string;

    ek2_count: number;
    last_ek2_date: string;
    last_ek2_status: string;
  }
>
) {
  const companyId = String(u.company_id || u.firm_id || "").trim();
  const employeeId = String(u.id).trim();

  const examInfo =
  examMap[employeeId] || {
    examination_count: 0,
    last_examination_date: "",
    last_examination_decision: "",
    next_examination_date: "",

    ek2_count: 0,
    last_ek2_date: "",
    last_ek2_status: "",
  };

  return {
    id: employeeId,
    full_name: String(u.full_name || "Çalışan").trim(),
    email: String(u.email || "").trim(),
    phone: String((u as any).phone || (u as any).gsm || "").trim(),
    identity_number: String((u as any).identity_number || (u as any).tc_no || (u as any).tckn || "").trim(),
    birth_date: String((u as any).birth_date || (u as any).date_of_birth || "").trim(),
    gender: String((u as any).gender || (u as any).cinsiyet || "").trim(),
    blood_group: String((u as any).blood_group || (u as any).bloodGroup || "").trim(),
    department: String((u as any).department || (u as any).department_name || "").trim(),
    company_id: companyId,
    firm_id: companyId,
    company_name: companyMap[companyId] || "Firma Yok",
    job_title: String(u.job_title || u.jobTitle || "").trim(),
    start_date: String(u.start_date || u.startDate || "").trim(),

    examination_count: examInfo.examination_count,
    last_examination_date: examInfo.last_examination_date,
    last_examination_decision: examInfo.last_examination_decision,
    next_examination_date: examInfo.next_examination_date,
    ek2_count: examInfo.ek2_count,
last_ek2_date: examInfo.last_ek2_date,
last_ek2_status: examInfo.last_ek2_status,
last_ek2: examInfo.last_ek2_date || "-",
  };
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

    if (adminRole === "company_admin" && !companyIdFromCookie) {
      return NextResponse.json(
        { error: "Firma bilgisi bulunamadı." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    let rows: EmployeeLikeRow[] = [];

    let usersQuery = supabase
      .from("users")
      .select("*")
      .order("full_name", { ascending: true })
      .limit(200);

    if (adminRole === "company_admin") {
      usersQuery = usersQuery.eq("company_id", companyIdFromCookie);
    }

    const { data: users } = await usersQuery.returns<EmployeeLikeRow[]>();

    if (users && users.length > 0) {
      rows = users;
    } else {
      let employeesQuery = supabase
        .from("employees")
       .select("*")
        .order("full_name", { ascending: true })
        .limit(200);

      if (adminRole === "company_admin") {
        employeesQuery = employeesQuery.eq("firm_id", companyIdFromCookie);
      }

      const { data: employees, error: employeesError } =
        await employeesQuery.returns<EmployeeLikeRow[]>();

      if (employeesError) {
        return NextResponse.json(
          {
            error: "Çalışanlar alınamadı.",
            detail: employeesError.message,
          },
          { status: 500 }
        );
      }

      rows = employees || [];
    }

    const companyIds = Array.from(
      new Set(
        rows
          .map((u) => String(u.company_id || u.firm_id || "").trim())
          .filter(Boolean)
      )
    );

    const employeeIds = rows.map((u) => String(u.id).trim()).filter(Boolean);

    let companyMap: Record<string, string> = {};

    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds)
        .returns<CompanyRow[]>();

      if (companiesError) {
        return NextResponse.json(
          {
            error: "Firma bilgileri alınamadı.",
            detail: companiesError.message,
          },
          { status: 500 }
        );
      }

      companyMap = Object.fromEntries(
        (companies || []).map((c) => [
          String(c.id || "").trim(),
          String(c.name || "Firma Yok").trim() || "Firma Yok",
        ])
      );
    }

    let examMap: Record<
  string,
  {
    examination_count: number;
    last_examination_date: string;
    last_examination_decision: string;
    next_examination_date: string;

    ek2_count: number;
    last_ek2_date: string;
    last_ek2_status: string;
  }
> = {};

    if (employeeIds.length > 0) {
      const { data: examinations, error: examinationsError } = await supabase
        .from("health_examinations")
        .select(
          "id, employee_id, company_id, exam_date, next_exam_date, decision, exam_type, is_deleted"
        )
        .in("employee_id", employeeIds)
        .eq("is_deleted", false)
        .order("exam_date", { ascending: false })
        .returns<ExaminationRow[]>();

      if (examinationsError) {
        return NextResponse.json(
          {
            error: "Muayene özetleri alınamadı.",
            detail: examinationsError.message,
          },
          { status: 500 }
        );
      }

      for (const exam of examinations || []) {
  const employeeId = String(exam.employee_id || "").trim();
  if (!employeeId) continue;

  if (!examMap[employeeId]) {
    examMap[employeeId] = {
      examination_count: 0,
      last_examination_date: "",
      last_examination_decision: "",
      next_examination_date: "",

      ek2_count: 0,
      last_ek2_date: "",
      last_ek2_status: "",
    };
  }

  const examTypeRaw = String(exam.exam_type || "").trim();
const examType = examTypeRaw.toUpperCase();

const isEk2 =
  examType === "EK2_ISE_GIRIS" ||
  examType === "EK2_PERIYODIK" ||
  examTypeRaw === "İşe Giriş" ||
  examTypeRaw === "Periyodik";

  if (isEk2) {
    examMap[employeeId].ek2_count += 1;

    if (!examMap[employeeId].last_ek2_date && exam.exam_date) {
      examMap[employeeId].last_ek2_date = exam.exam_date;
      examMap[employeeId].last_ek2_status = exam.decision || "";
    }

    continue;
  }

  examMap[employeeId].examination_count += 1;

  if (!examMap[employeeId].last_examination_date && exam.exam_date) {
    examMap[employeeId].last_examination_date = exam.exam_date;
    examMap[employeeId].last_examination_decision = exam.decision || "";
  }

  if (!examMap[employeeId].next_examination_date && exam.next_exam_date) {
    examMap[employeeId].next_examination_date = exam.next_exam_date;
  }
}
    }
    const employees = rows.map((u) => normalizeEmployee(u, companyMap, examMap));

    return NextResponse.json({
      success: true,
      employees,
      source: users && users.length > 0 ? "users" : "employees",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message || "Health employees could not be loaded.",
      },
      { status: 500 }
    );
  }
}