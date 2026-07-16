"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchEmployeeIntegration,
} from "./EmployeeIntegrationClient";

import type {
  EmployeeIntegrationData,
} from "./types";

export function useEmployeeIntegration(
  employeeId?: string | null
) {

  const [data, setData] =
    useState<EmployeeIntegrationData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {

    if (!employeeId) {
      setData(null);
      setError("");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const result =
        await fetchEmployeeIntegration(employeeId);

      setData(result);

    } catch (e: any) {

      setData(null);

      setError(
        e?.message ||
        "Veriler alınamadı."
      );

    } finally {

      setLoading(false);

    }

  }, [employeeId]);

  useEffect(() => {

    void load();

  }, [load]);

  return {

    data,

    loading,

    error,

    reload: load,

  };

}