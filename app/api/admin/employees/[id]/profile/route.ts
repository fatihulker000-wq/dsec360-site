import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type OptionalQueryResult = {
  data: any[];
  warning?: string;
};

async function safeSelect(
  query: PromiseLike<{
    data: any[] | null;
    error: any;
  }>,
  label: string
): Promise<OptionalQueryResult> {

  try {

    const { data, error } = await query;

    if (error) {
      console.warn(`${label} sorgu hatası`, error);

      return {
        data: [],
        warning: `${label} verisi alınamadı`,
      };
    }

    return {
      data: Array.isArray(data) ? data : [],
    };

  } catch (error) {

    console.warn(`${label} sorgu hatası`, error);

    return {
      data: [],
      warning: `${label} verisi alınamadı`,
    };

  }

}

function normalizeDate(value: unknown) {
  if (!value) return undefined;

  const d = new Date(String(value));

  if (isNaN(d.getTime())) return undefined;

  return d.toISOString();
}

function mapGenericItems(rows: any[], source: string) {
  return rows.map((row, index) => ({
    id: String(row.id || `${source}-${index}`),

    title:
      row.title ||
      row.name ||
      row.training_name ||
      row.document_name ||
      row.description ||
      `${source} kaydı`,

    description:
      row.description ||
      row.notes ||
      row.result ||
      row.status_description ||
      undefined,

    status:
      row.status ||
      row.state ||
      row.result_status ||
      undefined,

    date:
      normalizeDate(
        row.date ||
          row.created_at ||
          row.updated_at ||
          row.training_date ||
          row.examination_date ||
          row.due_date
      ),

    meta:
      row.meta ||
      row.category ||
      row.type ||
      row.document_type ||
      undefined,

    source,
  }));
}

function countOpen(rows: any[]) {
  return rows.filter((row) => {
    const status = String(
      row.status ||
      row.state ||
      ""
    ).toUpperCase();

    return ![
      "COMPLETED",
      "DONE",
      "CLOSED",
      "TAMAMLANDI",
      "KAPANDI",
    ].includes(status);
  }).length;
}

function buildStatus(
  rows: any[]
):
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN" {

  if (!rows.length) return "UNKNOWN";

  const hasMissing = rows.some((r) => {
    const s = String(
      r.status ||
      r.state ||
      ""
    ).toUpperCase();

    return [
      "MISSING",
      "EXPIRED",
      "OVERDUE",
      "EKSİK",
      "SÜRESİ_DOLDU",
    ].includes(s);
  });

  if (hasMissing) return "MISSING";

  const hasExpiring = rows.some((r) => {
    const s = String(
      r.status ||
      r.state ||
      ""
    ).toUpperCase();

    return [
      "EXPIRING",
      "DUE_SOON",
      "YAKLAŞIYOR",
    ].includes(s);
  });

  if (hasExpiring) return "EXPIRING";

  return "COMPLETE";
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Çalışan bulunamadı.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Çalışan bulunamadı.",
        },
        { status: 404 }
      );
    }
        const [
      trainingResult,
      healthResult,
      ppeResult,
      riskResult,
      auditResult,
      accidentResult,
      documentResult,
      agendaResult,
      sgkResult,
      ibysResult,
    ] = await Promise.all([

      safeSelect(
        supabase
          .from("employee_trainings")
          .select("*")
          .eq("employee_id", id),
        "Eğitim"
      ),

      safeSelect(
        supabase
          .from("employee_health_records")
          .select("*")
          .eq("employee_id", id),
        "Sağlık"
      ),

      safeSelect(
        supabase
          .from("employee_ppe_assignments")
          .select("*")
          .eq("employee_id", id),
        "KKD"
      ),

      safeSelect(
        supabase
          .from("employee_risks")
          .select("*")
          .eq("employee_id", id),
        "Risk"
      ),

      safeSelect(
        supabase
          .from("employee_audits")
          .select("*")
          .eq("employee_id", id),
        "Denetim"
      ),

      safeSelect(
        supabase
          .from("accidents")
          .select("*")
          .or(
            `employee_id.eq.${id},employeeId.eq.${id}`
          ),
        "İş Kazası"
      ),

      safeSelect(
        supabase
          .from("employee_documents")
          .select("*")
          .eq("employee_id", id),
        "Belgeler"
      ),

      safeSelect(
        supabase
          .from("agenda_items")
          .select("*")
          .eq("employee_id", id),
        "Ajanda"
      ),

      safeSelect(
        supabase
          .from("employee_sgk_records")
          .select("*")
          .eq("employee_id", id),
        "SGK"
      ),

      safeSelect(
        supabase
          .from("employee_ibys_records")
          .select("*")
          .eq("employee_id", id),
        "İBYS"
      ),

    ]);

    const warnings = [

      trainingResult.warning,

      healthResult.warning,

      ppeResult.warning,

      riskResult.warning,

      auditResult.warning,

      accidentResult.warning,

      documentResult.warning,

      agendaResult.warning,

      sgkResult.warning,

      ibysResult.warning,

    ].filter(Boolean) as string[];

    const activityItems = [

      {
        id: `employee-${employee.id}`,

        title: "Çalışan oluşturuldu",

        description:
          employee.full_name,

        date:
          employee.created_at ||
          new Date().toISOString(),

        category: "EMPLOYEE",
      },

      ...trainingResult.data.map((x, i) => ({

        id: `training-${x.id || i}`,

        title:
          x.title ||
          x.training_name ||
          "Eğitim",

        description:
          x.description ||
          x.status,

        date:
          normalizeDate(
            x.training_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "TRAINING",

      })),

      ...healthResult.data.map((x, i) => ({

        id: `health-${x.id || i}`,

        title:
          x.title ||
          x.examination_type ||
          "Sağlık",

        description:
          x.result ||
          x.status,

        date:
          normalizeDate(
            x.examination_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "HEALTH",

      })),

      ...accidentResult.data.map((x, i) => ({

        id: `accident-${x.id || i}`,

        title:
          x.title ||
          x.event_type ||
          "İş Kazası",

        description:
          x.description,

        date:
          normalizeDate(
            x.event_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "ACCIDENT",

      })),

    ];
        return NextResponse.json({
      success: true,

      data: {
        employeeId: id,

        summary: {
          training_status:
            buildStatus(trainingResult.data),

          health_status:
            buildStatus(healthResult.data),

          ppe_status:
            buildStatus(ppeResult.data),

          document_status:
            buildStatus(documentResult.data),

          risk_status:
            riskResult.data.some(
              (row) =>
                Number(
                  row.score ||
                  row.risk_score ||
                  0
                ) >= 200
            )
              ? "HIGH"
              : riskResult.data.length
              ? "MEDIUM"
              : "UNKNOWN",

          training_completion_rate:
            trainingResult.data.length
              ? Math.round(
                  (
                    trainingResult.data.filter(
                      (row) =>
                        String(
                          row.status || ""
                        ).toUpperCase() ===
                        "COMPLETED"
                    ).length /
                    trainingResult.data.length
                  ) * 100
                )
              : undefined,

          ppe_completion_rate:
            ppeResult.data.length
              ? Math.round(
                  (
                    ppeResult.data.filter(
                      (row) =>
                        String(
                          row.status || ""
                        ).toUpperCase() ===
                        "COMPLETE"
                    ).length /
                    ppeResult.data.length
                  ) * 100
                )
              : undefined,

          open_risk_count:
            countOpen(riskResult.data),

          open_action_count:
            countOpen(agendaResult.data),

          accident_count:
            accidentResult.data.length,

          upcoming_count:
            agendaResult.data.length,
        },

        trainingItems:
          mapGenericItems(
            trainingResult.data,
            "TRAINING"
          ),

        healthItems:
          mapGenericItems(
            healthResult.data,
            "HEALTH"
          ),

        ppeItems:
          mapGenericItems(
            ppeResult.data,
            "PPE"
          ),

        riskItems:
          mapGenericItems(
            riskResult.data,
            "RISK"
          ),

        auditItems:
          mapGenericItems(
            auditResult.data,
            "AUDIT"
          ),

        accidentItems:
          mapGenericItems(
            accidentResult.data,
            "ACCIDENT"
          ),

        documentItems:
          mapGenericItems(
            documentResult.data,
            "DOCUMENT"
          ),

        agendaItems:
          mapGenericItems(
            agendaResult.data,
            "AGENDA"
          ),

        sgkItems:
          mapGenericItems(
            sgkResult.data,
            "SGK"
          ),

        ibysItems:
          mapGenericItems(
            ibysResult.data,
            "IBYS"
          ),

        activityItems,

        loadedAt:
          new Date().toISOString(),

        warnings,
      },
    });
      } catch (error: any) {
    console.error(
      "Employee Profile Integration Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Çalışan profil verileri yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}