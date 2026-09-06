import type { AgendaResponse, AgendaTask, CompaniesResponse, CreateAgendaRequest, EmployeesResponse } from "./types";
async function parseJson<T>(response: Response): Promise<T> { const json = await response.json().catch(() => ({})); if (!response.ok) throw new Error(typeof json?.error === "string" ? json.error : "Sunucu hatası oluştu."); return json as T; }
export async function getAgenda(webFirmId: string): Promise<AgendaResponse> {
 if (!webFirmId) return { success: true, records: [] };
 const q = new URLSearchParams({ firmId: webFirmId });
 const [manual, sources] = await Promise.all([
  parseJson<AgendaResponse>(await fetch(`/api/admin/agenda?${q}`, { credentials:"include", cache:"no-store" })),
  parseJson<AgendaResponse>(await fetch(`/api/admin/agenda/sources?${q}`, { credentials:"include", cache:"no-store" })).catch(() => ({success:true,records:[]} as AgendaResponse))
 ]);
 const records: AgendaTask[] = [...(manual.records ?? []), ...(sources.records ?? [])];
 return { success:true, firmId:webFirmId, records, count:records.length };
}
export async function getCompanies(): Promise<CompaniesResponse> { return parseJson(await fetch("/api/admin/companies", { credentials:"include", cache:"no-store" })); }
export async function getEmployees(webFirmId: string): Promise<EmployeesResponse> { const q = new URLSearchParams({ firmId:webFirmId }); return parseJson(await fetch(`/api/admin/employees?${q}`, { credentials:"include", cache:"no-store" })); }
export async function createAgenda(payload: CreateAgendaRequest) { return parseJson<{success:boolean}>(await fetch("/api/admin/agenda", { method:"POST", credentials:"include", cache:"no-store", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) })); }
export async function patchAgenda(id: string, webFirmId: string, payload: Record<string, unknown>) { const q=new URLSearchParams({firmId:webFirmId}); return parseJson<{success:boolean}>(await fetch(`/api/admin/agenda/${id}?${q}`, { method:"PATCH", credentials:"include", cache:"no-store", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) })); }
export async function removeAgenda(id: string, webFirmId: string) { const q=new URLSearchParams({firmId:webFirmId}); return parseJson<{success:boolean}>(await fetch(`/api/admin/agenda/${id}?${q}`, { method:"DELETE", credentials:"include", cache:"no-store" })); }
