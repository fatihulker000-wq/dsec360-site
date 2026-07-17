import type {
  ExecutiveReportDashboardData,
  ExecutiveReportDashboardInput,
  ExecutiveReportModuleScore,
  ExecutiveReportTone,
} from "./types";

export function buildExecutiveReportDashboard(
  input: ExecutiveReportDashboardInput
): ExecutiveReportDashboardData {

  const employeeCount =
    number(input.employeeCount);

  const activeEmployeeCount =
    number(input.activeEmployeeCount);

  const passiveEmployeeCount =
    number(input.passiveEmployeeCount);

  const totalTrainings =
    number(input.totalTrainings);

  const completedTrainings =
    number(input.completedTrainings);

  const missingTrainings =
    number(input.missingTrainings);

  const inProgressTrainings =
    number(input.inProgressTrainings);

  const totalAudits =
    number(input.totalAudits);

  const completedAudits =
    number(input.completedAudits);

  const draftAudits =
    number(input.draftAudits);

  const complianceScore =
    clamp(
      number(input.complianceScore),
      0,
      100
    );

  const nonconformityCount =
    number(input.nonconformityCount);

  const openDofCount =
    number(input.openDofCount);

  const closedDofCount =
    number(input.closedDofCount);

  const totalRisks =
    number(input.totalRisks);

  const highRiskCount =
    number(input.highRiskCount);

  const mediumRiskCount =
    number(input.mediumRiskCount);

  const lowRiskCount =
    number(input.lowRiskCount);

  const totalHealthRecords =
    number(input.totalHealthRecords);

  const expiringHealthCount =
    number(input.expiringHealthCount);

  const expiredHealthCount =
    number(input.expiredHealthCount);

  const totalPpeAssignments =
    number(input.totalPpeAssignments);

  const pendingPpeCount =
    number(input.pendingPpeCount);

  const accidentCount =
    number(input.accidentCount);

  const nearMissCount =
    number(input.nearMissCount);

  const occupationalDiseaseCount =
    number(input.occupationalDiseaseCount);

  const ibysSuccessCount =
    number(input.ibysSuccessCount);

  const ibysPendingCount =
    number(input.ibysPendingCount);

  const ibysErrorCount =
    number(input.ibysErrorCount);

  // -------------------------------------------------
  // Çalışan Skoru
  // -------------------------------------------------

  const employeeScore =
    employeeCount > 0
      ? clamp(
          Math.round(
            (
              (activeEmployeeCount || employeeCount) /
              employeeCount
            ) * 100
          ),
          0,
          100
        )
      : 0;

  // -------------------------------------------------
  // Eğitim Skoru
  // -------------------------------------------------

  const trainingScore =
    totalTrainings > 0
      ? Math.round(
          (
            completedTrainings /
            Math.max(
              1,
              totalTrainings
            )
          ) * 100
        )
      : 0;

  // -------------------------------------------------
  // Denetim Skoru
  // -------------------------------------------------

  const auditScore =
    complianceScore;

  // -------------------------------------------------
  // Risk Skoru
  // -------------------------------------------------

  const riskScore =
    totalRisks > 0
      ? clamp(
          Math.round(
            100 -
              (
                (
                  highRiskCount * 1 +
                  mediumRiskCount * .45 +
                  lowRiskCount * .12
                ) /
                Math.max(
                  1,
                  totalRisks
                )
              ) * 100
          ),
          0,
          100
        )
      : 100;

  // -------------------------------------------------
  // Sağlık Skoru
  // -------------------------------------------------

  const healthScore =
    totalHealthRecords > 0
      ? clamp(
          Math.round(
            100 -
              (
                (
                  expiredHealthCount +
                  expiringHealthCount * .45
                ) /
                Math.max(
                  1,
                  totalHealthRecords
                )
              ) * 100
          ),
          0,
          100
        )
      : 0;

  // -------------------------------------------------
  // KKD Skoru
  // -------------------------------------------------

  const ppeScore =
    totalPpeAssignments > 0
      ? clamp(
          Math.round(
            100 -
              (
                pendingPpeCount /
                Math.max(
                  1,
                  totalPpeAssignments
                )
              ) * 100
          ),
          0,
          100
        )
      : 0;
        // -------------------------------------------------
  // Kaza Skoru
  // -------------------------------------------------

  const accidentScore =
    clamp(
      100 -
        accidentCount * 18 -
        nearMissCount * 7 -
        occupationalDiseaseCount * 25,
      0,
      100
    );

  // -------------------------------------------------
  // İBYS Skoru
  // -------------------------------------------------

  const ibysTotal =
    ibysSuccessCount +
    ibysPendingCount +
    ibysErrorCount;

  const ibysScore =
    ibysTotal > 0
      ? clamp(
          Math.round(
            (
              (
                ibysSuccessCount * 1 +
                ibysPendingCount * .35
              ) /
              ibysTotal
            ) * 100
          ),
          0,
          100
        )
      : 0;

  // -------------------------------------------------
  // Modül Skorları
  // -------------------------------------------------

  const moduleScores:
    ExecutiveReportModuleScore[] = [

    module(
      "EMPLOYEE",
      "Çalışan Yönetimi",
      employeeScore,
      "Aktif / pasif çalışan dengesi"
    ),

    module(
      "TRAINING",
      "Eğitim Yönetimi",
      trainingScore,
      "Tamamlanan eğitim performansı"
    ),

    module(
      "AUDIT",
      "Denetim Yönetimi",
      auditScore,
      "Denetim uyum skoru"
    ),

    module(
      "RISK",
      "Risk Yönetimi",
      riskScore,
      "Açık risk yoğunluğu"
    ),

    module(
      "HEALTH",
      "Sağlık Yönetimi",
      healthScore,
      "Muayene uygunluğu"
    ),

    module(
      "PPE",
      "KKD Yönetimi",
      ppeScore,
      "KKD teslim performansı"
    ),

    module(
      "ACCIDENT",
      "İş Kazası Yönetimi",
      accidentScore,
      "Kaza ve ramak kala analizi"
    ),

    module(
      "IBYS",
      "İBYS",
      ibysScore,
      "Bakanlık entegrasyon durumu"
    ),

  ];

  // -------------------------------------------------
  // Genel D-SEC Skoru
  // -------------------------------------------------

  const overallScore =
    Math.round(

      moduleScores.reduce(

        (total, item) =>

          total + item.score,

        0

      ) /

      moduleScores.length

    );

  const overallTone =
    toneFromScore(
      overallScore
    );

  // -------------------------------------------------
  // Yönetici Öncelikleri
  // -------------------------------------------------

  const priorityActions =
    buildPriorityActions({

      missingTrainings,

      inProgressTrainings,

      nonconformityCount,

      openDofCount,

      highRiskCount,

      expiredHealthCount,

      expiringHealthCount,

      pendingPpeCount,

      accidentCount,

      nearMissCount,

      ibysErrorCount,

      ibysPendingCount,

    });

  // -------------------------------------------------
  // Dashboard Sonucu
  // -------------------------------------------------

  return {

    company: {

      id:
        input.companyId,

      name:
        input.companyName,

      companyTitle:
        input.companyTitle,

      employeeCount,

    },

    kpis: [

      {

        key: "employees",

        title:
          "Toplam Çalışan",

        value:
          employeeCount,

        subtitle:
          `${activeEmployeeCount} aktif · ${passiveEmployeeCount} pasif`,

        tone:
          "NEUTRAL",

      },

      {

        key: "training",

        title:
          "Eğitimler",

        value:
          totalTrainings,

        subtitle:
          `${completedTrainings} tamamlandı · ${missingTrainings} eksik`,

        tone:
          missingTrainings > 0
            ? "WARNING"
            : "GOOD",

      },

      {

        key: "audit",

        title:
          "Denetimler",

        value:
          totalAudits,

        subtitle:
          `${completedAudits} tamamlandı · ${draftAudits} taslak`,

        tone:
          auditScore >= 70
            ? "GOOD"
            : "WARNING",

      },

      {

        key: "dof",

        title:
          "Açık DÖF",

        value:
          openDofCount,

        subtitle:
          `${closedDofCount} kapalı`,

        tone:
          openDofCount > 0
            ? "WARNING"
            : "GOOD",

      },

      {

        key: "risk",

        title:
          "Toplam Risk",

        value:
          totalRisks,

        subtitle:
          `${highRiskCount} yüksek · ${mediumRiskCount} orta · ${lowRiskCount} düşük`,

        tone:
          highRiskCount > 0
            ? "CRITICAL"
            : "GOOD",

      },

      {

        key: "health",

        title:
          "Sağlık",

        value:
          totalHealthRecords,

        subtitle:
          `${expiredHealthCount} süresi dolan · ${expiringHealthCount} yaklaşan`,

        tone:
          expiredHealthCount > 0
            ? "CRITICAL"
            : expiringHealthCount > 0
            ? "WARNING"
            : "GOOD",

      },

      {

        key: "ppe",

        title:
          "KKD",

        value:
          totalPpeAssignments,

        subtitle:
          `${pendingPpeCount} teslim bekliyor`,

        tone:
          pendingPpeCount > 0
            ? "WARNING"
            : "GOOD",

      },
            {

        key: "accident",

        title: "İş Kazaları",

        value: accidentCount + nearMissCount,

        subtitle:
          `${accidentCount} kaza · ${nearMissCount} ramak kala`,

        tone:
          accidentCount > 0
            ? "CRITICAL"
            : nearMissCount > 0
            ? "WARNING"
            : "GOOD",

      },

      {

        key: "ibys",

        title: "İBYS",

        value:
          ibysSuccessCount +
          ibysPendingCount +
          ibysErrorCount,

        subtitle:
          `${ibysSuccessCount} başarılı · ${ibysErrorCount} hata`,

        tone:
          ibysErrorCount > 0
            ? "CRITICAL"
            : ibysPendingCount > 0
            ? "WARNING"
            : "GOOD",

      },

    ],

    moduleScores,

    overallScore,

    overallTone,

    executiveSummary:
      buildExecutiveSummary(
        input.companyName,
        overallScore,
        priorityActions
      ),

    priorityActions,

    generatedAt:
      new Date().toISOString(),

  };

}

// ------------------------------------------------------------

function module(

  key: ExecutiveReportModuleScore["key"],

  title: string,

  score: number,

  summary: string

): ExecutiveReportModuleScore {

  return {

    key,

    title,

    score:
      clamp(
        Math.round(score),
        0,
        100
      ),

    summary,

    tone:
      toneFromScore(score),

  };

}

// ------------------------------------------------------------

export function toneFromScore(
  score: number
): ExecutiveReportTone {

  if (score >= 80)
    return "GOOD";

  if (score >= 55)
    return "WARNING";

  return "CRITICAL";

}

// ------------------------------------------------------------

function buildExecutiveSummary(

  companyName: string,

  score: number,

  actions: string[]

) {

  const level =
    score >= 80
      ? "güçlü ve kontrollü"

      : score >= 55
      ? "yakın takip gerektiren"

      : "kritik iyileştirme gerektiren";

  const actionText =
    actions.length > 0
      ? `Öncelikli başlıklar: ${actions
          .slice(0, 3)
          .join(", ")}.`

      : "Belirgin kritik aksiyon tespit edilmedi.";

  return `${companyName} için genel D-SEC skoru ${score}/100 ve yönetim seviyesi ${level}. ${actionText}`;

}

// ------------------------------------------------------------

function buildPriorityActions(args: {

  missingTrainings: number;

  inProgressTrainings: number;

  nonconformityCount: number;

  openDofCount: number;

  highRiskCount: number;

  expiredHealthCount: number;

  expiringHealthCount: number;

  pendingPpeCount: number;

  accidentCount: number;

  nearMissCount: number;

  ibysErrorCount: number;

  ibysPendingCount: number;

}) {

  const actions: Array<{

    title: string;

    priority: number;

  }> = [];

  if (args.highRiskCount > 0)

    actions.push({

      title:
        `${args.highRiskCount} yüksek riski kapat`,

      priority: 100,

    });

  if (args.openDofCount > 0)

    actions.push({

      title:
        `${args.openDofCount} açık DÖF için termin belirle`,

      priority: 95,

    });

  if (args.accidentCount > 0)

    actions.push({

      title:
        `${args.accidentCount} kaza için kök neden analizi yap`,

      priority: 92,

    });

  if (args.expiredHealthCount > 0)

    actions.push({

      title:
        `${args.expiredHealthCount} süresi dolan muayeneyi yenile`,

      priority: 90,

    });

  if (args.missingTrainings > 0)

    actions.push({

      title:
        `${args.missingTrainings} eksik eğitimi tamamla`,

      priority: 84,

    });

  if (args.pendingPpeCount > 0)

    actions.push({

      title:
        `${args.pendingPpeCount} bekleyen KKD teslimini tamamla`,

      priority: 80,

    });

  if (args.ibysErrorCount > 0)

    actions.push({

      title:
        `${args.ibysErrorCount} İBYS aktarım hatasını düzelt`,

      priority: 78,

    });

  if (args.nonconformityCount > 0)

    actions.push({

      title:
        `${args.nonconformityCount} uygunsuzluğu kapat`,

      priority: 76,

    });

  if (args.expiringHealthCount > 0)

    actions.push({

      title:
        `${args.expiringHealthCount} yaklaşan muayeneyi planla`,

      priority: 70,

    });

  if (args.nearMissCount > 0)

    actions.push({

      title:
        `${args.nearMissCount} ramak kala olayını analiz et`,

      priority: 68,

    });

  if (args.inProgressTrainings > 0)

    actions.push({

      title:
        `${args.inProgressTrainings} devam eden eğitimleri takip et`,

      priority: 60,

    });

  if (args.ibysPendingCount > 0)

    actions.push({

      title:
        `${args.ibysPendingCount} bekleyen İBYS kayıtlarını kontrol et`,

      priority: 58,

    });

  return actions

    .sort(
      (a, b) => b.priority - a.priority
    )

    .map(
      (item) => item.title
    )

    .slice(0, 8);

}

// ------------------------------------------------------------

function number(
  value?: number | null
) {
  return Number(value || 0);
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}