import {
  ExecutiveGrade,
  ExecutiveModuleScore,
} from "./types";

export interface ExecutiveScoreInput {

  modules: ExecutiveModuleScore[];

}

export interface ExecutiveScoreResult {

  overallScore: number;

  grade: ExecutiveGrade;

  maturity: number;

  legalCompliance: number;

  digitalization: number;

  operationalRisk: number;

}

export function calculateExecutiveScore(

  input: ExecutiveScoreInput

): ExecutiveScoreResult {

  if (
    input.modules.length === 0
  ) {

    return {

      overallScore: 0,

      grade: "D",

      maturity: 0,

      legalCompliance: 0,

      digitalization: 0,

      operationalRisk: 100,

    };

  }

  //--------------------------------------------------

  // Weighted Score

  //--------------------------------------------------

  let totalWeight = 0;

  let weightedScore = 0;

  input.modules.forEach(

    module => {

      totalWeight += module.weight;

      weightedScore +=
        module.score *
        module.weight;

    }

  );

  const overallScore =

    Math.round(

      weightedScore /

      Math.max(
        totalWeight,
        1
      )

    );

  //--------------------------------------------------

  // Grade

  //--------------------------------------------------

  let grade: ExecutiveGrade = "D";

  if (overallScore >= 95)

    grade = "A+";

  else if (overallScore >= 90)

    grade = "A";

  else if (overallScore >= 75)

    grade = "B";

  else if (overallScore >= 60)

    grade = "C";

  //--------------------------------------------------

  // Maturity

  //--------------------------------------------------

  const maturity =

    Math.round(

      overallScore * 0.96

    );

  //--------------------------------------------------

  // Legal Compliance

  //--------------------------------------------------

  const legalCompliance =

    Math.round(

      input.modules

        .filter(

          m =>

            [

              "training",

              "audit",

              "risk",

              "health",

              "ibys",

            ].includes(

              m.key

            )

        )

        .reduce(

          (

            total,

            module

          ) =>

            total +

            module.score,

          0

        ) /

      Math.max(

        input.modules.filter(

          m =>

            [

              "training",

              "audit",

              "risk",

              "health",

              "ibys",

            ].includes(

              m.key

            )

        ).length,

        1

      )

    );

  //--------------------------------------------------

  // Digitalization

  //--------------------------------------------------

  const digitalization =

    Math.round(

      input.modules

        .reduce(

          (

            total,

            module

          ) =>

            total +

            module.score,

          0

        ) /

      input.modules.length

    );

  //--------------------------------------------------

  // Operational Risk

  //--------------------------------------------------

  const averagePriority =

    input.modules.reduce(

      (

        total,

        module

      ) => {

        switch (

          module.priority

        ) {

          case "LOW":

            return total + 10;

          case "MEDIUM":

            return total + 35;

          case "HIGH":

            return total + 70;

          case "CRITICAL":

            return total + 100;

        }

      },

      0

    ) /

    input.modules.length;

  const operationalRisk =

    Math.round(

      averagePriority

    );

  //--------------------------------------------------

  return {

    overallScore,

    grade,

    maturity,

    legalCompliance,

    digitalization,

    operationalRisk,

  };

}