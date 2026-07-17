"use client";

import type {
  ReportHeatmapCell,
} from "./types";

export default function ReportHeatmap({
  cells,
}: {
  cells: ReportHeatmapCell[];
}) {
  const rows = Array.from(
    new Set(cells.map((cell) => cell.rowLabel))
  );

  const columns = Array.from(
    new Set(cells.map((cell) => cell.columnLabel))
  );

  const max = Math.max(
    1,
    ...cells.map((cell) => cell.value)
  );

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        Risk Isı Haritası
      </h3>

      <p
        style={{
          margin: "6px 0 16px",
          color: "#64748b",
          fontSize: 12,
        }}
      >
        Departman veya lokasyon bazlı risk yoğunluğu.
      </p>

      {cells.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 620,
              borderCollapse: "separate",
              borderSpacing: 7,
            }}
          >
            <thead>
              <tr>
                <th />

                {columns.map((column) => (
                  <th
                    key={column}
                    style={{
                      padding: 8,
                      fontSize: 11,
                      color: "#64748b",
                    }}
                  >
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
                      padding: 8,
                      textAlign: "left",
                      fontSize: 11,
                      color: "#334155",
                    }}
                  >
                    {row}
                  </th>

                  {columns.map((column) => {
                    const item =
                      cells.find(
                        (cell) =>
                          cell.rowLabel === row &&
                          cell.columnLabel === column
                      );

                    const value =
                      item?.value || 0;

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

                    const color =
                      ratio >= 0.5
                        ? "#fff"
                        : "#111827";

                    return (
                      <td
                        key={`${row}-${column}`}
                        style={{
                          minWidth: 86,
                          padding: 14,
                          borderRadius: 12,
                          background,
                          color,
                          textAlign: "center",
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
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 26,
        borderRadius: 14,
        background: "#f8fafc",
        color: "#64748b",
        textAlign: "center",
        fontWeight: 800,
      }}
    >
      Isı haritası verisi bulunmuyor.
    </div>
  );
}
