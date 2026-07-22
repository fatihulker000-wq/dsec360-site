"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { parseRiskExcel } from "../utils/riskExcelImport";
import type { ImportedRiskRow } from "../utils/riskExcelImport";

type Props = {
  open: boolean;
  importing: boolean;
  companies: string[];
  onClose: () => void;
  onImport: (rows: ImportedRiskRow[]) => void | Promise<void>;
};

export default function RiskImportDialog({
  open,
  importing,
  companies,
  onClose,
  onImport,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<ImportedRiskRow[]>([]);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [readError, setReadError] = useState("");

  const validRows = useMemo(
    () => rows.filter((row: ImportedRiskRow) => row.valid),
    [rows]
  );

  const invalidRows = useMemo(
    () => rows.filter((row: ImportedRiskRow) => !row.valid),
    [rows]
  );

  if (!open) return null;

  const selectFile = async (file?: File) => {
    if (!file) return;

    try {
      setReading(true);
      setReadError("");
      setFileName(file.name);

      const parsed = await parseRiskExcel(file);

      setRows(
        parsed.map((row) => ({
          ...row,
          companyId:
            row.companyId ||
            (companies.length === 1 ? companies[0] : ""),
        }))
      );
    } catch (error) {
      setRows([]);
      setReadError(
        error instanceof Error
          ? error.message
          : "Excel dosyası okunamadı."
      );
    } finally {
      setReading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(15,23,42,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={() => {
        if (!importing && !reading) onClose();
      }}
    >
      <section
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 30px 90px rgba(15,23,42,0.34)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              Excel’den Risk İçe Aktar
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              İlk çalışma sayfasındaki kayıtlar okunur ve geçerli satırlar sisteme aktarılır.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={importing || reading}
            style={{
              width: 40,
              height: 40,
              border: 0,
              borderRadius: 12,
              background: "#f1f5f9",
              color: "#475569",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={reading || importing}
          style={{
            width: "100%",
            minHeight: 132,
            borderRadius: 18,
            border: "2px dashed #cbd5e1",
            background: "#f8fafc",
            color: "#475569",
            display: "grid",
            placeItems: "center",
            padding: 18,
            cursor: reading || importing ? "wait" : "pointer",
          }}
        >
          <div style={{ textAlign: "center" }}>
            {reading ? (
              <Loader2 size={28} className="riskImportSpin" />
            ) : (
              <FileSpreadsheet size={32} color="#047857" />
            )}

            <div
              style={{
                marginTop: 10,
                color: "#0f172a",
                fontWeight: 900,
              }}
            >
              {reading
                ? "Excel okunuyor..."
                : "Excel dosyasını seçin"}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              XLSX, XLS veya CSV
            </div>
          </div>
        </button>

        {fileName ? (
          <div
            style={{
              marginTop: 12,
              color: "#475569",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Dosya: {fileName}
          </div>
        ) : null}

        {readError ? (
          <div
            style={{
              marginTop: 12,
              borderRadius: 14,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={17} />
            {readError}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {[
                ["Toplam Satır", rows.length, "#eff6ff", "#1d4ed8"],
                ["Geçerli", validRows.length, "#ecfdf5", "#047857"],
                ["Hatalı", invalidRows.length, "#fef2f2", "#b91c1c"],
              ].map(([label, value, bg, color]) => (
                <div
                  key={String(label)}
                  style={{
                    borderRadius: 15,
                    padding: 13,
                    background: String(bg),
                    color: String(color),
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 850,
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 24,
                      fontWeight: 950,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                overflowX: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 900,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Satır",
                      "Durum",
                      "Firma",
                      "Başlık",
                      "Tehlike",
                      "Yöntem",
                      "Bölüm",
                      "Hata",
                    ].map((title) => (
                      <th
                        key={title}
                        style={{
                          textAlign: "left",
                          padding: "11px 12px",
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 900,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, 100).map((row) => (
                    <tr
                      key={`${row.rowNumber}-${row.title}`}
                      style={{
                        borderBottom: "1px solid #eef2f7",
                      }}
                    >
                      <td style={{ padding: 12 }}>{row.rowNumber}</td>

                      <td style={{ padding: 12 }}>
                        {row.valid ? (
                          <CheckCircle2 size={17} color="#047857" />
                        ) : (
                          <AlertTriangle size={17} color="#b91c1c" />
                        )}
                      </td>

                      <td style={{ padding: 12 }}>
                        <select
                          value={row.companyId}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.rowNumber === row.rowNumber
                                  ? {
                                      ...item,
                                      companyId: event.target.value,
                                    }
                                  : item
                              )
                            )
                          }
                          style={{
                            minWidth: 180,
                            height: 36,
                            borderRadius: 10,
                            border: "1px solid #dbe3ec",
                            padding: "0 9px",
                          }}
                        >
                          <option value="">Firma seçin</option>
                          {companies.map((company) => (
                            <option key={company} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: 12, fontWeight: 800 }}>
                        {row.title || "-"}
                      </td>

                      <td style={{ padding: 12 }}>
                        {row.hazard || "-"}
                      </td>

                      <td style={{ padding: 12 }}>
                        {row.method === "FINE_KINNEY"
                          ? "Fine-Kinney"
                          : "5x5 Matris"}
                      </td>

                      <td style={{ padding: 12 }}>
                        {row.department || "-"}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          color: row.valid ? "#047857" : "#b91c1c",
                          fontSize: 12,
                          fontWeight: 750,
                        }}
                      >
                        {row.valid
                          ? "Hazır"
                          : row.errors.join(" ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length > 100 ? (
              <p
                style={{
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Önizlemede ilk 100 satır gösteriliyor.
              </p>
            ) : null}
          </>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={importing || reading}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              color: "#475569",
              fontWeight: 850,
              padding: "0 16px",
              cursor: "pointer",
            }}
          >
            İptal
          </button>

          <button
            type="button"
            disabled={
              importing ||
              reading ||
              validRows.length === 0 ||
              validRows.some((row) => !row.companyId)
            }
            onClick={() => void onImport(validRows)}
            style={{
              height: 44,
              borderRadius: 12,
              border: 0,
              background: "#047857",
              color: "#ffffff",
              fontWeight: 900,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: importing ? "wait" : "pointer",
              opacity:
                validRows.length === 0 ||
                validRows.some((row) => !row.companyId)
                  ? 0.55
                  : 1,
            }}
          >
            {importing ? (
              <Loader2 size={16} className="riskImportSpin" />
            ) : (
              <Upload size={16} />
            )}

            {importing
              ? "İçe aktarılıyor"
              : `${validRows.length} Kaydı Aktar`}
          </button>
        </div>
      </section>

      <style jsx>{`
        .riskImportSpin {
          animation: risk-import-spin 0.9s linear infinite;
        }

        @keyframes risk-import-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          section > div:nth-of-type(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}