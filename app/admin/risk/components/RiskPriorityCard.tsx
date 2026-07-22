"use client";

import {
  AlertTriangle,
  Gauge,
  ShieldAlert,
  TimerReset,
  Users,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  record: RiskRecord;
};

function normalizeRiskScore(record: RiskRecord) {
  if (record.method === "FINE_KINNEY") {
    return Math.min(100, (Number(record.score || 0) / 400) * 100);
  }

  return Math.min(100, (Number(record.score || 0) / 25) * 100);
}

export function calculatePriorityScore(record: RiskRecord) {
  const riskScore = normalizeRiskScore(record);

  const overdueScore =
    !record.completed &&
    record.dueDateMillis &&
    record.dueDateMillis < Date.now()
      ? 100
      : !record.completed
        ? 55
        : 0;

  const responsibilityScore = record.responsible?.trim()
    ? 100
    : 20;

  const evidenceScore =
    record.photoUrl || record.attachmentUrl ? 100 : 35;

  const criticalityScore =
    record.level === "INTOLERABLE"
      ? 100
      : record.level === "VERY_HIGH"
        ? 90
        : record.level === "HIGH"
          ? 72
          : record.level === "MEDIUM"
            ? 45
            : 20;

  const score = Math.round(
    riskScore * 0.38 +
      overdueScore * 0.22 +
      criticalityScore * 0.22 +
      (100 - responsibilityScore) * 0.08 +
      (100 - evidenceScore) * 0.1
  );

  return Math.max(0, Math.min(100, score));
}

function priorityInfo(score: number) {
  if (score >= 85) {
    return {
      label: "Kritik",
      description:
        "Yönetim müdahalesi ve kısa terminli düzeltici faaliyet gerektirir.",
      background: "#450a0a",
      color: "#ffffff",
    };
  }

  if (score >= 70) {
    return {
      label: "Çok Yüksek",
      description:
        "Öncelikli aksiyon planı oluşturulmalı ve yönetici takibine alınmalıdır.",
      background: "#fef2f2",
      color: "#b91c1c",
    };
  }

  if (score >= 50) {
    return {
      label: "Yüksek",
      description:
        "Planlı DÖF açılmalı ve uygulama etkinliği düzenli izlenmelidir.",
      background: "#fff7ed",
      color: "#c2410c",
    };
  }

  if (score >= 30) {
    return {
      label: "Orta",
      description:
        "Kontroller sürdürülmeli ve belirlenen termin içinde iyileştirme yapılmalıdır.",
      background: "#fffbeb",
      color: "#92400e",
    };
  }

  return {
    label: "Düşük",
    description:
      "Mevcut kontroller korunmalı ve periyodik saha kontrolü yapılmalıdır.",
    background: "#ecfdf5",
    color: "#047857",
  };
}

export default function RiskPriorityCard({
  record,
}: Props) {
  const score = calculatePriorityScore(record);
  const info = priorityInfo(score);

  const dueStatus =
    record.completed
      ? "Kapalı"
      : record.dueDateMillis &&
          record.dueDateMillis < Date.now()
        ? "Gecikmiş"
        : "Açık";

  return (
    <section
      style={{
        borderRadius: 18,
        border: `1px solid ${info.color}33`,
        background: info.background,
        color: info.color,
        padding: 15,
        display: "grid",
        gap: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontWeight: 950,
          }}
        >
          <Gauge size={19} />
          Yönetim Öncelik Puanı
        </div>

        <strong
          style={{
            fontSize: 24,
          }}
        >
          {score}/100
        </strong>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 999,
            background: info.color,
          }}
        />
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 950,
          }}
        >
          Öncelik: {info.label}
        </div>

        <p
          style={{
            margin: "5px 0 0",
            color: info.color,
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {info.description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 8,
        }}
      >
        <div
          style={{
            borderRadius: 11,
            background: "rgba(255,255,255,.56)",
            padding: 9,
          }}
        >
          <ShieldAlert size={14} />

          <div
            style={{
              marginTop: 5,
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            Risk seviyesi
          </div>

          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 11,
            }}
          >
            {record.level}
          </strong>
        </div>

        <div
          style={{
            borderRadius: 11,
            background: "rgba(255,255,255,.56)",
            padding: 9,
          }}
        >
          <TimerReset size={14} />

          <div
            style={{
              marginTop: 5,
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            DÖF
          </div>

          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 11,
            }}
          >
            {dueStatus}
          </strong>
        </div>

        <div
          style={{
            borderRadius: 11,
            background: "rgba(255,255,255,.56)",
            padding: 9,
          }}
        >
          <Users size={14} />

          <div
            style={{
              marginTop: 5,
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            Sorumlu
          </div>

          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 11,
            }}
          >
            {record.responsible?.trim()
              ? "Atandı"
              : "Eksik"}
          </strong>
        </div>
      </div>

      {score >= 70 ? (
        <div
          style={{
            borderRadius: 12,
            background: "rgba(255,255,255,.62)",
            padding: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          <AlertTriangle size={16} />
          Yönetici takibi gerektirir.
        </div>
      ) : null}
    </section>
  );
}