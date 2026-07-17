"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchReportEnterpriseSummary,
} from "./ReportEnterpriseClient";

import type {
  ReportEnterpriseSummary,
} from "./types";

export function useReportEnterpriseSummary(
  companyId: string
) {
  const [data, setData] =
    useState<ReportEnterpriseSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const reload = useCallback(async () => {

    if (!companyId) {
      setData(null);
      setError("");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const result =
        await fetchReportEnterpriseSummary(
          companyId
        );

      if (
        !result.success ||
        !result.data
      ) {

        setData(null);

        setError(
          result.error ||
            "Kurumsal rapor verileri alınamadı."
        );

        return;

      }

      setData(result.data);

    } finally {

      setLoading(false);

    }

  }, [companyId]);

  useEffect(() => {

    void reload();

  }, [reload]);

  return {

    data,

    loading,

    error,

    reload,

  };

}