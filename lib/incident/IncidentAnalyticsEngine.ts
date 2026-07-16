import {
  IncidentAnalyticsData,
  IncidentAnalyticsMetrics,
  IncidentAnalyticsPrediction,
  IncidentAnalyticsRecommendation,
  IncidentAnalyticsRecord,
  IncidentAnalyticsRiskLevel,
  IncidentDistributionItem,
  IncidentTrendPoint,
} from "@/components/incident-v2/analytics/types";

type AnalyticsOptions = {
  workedHours?: number;
  employeeCount?: number;
};

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    maximum,
    Math.max(minimum, Math.round(value))
  );
}

function percentage(
  part: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function normalizeDate(
  value: string | number
) {
  if (typeof value === "number") {
    return new Date(value);
  }

  return new Date(value);
}

function getRiskLevel(
  score: number
): IncidentAnalyticsRiskLevel {
  if (score >= 80) {
    return "LOW";
  }

  if (score >= 60) {
    return "MEDIUM";
  }

  if (score >= 40) {
    return "HIGH";
  }

  return "CRITICAL";
}

function calculateAiIncidentScore(
  records: IncidentAnalyticsRecord[]
) {
  if (records.length === 0) {
    return 100;
  }

  const accidents = records.filter(
    (record) =>
      record.incidentType === "WORK_ACCIDENT" ||
      record.incidentType === "KAZA"
  ).length;

  const fatalities = records.filter(
    (record) =>
      record.isFatal === true ||
      record.severity >= 5
  ).length;

  const totalLostDays = records.reduce(
    (sum, record) =>
      sum + Number(record.lostWorkDays || 0),
    0
  );

  const averageSeverity =
    records.reduce(
      (sum, record) =>
        sum + Number(record.severity || 0),
      0
    ) / records.length;

  const openInvestigations = records.filter(
    (record) =>
      record.investigationStatus === "OPEN" ||
      record.investigationStatus ===
        "IN_PROGRESS"
  ).length;

  const overdueActions = records.filter(
    (record) =>
      record.correctiveActionStatus ===
        "OVERDUE" ||
      (
        record.correctiveActionStatus !==
          "COMPLETED" &&
        record.actionDueDate &&
        new Date(record.actionDueDate).getTime() <
          Date.now()
      )
  ).length;

  let score = 100;

  score -= percentage(
    accidents,
    records.length
  ) * 0.2;

  score -= clamp(
    averageSeverity * 7,
    0,
    25
  );

  score -= clamp(
    totalLostDays * 0.35,
    0,
    20
  );

  score -= clamp(
    openInvestigations * 2,
    0,
    15
  );

  score -= clamp(
    overdueActions * 3,
    0,
    20
  );

  score -= fatalities * 25;

  return clamp(score);
}

function groupDistribution(
  records: IncidentAnalyticsRecord[],
  selector: (
    record: IncidentAnalyticsRecord
  ) => string
): IncidentDistributionItem[] {
  const map = new Map<string, number>();

  records.forEach((record) => {
    const label =
      selector(record)?.trim() ||
      "Belirtilmemiş";

    map.set(
      label,
      (map.get(label) || 0) + 1
    );
  });

  return [...map.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(
        count,
        records.length
      ),
      score: clamp(
        100 -
          percentage(
            count,
            Math.max(records.length, 1)
          )
      ),
      riskLevel: getRiskLevel(
        clamp(
          100 -
            percentage(
              count,
              Math.max(records.length, 1)
            )
        )
      ),
    }))
    .sort(
      (first, second) =>
        second.count - first.count
    );
}

function buildMonthlyTrend(
  records: IncidentAnalyticsRecord[]
): IncidentTrendPoint[] {
  const now = new Date();

  return Array.from(
    { length: 12 },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 11 + index,
        1
      );

      const month = date.getMonth();

      const year = date.getFullYear();

      const rows = records.filter((record) => {
        const eventDate =
          normalizeDate(record.eventDate);

        return (
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });

      const accidents = rows.filter(
        (record) =>
          record.incidentType ===
            "WORK_ACCIDENT" ||
          record.incidentType === "KAZA"
      ).length;

      const nearMisses = rows.filter(
        (record) =>
          record.incidentType ===
            "NEAR_MISS" ||
          record.incidentType ===
            "RAMAK_KALA"
      ).length;

      const lostDays = rows.reduce(
        (sum, record) =>
          sum +
          Number(record.lostWorkDays || 0),
        0
      );

      const severityAverage =
        rows.length === 0
          ? 0
          : Math.round(
              (
                rows.reduce(
                  (sum, record) =>
                    sum +
                    Number(
                      record.severity || 0
                    ),
                  0
                ) / rows.length
              ) * 10
            ) / 10;

      return {
        key: `${year}-${String(
          month + 1
        ).padStart(2, "0")}`,

        label: date.toLocaleDateString(
          "tr-TR",
          {
            month: "short",
          }
        ),

        total: rows.length,

        accidents,

        nearMisses,

        lostDays,

        severityAverage,
      };
    }
  );
}

function calculatePrediction(
  trend: IncidentTrendPoint[]
): IncidentAnalyticsPrediction {
  if (trend.length < 2) {
    return {
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      repeatProbability: 0,
      confidence: 50,
      trend: "STABLE",
    };
  }

  const recent = trend.slice(-3);

  const previous = trend.slice(-6, -3);

  const recentAverage =
    recent.reduce(
      (sum, item) =>
        sum + item.total,
      0
    ) / Math.max(recent.length, 1);

  const previousAverage =
    previous.reduce(
      (sum, item) =>
        sum + item.total,
      0
    ) / Math.max(previous.length, 1);

  const delta =
    recentAverage - previousAverage;

  const trendDirection =
    delta > 0.5
      ? "UP"
      : delta < -0.5
      ? "DOWN"
      : "STABLE";

  return {
    next30Days: Math.max(
      0,
      Math.round(
        recentAverage + delta
      )
    ),

    next60Days: Math.max(
      0,
      Math.round(
        recentAverage + delta * 2
      )
    ),

    next90Days: Math.max(
      0,
      Math.round(
        recentAverage + delta * 3
      )
    ),

    repeatProbability: clamp(
      recentAverage * 12 +
        Math.max(delta, 0) * 8
    ),

    confidence: clamp(
      70 +
        Math.min(
          trend.length,
          12
        ) *
          2,
      0,
      95
    ),

    trend: trendDirection,
  };
}

function buildRecommendations(
  metrics: IncidentAnalyticsMetrics,
  data: {
    departments: IncidentDistributionItem[];
    rootCauses: IncidentDistributionItem[];
    prediction: IncidentAnalyticsPrediction;
  }
): IncidentAnalyticsRecommendation[] {
  const recommendations:
    IncidentAnalyticsRecommendation[] = [];

  if (
    metrics.overdueCorrectiveActions > 0
  ) {
    recommendations.push({
      id: "overdue-actions",
      title: "Geciken DÖF kayıtları",
      description: `${metrics.overdueCorrectiveActions} geciken aksiyon bulunuyor.`,
      action:
        "Sorumluları ve termin tarihlerini yeniden planlayın.",
      priority: "CRITICAL",
      category: "CORRECTIVE_ACTION",
    });
  }

  if (
    metrics.openInvestigations > 0
  ) {
    recommendations.push({
      id: "open-investigations",
      title: "Açık soruşturmalar",
      description: `${metrics.openInvestigations} soruşturma henüz kapanmadı.`,
      action:
        "Soruşturma sorumlularına görev hatırlatması gönderin.",
      priority: "HIGH",
      category: "INVESTIGATION",
    });
  }

  const topDepartment =
    data.departments[0];

  if (
    topDepartment &&
    topDepartment.count > 1
  ) {
    recommendations.push({
      id: "department-risk",
      title: "Riskli departman",
      description: `${topDepartment.label} bölümünde ${topDepartment.count} olay kaydı bulunuyor.`,
      action:
        "Bölüme özel saha denetimi ve eğitim planlayın.",
      priority: "HIGH",
      category: "INSPECTION",
    });
  }

  const topRootCause =
    data.rootCauses[0];

  if (
    topRootCause &&
    topRootCause.count > 1
  ) {
    recommendations.push({
      id: "root-cause",
      title: "Tekrarlayan kök neden",
      description: `${topRootCause.label} en sık görülen kök neden.`,
      action:
        "Risk değerlendirmesini ve ilgili prosedürleri revize edin.",
      priority: "HIGH",
      category: "RISK",
    });
  }

  if (
    data.prediction.trend === "UP"
  ) {
    recommendations.push({
      id: "incident-trend",
      title: "Olay eğilimi yükseliyor",
      description:
        "Son dönem olay ortalamasında artış tespit edildi.",
      action:
        "Yönetim gözden geçirme toplantısı planlayın.",
      priority: "CRITICAL",
      category: "MANAGEMENT",
    });
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push({
      id: "stable",
      title: "Olay performansı stabil",
      description:
        "Kritik yeni bir eğilim tespit edilmedi.",
      action:
        "Mevcut denetim ve eğitim planını sürdürün.",
      priority: "LOW",
      category: "MANAGEMENT",
    });
  }

  return recommendations;
}

export class IncidentAnalyticsEngine {
  static analyze(
    records: IncidentAnalyticsRecord[],
    options: AnalyticsOptions = {}
  ): IncidentAnalyticsData {
    const workedHours =
      options.workedHours || 0;

    const employeeCount =
      options.employeeCount || 0;

    const workAccidents =
      records.filter(
        (record) =>
          record.incidentType ===
            "WORK_ACCIDENT" ||
          record.incidentType === "KAZA"
      ).length;

    const nearMisses =
      records.filter(
        (record) =>
          record.incidentType ===
            "NEAR_MISS" ||
          record.incidentType ===
            "RAMAK_KALA"
      ).length;

    const unsafeConditions =
      records.filter(
        (record) =>
          record.incidentType ===
            "UNSAFE_CONDITION" ||
          record.incidentType ===
            "TEHLIKELI_DURUM"
      ).length;

    const occupationalDiseases =
      records.filter(
        (record) =>
          record.incidentType ===
          "OCCUPATIONAL_DISEASE"
      ).length;

    const fatalities =
      records.filter(
        (record) =>
          record.isFatal === true ||
          record.severity >= 5
      ).length;

    const lostTimeInjuries =
      records.filter(
        (record) =>
          record.isLostTime === true ||
          record.lostWorkDays > 0
      ).length;

    const medicalTreatmentCases =
      records.filter(
        (record) =>
          record.isMedicalTreatment === true
      ).length;

    const restrictedWorkCases =
      records.filter(
        (record) =>
          record.isRestrictedWork === true
      ).length;

    const totalLostDays =
      records.reduce(
        (sum, record) =>
          sum +
          Number(
            record.lostWorkDays || 0
          ),
        0
      );

    const averageSeverity =
      records.length === 0
        ? 0
        : Math.round(
            (
              records.reduce(
                (sum, record) =>
                  sum +
                  Number(
                    record.severity || 0
                  ),
                0
              ) / records.length
            ) * 10
          ) / 10;

    const openInvestigations =
      records.filter(
        (record) =>
          record.investigationStatus ===
            "OPEN" ||
          record.investigationStatus ===
            "IN_PROGRESS"
      ).length;

    const closedInvestigations =
      records.filter(
        (record) =>
          record.investigationStatus ===
            "COMPLETED" ||
          record.investigationStatus ===
            "CLOSED"
      ).length;

    const openCorrectiveActions =
      records.filter(
        (record) =>
          record.correctiveActionStatus ===
            "OPEN" ||
          record.correctiveActionStatus ===
            "IN_PROGRESS"
      ).length;

    const overdueCorrectiveActions =
      records.filter(
        (record) =>
          record.correctiveActionStatus ===
            "OVERDUE" ||
          (
            record.correctiveActionStatus !==
              "COMPLETED" &&
            record.actionDueDate &&
            new Date(
              record.actionDueDate
            ).getTime() < Date.now()
          )
      ).length;

    const monthlyTrend =
      buildMonthlyTrend(records);

    const departmentDistribution =
      groupDistribution(
        records,
        (record) => record.department
      );

    const rootCauseDistribution =
      groupDistribution(
        records,
        (record) =>
          record.rootCauseCategory
      );

    const bodyPartDistribution =
      groupDistribution(
        records,
        (record) =>
          record.injuryBodyPart
      );

    const shiftDistribution =
      groupDistribution(
        records,
        (record) => record.shift
      );

    const locationDistribution =
      groupDistribution(
        records,
        (record) => record.location
      );

    const incidentTypeDistribution =
      groupDistribution(
        records,
        (record) =>
          record.incidentType
      );

    const severityDistribution =
      groupDistribution(
        records,
        (record) =>
          `Seviye ${record.severity || 0}`
      );

    const prediction =
      calculatePrediction(
        monthlyTrend
      );

    const aiIncidentScore =
      calculateAiIncidentScore(records);

    const metrics: IncidentAnalyticsMetrics =
      {
        totalIncidents: records.length,

        workAccidents,

        nearMisses,

        unsafeConditions,

        occupationalDiseases,

        fatalities,

        lostTimeInjuries,

        medicalTreatmentCases,

        restrictedWorkCases,

        totalLostDays,

        openInvestigations,

        closedInvestigations,

        openCorrectiveActions,

        overdueCorrectiveActions,

        averageSeverity,

        completionRate: percentage(
          closedInvestigations,
          openInvestigations +
            closedInvestigations
        ),

        nearMissRate: percentage(
          nearMisses,
          records.length
        ),

        aiIncidentScore,

        riskLevel:
          getRiskLevel(
            aiIncidentScore
          ),

        ltifr:
          workedHours <= 0
            ? 0
            : Math.round(
                (
                  (
                    lostTimeInjuries *
                    1_000_000
                  ) /
                  workedHours
                ) *
                  100
              ) / 100,

        trir:
          workedHours <= 0
            ? 0
            : Math.round(
                (
                  (
                    (
                      lostTimeInjuries +
                      medicalTreatmentCases +
                      restrictedWorkCases
                    ) *
                    200_000
                  ) /
                  workedHours
                ) *
                  100
              ) / 100,

        frequencyRate:
          workedHours <= 0
            ? 0
            : Math.round(
                (
                  (
                    workAccidents *
                    1_000_000
                  ) /
                  workedHours
                ) *
                  100
              ) / 100,

        severityRate:
          workedHours <= 0
            ? 0
            : Math.round(
                (
                  (
                    totalLostDays *
                    1_000_000
                  ) /
                  workedHours
                ) *
                  100
              ) / 100,
      };

    const recommendations =
      buildRecommendations(metrics, {
        departments:
          departmentDistribution,

        rootCauses:
          rootCauseDistribution,

        prediction,
      });

    return {
      metrics,

      monthlyTrend,

      departmentDistribution,

      rootCauseDistribution,

      bodyPartDistribution,

      shiftDistribution,

      locationDistribution,

      incidentTypeDistribution,

      severityDistribution,

      prediction,

      recommendations,
    };
  }
}