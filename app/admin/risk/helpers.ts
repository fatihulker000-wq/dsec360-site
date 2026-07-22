/* ==========================================================
   D-SEC Enterprise
   Risk Management V2
   Helpers
========================================================== */

import {
  KPI_COLORS,
  RISK_LEVELS,
} from "./constants";

import type { RiskLevel } from "./types";

/* ==========================================================
   DATE
========================================================== */

export function formatDate(
  value?: number | null
): string {

  if (!value) return "-";

  const d = new Date(value);

  if (isNaN(d.getTime()))
    return "-";

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(d);

}

export function formatDateTime(
  value?: number | null
): string {

  if (!value) return "-";

  const d = new Date(value);

  if (isNaN(d.getTime()))
    return "-";

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(d);

}

/* ==========================================================
   SCORE
========================================================== */

export function fineKinneyScore(

  probability: number,

  frequency: number,

  severity: number

) {

  return (
    probability *
    frequency *
    severity
  );

}

/* ==========================================================
   LEVEL
========================================================== */

export function riskLevelFromScore(

  score: number

): RiskLevel {

  if (score < 20)
    return "LOW";

  if (score < 70)
    return "MEDIUM";

  if (score < 200)
    return "HIGH";

  if (score < 400)
    return "VERY_HIGH";

  return "INTOLERABLE";

}

/* ==========================================================
   LEVEL LABEL
========================================================== */

export function riskLabel(

  level: RiskLevel

) {

  return (

    RISK_LEVELS.find(
      x => x.value === level
    )?.label ||

    level

  );

}

/* ==========================================================
   LEVEL COLOR
========================================================== */

export function riskColor(

  level: RiskLevel

) {

  return (

    RISK_LEVELS.find(
      x => x.value === level
    )?.color ||

    KPI_COLORS.primary

  );

}

export function riskBackground(

  level: RiskLevel

) {

  return (

    RISK_LEVELS.find(
      x => x.value === level
    )?.background ||

    "#F3F4F6"

  );

}

/* ==========================================================
   PERCENT
========================================================== */

export function percent(

  value: number,

  total: number

) {

  if (total === 0)
    return 0;

  return Math.round(
    (value / total) * 100
  );

}

/* ==========================================================
   TEXT
========================================================== */

export function capitalize(

  value?: string

) {

  if (!value)
    return "";

  return (

    value.charAt(0)
      .toUpperCase()

    +

    value.slice(1)
      .toLowerCase()

  );

}

/* ==========================================================
   UUID
========================================================== */

export function randomId() {

  return crypto.randomUUID();

}

/* ==========================================================
   FILE
========================================================== */

export function isImage(

  url?: string | null

) {

  if (!url)
    return false;

  return /\.(png|jpg|jpeg|webp)$/i.test(
    url
  );

}

/* ==========================================================
   DANGER
========================================================== */

export function dangerClassColor(

  value: string

) {

  switch (value) {

    case "AZ_TEHLIKELI":
      return "#16A34A";

    case "TEHLIKELI":
      return "#F59E0B";

    case "COK_TEHLIKELI":
      return "#DC2626";

    default:
      return "#64748B";

  }

}

/* ==========================================================
   KPI
========================================================== */

export function averageScore(

  scores: number[]

) {

  if (scores.length === 0)
    return 0;

  return Math.round(

    scores.reduce(
      (a, b) => a + b,
      0
    ) /

    scores.length

  );

}

/* ==========================================================
   GROUP
========================================================== */

export function groupBy<T>(

  array: T[],

  selector: (x: T) => string

) {

  return array.reduce(

    (acc, item) => {

      const key =
        selector(item);

      acc[key] ??= [];

      acc[key].push(item);

      return acc;

    },

    {} as Record<
      string,
      T[]
    >

  );

}