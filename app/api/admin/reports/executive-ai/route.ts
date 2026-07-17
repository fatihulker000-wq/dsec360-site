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

    if(score>=90)
        return "LOW";

    if(score>=75)
        return "MEDIUM";

    if(score>=60)
        return "HIGH";

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

    if (total === 0) {
        return 0;
    }

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
              "health_records"
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
        .from("accident_records")
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
    // Modül performans detayları
    //--------------------------------------------------

    const completedTrainingCount =
      trainings.filter(
        (row: any) =>
          [
            "COMPLETED",
            "TAMAMLANDI",
          ].includes(
            String(row.status || "")
              .trim()
              .toUpperCase()
          )
      ).length;

    const completedInspectionCount =
      inspections.filter(
        (row: any) =>
          [
            "COMPLETED",
            "CLOSED",
            "TAMAMLANDI",
            "KAPANDI",
          ].includes(
            String(row.status || "")
              .trim()
              .toUpperCase()
          )
      ).length;

    const validHealthCount =
      healths.filter(
        (row: any) =>
          [
            "COMPLETED",
            "VALID",
            "ACTIVE",
            "TAMAMLANDI",
            "GEÇERLİ",
            "GECERLI",
          ].includes(
            String(row.status || "")
              .trim()
              .toUpperCase()
          ) ||
          Boolean(
            row.exam_date_millis ||
            row.exam_date
          )
      ).length;

    const closedDofCount =
      dofs.filter(
        (row: any) =>
          [
            "CLOSED",
            "COMPLETED",
            "KAPANDI",
            "TAMAMLANDI",
          ].includes(
            String(row.status || "")
              .trim()
              .toUpperCase()
          )
      ).length;

    const openDofCount =
      Math.max(
        dofs.length -
        closedDofCount,
        0
      );

    //--------------------------------------------------
    // Executive Module List
    //--------------------------------------------------

    const modules: ExecutiveModuleScore[] = [
      {
        key: "training",
        title: "Eğitim Performansı",
        score: trainingScore,
        weight: 25,
        priority:
          normalizePriority(
            trainingScore
          ),
        trend: 0,
        total: trainings.length,
        completed:
          completedTrainingCount,
        missing:
          Math.max(
            trainings.length -
            completedTrainingCount,
            0
          ),
        detail:
          trainings.length === 0
            ? `${employees?.length || 0} çalışan için eğitim ataması bulunmuyor.`
            : `${completedTrainingCount}/${trainings.length} eğitim ataması tamamlandı.`,
      },
      {
        key: "audit",
        title: "Denetim Performansı",
        score: inspectionScore,
        weight: 20,
        priority:
          normalizePriority(
            inspectionScore
          ),
        trend: 0,
        total: inspections.length,
        completed:
          completedInspectionCount,
        missing:
          Math.max(
            inspections.length -
            completedInspectionCount,
            0
          ),
        detail:
          inspections.length === 0
            ? "Tamamlanmış veya planlanmış denetim bulunmuyor."
            : `${completedInspectionCount}/${inspections.length} denetim tamamlandı.`,
      },
      {
        key: "health",
        title: "Sağlık Performansı",
        score: healthScore,
        weight: 15,
        priority:
          normalizePriority(
            healthScore
          ),
        trend: 0,
        total: healths.length,
        completed:
          validHealthCount,
        missing:
          Math.max(
            (employees?.length || 0) -
            validHealthCount,
            0
          ),
        detail:
          healths.length === 0
            ? `${employees?.length || 0} çalışan için sağlık kaydı bulunmuyor.`
            : `${validHealthCount} geçerli sağlık kaydı bulunuyor.`,
      },
      {
        key: "accident",
        title: "İş Kazası Performansı",
        score:
          accidents.length === 0
            ? 100
            : Math.max(
                0,
                100 -
                accidents.length * 20
              ),
        weight: 15,
        priority:
          normalizePriority(
            accidents.length === 0
              ? 100
              : Math.max(
                  0,
                  100 -
                  accidents.length * 20
                )
          ),
        trend: 0,
        total: accidents.length,
        completed:
          accidents.length === 0
            ? 1
            : 0,
        missing: accidents.length,
        detail:
          accidents.length === 0
            ? "Kayıtlı iş kazası veya olay bulunmuyor."
            : `${accidents.length} iş kazası/olay kaydı bulunuyor.`,
      },
      {
        key: "dof",
        title: "DÖF Performansı",
        score: dofScore,
        weight: 15,
        priority:
          normalizePriority(
            dofScore
          ),
        trend: 0,
        total: dofs.length,
        completed:
          closedDofCount,
        missing:
          openDofCount,
        detail:
          dofs.length === 0
            ? "DÖF kaydı bulunmuyor."
            : `${closedDofCount} kapalı, ${openDofCount} açık DÖF bulunuyor.`,
      },
      {
        key: "documentation",
        title: "Dokümantasyon Performansı",
        score: documentScore,
        weight: 5,
        priority:
          normalizePriority(
            documentScore
          ),
        trend: 0,
        total: documents.length,
        completed:
          documents.filter(
            (row: any) =>
              [
                "ACTIVE",
                "VALID",
                "AKTİF",
                "GECERLI",
                "GEÇERLİ",
              ].includes(
                String(row.status || "")
                  .trim()
                  .toUpperCase()
              )
          ).length,
        missing: Math.max(
          documents.length -
          documents.filter(
            (row: any) =>
              [
                "ACTIVE",
                "VALID",
                "AKTİF",
                "GECERLI",
                "GEÇERLİ",
              ].includes(
                String(row.status || "")
                  .trim()
                  .toUpperCase()
              )
          ).length,
          0
        ),
        detail:
          documents.length === 0
            ? "Aktif doküman kaydı bulunmuyor."
            : `${documents.length} doküman değerlendirildi.`,
      },
      {
        key: "emergency",
        title: "Acil Durum Performansı",
        score: emergencyScore,
        weight: 5,
        priority:
          normalizePriority(
            emergencyScore
          ),
        trend: 0,
        total: emergencies.length,
        completed:
          emergencies.filter(
            (row: any) =>
              [
                "ACTIVE",
                "VALID",
                "COMPLETED",
                "AKTİF",
                "TAMAMLANDI",
              ].includes(
                String(row.status || "")
                  .trim()
                  .toUpperCase()
              )
          ).length,
        missing: Math.max(
          emergencies.length -
          emergencies.filter(
            (row: any) =>
              [
                "ACTIVE",
                "VALID",
                "COMPLETED",
                "AKTİF",
                "TAMAMLANDI",
              ].includes(
                String(row.status || "")
                  .trim()
                  .toUpperCase()
              )
          ).length,
          0
        ),
        detail:
          emergencies.length === 0
            ? "Acil durum planı veya kayıt bulunmuyor."
            : `${emergencies.length} acil durum kaydı değerlendirildi.`,
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