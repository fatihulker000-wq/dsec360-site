import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   TYPES
============================================================ */

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type MatrixRiskRow = {
  id: string;
  sync_key: string;

  company_id: string | null;
  local_firm_id: number | null;

  title: string;
  hazard: string;
  consequence: string | null;
  control: string |null;

  probability:number;
  severity:number;
  score:number;

  department:string|null;
  location:string|null;
  machine:string|null;
  responsible:string|null;

  dof_status:"OPEN"|"CLOSED";
  dof_action:string;
  dof_responsible:string;
  dof_due_date_millis:number|null;
  dof_closed_at_millis:number|null;
  dof_note:string;

  source:"APP"|"WEB"|"MERGED"|"SYSTEM";

  sync_status:"PENDING"|"SYNCING"|"SYNCED"|"FAILED";
  sync_error:string|null;
  last_synced_at:string|null;

  is_deleted:boolean;
  deleted_at:string|null;

  created_at:string;
  updated_at:string;
};

type FineKinneyRiskRow = {

  id:string;
  sync_key:string;

  company_id:string|null;
  local_firm_id:number|null;

  title:string;
  hazard:string;

  consequence:string|null;
  control:string|null;

  probability_value:number;
  frequency_value:number;
  severity_value:number;

  score:number;

  level:string;
  action:string;

  department:string|null;
  location:string|null;
  machine:string|null;
  responsible:string|null;

  dof_status:"OPEN"|"CLOSED";
  dof_action:string;
  dof_responsible:string;
  dof_due_date_millis:number|null;
  dof_closed_at_millis:number|null;
  dof_note:string;

  source:"APP"|"WEB"|"MERGED"|"SYSTEM";

  sync_status:"PENDING"|"SYNCING"|"SYNCED"|"FAILED";
  sync_error:string|null;
  last_synced_at:string|null;

  is_deleted:boolean;
  deleted_at:string|null;

  created_at:string;
  updated_at:string;

};

type CompanyRow={
    id:string;
    name:string|null;
};

type RiskWritePayload={

    id?:string;

    method?:"MATRIX"|"FINE_KINNEY";

    companyId?:string;

    localFirmId?:number|null;

    syncKey?:string;

    title?:string;

    hazard?:string;

    consequence?:string|null;

    control?:string|null;

    probability?:number|null;

    severity?:number|null;

    probabilityValue?:number|null;

    frequencyValue?:number|null;

    severityValue?:number|null;

    level?:string|null;

    action?:string|null;

    department?:string|null;

    location?:string|null;

    machine?:string|null;

    responsible?:string|null;

    dofStatus?:"OPEN"|"CLOSED";

    dofAction?:string|null;

    dofResponsible?:string|null;

    dofDueDate?:string|null;

    dofClosedDate?:string|null;

    dofNote?:string|null;

};

/* ============================================================
   HELPERS
============================================================ */

function getSupabase(){

    const url=process.env.SUPABASE_URL;

    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(!url || !key){

        throw new Error("Supabase ENV bulunamadı.");

    }

    return createClient(url,key,{

        auth:{

            persistSession:false,

            autoRefreshToken:false

        }

    });

}

function normalizeCompanyKey(value?:string|null){

    return String(value||"")

        .trim()

        .toLocaleLowerCase("tr-TR")

        .replace(/\s+/g," ");

}

function matrixLevel(score:number):RiskLevel{

    if(score>=20)return"CRITICAL";

    if(score>=15)return"HIGH";

    if(score>=8)return"MEDIUM";

    return"LOW";

}

function fineKinneyLevel(score:number):RiskLevel{

    if(score>=400)return"CRITICAL";

    if(score>=200)return"HIGH";

    if(score>=70)return"MEDIUM";

    return"LOW";

}

function levelLabel(level:RiskLevel){

    switch(level){

        case"CRITICAL":return"Kritik";

        case"HIGH":return"Yüksek";

        case"MEDIUM":return"Orta";

        default:return"Düşük";

    }

}

function millisToIso(value?:number|null){

    if(!value)return null;

    const d=new Date(value);

    if(Number.isNaN(d.getTime()))return null;

    return d.toISOString();

}

function isoToMillis(value?:string|null){

    if(!value)return null;

    const t=new Date(value).getTime();

    if(Number.isNaN(t))return null;

    return t;

}

function cleanText(value?:string|null){

    const txt=String(value||"").trim();

    return txt.length?txt:null;

}
/* ============================================================
   ADMIN CONTEXT
============================================================ */

async function getAdminContext() {

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
            (
                adminRole === "super_admin" ||
                adminRole === "company_admin" ||
                adminRole === "demo_user"
            ),

        adminRole,

        companyId,

        companyScoped:
            adminRole === "company_admin" ||
            adminRole === "demo_user",

        readOnly:
            adminRole === "demo_user"

    };

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
                    message: "Yetkisiz erişim."
                },
                {
                    status: 401
                }
            );

        }

        const url = new URL(request.url);

        const firm =
            String(
                url.searchParams.get("firm") || ""
            ).trim();

        const supabase = getSupabase();

        let companiesQuery = supabase
            .from("companies")
            .select("id,name")
            .order("name");

        if (ctx.companyScoped) {

            companiesQuery =
                companiesQuery.eq(
                    "id",
                    ctx.companyId
                );

        }

        const {

            data: companies,
            error: companyError

        } =
            await companiesQuery
                .returns<CompanyRow[]>();

        if (companyError) {

            return NextResponse.json(
                {
                    success: false,
                    message: companyError.message
                },
                {
                    status: 500
                }
            );

        }

        const companyMap =
            Object.fromEntries(

                (companies || []).map(c => [

                    c.id,

                    c.name || "Firma"

                ])

            );

        let selectedCompany = "";

        if (ctx.companyScoped) {

            selectedCompany = ctx.companyId;

        }

        else if (firm) {

            selectedCompany =
                (companies || []).find(c =>

                    c.id === firm ||

                    normalizeCompanyKey(c.name) ===
                    normalizeCompanyKey(firm)

                )?.id || "";

        }

        let matrixQuery =
            supabase
                .from("risk_items")
                .select("*")
                .eq("is_deleted", false)
                .order("score", {
                    ascending: false
                });

        let fineQuery =
            supabase
                .from("fine_kinney_risks")
                .select("*")
                .eq("is_deleted", false)
                .order("score", {
                    ascending: false
                });

        if (selectedCompany) {

            matrixQuery =
                matrixQuery.eq(
                    "company_id",
                    selectedCompany
                );

            fineQuery =
                fineQuery.eq(
                    "company_id",
                    selectedCompany
                );

        }

        const [

            matrixResult,

            fineResult

        ] = await Promise.all([

            matrixQuery.returns<MatrixRiskRow[]>(),

            fineQuery.returns<FineKinneyRiskRow[]>()

        ]);

        if (matrixResult.error) {

            return NextResponse.json(
                {
                    success: false,
                    message: matrixResult.error.message
                },
                {
                    status: 500
                }
            );

        }

        if (fineResult.error) {

            return NextResponse.json(
                {
                    success: false,
                    message: fineResult.error.message
                },
                {
                    status: 500
                }
            );

        }

        const matrixRows =
            matrixResult.data || [];

        const fineRows =
            fineResult.data || [];
                    const matrixRecords = matrixRows.map((row) => {
            const level = matrixLevel(Number(row.score || 0));
            const companyId = String(row.company_id || "").trim();

            return {
                id: row.id,
                method: "MATRIX",

                title: row.title,
                hazard: row.hazard,
                consequence: row.consequence,
                control: row.control,

                company: companyMap[companyId] || "Firma",

                probability: row.probability,
                severity: row.severity,

                score: Number(row.score || 0),

                level,
                levelLabel: levelLabel(level),

                department: row.department,
                location: row.location,
                machine: row.machine,
                responsible: row.responsible,

                dofStatus: row.dof_status,
                dofAction: row.dof_action,
                dofResponsible: row.dof_responsible,
                dofDueDate: millisToIso(row.dof_due_date_millis),
                dofClosedDate: millisToIso(row.dof_closed_at_millis),
                dofNote: row.dof_note,

                source: row.source,
                syncStatus: row.sync_status,

                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        });

        const fineRecords = fineRows.map((row) => {

            const level = fineKinneyLevel(Number(row.score || 0));

            const companyId = String(row.company_id || "").trim();

            return {

                id: row.id,

                method: "FINE_KINNEY",

                title: row.title,

                hazard: row.hazard,

                consequence: row.consequence,

                control: row.control,

                company: companyMap[companyId] || "Firma",

                probabilityValue: row.probability_value,

                frequencyValue: row.frequency_value,

                severityValue: row.severity_value,

                score: Number(row.score || 0),

                level,

                levelLabel: row.level || levelLabel(level),

                action: row.action,

                department: row.department,

                location: row.location,

                machine: row.machine,

                responsible: row.responsible,

                dofStatus: row.dof_status,

                dofAction: row.dof_action,

                dofResponsible: row.dof_responsible,

                dofDueDate: millisToIso(row.dof_due_date_millis),

                dofClosedDate: millisToIso(row.dof_closed_at_millis),

                dofNote: row.dof_note,

                source: row.source,

                syncStatus: row.sync_status,

                createdAt: row.created_at,

                updatedAt: row.updated_at

            };

        });

        const records =

            [...matrixRecords, ...fineRecords]

                .sort((a, b) => {

                    if (b.score !== a.score) {

                        return b.score - a.score;

                    }

                    return (
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                    );

                });

        const summary = {

            total: records.length,

            critical:
                records.filter(r => r.level === "CRITICAL").length,

            high:
                records.filter(r => r.level === "HIGH").length,

            medium:
                records.filter(r => r.level === "MEDIUM").length,

            low:
                records.filter(r => r.level === "LOW").length,

            openDof:
                records.filter(r => r.dofStatus === "OPEN").length,

            closedDof:
                records.filter(r => r.dofStatus === "CLOSED").length,

            matrixCount:
                matrixRecords.length,

            fineKinneyCount:
                fineRecords.length

        };

        const riskScore = Math.max(

            0,

            100 -

            (

                summary.critical * 18 +

                summary.high * 9 +

                summary.medium * 4

            )

        );

        return NextResponse.json({

            success: true,

            records,

            companies:

                Object.values(companyMap)

                    .sort(),

            summary: {

                ...summary,

                riskScore

            }

        });

    }

    catch (e) {

        console.error(e);

        return NextResponse.json(

            {

                success: false,

                message: "Risk verileri okunamadı.",

                detail:

                    e instanceof Error

                        ? e.message

                        : String(e)

            },

            {

                status: 500

            }

        );

    }

}

/* ============================================================
   VALIDATION
============================================================ */

function validateRiskPayload(payload: RiskWritePayload): string {
  const title = String(payload.title || "").trim();
  const hazard = String(payload.hazard || "").trim();

  if (!title) {
    return "Risk başlığı zorunludur.";
  }

  if (!hazard) {
    return "Tehlike alanı zorunludur.";
  }

  if (payload.method === "FINE_KINNEY") {
    const probabilityValue = Number(payload.probabilityValue ?? 0);
    const frequencyValue = Number(payload.frequencyValue ?? 0);
    const severityValue = Number(payload.severityValue ?? 0);

    if (
      !Number.isFinite(probabilityValue) ||
      !Number.isFinite(frequencyValue) ||
      !Number.isFinite(severityValue)
    ) {
      return "Fine-Kinney değerleri geçersizdir.";
    }

    if (
      probabilityValue < 0 ||
      frequencyValue < 0 ||
      severityValue < 0
    ) {
      return "Fine-Kinney değerleri negatif olamaz.";
    }
  } else {
    const probability = Number(payload.probability ?? 1);
    const severity = Number(payload.severity ?? 1);

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

function fineKinneyLevelText(score: number): string {
  if (score >= 400) return "Tolerans Gösterilemez Risk";
  if (score >= 200) return "Esaslı Risk";
  if (score >= 70) return "Önemli Risk";
  if (score >= 20) return "Olası Risk";
  return "Önemsiz Risk";
}

function fineKinneyActionText(score: number): string {
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

async function resolveCompanyId(
  requestedCompany: string | undefined,
  context: Awaited<ReturnType<typeof getAdminContext>>
): Promise<string> {
  if (context.companyScoped) {
    return context.companyId;
  }

  const requested = String(requestedCompany || "").trim();

  if (!requested) {
    return "";
  }

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

  const normalizedRequested = normalizeCompanyKey(requested);

  return (
    (companies || []).find(
      (company) =>
        normalizeCompanyKey(company.name) === normalizedRequested
    )?.id || ""
  );
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
          message: "Yetkisiz erişim."
        },
        {
          status: 401
        }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message: "Demo kullanıcısı risk kaydı oluşturamaz."
        },
        {
          status: 403
        }
      );
    }

    const payload: RiskWritePayload =
      await request.json().catch(() => ({}));

    const validationError = validateRiskPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError
        },
        {
          status: 400
        }
      );
    }

    const companyId = await resolveCompanyId(
      payload.companyId,
      ctx
    );

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma seçilmelidir."
        },
        {
          status: 400
        }
      );
    }

    const supabase = getSupabase();

    const method =
      payload.method === "FINE_KINNEY"
        ? "FINE_KINNEY"
        : "MATRIX";

    const syncKey =
      String(payload.syncKey || "").trim() ||
      crypto.randomUUID();

    if (method === "FINE_KINNEY") {
      const probabilityValue =
        Number(payload.probabilityValue ?? 0);

      const frequencyValue =
        Number(payload.frequencyValue ?? 0);

      const severityValue =
        Number(payload.severityValue ?? 0);

      const score =
        probabilityValue *
        frequencyValue *
        severityValue;

      const { data, error } = await supabase
        .from("fine_kinney_risks")
        .insert({
          sync_key: syncKey,
          company_id: companyId,
          local_firm_id: payload.localFirmId ?? null,

          title: String(payload.title || "").trim(),
          hazard: String(payload.hazard || "").trim(),
          consequence: cleanText(payload.consequence),
          control: cleanText(payload.control),

          probability_value: probabilityValue,
          frequency_value: frequencyValue,
          severity_value: severityValue,

          level:
            cleanText(payload.level) ||
            fineKinneyLevelText(score),

          action:
            cleanText(payload.action) ||
            fineKinneyActionText(score),

          department: cleanText(payload.department),
          location: cleanText(payload.location),
          machine: cleanText(payload.machine),
          responsible: cleanText(payload.responsible),

          dof_status:
            payload.dofStatus === "CLOSED"
              ? "CLOSED"
              : "OPEN",

          dof_action:
            cleanText(payload.dofAction) || "",

          dof_responsible:
            cleanText(payload.dofResponsible) || "",

          dof_due_date_millis:
            isoToMillis(payload.dofDueDate),

          dof_closed_at_millis:
            payload.dofStatus === "CLOSED"
              ? (
                  isoToMillis(payload.dofClosedDate) ||
                  Date.now()
                )
              : null,

          dof_note:
            cleanText(payload.dofNote) || "",

          source: "WEB",
          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at: new Date().toISOString(),
          is_deleted: false,
          deleted_at: null
        })
        .select("id")
        .single<{ id: string }>();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Fine-Kinney kaydı oluşturulamadı.",
            detail: error.message
          },
          {
            status: 500
          }
        );
      }

      return NextResponse.json({
        success: true,
        id: data.id,
        method,
        message: "Fine-Kinney kaydı oluşturuldu."
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
        local_firm_id: payload.localFirmId ?? null,

        title: String(payload.title || "").trim(),
        hazard: String(payload.hazard || "").trim(),
        consequence: cleanText(payload.consequence),
        control: cleanText(payload.control),

        probability,
        severity,

        department: cleanText(payload.department),
        location: cleanText(payload.location),
        machine: cleanText(payload.machine),
        responsible: cleanText(payload.responsible),

        dof_status:
          payload.dofStatus === "CLOSED"
            ? "CLOSED"
            : "OPEN",

        dof_action:
          cleanText(payload.dofAction) || "",

        dof_responsible:
          cleanText(payload.dofResponsible) || "",

        dof_due_date_millis:
          isoToMillis(payload.dofDueDate),

        dof_closed_at_millis:
          payload.dofStatus === "CLOSED"
            ? (
                isoToMillis(payload.dofClosedDate) ||
                Date.now()
              )
            : null,

        dof_note:
          cleanText(payload.dofNote) || "",

        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at: new Date().toISOString(),
        is_deleted: false,
        deleted_at: null
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "5x5 risk kaydı oluşturulamadı.",
          detail: error.message
        },
        {
          status: 500
        }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      method,
      message: "5x5 risk kaydı oluşturuldu."
    });
  } catch (error) {
    console.error("risk create error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı oluşturulurken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status: 500
      }
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
          message: "Yetkisiz erişim."
        },
        {
          status: 401
        }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message: "Demo kullanıcısı risk kaydı düzenleyemez."
        },
        {
          status: 403
        }
      );
    }

    const payload: RiskWritePayload =
      await request.json().catch(() => ({}));

    const id = String(payload.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur."
        },
        {
          status: 400
        }
      );
    }

    const validationError = validateRiskPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError
        },
        {
          status: 400
        }
      );
    }

    const supabase = getSupabase();

    const method =
      payload.method === "FINE_KINNEY"
        ? "FINE_KINNEY"
        : "MATRIX";

    if (method === "FINE_KINNEY") {
      const probabilityValue =
        Number(payload.probabilityValue ?? 0);

      const frequencyValue =
        Number(payload.frequencyValue ?? 0);

      const severityValue =
        Number(payload.severityValue ?? 0);

      const score =
        probabilityValue *
        frequencyValue *
        severityValue;

      let updateQuery = supabase
        .from("fine_kinney_risks")
        .update({
          title: String(payload.title || "").trim(),
          hazard: String(payload.hazard || "").trim(),
          consequence: cleanText(payload.consequence),
          control: cleanText(payload.control),

          probability_value: probabilityValue,
          frequency_value: frequencyValue,
          severity_value: severityValue,

          level:
            cleanText(payload.level) ||
            fineKinneyLevelText(score),

          action:
            cleanText(payload.action) ||
            fineKinneyActionText(score),

          department: cleanText(payload.department),
          location: cleanText(payload.location),
          machine: cleanText(payload.machine),
          responsible: cleanText(payload.responsible),

          dof_status:
            payload.dofStatus === "CLOSED"
              ? "CLOSED"
              : "OPEN",

          dof_action:
            cleanText(payload.dofAction) || "",

          dof_responsible:
            cleanText(payload.dofResponsible) || "",

          dof_due_date_millis:
            isoToMillis(payload.dofDueDate),

          dof_closed_at_millis:
            payload.dofStatus === "CLOSED"
              ? (
                  isoToMillis(payload.dofClosedDate) ||
                  Date.now()
                )
              : null,

          dof_note:
            cleanText(payload.dofNote) || "",

          source: "WEB",
          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("is_deleted", false);

      if (ctx.companyScoped) {
        updateQuery =
          updateQuery.eq("company_id", ctx.companyId);
      }

      const { data, error } = await updateQuery
        .select("id")
        .maybeSingle<{ id: string }>();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Fine-Kinney kaydı güncellenemedi.",
            detail: error.message
          },
          {
            status: 500
          }
        );
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            message: "Fine-Kinney kaydı bulunamadı."
          },
          {
            status: 404
          }
        );
      }
    } else {
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

      let updateQuery = supabase
        .from("risk_items")
        .update({
          title: String(payload.title || "").trim(),
          hazard: String(payload.hazard || "").trim(),
          consequence: cleanText(payload.consequence),
          control: cleanText(payload.control),

          probability,
          severity,

          department: cleanText(payload.department),
          location: cleanText(payload.location),
          machine: cleanText(payload.machine),
          responsible: cleanText(payload.responsible),

          dof_status:
            payload.dofStatus === "CLOSED"
              ? "CLOSED"
              : "OPEN",

          dof_action:
            cleanText(payload.dofAction) || "",

          dof_responsible:
            cleanText(payload.dofResponsible) || "",

          dof_due_date_millis:
            isoToMillis(payload.dofDueDate),

          dof_closed_at_millis:
            payload.dofStatus === "CLOSED"
              ? (
                  isoToMillis(payload.dofClosedDate) ||
                  Date.now()
                )
              : null,

          dof_note:
            cleanText(payload.dofNote) || "",

          source: "WEB",
          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("is_deleted", false);

      if (ctx.companyScoped) {
        updateQuery =
          updateQuery.eq("company_id", ctx.companyId);
      }

      const { data, error } = await updateQuery
        .select("id")
        .maybeSingle<{ id: string }>();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: "5x5 risk kaydı güncellenemedi.",
            detail: error.message
          },
          {
            status: 500
          }
        );
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            message: "5x5 risk kaydı bulunamadı."
          },
          {
            status: 404
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      method,
      message: "Risk kaydı güncellendi."
    });
  } catch (error) {
    console.error("risk update error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı güncellenirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status: 500
      }
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
          message: "Yetkisiz erişim."
        },
        {
          status: 401
        }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message: "Demo kullanıcısı risk kaydı silemez."
        },
        {
          status: 403
        }
      );
    }

    const url = new URL(request.url);

    const id =
      String(url.searchParams.get("id") || "").trim();

    const method =
      String(
        url.searchParams.get("method") || "MATRIX"
      )
        .trim()
        .toUpperCase();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur."
        },
        {
          status: 400
        }
      );
    }

    const supabase = getSupabase();

    const table =
      method === "FINE_KINNEY"
        ? "fine_kinney_risks"
        : "risk_items";

    let deleteQuery = supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("is_deleted", false);

    if (ctx.companyScoped) {
      deleteQuery =
        deleteQuery.eq("company_id", ctx.companyId);
    }

    const { data, error } = await deleteQuery
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk kaydı silinemedi.",
          detail: error.message
        },
        {
          status: 500
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk kaydı bulunamadı."
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      method:
        method === "FINE_KINNEY"
          ? "FINE_KINNEY"
          : "MATRIX",
      message: "Risk kaydı silindi."
    });
  } catch (error) {
    console.error("risk delete error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kaydı silinirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error)
      },
      {
        status: 500
      }
    );
  }
}
