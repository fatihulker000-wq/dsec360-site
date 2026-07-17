import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type {
  ExecutiveModuleScore,
  ExecutivePriority,
} from "@/components/reports-v2/dora-ai/types";

import {
    runExecutiveAi,
} from "@/components/reports-v2/dora-ai";

export const dynamic = "force-dynamic";

function getSupabase() {

    return createClient(

        process.env.SUPABASE_URL!,

        process.env.SUPABASE_SERVICE_ROLE_KEY!

    );

}

function normalizePriority(
  score: number
): ExecutivePriority {

  if (score >= 90) {
    return "LOW";
  }

  if (score >= 75) {
    return "MEDIUM";
  }

  if (score >= 60) {
    return "HIGH";
  }

  return "CRITICAL";

}

function averageScore(
    values:number[]
){

    if(values.length===0)
        return 0;

    return Math.round(

        values.reduce(

            (a,b)=>a+b,

            0

        )/

        values.length

    );

}

function percent(

    ok:number,

    total:number

){

    if(total===0)
        return 100;

    return Math.round(

        ok/

        total*

        100

    );

}
export async function GET(

    request:Request

){

try{

    const{

        searchParams,

    }=

    new URL(

        request.url

    );

    const companyId=

        String(

            searchParams.get(

                "companyId"

            )||

            "ALL"

        );

    const supabase=

        getSupabase();

    //-------------------------------------

    // Firma

    //-------------------------------------

    const{

        data:company,

    }=

    companyId==="ALL"

    ?

    {

        data:[

            {

                name:"Tüm Firmalar"

            }

        ]

    }

    :

    await supabase

        .from("companies")

        .select("id,name")

        .eq(

            "id",

            companyId

        )

        .single();

    //-------------------------------------

    // Çalışanlar

    //-------------------------------------

    let employeeQuery=

        supabase

        .from(

            "employees"

        )

        .select(

            "id,firm_id"

        );

    if(

        companyId!=="ALL"

    ){

        employeeQuery=

        employeeQuery.eq(

            "firm_id",

            companyId

        );

    }

    const{

        data:employees,

    }=

    await employeeQuery;

    const employeeIds=

        (

            employees||

            []

        ).map(

            (e:any)=>

            String(

                e.id

            )

        );
            //--------------------------------------------------
    // Eğitim
    //--------------------------------------------------

    const trainingPromise =
      employeeIds.length > 0
        ? supabase
            .from("training_assignments")
            .select(
              "employee_id,status"
            )
            .in(
              "employee_id",
              employeeIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          });

    //--------------------------------------------------
    // Denetimler
    //--------------------------------------------------

    const inspectionPromise =
      supabase
        .from("inspection_runs")
        .select(
          "firm_id,status"
        );

    //--------------------------------------------------
    // Riskler
    //--------------------------------------------------

    const riskPromise =
      employeeIds.length > 0
        ? supabase
            .from("employee_risks")
            .select(
              "employee_id,score,risk_level"
            )
            .in(
              "employee_id",
              employeeIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          });

    //--------------------------------------------------
    // Sağlık
    //--------------------------------------------------

    const healthPromise =
      employeeIds.length > 0
        ? supabase
            .from(
              "employee_health_records"
            )
            .select(
              "employee_id,status"
            )
            .in(
              "employee_id",
              employeeIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          });

    //--------------------------------------------------
    // KKD
    //--------------------------------------------------

    const ppePromise =
      employeeIds.length > 0
        ? supabase
            .from(
              "employee_ppe_assignments"
            )
            .select(
              "employee_id,status"
            )
            .in(
              "employee_id",
              employeeIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          });

    //--------------------------------------------------
    // İş Kazaları
    //--------------------------------------------------

    const accidentPromise =
      supabase
        .from("accidents")
        .select(
          "firm_id,event_type"
        );

    //--------------------------------------------------
    // DÖF
    //--------------------------------------------------

    const dofPromise =
      supabase
        .from("inspection_dof")
        .select(
          "firm_id,status"
        );

    //--------------------------------------------------
    // İBYS
    //--------------------------------------------------

    const ibysPromise =
      employeeIds.length > 0
        ? supabase
            .from(
              "employee_ibys_records"
            )
            .select(
              "employee_id,status"
            )
            .in(
              "employee_id",
              employeeIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          });

    //--------------------------------------------------
    // Dokümanlar
    //--------------------------------------------------

    const documentPromise =
      supabase
        .from("documents")
        .select(
          "firm_id,status"
        );

    //--------------------------------------------------
    // Acil Durum
    //--------------------------------------------------

    const emergencyPromise =
      supabase
        .from("emergency_plans")
        .select(
          "firm_id,status"
        );

    //--------------------------------------------------
    // Hepsini Paralel Oku
    //--------------------------------------------------

    const [

      trainingResult,

      inspectionResult,

      riskResult,

      healthResult,

      ppeResult,

      accidentResult,

      dofResult,

      ibysResult,

      documentResult,

      emergencyResult,

    ] = await Promise.all([

      trainingPromise,

      inspectionPromise,

      riskPromise,

      healthPromise,

      ppePromise,

      accidentPromise,

      dofPromise,

      ibysPromise,

      documentPromise,

      emergencyPromise,

    ]);

    //--------------------------------------------------

    const trainings =
      trainingResult.data || [];

    const inspections =
      inspectionResult.data || [];

    const risks =
      riskResult.data || [];

    const healths =
      healthResult.data || [];

    const ppes =
      ppeResult.data || [];

    const accidents =
      accidentResult.data || [];

    const dofs =
      dofResult.data || [];

    const ibys =
      ibysResult.data || [];

    const documents =
      documentResult.data || [];

    const emergencies =
      emergencyResult.data || [];
          //--------------------------------------------------
    // Eğitim
    //--------------------------------------------------

    const trainingScore =
      percent(

        trainings.filter(
          (row: any) =>
            String(row.status)
              .toUpperCase() ===
            "COMPLETED"
        ).length,

        trainings.length

      );

    //--------------------------------------------------
    // Denetim
    //--------------------------------------------------

    const inspectionScore =
      percent(

        inspections.filter(
          (row: any) =>
            [
              "COMPLETED",
              "CLOSED",
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        inspections.length

      );

    //--------------------------------------------------
    // Risk
    //--------------------------------------------------

    const highRiskCount =
      risks.filter(
        (row: any) =>

          Number(row.score || 0) >= 200 ||

          String(
            row.risk_level || ""
          )
            .toUpperCase()
            .includes("HIGH")

      ).length;

    const riskScore =

      Math.max(

        0,

        100 -

          Math.round(

            (

              highRiskCount /

              Math.max(
                risks.length,
                1
              )

            ) *

            100

          )

      );

    //--------------------------------------------------
    // Sağlık
    //--------------------------------------------------

    const healthScore =
      percent(

        healths.filter(
          (row: any) =>
            [
              "COMPLETED",
              "VALID",
              "ACTIVE"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        healths.length

      );

    //--------------------------------------------------
    // KKD
    //--------------------------------------------------

    const ppeScore =
      percent(

        ppes.filter(
          (row: any) =>
            [
              "DELIVERED",
              "COMPLETED"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        ppes.length

      );

    //--------------------------------------------------
    // İş Kazaları
    //--------------------------------------------------

    const accidentScore =

      Math.max(

        0,

        100 -

        accidents.length

      );

    //--------------------------------------------------
    // DÖF
    //--------------------------------------------------

    const dofScore =
      percent(

        dofs.filter(
          (row: any) =>
            [
              "CLOSED",
              "COMPLETED"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        dofs.length

      );

    //--------------------------------------------------
    // İBYS
    //--------------------------------------------------

    const ibysScore =
      percent(

        ibys.filter(
          (row: any) =>
            [
              "SUCCESS",
              "COMPLETED",
              "SENT"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        ibys.length

      );

    //--------------------------------------------------
    // Dokümantasyon
    //--------------------------------------------------

    const documentScore =
      percent(

        documents.filter(
          (row: any) =>
            [
              "ACTIVE",
              "VALID"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        documents.length

      );

    //--------------------------------------------------
    // Acil Durum
    //--------------------------------------------------

    const emergencyScore =
      percent(

        emergencies.filter(
          (row: any) =>
            [
              "ACTIVE",
              "VALID"
            ].includes(
              String(row.status)
                .toUpperCase()
            )
        ).length,

        emergencies.length

      );

    //--------------------------------------------------
    // Executive Module List
    //--------------------------------------------------

    const modules: ExecutiveModuleScore[] = [

      {

        key: "training",

        title: "Eğitim",

        score: trainingScore,

        weight: 15,

        priority:
          normalizePriority(
            trainingScore
          ),

        trend: 2,

      },

      {

        key: "audit",

        title: "Denetim",

        score: inspectionScore,

        weight: 15,

        priority:
          normalizePriority(
            inspectionScore
          ),

        trend: 1,

      },

      {

        key: "risk",

        title: "Risk",

        score: riskScore,

        weight: 20,

        priority:
          normalizePriority(
            riskScore
          ),

        trend: -1,

      },

      {

        key: "health",

        title: "Sağlık",

        score: healthScore,

        weight: 12,

        priority:
          normalizePriority(
            healthScore
          ),

        trend: 1,

      },

      {

        key: "ppe",

        title: "KKD",

        score: ppeScore,

        weight: 8,

        priority:
          normalizePriority(
            ppeScore
          ),

        trend: 1,

      },

      {

        key: "accident",

        title: "İş Kazaları",

        score: accidentScore,

        weight: 12,

        priority:
          normalizePriority(
            accidentScore
          ),

        trend: -2,

      },

      {

        key: "dof",

        title: "DÖF",

        score: dofScore,

        weight: 8,

        priority:
          normalizePriority(
            dofScore
          ),

        trend: 1,

      },

      {

        key: "ibys",

        title: "İBYS",

        score: ibysScore,

        weight: 5,

        priority:
          normalizePriority(
            ibysScore
          ),

        trend: 2,

      },

      {

        key: "documentation",

        title: "Dokümantasyon",

        score: documentScore,

        weight: 3,

        priority:
          normalizePriority(
            documentScore
          ),

        trend: 1,

      },

      {

        key: "emergency",

        title: "Acil Durum",

        score: emergencyScore,

        weight: 2,

        priority:
          normalizePriority(
            emergencyScore
          ),

        trend: 1,

      },

    ];
        //--------------------------------------------------
    // DORA AI
    //--------------------------------------------------

    const executiveSummary =
      runExecutiveAi({

        companyName:

          Array.isArray(company)

            ? company[0]?.name ||

              "Tüm Firmalar"

            : company?.name ||

              "Firma",

        modules,

      });

    //--------------------------------------------------
    // Dashboard Cards
    //--------------------------------------------------

    const dashboard = {

      company:

        Array.isArray(company)

          ? company[0]?.name ||

            "Tüm Firmalar"

          : company?.name ||

            "Firma",

      employeeCount:

        employees?.length || 0,

      trainingCount:

        trainings.length,

      inspectionCount:

        inspections.length,

      riskCount:

        risks.length,

      accidentCount:

        accidents.length,

      dofCount:

        dofs.length,

      ibysCount:

        ibys.length,

      documentCount:

        documents.length,

      emergencyCount:

        emergencies.length,

      generatedAt:

        new Date()

          .toISOString(),

    };

    //--------------------------------------------------
    // PDF Summary

    //--------------------------------------------------

    const pdfSummary = {

      title:

        "DORA Executive Summary",

      company:

        dashboard.company,

      overallScore:

        executiveSummary.overallScore,

      grade:

        executiveSummary.grade,

      maturity:

        executiveSummary.maturity,

      legalCompliance:

        executiveSummary.legalCompliance,

      digitalization:

        executiveSummary.digitalization,

      operationalRisk:

        executiveSummary.operationalRisk,

      executiveText:

        executiveSummary.executiveText,

      recommendations:

        executiveSummary.recommendations.slice(

          0,

          5

        ),

      predictions:

        executiveSummary.predictions,

    };

    //--------------------------------------------------
    // Response Object

    //--------------------------------------------------

    const response = {

      success: true,

      dashboard,

      executiveSummary,

      pdfSummary,

    };
        //--------------------------------------------------
    // JSON Response
    //--------------------------------------------------

    return NextResponse.json(response);

  } catch (errorValue: unknown) {

    console.error(
      "[DORA AI] Executive route error:",
      errorValue
    );

    return NextResponse.json(
      {
        success: false,

        error:
          errorValue instanceof Error
            ? errorValue.message
            : "DORA AI Executive raporu oluşturulamadı.",

        dashboard: null,

        executiveSummary: null,

        pdfSummary: null,
      },
      {
        status: 500,
      }
    );

  }

}