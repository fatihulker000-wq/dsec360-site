import { cookies } from "next/headers";

export async function assertInspectionRunScope(supabase: any, remoteId: number) {
  const cookieStore = await cookies();
  const role = String(
    cookieStore.get("dsec_user_role")?.value ||
      cookieStore.get("dsec_admin_role")?.value ||
      ""
  ).trim();
  const sessionCompanyId = String(cookieStore.get("dsec_company_id")?.value || "").trim();

  const { data: run, error: runError } = await supabase
    .from("denetim_runs")
    .select("id, firm_id, firm_name")
    .eq("id", remoteId)
    .maybeSingle();

  if (runError) throw runError;
  if (!run) return { ok: false as const, status: 404, error: "Denetim bulunamadı." };

  if (role === "super_admin") return { ok: true as const, run };

  if (!sessionCompanyId) {
    return { ok: false as const, status: 401, error: "Firma oturumu bulunamadı." };
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, local_firm_id")
    .eq("id", sessionCompanyId)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!company) return { ok: false as const, status: 403, error: "Firma erişimi doğrulanamadı." };

  const allowedKeys = new Set([
    String(company.id || "").trim(),
    String(company.local_firm_id ?? "").trim(),
  ].filter(Boolean));

  const runFirmKey = String(run.firm_id || "").trim();
  if (!allowedKeys.has(runFirmKey)) {
    return { ok: false as const, status: 403, error: "Bu denetim seçili firmaya ait değil." };
  }

  return { ok: true as const, run };
}
