"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import type { RiskMethod, RiskRecord } from "../types";
import { importRisks } from "../services";

type Props = {
  open: boolean;
  firmId: string;
  companyName: string;
  onClose: () => void;
  onImported: () => void | Promise<void>;
};

type PreviewRow = Partial<RiskRecord> & {
  rowNo: number;
  valid: boolean;
  error: string;
};

const HEADERS = [
  "Departman",
  "Süreç",
  "Faaliyet",
  "Tehlike",
  "Olası Sonuç",
  "Mevcut Kontrol",
  "İlave Kontrol",
  "Sorumlu",
  "Yöntem",
  "Olasılık",
  "Frekans",
  "Şiddet",
  "Termin",
  "DÖF Durumu",
];

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTemplate() {
  const sample = [
    "Depo",
    "Sevkiyat Alanı",
    "Forklift ile taşıma",
    "Forklift çarpması",
    "Yaralanma veya ölüm",
    "Yaya yolu ve hız limiti",
    "Fiziksel bariyer uygulanması",
    "Depo Müdürü",
    "FINE_KINNEY",
    "3",
    "6",
    "15",
    "2026-12-31",
    "Açık",
  ];

  const csv = [
    HEADERS.map(escapeCsv).join(";"),
    sample.map(escapeCsv).join(";"),
  ].join("\n");

  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "DSEC_Risk_Toplu_Aktarim_Sablonu.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ";" || char === ",") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeMethod(value: string): RiskMethod {
  const normalized = value
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, "_");

  return normalized.includes("5X5") || normalized.includes("MATRIX")
    ? "MATRIX_5X5"
    : "FINE_KINNEY";
}

function calculateLevel(
  score: number,
  method: RiskMethod
): RiskRecord["level"] {
  if (method === "MATRIX_5X5") {
    if (score <= 6) return "LOW";
    if (score <= 12) return "MEDIUM";
    if (score <= 16) return "HIGH";
    if (score <= 20) return "VERY_HIGH";
    return "INTOLERABLE";
  }

  if (score < 20) return "LOW";
  if (score < 70) return "MEDIUM";
  if (score < 200) return "HIGH";
  if (score < 400) return "VERY_HIGH";
  return "INTOLERABLE";
}

function parseDate(value: string): number | null {
  if (!value.trim()) return null;
  const time = new Date(`${value.trim()}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

function parseCsv(
  content: string,
  firmId: string,
  companyName: string
): PreviewRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const [
      department = "",
      process = "",
      activity = "",
      hazard = "",
      consequence = "",
      existingControl = "",
      proposedControl = "",
      responsible = "",
      rawMethod = "FINE_KINNEY",
      rawProbability = "1",
      rawFrequency = "1",
      rawSeverity = "1",
      dueDate = "",
      rawStatus = "Açık",
    ] = values;

    const method = normalizeMethod(rawMethod);
    const probability = Number(rawProbability || 1);
    const frequency =
      method === "MATRIX_5X5"
        ? 1
        : Number(rawFrequency || 1);
    const severity = Number(rawSeverity || 1);

    const score =
      method === "FINE_KINNEY"
        ? probability * frequency * severity
        : probability * severity;

    const errors: string[] = [];

    if (!activity.trim()) errors.push("Faaliyet eksik");
    if (!hazard.trim()) errors.push("Tehlike eksik");
    if (!Number.isFinite(probability)) errors.push("Olasılık hatalı");
    if (!Number.isFinite(frequency)) errors.push("Frekans hatalı");
    if (!Number.isFinite(severity)) errors.push("Şiddet hatalı");

    return {
      rowNo: index + 2,
      valid: errors.length === 0,
      error: errors.join(", "),
      firmId,
      company: companyName,
      department,
      process,
      activity,
      hazard,
      consequence,
      existingControl,
      proposedControl,
      responsible,
      method,
      probability,
      frequency,
      severity,
      score,
      level: calculateLevel(score, method),
      completed:
        rawStatus.trim().toLocaleLowerCase("tr-TR") === "kapalı",
      dueDateMillis: parseDate(dueDate),
      photoUrl: null,
      attachmentUrl: null,
      createdAtMillis: Date.now(),
      updatedAtMillis: Date.now(),
    };
  });
}

export default function RiskImportCenter({
  open,
  firmId,
  companyName,
  onClose,
  onImported,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const validRows = useMemo(
    () => rows.filter((row) => row.valid),
    [rows]
  );

  if (!open) return null;

  const selectFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");

    if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".csv")) {
      setRows([]);
      setMessage("Şimdilik CSV dosyası yükleyin. Şablon Excel ile açılır.");
      return;
    }

    const content = await file.text();
    setRows(parseCsv(content, firmId, companyName));
  };

  const runImport = async () => {
    if (!firmId) {
      setMessage("Önce firma seçin.");
      return;
    }

    if (validRows.length === 0) {
      setMessage("Aktarılacak geçerli kayıt bulunamadı.");
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      const result = await importRisks(
        validRows.map(({ rowNo, valid, error, ...record }) => record)
      );

      setMessage(
        `${result.successCount} kayıt aktarıldı.` +
          (result.failedIndexes.length
            ? ` ${result.failedIndexes.length} kayıt başarısız.`
            : "")
      );

      await onImported();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Toplu aktarım yapılamadı."
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "rgba(15,23,42,.65)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(980px,100%)",
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
              Toplu Risk Aktarımı
            </h2>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 12 }}>
              CSV şablonunu doldurun, ön izleyin ve toplu kaydedin.
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
              onClick={downloadTemplate}
              style={{
                minHeight: 42,
                borderRadius: 11,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              Şablon İndir
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
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
              <Upload size={16} />
              CSV Seç
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={selectFile}
            />
          </div>

          {rows.length > 0 ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 8,
                }}
              >
                {[
                  ["Toplam", rows.length],
                  ["Geçerli", validRows.length],
                  ["Hatalı", rows.length - validRows.length],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      borderRadius: 12,
                      background: "#f8fafc",
                      padding: 12,
                    }}
                  >
                    <div style={{ color: "#64748b", fontSize: 10 }}>
                      {label}
                    </div>
                    <strong style={{ fontSize: 20 }}>{value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ overflowX: "auto", maxHeight: 360 }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 850,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Satır", "Faaliyet", "Tehlike", "Skor", "Durum"].map(
                        (title) => (
                          <th
                            key={title}
                            style={{
                              padding: 10,
                              textAlign: "left",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {title}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row) => (
                      <tr key={row.rowNo}>
                        <td style={{ padding: 10 }}>{row.rowNo}</td>
                        <td style={{ padding: 10 }}>{row.activity}</td>
                        <td style={{ padding: 10 }}>{row.hazard}</td>
                        <td style={{ padding: 10 }}>{row.score}</td>
                        <td style={{ padding: 10 }}>
                          {row.valid ? (
                            <span style={{ color: "#047857" }}>
                              <CheckCircle2 size={15} /> Geçerli
                            </span>
                          ) : (
                            <span style={{ color: "#b91c1c" }}>
                              <AlertTriangle size={15} /> {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {message ? (
            <div
              style={{
                borderRadius: 11,
                background: "#f8fafc",
                padding: 11,
                color: "#334155",
                fontWeight: 800,
              }}
            >
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void runImport()}
            disabled={working || validRows.length === 0}
            style={{
              minHeight: 46,
              borderRadius: 12,
              border: 0,
              background: "#6b1020",
              color: "#fff",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              fontWeight: 900,
              cursor: working ? "wait" : "pointer",
            }}
          >
            {working ? <Loader2 size={16} /> : <FileSpreadsheet size={16} />}
            Geçerli Kayıtları Aktar
          </button>
        </div>
      </section>
    </div>
  );
}