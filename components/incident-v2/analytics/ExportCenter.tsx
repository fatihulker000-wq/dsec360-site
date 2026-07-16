"use client";

import { IncidentAnalyticsData } from "./types";

interface Props {
  data: IncidentAnalyticsData;
  title?: string;
}

export default function ExportCenter({
  data,
  title = "D-SEC İş Kazası Analiz Raporu",
}: Props) {
  function exportJson() {
    downloadFile(
      "incident-analytics.json",
      JSON.stringify(data, null, 2),
      "application/json"
    );
  }

  function exportCsv() {
    const rows = [
      ["Gösterge", "Değer"],
      [
        "Toplam Olay",
        data.metrics.totalIncidents,
      ],
      [
        "İş Kazası",
        data.metrics.workAccidents,
      ],
      [
        "Ramak Kala",
        data.metrics.nearMisses,
      ],
      [
        "Kayıp Gün",
        data.metrics.totalLostDays,
      ],
      ["LTIFR", data.metrics.ltifr],
      ["TRIR", data.metrics.trir],
      [
        "Frequency Rate",
        data.metrics.frequencyRate,
      ],
      [
        "Severity Rate",
        data.metrics.severityRate,
      ],
      [
        "AI Incident Score",
        data.metrics.aiIncidentScore,
      ],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(";")
      )
      .join("\n");

    downloadFile(
      "incident-analytics.csv",
      `\uFEFF${csv}`,
      "text/csv;charset=utf-8"
    );
  }

  function printPage() {
    window.print();
  }

  return (
    <section style={cardStyle}>
      <div>
        <div
          style={{
            color: "#64748b",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          EXPORT CENTER
        </div>

        <h3
          style={{
            margin: "6px 0 0",
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          {title}
        </h3>
      </div>

      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 18,
        }}
      >
        <ActionButton
          title="PDF / Yazdır"
          onClick={printPage}
          color="#111827"
        />

        <ActionButton
          title="Excel / CSV"
          onClick={exportCsv}
          color="#166534"
        />

        <ActionButton
          title="JSON"
          onClick={exportJson}
          color="#1d4ed8"
        />
      </div>
    </section>
  );
}

function ActionButton({
  title,
  onClick,
  color,
}: {
  title: string;
  onClick(): void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 12,
        padding: "11px 17px",
        background: color,
        color: "#fff",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {title}
    </button>
  );
}

function downloadFile(
  fileName: string,
  content: string,
  type: string
) {
  const blob = new Blob([content], {
    type,
  });

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

const cardStyle: React.CSSProperties = {
  padding: 22,
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 10px 28px rgba(15,23,42,.05)",
};