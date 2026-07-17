import {
  ExecutiveModuleScore,
  ExecutiveSummary,
} from "./types";

import {
  calculateExecutiveScore,
} from "./ExecutiveScoreEngine";

import {
  buildExecutiveSummary,
} from "./ExecutiveSummaryBuilder";

import {
  buildExecutiveRecommendations,
} from "./ExecutiveRecommendationEngine";

import {
  buildExecutivePredictions,
} from "./ExecutivePredictionEngine";

import {
  buildExecutiveTimeline,
} from "./ExecutiveTimelineEngine";

export interface ExecutiveAiInput {

  companyName: string;

  modules: ExecutiveModuleScore[];

}

export function runExecutiveAi(

  input: ExecutiveAiInput

): ExecutiveSummary {

  //--------------------------------------------------
  // SCORE
  //--------------------------------------------------

  const score =
    calculateExecutiveScore({

      modules:
        input.modules,

    });

  //--------------------------------------------------
  // SUMMARY
  //--------------------------------------------------

  const summary =
    buildExecutiveSummary({

      companyName:
        input.companyName,

      modules:
        input.modules,

    });

  //--------------------------------------------------
  // RECOMMENDATIONS
  //--------------------------------------------------

  const recommendations =
    buildExecutiveRecommendations({

      modules:
        input.modules,

    });

  //--------------------------------------------------
  // PREDICTIONS
  //--------------------------------------------------

  const predictions =
    buildExecutivePredictions({

      modules:
        input.modules,

      overallScore:
        score.overallScore,

      operationalRisk:
        score.operationalRisk,

    });

  //--------------------------------------------------
  // TIMELINE
  //--------------------------------------------------

  const timeline =
    buildExecutiveTimeline({

      recommendations,

    });

  //--------------------------------------------------

  return {

    ...summary,

    recommendations,

    predictions,

    timeline,

  };

}