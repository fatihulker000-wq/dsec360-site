"use client";

import type { InvestigationFile } from "./InvestigationTypes";
import { progress } from "./InvestigationUtils";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "11px 0",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
};

export default function InvestigationSummaryPanel({
  file,
}: {
  file: InvestigationFile;
}) {
  const result = progress(file);

  const totalAttachments =
    file.initial.attachments.length +
    file.evidence.attachments.length +
    file.rootCause.attachments.length +
    file.witnesses.reduce(
      (total, witness) =>
        total + witness.attachments.length,
      0
    ) +
    file.interviews.reduce(
      (total, interview) =>
        total + interview.attachments.length,
      0
    ) +
    file.actions.reduce(
      (total, action) =>
        total + action.attachments.length,
      0
    );

  const openActions = file.actions.filter(
    (action) => action.status !== "COMPLETED"
  ).length;

  return (
    <section
      className="no-print"
      style={cardStyle}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 950,
          color: "#111827",
          marginBottom: 8,
        }}
      >
        Soruşturma Özeti
      </div>

      <SummaryRow
        title="İlerleme"
        value={`%${result.percent}`}
      />

      <SummaryRow
        title="Tamamlanan Aşama"
        value={`${result.completed}/${result.total}`}
      />

      <SummaryRow
        title="Toplam Dosya"
        value={totalAttachments}
      />

      <SummaryRow
        title="Tanık"
        value={file.witnesses.length}
      />

      <SummaryRow
        title="Görüşme"
        value={file.interviews.length}
      />

      <SummaryRow
        title="Toplam DÖF / Aksiyon"
        value={file.actions.length}
      />

      <SummaryRow
        title="Açık DÖF / Aksiyon"
        value={openActions}
      />

      <SummaryRow
        title="Dosya Durumu"
        value={
          file.completed
            ? "Tamamlandı"
            : "Devam Ediyor"
        }
      />

      <SummaryRow
        title="Oluşturulma"
        value={formatDate(file.createdAt)}
      />

      <SummaryRow
        title="Son Güncelleme"
        value={formatDate(file.updatedAt)}
        last
      />
    </section>
  );
}

function SummaryRow({
  title,
  value,
  last = false,
}: {
  title: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <div
      style={{
        ...itemStyle,
        borderBottom: last
          ? "none"
          : itemStyle.borderBottom,
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        {title}
      </span>

      <strong
        style={{
          color: "#111827",
          fontWeight: 950,
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("tr-TR");
}