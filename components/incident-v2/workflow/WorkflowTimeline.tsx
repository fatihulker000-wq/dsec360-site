"use client";

import { IncidentWorkflowStep } from "./types";

interface Props {
  steps: IncidentWorkflowStep[];
}

export default function WorkflowTimeline({
  steps,
}: Props) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #e5e7eb",
        padding: 24,
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            color: "#64748b",
          }}
        >
          WORKFLOW TIMELINE
        </div>

        <h2
          style={{
            marginTop: 8,
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          İş Akışı Zaman Çizelgesi
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {steps.map((step, index) => (
          <TimelineItem
            key={step.id}
            index={index}
            step={step}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineItem({
  step,
  index,
  isLast,
}: {
  step: IncidentWorkflowStep;
  index: number;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "70px 1fr",
        gap: 18,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {!isLast && (
          <div
            style={{
              position: "absolute",
              top: 56,
              width: 3,
              bottom: -22,
              background: "#dbeafe",
            }}
          />
        )}

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: statusColor(step.status),
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 900,
          }}
        >
          {index + 1}
        </div>
      </div>

      <article
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 18,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {step.title}
            </h3>

            <div
              style={{
                marginTop: 6,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              {step.description}
            </div>
          </div>

          <StatusBadge
            status={step.status}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <Chip value={step.type} />

          <Chip value={step.priority} />

          {step.required && (
            <Chip value="ZORUNLU" />
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          <Info
            title="Başlangıç"
            value={format(step.startedAt)}
          />

          <Info
            title="Tamamlanma"
            value={format(step.completedAt)}
          />

          <Info
            title="Hata"
            value={step.error || "-"}
          />
        </div>
      </article>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <div
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        background: badgeBg(status),
        color: badgeColor(status),
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {status}
    </div>
  );
}

function Chip({
  value,
}: {
  value: string;
}) {
  return (
    <div
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        background: "#f1f5f9",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {value}
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 5,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function format(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleString(
    "tr-TR"
  );
}

function statusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "#16a34a";

    case "RUNNING":
      return "#2563eb";

    case "FAILED":
      return "#dc2626";

    case "SKIPPED":
      return "#94a3b8";

    default:
      return "#ca8a04";
  }
}

function badgeBg(status: string) {
  switch (status) {
    case "COMPLETED":
      return "#dcfce7";

    case "RUNNING":
      return "#dbeafe";

    case "FAILED":
      return "#fee2e2";

    case "SKIPPED":
      return "#f1f5f9";

    default:
      return "#fef9c3";
  }
}

function badgeColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "#166534";

    case "RUNNING":
      return "#1d4ed8";

    case "FAILED":
      return "#b91c1c";

    case "SKIPPED":
      return "#475569";

    default:
      return "#854d0e";
  }
}