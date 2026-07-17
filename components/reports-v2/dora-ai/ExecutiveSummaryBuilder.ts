import {
  ExecutiveSummary,
  ExecutiveModuleScore,
} from "./types";

import {
  calculateExecutiveScore,
} from "./ExecutiveScoreEngine";

export interface ExecutiveSummaryInput {

  companyName: string;

  modules: ExecutiveModuleScore[];

}

export function buildExecutiveSummary(

  input: ExecutiveSummaryInput

): ExecutiveSummary {

  //------------------------------------------------

  // SCORE

  //------------------------------------------------

  const scoreResult =
    calculateExecutiveScore({

      modules:
        input.modules,

    });

  //------------------------------------------------

  // En iyi modüller

  //------------------------------------------------

  const bestModules =
    [...input.modules]

      .sort(
        (a, b) =>
          b.score -
          a.score
      )

      .slice(0, 3);

  //------------------------------------------------

  // En kritik modüller

  //------------------------------------------------

  const criticalModules =
    [...input.modules]

      .sort(
        (a, b) =>
          a.score -
          b.score
      )

      .slice(0, 3);

  //------------------------------------------------

  // Trend

  //------------------------------------------------

  const improving =
    input.modules.filter(

      module =>

        module.trend > 0

    );

  const worsening =
    input.modules.filter(

      module =>

        module.trend < 0

    );

  //------------------------------------------------

  // Executive Text

  //------------------------------------------------

  const text: string[] = [];

  text.push(

    `${input.companyName} firmasının mevcut kurumsal uyum puanı ${scoreResult.overallScore}/100 seviyesindedir.`

  );

  text.push(

    `Genel kurumsal değerlendirme notu ${scoreResult.grade} olarak hesaplanmıştır.`

  );

  //------------------------------------------------

  if (
    bestModules.length
  ) {

    text.push(

      `En güçlü modüller: ${bestModules

        .map(

          module =>

            module.title

        )

        .join(", ")}.`

    );

  }

  //------------------------------------------------

  if (
    criticalModules.length
  ) {

    text.push(

      `İyileştirme gerektiren öncelikli alanlar: ${criticalModules

        .map(

          module =>

            module.title

        )

        .join(", ")}.`

    );

  }

  //------------------------------------------------

  if (
    improving.length
  ) {

    text.push(

      `${improving.length} modülde pozitif performans eğilimi tespit edilmiştir.`

    );

  }

  //------------------------------------------------

  if (
    worsening.length
  ) {

    text.push(

      `${worsening.length} modülde performans düşüşü gözlenmektedir.`

    );

  }

  //------------------------------------------------

  if (
    scoreResult.operationalRisk >= 70
  ) {

    text.push(

      "Operasyonel risk seviyesi yüksektir. Kritik aksiyonların kısa sürede tamamlanması önerilir."

    );

  } else if (

    scoreResult.operationalRisk >= 40

  ) {

    text.push(

      "Operasyonel risk orta seviyededir. Önleyici faaliyetlerin planlı şekilde devam etmesi önerilmektedir."

    );

  } else {

    text.push(

      "Operasyonel risk kabul edilebilir seviyededir. Mevcut uygulamaların sürdürülebilirliği korunmalıdır."

    );

  }

  //------------------------------------------------

  if (
    scoreResult.legalCompliance < 80
  ) {

    text.push(

      "Yasal uyum seviyesinin artırılması amacıyla eğitim, denetim ve sağlık süreçlerinin gözden geçirilmesi tavsiye edilir."

    );

  }

  //------------------------------------------------

  if (
    scoreResult.digitalization < 80
  ) {

    text.push(

      "Dijital süreçlerin yaygınlaştırılması kurumsal performansı olumlu yönde artıracaktır."

    );

  }

  //------------------------------------------------

  return {

    overallScore:
      scoreResult.overallScore,

    grade:
      scoreResult.grade,

    maturity:
      scoreResult.maturity,

    legalCompliance:
      scoreResult.legalCompliance,

    digitalization:
      scoreResult.digitalization,

    operationalRisk:
      scoreResult.operationalRisk,

    modules:
      input.modules,

    recommendations: [],

    predictions: [],

    timeline: [],

    executiveText:
      text.join("\n\n"),

  };

}