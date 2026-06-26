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
  name?: string | null;
  email?: string | null;
  company_id?: string | null;
  firm_id?: string | null;
  job_title?: string | null;
  jobTitle?: string | null;
  start_date?: string | null;
  startDate?: string | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

function normalizeEmployee(u: EmployeeLikeRow, companyMap: Record<string, string>) {
  const companyId = String(u.company_id || u.firm_id || "").trim();

  return {
    id: String(u.id),
    full_name: String(u.full_name || u.name || "Çalışan").trim(),
    email: String(u.email || "").trim(),
    company_id: companyId,
    company_name: companyMap[companyId] || "Firma Yok",
    job_title: String(u.job_title || u.jobTitle || "").trim(),
    start_date: String(u.start_date || u.startDate || "").trim(),
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
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
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
      .select("id, full_name, email, company_id, job_title, start_date")
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
        .select("id, full_name, name, email, company_id, firm_id, job_title, start_date")
        .limit(200);

      if (adminRole === "company_admin") {
        employeesQuery = employeesQuery.or(
          `company_id.eq.${companyIdFromCookie},firm_id.eq.${companyIdFromCookie}`
        );
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

    const employees = rows.map((u) => normalizeEmployee(u, companyMap));

    return NextResponse.json({
  success: true,
  employees,
  source: users && users.length > 0 ? "users" : "employees",
  debug: {
    adminRole,
    companyIdFromCookie,
    rowsCount: rows.length,
    usersCount: users?.length ?? 0,
    employeesCount: employees.length,
    firstRow: rows[0] ?? null,
  },
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