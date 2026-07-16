"use client";

import { useMemo } from "react";

import EmployeeIntegrationStatus from "./EmployeeIntegrationStatus";
import { useEmployeeIntegration } from "./useEmployeeIntegration";

import type {
  EmployeeIntegrationData,
} from "./types";

export default function EmployeeIntegrationBridge({
  employeeId,
  children,
}: {
  employeeId?: string | null;
  children(args: {
    integration: EmployeeIntegrationData | null;
    loading: boolean;
    error: string;
    reload(): Promise<void>;
  }): React.ReactNode;
}) {
  const {
    data,
    loading,
    error,
    reload,
  } = useEmployeeIntegration(employeeId);

  const warnings = useMemo(
    () => data?.warnings || [],
    [data]
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <EmployeeIntegrationStatus
        loading={loading}
        error={error}
        warnings={warnings}
        onRetry={() => {
          void reload();
        }}
      />

      {children({
        integration: data,
        loading,
        error,
        reload,
      })}
    </div>
  );
}
