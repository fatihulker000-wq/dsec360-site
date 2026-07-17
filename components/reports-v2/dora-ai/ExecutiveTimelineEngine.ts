import {
  ExecutiveRecommendation,
  ExecutiveTimelineItem,
} from "./types";

export interface TimelineInput {
  recommendations: ExecutiveRecommendation[];
}

export function buildExecutiveTimeline(
  input: TimelineInput
): ExecutiveTimelineItem[] {

  const timeline: ExecutiveTimelineItem[] = [];

  //--------------------------------------------------
  // Önceliğe göre sırala
  //--------------------------------------------------

  const ordered =
    [...input.recommendations].sort(
      (a, b) => a.dueDays - b.dueDays
    );

  ordered.forEach((item) => {

    let title = "";

    switch (item.dueDays) {

      case 7:
        title = "Kritik Müdahale";
        break;

      case 15:
        title = "Kısa Vadeli İyileştirme";
        break;

      case 30:
        title = "Operasyonel İyileştirme";
        break;

      case 60:
        title = "Süreç Geliştirme";
        break;

      default:
        title = "Sürdürülebilirlik";
    }

    timeline.push({

      title,

      description:

        `${item.title}: ${item.description}`,

      targetDay:
        item.dueDays,

    });

  });

  //--------------------------------------------------
  // Boş ise varsayılan plan
  //--------------------------------------------------

  if (timeline.length === 0) {

    timeline.push({

      title:
        "Mevcut Durumu Koruma",

      description:
        "Tüm modüller hedef seviyede. Periyodik denetimler devam etmelidir.",

      targetDay: 90,

    });

  }

  //--------------------------------------------------

  return timeline;

}