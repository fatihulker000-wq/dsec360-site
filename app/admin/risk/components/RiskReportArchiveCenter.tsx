"use client";

import { useMemo, useRef, useState } from "react";
import {
  Archive,
  Download,
  FileUp,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type { RiskRecord } from "../types";
import { importRisks } from "../services";
import {
  attachPdfToArchive,
  deleteArchivedRiskReport,
  downloadRiskReportPackage,
  listRiskReportArchive,
  readRiskReportPackage,
  saveUploadedRiskReportPackage,
  type ArchivedRiskReport,
} from "./riskReportArchive";

type Props = {
  open: boolean;
  firmId: string;
  companyName: string;
  onClose: () => void;
  onRestored: () => void | Promise<void>;
};

export default function RiskReportArchiveCenter({
  open,
  firmId,
  companyName,
  onClose,
  onRestored,
}: Props) {
  const packageRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);

  const [version, setVersion] = useState(0);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState("");

  const reports = useMemo(
    () => listRiskReportArchive(),
    [version]
  );

  if (!open) return null;

  const uploadPackage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const report = await readRiskReportPackage(file);
      saveUploadedRiskReportPackage(report);
      setVersion((value) => value + 1);
      setMessage(`${report.reportNo} arşive yüklendi.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Rapor paketi yüklenemedi."
      );
    }
  };

  const uploadPdf = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reportNo = file.name
      .replace(/\.pdf$/i, "")
      .split("_")[0]
      .trim();

    if (!reportNo) {
      setMessage("PDF dosya adında rapor numarası bulunamadı.");
      return;
    }

    attachPdfToArchive(reportNo, file.name);
    setVersion((value) => value + 1);
    setMessage(`${file.name} arşiv kaydına bağlandı.`);
  };

  const restore = async (report: ArchivedRiskReport) => {
    try {
      setWorkingId(report.id);
      setMessage("");

      const restored = report.records.map((record) => ({
        ...record,
        id: undefined,
        firmId: firmId || record.firmId,
        company: companyName || record.company,
        createdAtMillis: Date.now(),
        updatedAtMillis: Date.now(),
      })) as Array<Partial<RiskRecord>>;

      const result = await importRisks(restored);
      await onRestored();

      setMessage(`${result.successCount} risk kaydı geri yüklendi.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Rapor geri yüklenemedi."
      );
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        background: "rgba(15,23,42,.65)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(1000px,100%)",
          maxHeight: "94vh",
          overflowY: "auto",
          borderRadius: 22,
          background: "#fff",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          style={{
            padding: 18,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              Risk Rapor Arşivi
            </h2>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 12 }}>
              Rapor paketini yükleyin veya arşivden riskleri geri yükleyin.
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
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => packageRef.current?.click()}
              style={{
                minHeight: 42,
                borderRadius: 11,
                border: 0,
                background: "#6b1020",
                color: "#fff",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <Upload size={16} />
              D-SEC Paket Yükle
            </button>

            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              style={{
                minHeight: 42,
                borderRadius: 11,
                border: "1px solid #dbe3ec",
                background: "#fff",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              <FileUp size={16} />
              PDF Bağla
            </button>

            <input
              ref={packageRef}
              type="file"
              accept=".json,.dsec-risk.json,application/json"
              hidden
              onChange={uploadPackage}
            />

            <input
              ref={pdfRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={uploadPdf}
            />
          </div>

          {message ? (
            <div
              style={{
                borderRadius: 11,
                background: "#f8fafc",
                padding: 11,
                fontWeight: 800,
              }}
            >
              {message}
            </div>
          ) : null}

          {reports.length === 0 ? (
            <div
              style={{
                minHeight: 180,
                borderRadius: 14,
                border: "1px dashed #cbd5e1",
                display: "grid",
                placeItems: "center",
                color: "#94a3b8",
              }}
            >
              Arşiv kaydı bulunamadı.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {reports.map((report) => (
                <article
                  key={report.id}
                  style={{
                    borderRadius: 14,
                    border: "1px solid #dbe3ec",
                    padding: 13,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{report.reportNo}</strong>
                    <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>
                      {report.companyName || "-"} · {report.records.length} kayıt ·{" "}
                      {new Date(report.createdAt).toLocaleString("tr-TR")}
                    </div>
                    {report.pdfFileName ? (
                      <div style={{ marginTop: 3, color: "#047857", fontSize: 10 }}>
                        PDF: {report.pdfFileName}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    <button
                      type="button"
                      onClick={() => downloadRiskReportPackage(report)}
                      title="Paketi indir"
                      style={iconButton("#eff6ff", "#1d4ed8")}
                    >
                      <Download size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void restore(report)}
                      disabled={workingId === report.id}
                      title="Riskleri geri yükle"
                      style={iconButton("#ecfdf5", "#047857")}
                    >
                      {workingId === report.id ? (
                        <Loader2 size={15} />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deleteArchivedRiskReport(report.id);
                        setVersion((value) => value + 1);
                      }}
                      title="Arşivden sil"
                      style={iconButton("#fef2f2", "#b91c1c")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function iconButton(background: string, color: string) {
  return {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid #dbe3ec",
    background,
    color,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  } as const;
}