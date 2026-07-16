"use client";

import { useMemo, useState } from "react";

import IbysDashboard from "./IbysDashboard";
import IbysIncidentTable from "./IbysIncidentTable";
import IbysValidationCard from "./IbysValidationCard";

import { IbysPayloadBuilder } from "./IbysPayloadBuilder";
import { IbysStatusEngine } from "./IbysStatusEngine";
import { IbysValidationEngine } from "./IbysValidationEngine";

import {
  IbysDashboardSummary,
  IbysIncidentPayload,
  IbysIncidentRecord,
} from "./types";

interface Props {
  items: IbysIncidentRecord[];

  onChange(
    items: IbysIncidentRecord[]
  ): void;

  onPayloadPrepared?(
    payload: IbysIncidentPayload
  ): void;
}

export default function IbysCenter({
  items,
  onChange,
  onPayloadPrepared,
}: Props) {
  const [selectedId, setSelectedId] =
    useState<string>();

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const validation =
        IbysValidationEngine.validate(item);

      return {
        ...item,

        missingFields:
          validation.missingFields,

        status:
          IbysStatusEngine.calculate(
            item,
            validation
          ),
      };
    });
  }, [items]);

  const selectedItem =
    normalizedItems.find(
      (item) =>
        item.incidentId === selectedId
    );

  const selectedValidation =
    selectedItem
      ? IbysValidationEngine.validate(
          selectedItem
        )
      : undefined;

  const summary =
    useMemo<IbysDashboardSummary>(() => {
      return {
        total: normalizedItems.length,

        draft: normalizedItems.filter(
          (item) =>
            item.status === "DRAFT"
        ).length,

        missing: normalizedItems.filter(
          (item) =>
            item.status ===
            "MISSING_INFORMATION"
        ).length,

        ready: normalizedItems.filter(
          (item) =>
            item.status === "READY"
        ).length,

        sent: normalizedItems.filter(
          (item) =>
            item.status === "SENT"
        ).length,

        failed: normalizedItems.filter(
          (item) =>
            item.status === "FAILED"
        ).length,
      };
    }, [normalizedItems]);

  function prepare(
    target: IbysIncidentRecord
  ) {
    try {
      const payload =
        IbysPayloadBuilder.build(target);

      const now =
        new Date().toISOString();

      onChange(
        items.map((item) =>
          item.incidentId ===
          target.incidentId
            ? {
                ...item,
                preparedAt: now,
                status: "READY",
                errorMessage: undefined,
              }
            : item
        )
      );

      onPayloadPrepared?.(payload);

      setSelectedId(
        target.incidentId
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "İBYS paketi hazırlanamadı.";

      onChange(
        items.map((item) =>
          item.incidentId ===
          target.incidentId
            ? {
                ...item,
                status: "FAILED",
                errorMessage: message,
              }
            : item
        )
      );
    }
  }

  function markSent(
    target: IbysIncidentRecord
  ) {
    onChange(
      items.map((item) =>
        item.incidentId ===
        target.incidentId
          ? {
              ...item,
              sentAt:
                new Date().toISOString(),
              status: "SENT",
            }
          : item
      )
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <IbysDashboard
        summary={summary}
      />

      {selectedItem &&
        selectedValidation && (
          <IbysValidationCard
            item={selectedItem}
            validation={
              selectedValidation
            }
          />
        )}

      <IbysIncidentTable
        items={normalizedItems}
        onOpen={(item) =>
          setSelectedId(item.incidentId)
        }
        onPrepare={prepare}
        onMarkSent={markSent}
      />
    </div>
  );
}