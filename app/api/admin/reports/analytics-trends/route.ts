import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function startOfMonth(
  monthsAgo: number
) {
  const date = new Date();

  date.setDate(1);

  date.setHours(
    0,
    0,
    0,
    0
  );

  date.setMonth(
    date.getMonth() -
      monthsAgo
  );

  return date;
}

function periodKey(
  value:
    | Date
    | string
    | number
) {
  const date =
    new Date(value);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function periodLabel(
  date: Date
) {
  return date.toLocaleDateString(
    "tr-TR",
    {
      month: "short",
      year: "2-digit",
    }
  );
}

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}
export async function GET(
  request: Request
) {
  try {

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const companyId =
      String(
        searchParams.get(
          "companyId"
        ) || "ALL"
      );

    const months =
      clamp(
        Number(
          searchParams.get(
            "months"
          ) || 12
        ),
        1,
        24
      );

    const supabase =
      getSupabase();

    const periods =
      Array.from(
        {
          length: months,
        },
        (_, index) => {

          const date =
            startOfMonth(
              months -
                index -
                1
            );

          return {

            key:
              periodKey(
                date
              ),

            label:
              periodLabel(
                date
              ),

          };

        }
      );

    const fromDate =
      startOfMonth(
        months - 1
      ).toISOString();

    let employeeQuery =
      supabase

        .from(
          "employees"
        )

        .select(
          "id,firm_id"
        );

    if (
      companyId !==
        "ALL" &&
      companyId !==
        "all"
    ) {

      employeeQuery =
        employeeQuery.eq(
          "firm_id",
          companyId
        );

    }

    const {
      data: employees,
    } =
      await employeeQuery;

    const employeeIds =
      (
        employees ||
        []
      ).map(
        (
          row: any
        ) =>
          String(
            row.id
          )
      );
          const [
      trainingResult,
      auditResult,
      dofResult,
      riskResult,
      accidentResult,
      companyResult,
    ] = await Promise.all([

      employeeIds.length
        ? supabase
            .from("training_assignments")
            .select(
              "employee_id,status,completed_at,created_at"
            )
            .in(
              "employee_id",
              employeeIds
            )
            .gte(
              "created_at",
              fromDate
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
        .from("inspection_runs")
        .select(
          "firm_id,status,completed_at,created_at"
        )
        .gte(
          "created_at",
          fromDate
        ),

      supabase
        .from("inspection_dof")
        .select(
          "firm_id,status,closed_at,created_at"
        )
        .gte(
          "created_at",
          fromDate
        ),

      employeeIds.length
        ? supabase
            .from("employee_risks")
            .select(
              "employee_id,risk_level,score,created_at"
            )
            .in(
              "employee_id",
              employeeIds
            )
            .gte(
              "created_at",
              fromDate
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
        .from("accidents")
        .select(
          "firm_id,event_type,created_at"
        )
        .gte(
          "created_at",
          fromDate
        ),

      supabase
        .from("companies")
        .select(
          "id,name"
        ),

    ]);

    const trainingRows =
      trainingResult.data || [];

    const auditRows =
      (
        auditResult.data || []
      ).filter(
        (row: any) =>
          companyId === "ALL" ||
          companyId === "all" ||
          String(row.firm_id) ===
            companyId
      );

    const dofRows =
      (
        dofResult.data || []
      ).filter(
        (row: any) =>
          companyId === "ALL" ||
          companyId === "all" ||
          String(row.firm_id) ===
            companyId
      );

    const riskRows =
      riskResult.data || [];

    const accidentRows =
      (
        accidentResult.data || []
      ).filter(
        (row: any) =>
          companyId === "ALL" ||
          companyId === "all" ||
          String(row.firm_id) ===
            companyId
      );

    const companies =
      companyResult.data || [];
          const trends =
      periods.map((period) => {

        const trainingInPeriod =
          trainingRows.filter(
            (row: any) =>
              periodKey(
                row.completed_at ||
                row.created_at
              ) === period.key
          );

        const auditsInPeriod =
          auditRows.filter(
            (row: any) =>
              periodKey(
                row.completed_at ||
                row.created_at
              ) === period.key
          );

        const dofInPeriod =
          dofRows.filter(
            (row: any) =>
              periodKey(
                row.closed_at ||
                row.created_at
              ) === period.key
          );

        const risksInPeriod =
          riskRows.filter(
            (row: any) =>
              periodKey(
                row.created_at
              ) === period.key
          );

        const accidentsInPeriod =
          accidentRows.filter(
            (row: any) =>
              periodKey(
                row.created_at
              ) === period.key
          );

        return {

          period:
            period.label,

          trainingCompleted:
            trainingInPeriod.filter(
              (row: any) =>
                String(
                  row.status
                ).toUpperCase() ===
                "COMPLETED"
            ).length,

          trainingMissing:
            trainingInPeriod.filter(
              (row: any) =>
                String(
                  row.status
                ).toUpperCase() !==
                "COMPLETED"
            ).length,

          auditsCompleted:
            auditsInPeriod.filter(
              (row: any) =>
                [
                  "COMPLETED",
                  "CLOSED",
                ].includes(
                  String(
                    row.status
                  ).toUpperCase()
                )
            ).length,

          openDof:
            dofInPeriod.filter(
              (row: any) =>
                ![
                  "COMPLETED",
                  "CLOSED",
                ].includes(
                  String(
                    row.status
                  ).toUpperCase()
                )
            ).length,

          closedDof:
            dofInPeriod.filter(
              (row: any) =>
                [
                  "COMPLETED",
                  "CLOSED",
                ].includes(
                  String(
                    row.status
                  ).toUpperCase()
                )
            ).length,

          highRisk:
            risksInPeriod.filter(
              (row: any) =>
                String(
                  row.risk_level || ""
                )
                  .toUpperCase()
                  .includes("HIGH") ||

                Number(
                  row.score || 0
                ) >= 200
            ).length,

          mediumRisk:
            risksInPeriod.filter(
              (row: any) =>
                String(
                  row.risk_level || ""
                )
                  .toUpperCase()
                  .includes("MEDIUM") ||

                (
                  Number(
                    row.score || 0
                  ) >= 70 &&

                  Number(
                    row.score || 0
                  ) < 200
                )
            ).length,

          accident:
            accidentsInPeriod.filter(
              (row: any) =>
                [
                  "ACCIDENT",
                  "WORK_ACCIDENT",
                  "İŞ_KAZASI",
                ].includes(
                  String(
                    row.event_type
                  ).toUpperCase()
                )
            ).length,

          nearMiss:
            accidentsInPeriod.filter(
              (row: any) =>
                [
                  "NEAR_MISS",
                  "RAMAK_KALA",
                ].includes(
                  String(
                    row.event_type
                  ).toUpperCase()
                )
            ).length,

        };

      });
          const comparisons =
      companies.map(
        (company: any) => {

          const companyEmployees =
            (employees || []).filter(
              (employee: any) =>
                String(employee.firm_id) ===
                String(company.id)
            );

          const employeeCount =
            companyEmployees.length;

          // ---------------------------------------
          // Eğitim Skoru
          // ---------------------------------------

          const trainingScore =
            employeeCount > 0

              ? clamp(

                  Math.round(

                    (

                      trainingRows.filter(

                        (row: any) =>

                          companyEmployees.some(

                            (employee: any) =>

                              String(employee.id) ===

                              String(row.employee_id)

                          ) &&

                          String(row.status)
                            .toUpperCase() ===
                            "COMPLETED"

                      ).length /

                      Math.max(

                        1,

                        trainingRows.filter(

                          (row: any) =>

                            companyEmployees.some(

                              (employee: any) =>

                                String(employee.id) ===

                                String(row.employee_id)

                            )

                        ).length

                      )

                    ) * 100

                  )

                )

              : 0;

          // ---------------------------------------
          // Denetim Skoru
          // ---------------------------------------

          const companyAudits =
            auditRows.filter(
              (row: any) =>
                String(row.firm_id) ===
                String(company.id)
            );

          const auditScore =
            companyAudits.length > 0

              ? clamp(

                  Math.round(

                    (

                      companyAudits.filter(

                        (row: any) =>

                          [

                            "COMPLETED",

                            "CLOSED",

                          ].includes(

                            String(row.status)
                              .toUpperCase()

                          )

                      ).length /

                      companyAudits.length

                    ) * 100

                  )

                )

              : 0;

          // ---------------------------------------
          // Risk Skoru
          // ---------------------------------------

          const companyRisks =
            riskRows.filter(
              (row: any) =>

                companyEmployees.some(

                  (employee: any) =>

                    String(employee.id) ===

                    String(row.employee_id)

                )

            );

          const riskScore =
            companyRisks.length > 0

              ? clamp(

                  Math.round(

                    100 -

                    (

                      companyRisks.filter(

                        (row: any) =>

                          Number(row.score || 0) >= 200

                      ).length /

                      companyRisks.length

                    ) * 100

                  )

                )

              : 100;

          // ---------------------------------------
          // Genel Kurumsal Puan
          // ---------------------------------------

          const overallScore =
            Math.round(

              (

                trainingScore +

                auditScore +

                riskScore

              ) / 3

            );

          return {

            companyId:
              String(company.id),

            companyName:
              String(company.name || ""),

            employeeCount,

            trainingScore,

            auditScore,

            riskScore,

            overallScore,

          };

        }

      );

    // ---------------------------------------
    // HeatMap
    // ---------------------------------------

    const heatmap =
      comparisons.flatMap(
        (row: any) => [

          {

            rowLabel:
              row.companyName,

            columnLabel:
              "Eğitim",

            value:
              row.trainingScore,

          },

          {

            rowLabel:
              row.companyName,

            columnLabel:
              "Denetim",

            value:
              row.auditScore,

          },

          {

            rowLabel:
              row.companyName,

            columnLabel:
              "Risk",

            value:
              row.riskScore,

          },

        ]
      );
          return NextResponse.json({

      success: true,

      data: {

        periods,

        trends,

        comparisons,

        heatmap,

        generatedAt:
          new Date().toISOString(),

      },

    });

  } catch (errorValue: unknown) {

    console.error(
      "Advanced analytics error:",
      errorValue
    );

    return NextResponse.json(

      {

        success: false,

        error:

          errorValue instanceof Error

            ? errorValue.message

            : "Gelişmiş analitik verileri alınamadı.",

      },

      {

        status: 500,

      }

    );

  }

}