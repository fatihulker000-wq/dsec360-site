"use client";

import { useMemo } from "react";

import {
  IncidentWorkflowEvent,
} from "./types";

interface Props {
  events: IncidentWorkflowEvent[];
}

export default function WorkflowNotificationCenter({
  events,
}: Props) {
  const stats = useMemo(() => {
    return {
      total: events.length,
      success: events.filter(
        (x) => x.status === "COMPLETED"
      ).length,
      failed: events.filter(
        (x) => x.status === "FAILED"
      ).length,
      pending: events.filter(
        (x) =>
          x.status === "PENDING" ||
          x.status === "RUNNING"
      ).length,
    };
  }, [events]);

  return (
    <section
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <header
        style={{
          padding: 24,
          borderRadius: 22,
          background:
            "linear-gradient(135deg,#1e293b,#0f172a)",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: .8,
          }}
        >
          NOTIFICATION CENTER
        </div>

        <h2
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          Workflow Bildirim Merkezi
        </h2>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 22,
            flexWrap: "wrap",
          }}
        >
          <StatCard
            title="Toplam"
            value={stats.total}
          />

          <StatCard
            title="Başarılı"
            value={stats.success}
            color="#16a34a"
          />

          <StatCard
            title="Bekleyen"
            value={stats.pending}
            color="#2563eb"
          />

          <StatCard
            title="Hatalı"
            value={stats.failed}
            color="#dc2626"
          />
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((event) => (
            <NotificationCard
              key={event.id}
              event={event}
            />
          ))
        )}
      </div>
    </section>
  );
}

function NotificationCard({
  event,
}: {
  event: IncidentWorkflowEvent;
}) {
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns:
          "56px 1fr auto",
        gap: 18,
        alignItems: "center",
        padding: 18,
        borderRadius: 18,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: iconColor(
            event.status
          ),
          color: "#fff",
          fontWeight: 900,
          fontSize: 20,
        }}
      >
        {icon(event.status)}
      </div>

      <div>
        <div
          style={{
            fontWeight: 900,
            fontSize: 17,
          }}
        >
          {event.stepType}
        </div>

        <div
          style={{
            marginTop: 6,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          {event.message}
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Badge
            value={event.status}
          />

          {event.createdBy && (
            <Badge
              value={event.createdBy}
            />
          )}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        {format(event.createdAt)}
      </div>
    </article>
  );
}

function StatCard({
  title,
  value,
  color = "#ffffff",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        minWidth: 150,
        padding: 16,
        borderRadius: 16,
        background:
          "rgba(255,255,255,.08)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: .8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 900,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({
  value,
}: {
  value: string;
}) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: "#f1f5f9",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {value}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 50,
        textAlign: "center",
        background: "#fff",
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        color: "#64748b",
      }}
    >
      Henüz workflow bildirimi bulunmuyor.
    </div>
  );
}

function icon(status: string) {
  switch (status) {
    case "COMPLETED":
      return "✓";

    case "FAILED":
      return "!";

    case "RUNNING":
      return "↻";

    default:
      return "•";
  }
}

function iconColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "#16a34a";

    case "FAILED":
      return "#dc2626";

    case "RUNNING":
      return "#2563eb";

    default:
      return "#ca8a04";
  }
}

function format(date: string) {
  return new Date(date).toLocaleString(
    "tr-TR"
  );
}