export interface MonthlyTrainingTrend {
  month: string;

  assigned: number;

  completed: number;

  completionRate: number;

  averageFinalScore: number;

  certificateCount: number;

  evidenceScore: number;

  aiScore: number;
}

export interface TrendSummary {
  completionChange: number;

  examChange: number;

  certificateChange: number;

  evidenceChange: number;

  aiScoreChange: number;
}

export interface TrendAnalysisResult {
  monthly: MonthlyTrainingTrend[];

  summary: TrendSummary;

  direction:
    | "UP"
    | "DOWN"
    | "STABLE";
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function percent(
  part: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return round(
    (part / total) * 100
  );
}

export function createMonthlyTrend(
  data: {
    month: string;

    assigned: number;

    completed: number;

    averageFinalScore: number;

    certificateCount: number;

    evidenceScore: number;

    aiScore: number;
  }[]
): TrendAnalysisResult {

  const monthly =
    data.map((item) => ({

      month: item.month,

      assigned: item.assigned,

      completed: item.completed,

      completionRate: percent(
        item.completed,
        item.assigned
      ),

      averageFinalScore:
        round(item.averageFinalScore),

      certificateCount:
        item.certificateCount,

      evidenceScore:
        round(item.evidenceScore),

      aiScore:
        round(item.aiScore),

    }));

  if (monthly.length === 0) {

    return {

      monthly: [],

      summary: {

        completionChange: 0,

        examChange: 0,

        certificateChange: 0,

        evidenceChange: 0,

        aiScoreChange: 0,

      },

      direction: "STABLE",

    };

  }

  const first = monthly[0];

  const last =
    monthly[
      monthly.length - 1
    ];

  const summary = {

    completionChange:
      round(
        last.completionRate -
          first.completionRate
      ),

    examChange:
      round(
        last.averageFinalScore -
          first.averageFinalScore
      ),

    certificateChange:
      last.certificateCount -
      first.certificateCount,

    evidenceChange:
      round(
        last.evidenceScore -
          first.evidenceScore
      ),

    aiScoreChange:
      round(
        last.aiScore -
          first.aiScore
      ),

  };

  let direction:
    | "UP"
    | "DOWN"
    | "STABLE" =
    "STABLE";

  const score =
    summary.completionChange +
    summary.examChange +
    summary.evidenceChange +
    summary.aiScoreChange;

  if (score > 5) {

    direction = "UP";

  }
  else if (score < -5) {

    direction = "DOWN";

  }

  return {

    monthly,

    summary,

    direction,

  };

}

export function createPrediction(
  monthly:
    MonthlyTrainingTrend[]
) {

  if (
    monthly.length < 2
  ) {

    return {

      next30: 0,

      next60: 0,

      next90: 0,

    };

  }

  const last =
    monthly[
      monthly.length - 1
    ];

  const previous =
    monthly[
      monthly.length - 2
    ];

  const delta =
    last.completionRate -
    previous.completionRate;

  return {

    next30:
      Math.min(
        100,
        round(
          last.completionRate +
            delta
        )
      ),

    next60:
      Math.min(
        100,
        round(
          last.completionRate +
            delta * 2
        )
      ),

    next90:
      Math.min(
        100,
        round(
          last.completionRate +
            delta * 3
        )
      ),

  };

}

export function getTrendMessage(
  result:
    TrendAnalysisResult
) {

  switch (
    result.direction
  ) {

    case "UP":

      return "Son aylarda eğitim performansı yükseliş eğilimindedir.";

    case "DOWN":

      return "Son aylarda eğitim performansında düşüş gözlenmektedir.";

    default:

      return "Eğitim performansı stabil seviyededir.";

  }

}

export function buildTrendReport(
  result:
    TrendAnalysisResult
) {

  return {

    title:
      "AI Trend Analizi",

    direction:
      result.direction,

    summary:
      result.summary,

    message:
      getTrendMessage(
        result
      ),

  };

}