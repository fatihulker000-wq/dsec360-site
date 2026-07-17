"use client";

import type {
  AnalyticsHeatmapCell,
} from "./types";

export default function ReportAdvancedHeatmap({
  cells,
}: {
  cells: AnalyticsHeatmapCell[];
}) {
  const rows = Array.from(
    new Set(
      cells.map(
        (cell) => cell.rowLabel
      )
    )
  );

  const columns = Array.from(
    new Set(
      cells.map(
        (cell) => cell.columnLabel
      )
    )
  );

  const max = Math.max(
    1,
    ...cells.map(
      (cell) => cell.value
    )
  );

  return (
    <section
      style={{
        padding: 18,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px",
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        Şube / Departman Isı Haritası
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            minWidth: 680,
            width: "100%",
            borderSpacing: 7,
          }}
        >
          <thead>
            <tr>
              <th />

              {columns.map((column) => (
                <th key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <th
                  style={{
                    textAlign: "left",
                  }}
                >
                  {row}
                </th>

                {columns.map((column) => {
                  const value =
                    cells.find(
                      (cell) =>
                        cell.rowLabel === row &&
                        cell.columnLabel === column
                    )?.value || 0;

                  const ratio =
                    value / max;

                  const background =
                    ratio >= 0.75
                      ? "#b91c1c"
                      : ratio >= 0.5
                      ? "#ea580c"
                      : ratio >= 0.25
                      ? "#facc15"
                      : "#dcfce7";

                  return (
                    <td
                      key={`${row}-${column}`}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        textAlign: "center",
                        background,
                        color:
                          ratio >= 0.5
                            ? "#fff"
                            : "#111827",
                        fontWeight: 950,
                      }}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
