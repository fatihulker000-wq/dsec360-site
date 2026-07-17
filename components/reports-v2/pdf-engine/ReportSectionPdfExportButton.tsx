"use client";

import {
  useState,
} from "react";

import {
  exportReportSectionsToPdf,
} from "./ReportPdfSectionExporter";

export default function ReportSectionPdfExportButton({
  elementId,
  filename,
  label = "Kurumsal PDF",
  reportTitle,
  reportNo,
  verificationCode,
}: {
  elementId: string;
  filename: string;
  label?: string;
  reportTitle?: string;
  reportNo?: string;
  verificationCode?: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const handleExport = async () => {
    const rootElement =
      document.getElementById(
        elementId
      );

    if (!rootElement) {
      window.alert(
        "PDF rapor alanı bulunamadı."
      );
      return;
    }

    try {
      setLoading(true);

      await exportReportSectionsToPdf(
        rootElement,
        {
          filename,
          reportTitle,
          reportNo,
          verificationCode,
        }
      );
    } catch (errorValue) {
      console.error(
        "PDF export error:",
        errorValue
      );

      window.alert(
        "PDF oluşturulamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleExport();
      }}
      disabled={loading}
      style={{
        border: "none",
        borderRadius: 12,
        padding: "12px 16px",
        background:
          loading
            ? "#94a3b8"
            : "#ffffff",
        color: "#1d4ed8",
        fontWeight: 900,
        cursor:
          loading
            ? "wait"
            : "pointer",
      }}
    >
      {loading
        ? "PDF hazırlanıyor..."
        : label}
    </button>
  );
}
