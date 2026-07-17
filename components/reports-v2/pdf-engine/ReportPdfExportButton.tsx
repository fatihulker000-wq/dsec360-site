"use client";

import {
  useState,
} from "react";

import {
  exportElementToProfessionalPdf,
} from "./ReportPdfEngine";

import type {
  ReportPdfExportOptions,
} from "./types";

export default function ReportPdfExportButton({
  elementId,
  options,
  label = "Kurumsal PDF İndir",
}: {
  elementId: string;
  options: ReportPdfExportOptions;
  label?: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const handleExport = async () => {
    const element =
      document.getElementById(
        elementId
      );

    if (!element) {
      alert(
        "PDF oluşturulacak rapor alanı bulunamadı."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await exportElementToProfessionalPdf(
          element,
          options
        );

      if (!result.success) {
        alert(
          result.error ||
            "PDF oluşturulamadı."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      style={{
        border: "none",
        borderRadius: 13,
        padding: "12px 16px",
        background:
          loading
            ? "#94a3b8"
            : "#111827",
        color: "#fff",
        fontWeight: 900,
        cursor:
          loading
            ? "not-allowed"
            : "pointer",
      }}
    >
      {loading
        ? "PDF Hazırlanıyor..."
        : label}
    </button>
  );
}
