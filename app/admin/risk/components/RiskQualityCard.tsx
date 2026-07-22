"use client";

import {
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Paperclip,
  ShieldCheck,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  record: RiskRecord;
};

type QualityItem = {
  label: string;
  completed: boolean;
  weight: number;
};

export function calculateRiskQuality(
  record: RiskRecord
) {
  const items: QualityItem[] = [
    {
      label: "Faaliyet açıklaması",
      completed: Boolean(record.activity?.trim()),
      weight: 10,
    },
    {
      label: "Tehlike açıklaması",
      completed: Boolean(record.hazard?.trim()),
      weight: 12,
    },
    {
      label: "Olası sonuç",
      completed: Boolean(record.consequence?.trim()),
      weight: 10,
    },
    {
      label: "Mevcut kontrol",
      completed: Boolean(record.existingControl?.trim()),
      weight: 12,
    },
    {
      label: "İlave kontrol",
      completed: Boolean(record.proposedControl?.trim()),
      weight: 12,
    },
    {
      label: "Sorumlu ataması",
      completed: Boolean(record.responsible?.trim()),
      weight: 10,
    },
    {
      label: "Termin tarihi",
      completed: Boolean(record.dueDateMillis),
      weight: 10,
    },
    {
      label: "Risk puanı",
      completed: Number(record.score || 0) > 0,
      weight: 10,
    },
    {
      label: "Fotoğraf kanıtı",
      completed: Boolean(record.photoUrl),
      weight: 7,
    },
    {
      label: "Belge kanıtı",
      completed: Boolean(record.attachmentUrl),
      weight: 7,
    },
  ];

  const score = items.reduce(
    (sum, item) =>
      sum + (item.completed ? item.weight : 0),
    0
  );

  return {
    score,
    items,
  };
}

export default function RiskQualityCard({
  record,
}: Props) {
  const result = calculateRiskQuality(record);

  const color =
    result.score >= 85
      ? "#047857"
      : result.score >= 65
        ? "#1d4ed8"
        : result.score >= 45
          ? "#92400e"
          : "#b91c1c";

  const background =
    result.score >= 85
      ? "#ecfdf5"
      : result.score >= 65
        ? "#eff6ff"
        : result.score >= 45
          ? "#fffbeb"
          : "#fef2f2";

  return (
    <section
      style={{
        borderRadius: 18,
        border: `1px solid ${color}33`,
        background,
        padding: 15,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          color,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 950,
          }}
        >
          <ShieldCheck size={19} />
          Risk Kaydı Kalitesi
        </div>

        <strong
          style={{
            fontSize: 22,
          }}
        >
          %{result.score}
        </strong>
      </div>

      <div
        style={{
          height: 9,
          borderRadius: 999,
          background: "rgba(255,255,255,.62)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${result.score}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 7,
        }}
      >
        {result.items.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 10,
              background: "rgba(255,255,255,.55)",
              padding: 8,
              display: "grid",
              gridTemplateColumns: "15px 1fr",
              gap: 6,
              alignItems: "center",
              color: item.completed
                ? "#047857"
                : "#64748b",
              fontSize: 10,
              fontWeight: 850,
            }}
          >
            {item.completed ? (
              <CheckCircle2 size={14} />
            ) : (
              <Circle size={14} />
            )}

            {item.label}
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 11,
          background: "rgba(255,255,255,.58)",
          padding: 9,
          display: "flex",
          gap: 12,
          alignItems: "center",
          color: "#475569",
          fontSize: 10,
          fontWeight: 850,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <ImageIcon size={13} />
          Fotoğraf:{" "}
          {record.photoUrl ? "Var" : "Eksik"}
        </span>

        <span
          style={{
            display: "inline-flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <Paperclip size={13} />
          Belge:{" "}
          {record.attachmentUrl ? "Var" : "Eksik"}
        </span>
      </div>
    </section>
  );
}