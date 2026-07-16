export interface PredictionInput {
  completionRate: number;
  averageFinalScore: number;
  averageEvidenceScore: number;

  assignedTrainings: number;
  completedTrainings: number;

  monthlyGrowthRate: number;

  overdueTrainings: number;

  expiringCertificates: number;
}

export interface PredictionResult {

  next30: number;

  next60: number;

  next90: number;

  confidence: number;

  trend:
    | "UP"
    | "STABLE"
    | "DOWN";

  recommendations: string[];

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

function predictScore(

  current: number,

  growth: number,

  month: number

) {

  return clamp(

    current +
      growth * month

  );

}

function buildConfidence(
  input: PredictionInput
) {

  let confidence = 70;

  confidence +=
    input.averageEvidenceScore *
    0.10;

  confidence +=
    input.averageFinalScore *
    0.05;

  confidence -=
    input.overdueTrainings *
    0.40;

  confidence -=
    input.expiringCertificates *
    0.30;

  return clamp(confidence);

}

function buildRecommendations(
  input: PredictionInput
) {

  const list: string[] =
    [];

  if (
    input.overdueTrainings >
    0
  ) {

    list.push(
      "Geciken eğitimler tamamlanmalıdır."
    );

  }

  if (
    input.expiringCertificates >
    0
  ) {

    list.push(
      "Yaklaşan sertifika yenilemeleri planlanmalıdır."
    );

  }

  if (
    input.averageFinalScore <
    70
  ) {

    list.push(
      "Final sınav başarı oranı artırılmalıdır."
    );

  }

  if (
    input.averageEvidenceScore <
    75
  ) {

    list.push(
      "Kanıt kalitesi geliştirilmelidir."
    );

  }

  if (
    input.monthlyGrowthRate >
    0
  ) {

    list.push(
      "Mevcut eğitim stratejisi korunabilir."
    );

  }

  if (
    list.length === 0
  ) {

    list.push(
      "AI kritik risk tespit etmedi."
    );

  }

  return list;

}

export function buildPrediction(

  input:
    PredictionInput

): PredictionResult {

  const next30 =
    predictScore(

      input.completionRate,

      input.monthlyGrowthRate,

      1

    );

  const next60 =
    predictScore(

      input.completionRate,

      input.monthlyGrowthRate,

      2

    );

  const next90 =
    predictScore(

      input.completionRate,

      input.monthlyGrowthRate,

      3

    );

  let trend:
    | "UP"
    | "STABLE"
    | "DOWN" =
    "STABLE";

  if (
    input.monthlyGrowthRate >
    1
  ) {

    trend = "UP";

  }
  else if (
    input.monthlyGrowthRate <
    -1
  ) {

    trend = "DOWN";

  }

  return {

    next30,

    next60,

    next90,

    confidence:
      buildConfidence(
        input
      ),

    trend,

    recommendations:
      buildRecommendations(
        input
      ),

  };

}

export function getPredictionMessage(

  result:
    PredictionResult

) {

  switch (
    result.trend
  ) {

    case "UP":

      return `Mevcut performans korunursa yaklaşık 90 gün içinde eğitim tamamlama oranının %${result.next90} seviyesine ulaşması beklenmektedir.`;

    case "DOWN":

      return "Eğilim düşüş yönündedir. Yeni eğitim planları oluşturulmalıdır.";

    default:

      return "Eğitim performansı stabil görünmektedir.";

  }

}

export function buildExecutiveForecast(

  result:
    PredictionResult

) {

  return {

    title:
      "AI Eğitim Tahmini",

    confidence:
      result.confidence,

    trend:
      result.trend,

    next30:
      result.next30,

    next60:
      result.next60,

    next90:
      result.next90,

    summary:
      getPredictionMessage(
        result
      ),

    actions:
      result.recommendations,

  };

}