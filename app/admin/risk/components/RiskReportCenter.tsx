"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Printer,
  ShieldAlert,
  X,
} from "lucide-react";

import type { RiskRecord } from "../types";
import {
  createRiskReportNo,
  printClassicRiskReport,
} from "./riskClassicReport";
import {
  archiveRiskReport,
  downloadRiskReportPackage,
} from "./riskReportArchive";

import {
  createRiskReportSummary,
  exportRiskCsv,
  exportRiskWord,
  filterReportRecords,
  printRiskPdf,
  type RiskReportType,
} from "./riskReportUtils";

type ExtendedRiskReportType =
  | RiskReportType
  | "CLASSIC";

type Props = {
  open: boolean;
  records: RiskRecord[];
  companyName?: string;
  onClose: () => void;
};

const REPORT_OPTIONS: Array<{
  value: ExtendedRiskReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "CLASSIC",
    title: "Klasik Risk Değerlendirmesi",
    description:
      "Riskleri yüksekten düşüğe sıralayan klasik yatay risk tablosu.",
    icon: <FileSpreadsheet size={18} />,
  },
  {
    value: "EXECUTIVE",
    title: "Yönetici Özeti",
    description:
      "KPI, kritik riskler ve ilk 50 risk kaydını içeren kısa yönetim raporu.",
    icon: <BarChart3 size={18} />,
  },
  {
    value: "ALL_RISKS",
    title: "Tüm Risk Envanteri",
    description:
      "Tüm risk kayıtlarını ayrıntılı sayfalar halinde raporlar.",
    icon: <FileText size={18} />,
  },
  {
    value: "CRITICAL",
    title: "Kritik Riskler",
    description:
      "Yüksek, çok yüksek ve kabul edilemez riskleri raporlar.",
    icon: <ShieldAlert size={18} />,
  },
  {
    value: "OPEN_DOF",
    title: "Açık DÖF Raporu",
    description:
      "Açık, terminli ve gecikmiş düzeltici faaliyetleri listeler.",
    icon: <FileSpreadsheet size={18} />,
  },
  {
    value: "PHOTO",
    title: "Fotoğraflı Risk Raporu",
    description:
      "Fotoğraf veya belge bağlantısı bulunan riskleri raporlar.",
    icon: <ImageIcon size={18} />,
  },
  {
    value: "FINE_KINNEY",
    title: "Fine-Kinney Raporu",
    description:
      "Yalnızca Fine-Kinney yöntemiyle değerlendirilen riskler.",
    icon: <ShieldAlert size={18} />,
  },
  {
    value: "MATRIX_5X5",
    title: "5×5 Matris Raporu",
    description:
      "Yalnızca 5×5 matris yöntemiyle değerlendirilen riskler.",
    icon: <ShieldAlert size={18} />,
  },
];

export default function RiskReportCenter({
  open,
  records,
  companyName = "",
  onClose,
}: Props) {
  const [reportType, setReportType] =
    useState<ExtendedRiskReportType>("EXECUTIVE");

  const [working, setWorking] = useState<
    "" | "PDF" | "WORD" | "CSV"
  >("");

  const [error, setError] = useState("");

  const selectedRecords = useMemo(
    () =>
      reportType === "CLASSIC"
        ? records
        : filterReportRecords(
            records,
            reportType
          ),
    [records, reportType]
  );

  const summary = useMemo(
    () =>
      createRiskReportSummary(
        selectedRecords
      ),
    [selectedRecords]
  );

  if (!open) return null;

  const run = async (
    mode: "PDF" | "WORD" | "CSV"
  ) => {
    try {
      setWorking(mode);
      setError("");

      if (mode === "PDF") {
        if (reportType === "CLASSIC") {
          const reportNo = createRiskReportNo();
          printClassicRiskReport(
            records,
            companyName,
            reportNo
          );

          const archived = archiveRiskReport(
            records,
            companyName,
            reportNo
          );

          downloadRiskReportPackage(archived);
        } else {
          printRiskPdf(
            records,
            reportType,
            companyName
          );
        }
      } else if (mode === "WORD") {
        exportRiskWord(
          records,
          reportType as RiskReportType,
          companyName
        );
      } else {
        exportRiskCsv(
          records,
          reportType as RiskReportType
        );
      }
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : "Rapor oluşturulamadı."
      );
    } finally {
      setWorking("");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 190,
        background: "rgba(15,23,42,.64)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(1040px,100%)",
          maxHeight: "94vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#ffffff",
          boxShadow:
            "0 30px 90px rgba(15,23,42,.35)",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header
          style={{
            padding: 18,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              Kurumsal Risk Rapor Merkezi
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              PDF yazdırma görünümü, Word ve
              Excel uyumlu CSV çıktıları oluşturun.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 0,
              background: "#f1f5f9",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          style={{
            padding: 18,
            display: "grid",
            gap: 16,
          }}
        >
          <div
            className="reportGrid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: 10,
            }}
          >
            {REPORT_OPTIONS.map((option) => {
              const active =
                reportType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setReportType(
                      option.value
                    )
                  }
                  style={{
                    minHeight: 96,
                    borderRadius: 15,
                    border: active
                      ? "2px solid #6b1020"
                      : "1px solid #dbe3ec",
                    background: active
                      ? "#fff1f2"
                      : "#ffffff",
                    padding: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns:
                      "32px minmax(0,1fr)",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: active
                        ? "#6b1020"
                        : "#f1f5f9",
                      color: active
                        ? "#ffffff"
                        : "#475569",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {option.icon}
                  </span>

                  <span>
                    <strong
                      style={{
                        display: "block",
                        color: "#0f172a",
                        fontSize: 13,
                      }}
                    >
                      {option.title}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: "#64748b",
                        fontSize: 10,
                        lineHeight: 1.45,
                      }}
                    >
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <section
            style={{
              borderRadius: 17,
              border: "1px solid #dbe3ec",
              background: "#f8fafc",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(6,minmax(0,1fr))",
                gap: 8,
              }}
              className="reportStats"
            >
              {[
                [
                  "Kayıt",
                  summary.totalRisk,
                ],
                [
                  "Kritik",
                  summary.criticalRisk,
                ],
                [
                  "Ort. Skor",
                  summary.averageScore,
                ],
                [
                  "Açık DÖF",
                  summary.openDof,
                ],
                [
                  "Gecikmiş",
                  summary.overdueDof,
                ],
                [
                  "Kapalı",
                  summary.closedDof,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  style={{
                    borderRadius: 12,
                    background: "#ffffff",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {label}
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "#0f172a",
                      fontSize: 18,
                    }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {error ? (
            <div
              style={{
                borderRadius: 13,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                padding: 11,
                fontSize: 11,
                fontWeight: 850,
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 9,
            }}
            className="exportGrid"
          >
            <button
              type="button"
              onClick={() =>
                void run("PDF")
              }
              disabled={
                working !== "" ||
                selectedRecords.length === 0
              }
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: 0,
                background: "#6b1020",
                color: "#ffffff",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {working === "PDF" ? (
                <Loader2
                  size={16}
                  className="reportSpin"
                />
              ) : (
                <Printer size={16} />
              )}
              PDF / Yazdır
            </button>

            <button
              type="button"
              onClick={() =>
                void run("WORD")
              }
              disabled={
                working !== "" ||
                selectedRecords.length === 0
              }
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#1d4ed8",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <FileText size={16} />
              Word
            </button>

            <button
              type="button"
              onClick={() =>
                void run("CSV")
              }
              disabled={
                working !== "" ||
                selectedRecords.length === 0
              }
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: "1px solid #a7f3d0",
                background: "#ecfdf5",
                color: "#047857",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={16} />
              Excel / CSV
            </button>
          </div>
        </div>

        <style jsx>{`
          .reportSpin {
            animation: report-spin 0.9s linear
              infinite;
          }

          @keyframes report-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 760px) {
            .reportGrid,
            .exportGrid {
              grid-template-columns: 1fr !important;
            }

            .reportStats {
              grid-template-columns:
                repeat(2,minmax(0,1fr)) !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}