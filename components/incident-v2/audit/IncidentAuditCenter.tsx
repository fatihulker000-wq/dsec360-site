"use client";

import { useMemo, useState } from "react";

import IncidentAuditDashboard from "./IncidentAuditDashboard";
import IncidentAuditFilters from "./IncidentAuditFilters";
import IncidentAuditTimeline from "./IncidentAuditTimeline";
import IncidentAuditTable from "./IncidentAuditTable";

import { IncidentAuditEngine } from "./IncidentAuditEngine";

import {
  IncidentAuditFilters as AuditFilters,
  IncidentAuditLog,
} from "./types";

interface Props {
  logs: IncidentAuditLog[];
}

export default function IncidentAuditCenter({
  logs,
}: Props) {

  const [filters, setFilters] =
    useState<AuditFilters>({});

  const filteredLogs =
    useMemo(
      () =>
        IncidentAuditEngine.filter(
          logs,
          filters
        ),
      [logs, filters]
    );

  const summary =
    useMemo(
      () =>
        IncidentAuditEngine.summary(
          filteredLogs
        ),
      [filteredLogs]
    );

  const sortedLogs =
    useMemo(
      () =>
        IncidentAuditEngine.sortNewest(
          filteredLogs
        ),
      [filteredLogs]
    );

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <IncidentAuditDashboard
        summary={summary}
      />

      <IncidentAuditFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      <IncidentAuditTimeline
        logs={sortedLogs}
      />

      <IncidentAuditTable
        logs={sortedLogs}
      />
    </div>
  );
}