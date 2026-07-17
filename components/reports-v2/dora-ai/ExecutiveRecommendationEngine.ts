import {
  ExecutiveModuleScore,
  ExecutiveRecommendation,
} from "./types";

export interface RecommendationInput {
  modules: ExecutiveModuleScore[];
}

export function buildExecutiveRecommendations(
  input: RecommendationInput
): ExecutiveRecommendation[] {

  const recommendations: ExecutiveRecommendation[] = [];

  //--------------------------------------------------
  // Önce en düşük puanlı modüller
  //--------------------------------------------------

  const orderedModules =
    [...input.modules].sort(
      (a, b) => a.score - b.score
    );

  orderedModules.forEach((module) => {

    //--------------------------------------------------

    if (module.score >= 90) {
      return;
    }

    //--------------------------------------------------

    let dueDays = 90;

    switch (module.priority) {

      case "CRITICAL":
        dueDays = 7;
        break;

      case "HIGH":
        dueDays = 15;
        break;

      case "MEDIUM":
        dueDays = 30;
        break;

      default:
        dueDays = 60;
    }

    //--------------------------------------------------

    let description = "";

    switch (module.key) {

      case "training":

        description =
          "Eksik eğitimler tamamlanmalı, eğitim planı güncellenmeli.";

        break;

      case "audit":

        description =
          "Açık denetim bulguları kapatılmalı ve DÖF süreçleri hızlandırılmalı.";

        break;

      case "risk":

        description =
          "Yüksek Fine Kinney riskleri öncelikli olarak azaltılmalı.";

        break;

      case "health":

        description =
          "Periyodik sağlık muayeneleri tamamlanmalı.";

        break;

      case "ppe":

        description =
          "Eksik KKD teslimleri tamamlanmalı.";

        break;

      case "accident":

        description =
          "İş kazalarının kök neden analizi yapılmalı.";

        break;

      case "ibys":

        description =
          "İBYS kayıtları kontrol edilmeli ve başarısız kayıtlar düzeltilmeli.";

        break;

      case "emergency":

        description =
          "Acil durum planı ve tatbikatları gözden geçirilmeli.";

        break;

      case "documentation":

        description =
          "İSG dokümanları güncellenmeli.";

        break;

      default:

        description =
          "Modül performansı iyileştirilmeli.";

    }

    //--------------------------------------------------

    recommendations.push({

      id: module.key,

      priority: module.priority,

      title: module.title,

      description,

      dueDays,

    });

  });

  //--------------------------------------------------
  // Öncelik sıralaması
  //--------------------------------------------------

  const priorityOrder = {

    CRITICAL: 0,

    HIGH: 1,

    MEDIUM: 2,

    LOW: 3,

  };

  return recommendations.sort(

    (a, b) => {

      const priorityCompare =
        priorityOrder[a.priority] -
        priorityOrder[b.priority];

      if (priorityCompare !== 0) {
        return priorityCompare;
      }

      return a.dueDays - b.dueDays;

    }

  );

}