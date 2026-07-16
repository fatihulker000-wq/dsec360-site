export type HeatmapRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type HeatmapColor =
  | "GREEN"
  | "YELLOW"
  | "ORANGE"
  | "RED";

export interface HeatmapCellInput {
  id: string;

  title: string;

  department: string;

  employeeCount: number;

  completionRate: number;

  averageExamScore: number;

  averageEvidenceScore: number;

  certificateRate: number;

  overdueTrainingCount: number;

  expiredCertificateCount: number;
}

export interface HeatmapCell {

  id: string;

  title: string;

  department: string;

  score: number;

  risk: HeatmapRiskLevel;

  color: HeatmapColor;

  tooltip: string;

}

function clamp(
  value: number,
  min = 0,
  max = 100
) {

  return Math.min(
    max,
    Math.max(
      min,
      Math.round(value)
    )
  );

}

function calculateRiskScore(
  item: HeatmapCellInput
) {

  let score =

    item.completionRate * 0.35 +

    item.averageExamScore * 0.20 +

    item.averageEvidenceScore * 0.25 +

    item.certificateRate * 0.20;

  score -=
    item.overdueTrainingCount * 1.5;

  score -=
    item.expiredCertificateCount * 2;

  return clamp(score);

}

function getRiskLevel(
  score: number
): HeatmapRiskLevel {

  if (score >= 90)
    return "LOW";

  if (score >= 75)
    return "MEDIUM";

  if (score >= 55)
    return "HIGH";

  return "CRITICAL";

}

function getColor(
  risk: HeatmapRiskLevel
): HeatmapColor {

  switch (risk) {

    case "LOW":
      return "GREEN";

    case "MEDIUM":
      return "YELLOW";

    case "HIGH":
      return "ORANGE";

    default:
      return "RED";

  }

}

function buildTooltip(
  item: HeatmapCellInput,
  score: number,
  risk: HeatmapRiskLevel
) {

  return [

    `Departman : ${item.department}`,

    `Çalışan : ${item.employeeCount}`,

    `Tamamlama : %${item.completionRate}`,

    `Final : ${item.averageExamScore}`,

    `Kanıt : ${item.averageEvidenceScore}`,

    `Sertifika : %${item.certificateRate}`,

    `Risk : ${risk}`,

    `AI : ${score}`

  ].join("\n");

}

export function buildHeatmap(

  items:
    HeatmapCellInput[]

): HeatmapCell[] {

  return items

    .map((item) => {

      const score =
        calculateRiskScore(item);

      const risk =
        getRiskLevel(score);

      return {

        id: item.id,

        title: item.title,

        department:
          item.department,

        score,

        risk,

        color:
          getColor(risk),

        tooltip:
          buildTooltip(
            item,
            score,
            risk
          ),

      };

    })

    .sort(
      (a, b) =>
        a.score - b.score
    );

}

export function getCriticalAreas(

  heatmap:
    HeatmapCell[]

) {

  return heatmap.filter(

    (item) =>

      item.risk ===
        "CRITICAL"

  );

}

export function getHighRiskAreas(

  heatmap:
    HeatmapCell[]

) {

  return heatmap.filter(

    (item) =>

      item.risk ===
        "HIGH"

  );

}

export function getHealthyAreas(

  heatmap:
    HeatmapCell[]

) {

  return heatmap.filter(

    (item) =>

      item.risk ===
        "LOW"

  );

}

export function buildHeatmapSummary(

  heatmap:
    HeatmapCell[]

) {

  return {

    critical:

      getCriticalAreas(
        heatmap
      ).length,

    high:

      getHighRiskAreas(
        heatmap
      ).length,

    healthy:

      getHealthyAreas(
        heatmap
      ).length,

    averageScore:

      Math.round(

        heatmap.reduce(

          (sum, item) =>

            sum + item.score,

          0

        ) /

          Math.max(
            heatmap.length,
            1
          )

      ),

  };

}