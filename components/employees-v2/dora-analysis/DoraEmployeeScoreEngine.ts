import type {
  DoraEmployeeAnalysis,
  DoraEmployeeAnalysisInput,
  DoraEmployeeMetric,
  DoraEmployeeRecommendation,
  DoraEmployeeRiskLevel,
} from "./types";

export function analyzeEmployeeWithDora(
  input: DoraEmployeeAnalysisInput
): DoraEmployeeAnalysis {

  const integration = input.integration;

  const summary = integration?.summary;

  const trainingStatus =
    summary?.training_status || "UNKNOWN";

  const healthStatus =
    summary?.health_status || "UNKNOWN";

  const ppeStatus =
    summary?.ppe_status || "UNKNOWN";

  const documentStatus =
    summary?.document_status || "UNKNOWN";

  const accidentCount =
    Number(summary?.accident_count || 0);

  const openRiskCount =
    Number(summary?.open_risk_count || 0);

  const openActionCount =
    Number(summary?.open_action_count || 0);

  const upcomingCount =
    Number(summary?.upcoming_count || 0);

  const trainingRate =
    summary?.training_completion_rate;

  const ppeRate =
    summary?.ppe_completion_rate;

  const missingFields =
    input.missingProfileFields || [];

  const metrics: DoraEmployeeMetric[] = [

    buildTrainingMetric(
      trainingStatus,
      trainingRate
    ),

    buildHealthMetric(
      healthStatus
    ),

    buildPpeMetric(
      ppeStatus,
      ppeRate
    ),

    buildRiskMetric(
      openRiskCount,
      summary?.risk_status || "UNKNOWN"
    ),

    buildAccidentMetric(
      accidentCount
    ),

    buildDocumentMetric(
      documentStatus
    ),

    buildUpcomingMetric(
      upcomingCount,
      openActionCount
    ),

    buildDataMetric(
      missingFields
    ),

  ];

  const weightedRisk =
    metrics.reduce(
      (total, metric) =>
        total +
        metric.score *
        metric.weight,
      0
    ) /
    metrics.reduce(
      (total, metric) =>
        total +
        metric.weight,
      0
    );

  const inactivePenalty =
    input.active === false
      ? 8
      : 0;

  const score = clamp(
    Math.round(
      weightedRisk +
      inactivePenalty
    ),
    0,
    100
  );

  const riskLevel =
    getRiskLevel(score);

  const recommendations =
    buildRecommendations({

      trainingStatus,

      healthStatus,

      ppeStatus,

      documentStatus,

      accidentCount,

      openRiskCount,

      openActionCount,

      upcomingCount,

      trainingRate,

      ppeRate,

      missingFields,

    });

  const positiveSignals =
    buildPositiveSignals({

      trainingStatus,

      healthStatus,

      ppeStatus,

      documentStatus,

      accidentCount,

      openRiskCount,

      missingFields,

    });

  const riskSignals =
    buildRiskSignals({

      trainingStatus,

      healthStatus,

      ppeStatus,

      documentStatus,

      accidentCount,

      openRiskCount,

      openActionCount,

      upcomingCount,

      missingFields,

    });

  const confidence =
    calculateConfidence(
      integration,
      missingFields
    );

  return {

    employeeId:
      input.employeeId,

    score,

    riskLevel,

    confidence,

    headline:
      createHeadline(
        input.employeeName,
        riskLevel
      ),

    summary:
      createSummary({

        employeeName:
          input.employeeName,

        jobTitle:
          input.jobTitle,

        department:
          input.department,

        score,

        riskLevel,

        riskSignals,

      }),

    metrics,

    recommendations,

    positiveSignals,

    riskSignals,

    generatedAt:
      new Date().toISOString(),

  };

}
function buildTrainingMetric(
  status: string,
  completionRate?: number
): DoraEmployeeMetric {

  let score = 45;

  let explanation =
    "Eğitim verisi bulunamadı.";

  if (status === "COMPLETE") {

    score =
      completionRate != null
        ? Math.max(
            0,
            100 - completionRate
          )
        : 10;

    explanation =
      "Zorunlu eğitim kayıtları uygun.";

  }

  if (status === "EXPIRING") {

    score = 55;

    explanation =
      "Bazı eğitimlerin geçerlilik süresi yaklaşıyor.";

  }

  if (status === "MISSING") {

    score = 85;

    explanation =
      "Eksik veya süresi dolmuş eğitim kaydı mevcut.";

  }

  return {

    key: "TRAINING",

    title: "Eğitim Riski",

    value:
      completionRate != null
        ? `%${completionRate}`
        : statusLabel(status),

    score,

    weight: 1.15,

    status:
      normalizeStatus(status),

    explanation,

  };

}

function buildHealthMetric(
  status: string
): DoraEmployeeMetric {

  const config = {

    COMPLETE: [
      10,
      "Sağlık kayıtları uygun."
    ],

    EXPIRING: [
      65,
      "Muayene süresi yaklaşıyor."
    ],

    MISSING: [
      90,
      "Eksik sağlık kaydı mevcut."
    ],

    UNKNOWN: [
      50,
      "Sağlık verisi bulunamadı."
    ],

  }[status] || [

    50,

    "Sağlık verisi bulunamadı."

  ];

  return {

    key: "HEALTH",

    title: "Sağlık Uygunluğu",

    value:
      statusLabel(status),

    score:
      Number(config[0]),

    weight: 1.30,

    status:
      normalizeStatus(status),

    explanation:
      String(config[1]),

  };

}

function buildPpeMetric(

  status: string,

  completionRate?: number

): DoraEmployeeMetric {

  let score = 45;

  let explanation =
    "KKD bilgisi bulunamadı.";

  if (status === "COMPLETE") {

    score =
      completionRate != null
        ? Math.max(
            0,
            100 - completionRate
          )
        : 10;

    explanation =
      "KKD teslim kayıtları uygun.";

  }

  if (status === "EXPIRING") {

    score = 58;

    explanation =
      "KKD yenileme zamanı yaklaşıyor.";

  }

  if (status === "MISSING") {

    score = 88;

    explanation =
      "Eksik KKD veya zimmet kaydı bulunuyor.";

  }

  return {

    key: "PPE",

    title: "KKD Uygunluğu",

    value:
      completionRate != null
        ? `%${completionRate}`
        : statusLabel(status),

    score,

    weight: 1.10,

    status:
      normalizeStatus(status),

    explanation,

  };

}
function buildRiskMetric(
  openRiskCount: number,
  riskStatus: string
): DoraEmployeeMetric {

  const base =
    riskStatus === "HIGH"
      ? 80
      : riskStatus === "MEDIUM"
      ? 55
      : riskStatus === "LOW"
      ? 20
      : 40;

  const score = clamp(
    base + openRiskCount * 5,
    0,
    100
  );

  return {

    key: "RISK",

    title: "Açık Riskler",

    value: `${openRiskCount}`,

    score,

    weight: 1.35,

    status:
      score >= 80
        ? "CRITICAL"
        : score >= 60
        ? "HIGH"
        : score >= 35
        ? "MEDIUM"
        : "LOW",

    explanation:
      openRiskCount > 0
        ? `${openRiskCount} açık risk kaydı bulundu.`
        : "Açık risk bulunmuyor.",

  };

}

function buildAccidentMetric(
  accidentCount: number
): DoraEmployeeMetric {

  const score = clamp(
    accidentCount * 22,
    0,
    100
  );

  return {

    key: "ACCIDENT",

    title: "İş Kazası / Olay",

    value: `${accidentCount}`,

    score,

    weight: 1.40,

    status:
      score >= 80
        ? "CRITICAL"
        : score >= 55
        ? "HIGH"
        : score >= 25
        ? "MEDIUM"
        : "LOW",

    explanation:
      accidentCount > 0
        ? `${accidentCount} adet kaza / olay kaydı mevcut.`
        : "Kaza veya olay kaydı bulunmuyor.",

  };

}

function buildDocumentMetric(
  status: string
): DoraEmployeeMetric {

  const score =
    status === "COMPLETE"
      ? 8
      : status === "EXPIRING"
      ? 55
      : status === "MISSING"
      ? 78
      : 42;

  return {

    key: "DOCUMENT",

    title: "Belge Uygunluğu",

    value:
      statusLabel(status),

    score,

    weight: 0.75,

    status:
      normalizeStatus(status),

    explanation:

      status === "COMPLETE"

        ? "Belge durumu uygun."

        : status === "MISSING"

        ? "Eksik belge bulunuyor."

        : status === "EXPIRING"

        ? "Belge süresi yaklaşıyor."

        : "Belge verisi bulunamadı.",

  };

}

function buildUpcomingMetric(

  upcomingCount: number,

  openActionCount: number

): DoraEmployeeMetric {

  const total =
    upcomingCount +
    openActionCount;

  const score = clamp(
    total * 8,
    0,
    100
  );

  return {

    key: "UPCOMING",

    title: "Yaklaşan İşlemler",

    value: `${total}`,

    score,

    weight: 0.80,

    status:
      score >= 75
        ? "HIGH"
        : score >= 35
        ? "MEDIUM"
        : "LOW",

    explanation:
      total > 0
        ? `${total} yaklaşan işlem bulunuyor.`
        : "Yaklaşan işlem bulunmuyor.",

  };

}

function buildDataMetric(
  missingFields: string[]
): DoraEmployeeMetric {

  const score = clamp(
    missingFields.length * 14,
    0,
    100
  );

  return {

    key: "DATA",

    title: "Profil Veri Kalitesi",

    value:
      missingFields.length > 0
        ? `${missingFields.length} Eksik`
        : "Tam",

    score,

    weight: 0.65,

    status:
      score >= 70
        ? "HIGH"
        : score >= 30
        ? "MEDIUM"
        : "LOW",

    explanation:

      missingFields.length > 0

        ? `Eksik alanlar: ${missingFields.join(", ")}`

        : "Profil bilgileri eksiksiz.",

  };

}
function buildRecommendations(args: {
  trainingStatus: string;
  healthStatus: string;
  ppeStatus: string;
  documentStatus: string;
  accidentCount: number;
  openRiskCount: number;
  openActionCount: number;
  upcomingCount: number;
  trainingRate?: number;
  ppeRate?: number;
  missingFields: string[];
}): DoraEmployeeRecommendation[] {

  const list: DoraEmployeeRecommendation[] = [];

  // Eğitim
  if (
    args.trainingStatus === "MISSING" ||
    args.trainingStatus === "EXPIRING" ||
    (args.trainingRate != null && args.trainingRate < 100)
  ) {
    list.push({
      id: "training",
      title: "Eğitim Planını Güncelle",
      description:
        "Eksik veya süresi yaklaşan eğitimler tespit edildi.",
      action:
        "Zorunlu eğitimleri planlayın ve çalışanı eğitime atayın.",
      category: "TRAINING",
      priority:
        args.trainingStatus === "MISSING"
          ? "HIGH"
          : "MEDIUM",
      scoreImpact: 15,
    });
  }

  // Sağlık
  if (
    args.healthStatus === "MISSING" ||
    args.healthStatus === "EXPIRING"
  ) {
    list.push({
      id: "health",
      title: "Sağlık Muayenesi Planla",
      description:
        "Sağlık uygunluğu eksik veya süresi dolmak üzere.",
      action:
        "İşyeri hekimi tarafından muayene planlayın.",
      category: "HEALTH",
      priority:
        args.healthStatus === "MISSING"
          ? "CRITICAL"
          : "HIGH",
      scoreImpact: 18,
    });
  }

  // KKD
  if (
    args.ppeStatus === "MISSING" ||
    args.ppeStatus === "EXPIRING" ||
    (args.ppeRate != null && args.ppeRate < 100)
  ) {
    list.push({
      id: "ppe",
      title: "KKD Kontrolü Yap",
      description:
        "KKD teslim veya yenileme kaydı eksik.",
      action:
        "KKD zimmetlerini kontrol edin ve eksikleri tamamlayın.",
      category: "PPE",
      priority:
        args.ppeStatus === "MISSING"
          ? "HIGH"
          : "MEDIUM",
      scoreImpact: 12,
    });
  }

  // Risk
  if (args.openRiskCount > 0) {
    list.push({
      id: "risk",
      title: "Açık Riskleri Kapat",
      description:
        `${args.openRiskCount} açık risk kaydı mevcut.`,
      action:
        "Risklere sorumlu atayın ve termin belirleyin.",
      category: "RISK",
      priority:
        args.openRiskCount >= 3
          ? "CRITICAL"
          : "HIGH",
      scoreImpact: 20,
    });
  }

  // İş kazası
  if (args.accidentCount > 0) {
    list.push({
      id: "accident",
      title: "Kaza Analizi Yap",
      description:
        `${args.accidentCount} iş kazası / olay kaydı bulundu.`,
      action:
        "Kök neden analizi yapın ve tekrar önleme faaliyetlerini başlatın.",
      category: "ACCIDENT",
      priority:
        args.accidentCount >= 2
          ? "CRITICAL"
          : "HIGH",
      scoreImpact: 18,
    });
  }

  // Belgeler
  if (
    args.documentStatus === "MISSING" ||
    args.documentStatus === "EXPIRING"
  ) {
    list.push({
      id: "document",
      title: "Belgeleri Güncelle",
      description:
        "Eksik veya süresi yaklaşan çalışan belgeleri mevcut.",
      action:
        "Belgeleri yenileyin ve sisteme yükleyin.",
      category: "DOCUMENT",
      priority: "MEDIUM",
      scoreImpact: 8,
    });
  }

  // Ajanda
  if (
    args.upcomingCount > 0 ||
    args.openActionCount > 0
  ) {
    list.push({
      id: "agenda",
      title: "Yaklaşan İşlemleri Planla",
      description:
        `${args.upcomingCount + args.openActionCount} açık işlem bulunuyor.`,
      action:
        "Terminleri kontrol edin ve sorumluları bilgilendirin.",
      category: "AGENDA",
      priority: "MEDIUM",
      scoreImpact: 7,
    });
  }

  // Veri Kalitesi
  if (args.missingFields.length > 0) {
    list.push({
      id: "profile",
      title: "Personel Profilini Tamamla",
      description:
        `Eksik alanlar: ${args.missingFields.join(", ")}`,
      action:
        "Personel profilindeki eksik bilgileri tamamlayın.",
      category: "DATA_QUALITY",
      priority:
        args.missingFields.length >= 4
          ? "HIGH"
          : "MEDIUM",
      scoreImpact: 6,
    });
  }

  return list.sort(
    (a, b) =>
      priorityValue(b.priority) -
      priorityValue(a.priority)
  );
}

function buildPositiveSignals(args: {
  trainingStatus: string;
  healthStatus: string;
  ppeStatus: string;
  documentStatus: string;
  accidentCount: number;
  openRiskCount: number;
  missingFields: string[];
}) {

  const list: string[] = [];

  if (args.trainingStatus === "COMPLETE")
    list.push("✓ Eğitimler eksiksiz.");

  if (args.healthStatus === "COMPLETE")
    list.push("✓ Sağlık kayıtları uygun.");

  if (args.ppeStatus === "COMPLETE")
    list.push("✓ KKD teslimleri tamam.");

  if (args.documentStatus === "COMPLETE")
    list.push("✓ Belgeler güncel.");

  if (args.accidentCount === 0)
    list.push("✓ İş kazası kaydı bulunmuyor.");

  if (args.openRiskCount === 0)
    list.push("✓ Açık risk bulunmuyor.");

  if (args.missingFields.length === 0)
    list.push("✓ Profil bilgileri eksiksiz.");

  return list;
}

function buildRiskSignals(args: {
  trainingStatus: string;
  healthStatus: string;
  ppeStatus: string;
  documentStatus: string;
  accidentCount: number;
  openRiskCount: number;
  openActionCount: number;
  upcomingCount: number;
  missingFields: string[];
}) {

  const list: string[] = [];

  if (args.trainingStatus === "MISSING")
    list.push("Eksik eğitim");

  if (args.healthStatus === "MISSING")
    list.push("Eksik sağlık kaydı");

  if (args.ppeStatus === "MISSING")
    list.push("Eksik KKD");

  if (args.documentStatus === "MISSING")
    list.push("Eksik belge");

  if (args.accidentCount > 0)
    list.push(`${args.accidentCount} iş kazası`);

  if (args.openRiskCount > 0)
    list.push(`${args.openRiskCount} açık risk`);

  if (args.openActionCount > 0)
    list.push(`${args.openActionCount} açık aksiyon`);

  if (args.upcomingCount > 0)
    list.push(`${args.upcomingCount} yaklaşan işlem`);

  if (args.missingFields.length > 0)
    list.push(`${args.missingFields.length} eksik profil alanı`);

  return list;
}
function calculateConfidence(
  integration: DoraEmployeeAnalysisInput["integration"],
  missingFields: string[]
): number {

  let confidence = 55;

  if (integration) {
    confidence += 20;
  }

  const modules = integration
    ? [
        integration.trainingItems,
        integration.healthItems,
        integration.ppeItems,
        integration.riskItems,
        integration.accidentItems,
        integration.documentItems,
      ]
    : [];

  confidence +=
    modules.filter(
      (items) => items.length > 0
    ).length * 4;

  confidence -= Math.min(
    20,
    missingFields.length * 3
  );

  return clamp(
    Math.round(confidence),
    35,
    98
  );
}

function createHeadline(
  employeeName: string,
  riskLevel: DoraEmployeeRiskLevel
): string {

  const map = {
    LOW: "Düşük Risk",
    MEDIUM: "Orta Risk",
    HIGH: "Yüksek Risk",
    CRITICAL: "Kritik Risk",
  };

  return `${employeeName} • ${map[riskLevel]}`;
}

function createSummary(args: {
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  score: number;
  riskLevel: DoraEmployeeRiskLevel;
  riskSignals: string[];
}): string {

  const identity = [
    args.employeeName,
    args.jobTitle,
    args.department,
  ]
    .filter(Boolean)
    .join(" • ");

  const risks =
    args.riskSignals.length > 0
      ? args.riskSignals
          .slice(0, 4)
          .join(", ")
      : "Belirgin risk sinyali bulunmadı";

  return `${identity}. DORA analizine göre çalışan risk puanı ${args.score}/100 seviyesindedir. Genel değerlendirme: ${riskLevelLabel(args.riskLevel)}. Öne çıkan konular: ${risks}.`;
}

function getRiskLevel(
  score: number
): DoraEmployeeRiskLevel {

  if (score >= 80)
    return "CRITICAL";

  if (score >= 60)
    return "HIGH";

  if (score >= 35)
    return "MEDIUM";

  return "LOW";
}

function riskLevelLabel(
  value: DoraEmployeeRiskLevel
): string {

  return {
    LOW: "Düşük Risk",
    MEDIUM: "Orta Risk",
    HIGH: "Yüksek Risk",
    CRITICAL: "Kritik Risk",
  }[value];
}

function statusLabel(
  value: string
): string {

  return {
    COMPLETE: "Tamamlandı",
    MISSING: "Eksik",
    EXPIRING: "Yaklaşıyor",
    UNKNOWN: "Veri Yok",
  }[value] || "Veri Yok";
}

function normalizeStatus(
  value: string
):
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN" {

  if (value === "COMPLETE")
    return "COMPLETE";

  if (value === "MISSING")
    return "MISSING";

  if (value === "EXPIRING")
    return "EXPIRING";

  return "UNKNOWN";
}

function priorityValue(
  priority: string
): number {

  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[priority] || 0;
}

function clamp(
  value: number,
  min: number,
  max: number
): number {

  return Math.max(
    min,
    Math.min(max, value)
  );
}