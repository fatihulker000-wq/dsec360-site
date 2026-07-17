import {
  ExecutiveModuleScore,
} from "./types";

export interface ExecutiveComplianceResult {

  legalCompliance: number;

  completedModules: number;

  totalModules: number;

  missingModules: string[];

}

export function calculateExecutiveCompliance(

  modules: ExecutiveModuleScore[]

): ExecutiveComplianceResult {

  const legalModules = [

    "training",

    "audit",

    "risk",

    "health",

    "ppe",

    "ibys",

    "emergency",

    "documentation",

  ];

  const selectedModules =
    modules.filter(

      module =>

        legalModules.includes(

          module.key

        )

    );

  const totalModules =
    selectedModules.length;

  const completedModules =
    selectedModules.filter(

      module =>

        module.score >= 80

    ).length;

  const missingModules =
    selectedModules

      .filter(

        module =>

          module.score < 80

      )

      .map(

        module =>

          module.title

      );

  const legalCompliance =

    totalModules === 0

      ? 0

      : Math.round(

          completedModules /

          totalModules *

          100

        );

  return {

    legalCompliance,

    completedModules,

    totalModules,

    missingModules,

  };

}
