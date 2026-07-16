"use client";

import { useMemo, useState } from "react";

import SgkDashboard from "./SgkDashboard";
import SgkIncidentTable from "./SgkIncidentTable";
import SgkValidationCard from "./SgkValidationCard";

import { SgkStatusEngine } from "./SgkStatusEngine";
import { SgkValidationEngine } from "./SgkValidationEngine";

import {
  SgkDashboardSummary,
  SgkIncidentCheck,
} from "./types";

interface Props {
  items: SgkIncidentCheck[];
  onChange(
    items: SgkIncidentCheck[]
  ): void;
}

export default function SgkCenter({
  items,
  onChange,
}: Props) {
  const [selectedId, setSelectedId] =
    useState<string>();

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const validation =
        SgkValidationEngine.validate(item);

      const normalized: SgkIncidentCheck = {
        ...item,
        missingFields: validation.missing,
        status: item.notificationDate
          ? "SENT"
          : SgkStatusEngine.status({
              ...item,
              missingFields:
                validation.missing,
            }),
      };

      return normalized;
    });
  }, [items]);

  const selectedItem =
    normalizedItems.find(
      (item) =>
        item.incidentId === selectedId
    );

  const summary =
    useMemo<SgkDashboardSummary>(() => {
      return {
        total: normalizedItems.length,

        ready: normalizedItems.filter(
          (item) =>
            item.status === "READY"
        ).length,

        overdue: normalizedItems.filter(
          (item) =>
            item.status === "OVERDUE"
        ).length,

        sent: normalizedItems.filter(
          (item) =>
            item.status === "SENT"
        ).length,

        missing: normalizedItems.filter(
          (item) =>
            item.status ===
            "MISSING_INFORMATION"
        ).length,
      };
    }, [normalizedItems]);

  function markSent(
    target: SgkIncidentCheck
  ) {
    const now =
      new Date().toISOString();

    onChange(
      items.map((item) =>
        item.incidentId ===
        target.incidentId
          ? {
              ...item,
              notificationDate: now,
              status: "SENT",
            }
          : item
      )
    );

    setSelectedId(
      target.incidentId
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <SgkDashboard
        summary={summary}
      />

      {selectedItem && (
        <SgkValidationCard
          item={selectedItem}
        />
      )}

      <SgkIncidentTable
        items={normalizedItems}
        onOpen={(item) =>
          setSelectedId(
            item.incidentId
          )
        }
        onMarkSent={markSent}
      />
    </div>
  );
}