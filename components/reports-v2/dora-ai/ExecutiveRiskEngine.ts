import {
  ExecutiveModuleScore,
  ExecutivePriority,
} from "./types";

export interface ExecutiveRiskResult {

  operationalRisk: number;

  averageScore: number;

  highestPriority: ExecutivePriority;

  criticalModules: ExecutiveModuleScore[];

  warningCount: number;

}

export function calculateExecutiveRisk(

  modules: ExecutiveModuleScore[]

): ExecutiveRiskResult {

  if (modules.length === 0) {

    return {

      operationalRisk: 100,

      averageScore: 0,

      highestPriority: "CRITICAL",

      criticalModules: [],

      warningCount: 0,

    };

  }

  //--------------------------------------------

  const averageScore =

    Math.round(

      modules.reduce(

        (sum, module) =>

          sum + module.score,

        0

      ) /

      modules.length

    );

  //--------------------------------------------

  const criticalModules =

    modules.filter(

      module =>

        module.priority === "CRITICAL" ||

        module.score < 60

    );

  //--------------------------------------------

  const warningCount =

    modules.filter(

      module =>

        module.score < 80

    ).length;

  //--------------------------------------------

  let highestPriority: ExecutivePriority = "LOW";

  if (

    modules.some(

      module =>

        module.priority === "CRITICAL"

    )

  ) {

    highestPriority = "CRITICAL";

  }

  else if (

    modules.some(

      module =>

        module.priority === "HIGH"

    )

  ) {

    highestPriority = "HIGH";

  }

  else if (

    modules.some(

      module =>

        module.priority === "MEDIUM"

    )

  ) {

    highestPriority = "MEDIUM";

  }

  //--------------------------------------------

  let operationalRisk =

    100 - averageScore;

  //--------------------------------------------

  switch (

    highestPriority

  ) {

    case "CRITICAL":

      operationalRisk += 20;

      break;

    case "HIGH":

      operationalRisk += 10;

      break;

    case "MEDIUM":

      operationalRisk += 5;

      break;
  }

  operationalRisk =

    Math.max(

      0,

      Math.min(

        100,

        operationalRisk

      )

    );

  //--------------------------------------------

  return {

    operationalRisk,

    averageScore,

    highestPriority,

    criticalModules,

    warningCount,

  };

}