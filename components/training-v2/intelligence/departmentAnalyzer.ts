export type DepartmentMetrics = {
  id: string;
  name: string;

  employeeCount: number;

  assignedTrainings: number;
  completedTrainings: number;

  averageFinalScore: number;
  averageEvidenceScore: number;

  certificateCount: number;

  overdueTrainings: number;
  expiredCertificates: number;
};

export type DepartmentRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DepartmentAnalysis = {
  id: string;

  name: string;

  aiScore: number;

  completionRate: number;

  riskLevel: DepartmentRiskLevel;

  performance:
    | "EXCELLENT"
    | "GOOD"
    | "NORMAL"
    | "POOR";

  recommendation: string;
};

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(min, Math.round(value))
  );
}

function percent(
  part: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return clamp((part / total) * 100);
}

function calculateDepartmentScore(
  item: DepartmentMetrics
) {
  const completion =
    percent(
      item.completedTrainings,
      item.assignedTrainings
    );

  const certificate =
    percent(
      item.certificateCount,
      item.completedTrainings
    );

  const score =
    completion * 0.40 +
    item.averageFinalScore * 0.20 +
    item.averageEvidenceScore * 0.25 +
    certificate * 0.15;

  const penalty =
    item.overdueTrainings * 1.2 +
    item.expiredCertificates * 2;

  return clamp(score - penalty);
}

function getRisk(
  score: number
): DepartmentRiskLevel {

  if (score >= 90)
    return "LOW";

  if (score >= 75)
    return "MEDIUM";

  if (score >= 55)
    return "HIGH";

  return "CRITICAL";
}

function getPerformance(
  score: number
): DepartmentAnalysis["performance"] {
  if (score >= 90) {
    return "EXCELLENT";
  }

  if (score >= 75) {
    return "GOOD";
  }

  if (score >= 60) {
    return "NORMAL";
  }

  return "POOR";
}

function createRecommendation(
  score: number,
  metrics: DepartmentMetrics
) {

  if (
    metrics.overdueTrainings >
    0
  ) {

    return "Geciken eğitimler öncelikli planlanmalıdır.";

  }

  if (
    metrics.expiredCertificates >
    0
  ) {

    return "Sertifika yenileme eğitimleri başlatılmalıdır.";

  }

  if (
    metrics.averageFinalScore <
    70
  ) {

    return "Final sınav başarı oranı artırılmalıdır.";

  }

  if (
    metrics.averageEvidenceScore <
    75
  ) {

    return "Kanıt kalitesi iyileştirilmelidir.";

  }

  if (score >= 90) {

    return "Departman performansı örnek seviyededir.";

  }

  return "Mevcut eğitim planı düzenli takip edilmelidir.";
}

export function analyzeDepartments(
  departments: DepartmentMetrics[]
): DepartmentAnalysis[] {

  return departments

    .map((item) => {

      const aiScore =
        calculateDepartmentScore(
          item
        );

      return {

        id: item.id,

        name: item.name,

        aiScore,

        completionRate:
          percent(
            item.completedTrainings,
            item.assignedTrainings
          ),

        riskLevel:
          getRisk(aiScore),

        performance:
          getPerformance(aiScore),

        recommendation:
          createRecommendation(
            aiScore,
            item
          ),

      };

    })

    .sort(
      (a, b) =>
        b.aiScore - a.aiScore
    );

}

export function getBestDepartment(
  departments:
    DepartmentAnalysis[]
) {

  return departments[0] ?? null;

}

export function getWorstDepartment(
  departments:
    DepartmentAnalysis[]
) {

  if (
    departments.length === 0
  ) {

    return null;

  }

  return departments[
    departments.length - 1
  ];

}

export function getAverageDepartmentScore(
  departments:
    DepartmentAnalysis[]
) {

  if (
    departments.length === 0
  ) {

    return 0;

  }

  return Math.round(

    departments.reduce(

      (sum, item) =>
        sum + item.aiScore,

      0

    ) /

      departments.length

  );

}

export function buildDepartmentSummary(
  departments:
    DepartmentAnalysis[]
) {

  return {

    averageScore:
      getAverageDepartmentScore(
        departments
      ),

    bestDepartment:
      getBestDepartment(
        departments
      ),

    worstDepartment:
      getWorstDepartment(
        departments
      ),

    totalDepartments:
      departments.length,

  };

}