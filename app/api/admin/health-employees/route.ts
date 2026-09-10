 import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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
    prescription_count: number;
last_prescription_date: string;
last_prescription_status: string;
    accident_count: number;
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
    prescription_count: 0,
last_prescription_date: "",
last_prescription_status: "",
    accident_count: 0,
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
prescription_count: examInfo.prescription_count,
last_prescription_date: examInfo.last_prescription_date,
last_prescription_status: examInfo.last_prescription_status,
last_prescription: examInfo.last_prescription_date || "-",
    accident_count: examInfo.accident_count || 0,
    health_status: (() => {
      const today = new Date().toISOString().slice(0,10);
      const due = examInfo.next_examination_date || "";
      const decision = String(examInfo.last_examination_decision || "").toLocaleUpperCase("tr-TR");
      if ((due && due < today) || decision.includes("UYGUN DEĞİL")) return "CRITICAL";
      if (!examInfo.examination_count || !examInfo.ek2_count) return "MISSING";
      if (decision.includes("KISITLI")) return "WARNING";
      return "NORMAL";
    })(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" ||
      adminRole === "admin" ||
      adminRole === "company_admin" ||
      adminRole === "demo_user" ||
      !adminRole;

    if (adminAuth !== "ok" && adminRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    if (!isAllowedRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const scopedRole = adminRole === "company_admin" || adminRole === "demo_user";
    if (scopedRole && !companyIdFromCookie) {
      return NextResponse.json(
        { error: "Firma bilgisi bulunamadı." },
        { status: 403 }
      );
    }

    const requestedCompanyId = String(req.nextUrl.searchParams.get("companyId") || "").trim();
    if (
      scopedRole &&
      requestedCompanyId &&
      requestedCompanyId !== "ALL" &&
      requestedCompanyId !== companyIdFromCookie
    ) {
      return NextResponse.json({ error: "Bu firma için erişim yetkiniz yok." }, { status: 403 });
    }

    const selectedCompanyId = scopedRole
      ? companyIdFromCookie
      : requestedCompanyId && requestedCompanyId !== "ALL"
        ? requestedCompanyId
        : "";

    const supabase = getSupabase();

    let rows: EmployeeLikeRow[] = [];

    let employeesQuery = supabase
  .from("employees")
  .select("*")
  .order("full_name", { ascending: true })
  .limit(10000);

if (selectedCompanyId) {
  employeesQuery = employeesQuery.eq("firm_id", selectedCompanyId);
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
    prescription_count: number;
last_prescription_date: string;
last_prescription_status: string;
    accident_count: number;
  }
> = {};

    let examinationRows: ExaminationRow[] = [];
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

      examinationRows = examinations || [];

      for (const exam of examinationRows) {
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
      prescription_count: 0,
last_prescription_date: "",
last_prescription_status: "",
      accident_count: 0,
    };
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

// EK-2 kapsamı: gerçek form tablosu + eski EK2_* muayene kayıtları.
if (employeeIds.length > 0) {
  let ek2Query = supabase
    .from("health_ek2_forms")
    .select("id,employee_id,company_id,examination_id,status,decision,exam_date,next_exam_date,is_active,created_at")
    .in("employee_id", employeeIds)
    .order("exam_date", { ascending: false });

  if (selectedCompanyId) ek2Query = ek2Query.eq("company_id", selectedCompanyId);

  const { data: ek2Forms, error: ek2Error } = await ek2Query;
  if (ek2Error) {
    return NextResponse.json(
      { error:"EK-2 özetleri alınamadı.", detail:ek2Error.message },
      { status:500 }
    );
  }

  const activeForms=(ek2Forms||[]).filter((form:any)=>form.is_active!==false);
  const formExamIds=new Set(activeForms.map((form:any)=>String(form.examination_id||"").trim()).filter(Boolean));
  const employeeHasForm=new Set<string>();

  for (const form of activeForms) {
    const employeeId = String(form.employee_id || "").trim();
    if (!employeeId) continue;
    employeeHasForm.add(employeeId);

    if (!examMap[employeeId]) {
      examMap[employeeId] = {
        examination_count:0,last_examination_date:"",last_examination_decision:"",next_examination_date:"",
        ek2_count:0,last_ek2_date:"",last_ek2_status:"",
        prescription_count:0,last_prescription_date:"",last_prescription_status:"",
        accident_count:0
      };
    }

    examMap[employeeId].ek2_count += 1;
    if (!examMap[employeeId].last_ek2_date) {
      examMap[employeeId].last_ek2_date = form.exam_date || form.created_at || "";
      examMap[employeeId].last_ek2_status = form.decision || form.status || "";
    }
  }

  // Eski kayıtların bir kısmında health_ek2_forms satırı oluşmadan
  // health_examinations.exam_type = EK2_* olarak kaydedilmiş. Bunları kaybetme.
  for (const exam of examinationRows) {
    const examType=String(exam.exam_type||"").trim().toLocaleUpperCase("tr-TR");
    const isEk2=examType.startsWith("EK2_")||examType.includes("EK-2")||examType.includes("EK 2");
    if(!isEk2 || formExamIds.has(String(exam.id||"").trim())) continue;

    const employeeId=String(exam.employee_id||"").trim();
    if(!employeeId) continue;

    if (!examMap[employeeId]) {
      examMap[employeeId] = {
        examination_count:0,last_examination_date:"",last_examination_decision:"",next_examination_date:"",
        ek2_count:0,last_ek2_date:"",last_ek2_status:"",
        prescription_count:0,last_prescription_date:"",last_prescription_status:"",
        accident_count:0
      };
    }

    examMap[employeeId].ek2_count += 1;
    if (!examMap[employeeId].last_ek2_date) {
      examMap[employeeId].last_ek2_date = exam.exam_date || "";
      examMap[employeeId].last_ek2_status = exam.decision || "Muayene kaydından";
    }
  }
}

let prescriptionQuery = supabase
  .from("health_prescriptions")
  .select("employee_id, company_id, created_at, status")
  .in("employee_id", employeeIds)
  .eq("is_active", true)
  .order("created_at", { ascending: false });

if (selectedCompanyId) prescriptionQuery = prescriptionQuery.eq("company_id", selectedCompanyId);

const { data: prescriptions, error: prescriptionError } = await prescriptionQuery;

if (prescriptionError) {
  return NextResponse.json(
    {
      error: "Reçete özetleri alınamadı.",
      detail: prescriptionError.message,
    },
    { status: 500 }
  );
}

for (const prescription of prescriptions || []) {
  const employeeId = String(prescription.employee_id || "").trim();
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

      prescription_count: 0,
      last_prescription_date: "",
      last_prescription_status: "",
      accident_count: 0,
    };
  }

  examMap[employeeId].prescription_count++;

  if (!examMap[employeeId].last_prescription_date) {
    examMap[employeeId].last_prescription_date =
      prescription.created_at || "";

    examMap[employeeId].last_prescription_status =
      prescription.status || "";
  }
}


    // İş kazası özeti: isim eşleşmesi yerine kanonik web_employee_id kullanılır.
    // Bu, aynı isimli çalışanlar ve geçmiş mobil kayıtlar nedeniyle oluşabilecek yanlış eşleşmeleri azaltır.
    if (employeeIds.length > 0) {
      let accidentQuery = supabase
        .from("accident_records")
        .select("id,web_employee_id,web_firm_id,is_deleted")
        .in("web_employee_id", employeeIds)
        .or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0");

      if (selectedCompanyId) {
        accidentQuery = accidentQuery.eq("web_firm_id", selectedCompanyId);
      }

      const { data: accidentRows, error: accidentError } = await accidentQuery;

      if (accidentError) {
        return NextResponse.json(
          { error:"Çalışan iş kazası özetleri alınamadı.", detail:accidentError.message },
          { status:500 }
        );
      }

      for (const accident of accidentRows || []) {
        const employeeId=String(accident.web_employee_id||"").trim();
        if(!employeeId) continue;
        if(!examMap[employeeId]){
          examMap[employeeId]={
            examination_count:0,last_examination_date:"",last_examination_decision:"",next_examination_date:"",
            ek2_count:0,last_ek2_date:"",last_ek2_status:"",
            prescription_count:0,last_prescription_date:"",last_prescription_status:"",
            accident_count:0
          };
        }
        examMap[employeeId].accident_count += 1;
      }
    }

    const normalizedEmployees = rows.map((u) =>
  normalizeEmployee(u, companyMap, examMap)
);

    return NextResponse.json({
      success: true,
      employees: normalizedEmployees,
      source: "employees",
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
