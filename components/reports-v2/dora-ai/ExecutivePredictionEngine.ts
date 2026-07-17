import {
  ExecutiveModuleScore,
  ExecutivePrediction,
} from "./types";

export interface PredictionInput {
  modules: ExecutiveModuleScore[];
  overallScore: number;
  operationalRisk: number;
}

export function buildExecutivePredictions(
  input: PredictionInput
): ExecutivePrediction[] {

  //--------------------------------------------------
  // Ortalama trend hesapla
  //--------------------------------------------------

  const averageTrend =
    input.modules.length > 0
      ? input.modules.reduce(
          (sum, module) => sum + module.trend,
          0
        ) / input.modules.length
      : 0;

  //--------------------------------------------------
  // Tahmin fonksiyonu
  //--------------------------------------------------

  function project(days: number): ExecutivePrediction {

    // Trend etkisi
    const trendEffect =
      averageTrend * (days / 30);

    // Beklenen skor
    let expectedScore =
      Math.round(
        input.overallScore + trendEffect
      );

    expectedScore =
      Math.max(
        0,
        Math.min(100, expectedScore)
      );

    // Risk ters orantılı
    let expectedRisk =
      Math.round(
        input.operationalRisk - trendEffect
      );

    expectedRisk =
      Math.max(
        0,
        Math.min(100, expectedRisk)
      );

    return {

      period: `${days} Gün`,

      expectedScore,

      expectedRisk,

    };

  }

  //--------------------------------------------------

  return [

    project(30),

    project(60),

    project(90),

    project(180),

  ];

}