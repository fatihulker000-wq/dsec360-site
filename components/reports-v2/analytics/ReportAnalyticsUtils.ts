import type {
  ReportAnalyticsData,
  ReportAnalyticsInput,
  ReportMonthlyChange,
  ReportTrendPoint,
} from "./types";

export function buildReportAnalyticsData(
  input: ReportAnalyticsInput
): ReportAnalyticsData {

  return {

    trainingTrend:
      normalizeTrend(
        input.trainingTrend
      ),

    auditTrend:
      normalizeTrend(
        input.auditTrend
      ),

    dofTrend:
      normalizeTrend(
        input.dofTrend
      ),

    accidentTrend:
      normalizeTrend(
        input.accidentTrend
      ),

    riskTrend:
      normalizeTrend(
        input.riskTrend
      ),

    healthTrend:
      normalizeTrend(
        input.healthTrend
      ),

    ppeTrend:
      normalizeTrend(
        input.ppeTrend
      ),

    companyComparison:

      Array.isArray(
        input.companyComparison
      )

        ? input.companyComparison

        : [],

    monthlyChanges:

      Array.isArray(
        input.monthlyChanges
      )

        ? input.monthlyChanges

        : [],

    heatmap:

      Array.isArray(
        input.heatmap
      )

        ? input.heatmap

        : [],

    generatedAt:

      input.generatedAt ||

      new Date().toISOString(),

  };

}

// ----------------------------------------------------

export function normalizeTrend(

  rows?: ReportTrendPoint[]

) {

  return (

    Array.isArray(rows)

      ? rows

      : []

  )

    .map((row) => ({

      label:

        String(
          row.label || ""
        ),

      value:

        number(
          row.value
        ),

      secondaryValue:

        row.secondaryValue != null

          ? number(
              row.secondaryValue
            )

          : undefined,

      tertiaryValue:

        row.tertiaryValue != null

          ? number(
              row.tertiaryValue
            )

          : undefined,

    }))

    .filter(
      (row) => row.label
    );

}

// ----------------------------------------------------

export function getMonthlyChange(

  item: ReportMonthlyChange

) {

  const current =
    number(item.current);

  const previous =
    number(item.previous);

  if (previous === 0) {

    return {

      percent:

        current === 0

          ? 0

          : 100,

      direction:

        current === 0

          ? "FLAT"

          : "UP",

      positive:

        item.inversePositive

          ? false

          : current > 0,

    } as const;

  }

  const percent =
    Math.round(

      (

        (current - previous)

        /

        Math.abs(previous)

      ) * 100

    );

  const direction =

    percent > 0

      ? "UP"

      : percent < 0

      ? "DOWN"

      : "FLAT";

  const positive =

    item.inversePositive

      ? percent <= 0

      : percent >= 0;

  return {

    percent:

      Math.abs(percent),

    direction,

    positive,

  } as const;

}
// ----------------------------------------------------

export function maxTrendValue(
  rows: ReportTrendPoint[]
) {
  return Math.max(
    1,

    ...rows.flatMap((row) => [
      number(row.value),

      number(row.secondaryValue),

      number(row.tertiaryValue),
    ])
  );
}

// ----------------------------------------------------

export function minTrendValue(
  rows: ReportTrendPoint[]
) {
  if (!rows.length) {
    return 0;
  }

  return Math.min(
    ...rows.flatMap((row) => [
      number(row.value),

      number(row.secondaryValue),

      number(row.tertiaryValue),
    ])
  );
}

// ----------------------------------------------------

export function averageTrendValue(
  rows: ReportTrendPoint[]
) {
  if (!rows.length) {
    return 0;
  }

  const values = rows.flatMap((row) => [
    number(row.value),
  ]);

  const total = values.reduce(
    (sum, value) => sum + value,
    0
  );

  return Math.round(total / values.length);
}

// ----------------------------------------------------

export function trendDifference(
  rows: ReportTrendPoint[]
) {
  if (rows.length < 2) {
    return 0;
  }

  const first =
    number(rows[0].value);

  const last =
    number(rows[rows.length - 1].value);

  return last - first;
}

// ----------------------------------------------------

export function trendPercent(
  rows: ReportTrendPoint[]
) {
  if (rows.length < 2) {
    return 0;
  }

  const first =
    number(rows[0].value);

  const last =
    number(rows[rows.length - 1].value);

  if (first === 0) {
    return last === 0
      ? 0
      : 100;
  }

  return Math.round(
    ((last - first) /
      Math.abs(first)) *
      100
  );
}

// ----------------------------------------------------

export function trendDirection(
  rows: ReportTrendPoint[]
) {
  const percent =
    trendPercent(rows);

  if (percent > 0) {
    return "UP";
  }

  if (percent < 0) {
    return "DOWN";
  }

  return "FLAT";
}

// ----------------------------------------------------

function number(
  value?: number | null
) {
  return Number(value || 0);
}