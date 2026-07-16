import {
  IncidentAiLevel,
  IncidentAiScoreResult,
  IncidentMetrics,
} from "./types";

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(min, Math.round(value))
  );
}

function percent(
  value: number,
  total: number
) {
  if (total <= 0) return 0;

  return clamp((value / total) * 100);
}

export function calculateIncidentAiScore(
  metrics: IncidentMetrics
): IncidentAiScoreResult {

  const totalEvents =
    Math.max(metrics.totalEvents, 1);

  /*
   Pozitif göstergeler
  */

  const nearMissRate =
    percent(
      metrics.nearMiss,
      totalEvents
    );

  const rootCauseRate =
    clamp(
      metrics.rootCauseClosedRate
    );

  /*
   Negatif göstergeler
  */

  const accidentRate =
    percent(
      metrics.accidents,
      totalEvents
    );

  const severityPenalty =
    clamp(
      metrics.severityAverage * 10,
      0,
      30
    );

  const lostDayPenalty =
    clamp(
      metrics.totalLostDays * 0.40,
      0,
      20
    );

  const repeatedPenalty =
    clamp(
      metrics.repeatedEvents * 3,
      0,
      20
    );

  const investigationPenalty =
    clamp(
      metrics.openInvestigations * 2,
      0,
      20
    );

  const correctivePenalty =
    clamp(
      metrics.openCorrectiveActions * 1.5,
      0,
      15
    );

  const overduePenalty =
    clamp(
      metrics.overdueCorrectiveActions * 2,
      0,
      20
    );

  const fatalPenalty =
    metrics.fatalities * 25;

  /*
   Skor
  */

  let score = 100;

  score -= accidentRate * 0.35;

  score -= severityPenalty;

  score -= lostDayPenalty;

  score -= repeatedPenalty;

  score -= investigationPenalty;

  score -= correctivePenalty;

  score -= overduePenalty;

  score -= fatalPenalty;

  /*
   Bonuslar
  */

  score += nearMissRate * 0.10;

  score += rootCauseRate * 0.10;

  score = clamp(score);

  let level: IncidentAiLevel;

  let label: string;

  let description: string;

  if (score >= 90) {

    level = "EXCELLENT";

    label = "Mükemmel";

    description =
      "Olay yönetim sistemi kurumsal seviyede çalışıyor.";

  }
  else if (score >= 75) {

    level = "GOOD";

    label = "İyi";

    description =
      "Genel performans iyi. Küçük iyileştirmeler önerilir.";

  }
  else if (score >= 50) {

    level = "RISKY";

    label = "Riskli";

    description =
      "Tekrarlayan olaylar ve açık aksiyonlar risk oluşturuyor.";

  }
  else {

    level = "CRITICAL";

    label = "Kritik";

    description =
      "Acil yönetim müdahalesi gerektiren olay eğilimi mevcut.";

  }

  return {

    score,

    level,

    label,

    description,

  };

}

export function getIncidentScoreColor(
  score: number
) {

  if (score >= 90)
    return "#16a34a";

  if (score >= 75)
    return "#2563eb";

  if (score >= 50)
    return "#ca8a04";

  return "#dc2626";

}

export function getIncidentScoreIcon(
  level: IncidentAiLevel
) {

  switch (level) {

    case "EXCELLENT":
      return "🟢";

    case "GOOD":
      return "🔵";

    case "RISKY":
      return "🟠";

    default:
      return "🔴";

  }

}