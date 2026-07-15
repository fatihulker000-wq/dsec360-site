"use client";

import { useMemo, useState } from "react";
import styles from "./ParticipantImportCenter.module.css";

type PreviewRow = {
  full_name?: string;
  email?: string;
  password?: string;
  company_id?: string;
  is_active?: string | boolean;
  [key: string]: unknown;
};

type ParticipantImportCenterProps = {
  onCompleted?: () => Promise<void> | void;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function validateRows(rows: PreviewRow[]) {
  const errors: Record<number, string[]> = {};

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];

    if (!String(row.full_name || "").trim()) {
      rowErrors.push("Ad soyad eksik");
    }

    if (!String(row.email || "").trim()) {
      rowErrors.push("E-posta eksik");
    }

    if (!String(row.password || "").trim()) {
      rowErrors.push("Şifre eksik");
    }

    if (!String(row.company_id || "").trim()) {
      rowErrors.push("Firma ID eksik");
    }

    if (rowErrors.length > 0) {
      errors[index] = rowErrors;
    }
  });

  return errors;
}

export default function ParticipantImportCenter({
  onCompleted,
}: ParticipantImportCenterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<
    Record<number, string[]>
  >({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState("");
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const errorCount = Object.keys(previewErrors).length;
  const validCount = Math.max(0, previewRows.length - errorCount);

  const fileLabel = useMemo(
    () => file?.name || "Henüz dosya seçilmedi",
    [file]
  );

  const downloadTemplate = () => {
    const csv =
      "full_name,email,password,company_id,is_active\n" +
      "Ali Veli,ali.veli@mail.com,123456,FIRMA_ID,true\n";

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "dsec-egitim-katilimci-sablon.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreviewRows([]);
    setPreviewErrors({});
    setResult("");
    setServerErrors([]);
  };

  const parseFileForPreview = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewLoading(true);
    setPreviewRows([]);
    setPreviewErrors({});
    setResult("");
    setServerErrors([]);

    try {
      let rows: PreviewRow[] = [];
      const lowerName = selectedFile.name.toLowerCase();

      if (lowerName.endsWith(".csv")) {
        const text = await selectedFile.text();
        const lines = text
          .replace(/^\uFEFF/, "")
          .replace(/\r/g, "")
          .split("\n")
          .filter((line) => line.trim());

        if (lines.length > 0) {
          const headers = parseCsvLine(lines[0]).map(normalizeHeader);

          rows = lines.slice(1).map((line) => {
            const values = parseCsvLine(line);
            const row: PreviewRow = {};

            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || "";
            });

            return row;
          });
        }
      } else if (lowerName.endsWith(".xlsx")) {
        const XLSX = await import("xlsx");
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error("Excel dosyasında sayfa bulunamadı.");
        }

        const sheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json<PreviewRow>(sheet, {
          defval: "",
        });
      } else {
        throw new Error("Sadece CSV veya XLSX dosyası seçilebilir.");
      }

      setPreviewRows(rows);
      setPreviewErrors(validateRows(rows));
    } catch (cause) {
      console.error(cause);
      setFile(null);
      setPreviewRows([]);
      setPreviewErrors({});
      setResult(
        cause instanceof Error
          ? cause.message
          : "Dosya okunamadı."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const upload = async () => {
    if (!file) {
      setResult("Önce CSV veya XLSX dosyası seçin.");
      return;
    }

    if (previewRows.length === 0) {
      setResult("Yüklenecek katılımcı satırı bulunamadı.");
      return;
    }

    if (errorCount > 0) {
      const confirmed = window.confirm(
        `${errorCount} hatalı satır var. Sunucu doğrulamasına rağmen yüklemeye devam edilsin mi?`
      );

      if (!confirmed) return;
    }

    try {
      setUploading(true);
      setResult("");
      setServerErrors([]);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/admin/training-users/bulk-upload",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerErrors(
          Array.isArray(json?.errors)
            ? json.errors.map(String)
            : []
        );
        throw new Error(
          json?.error || "Toplu yükleme başarısız."
        );
      }

      setResult(
        `Yükleme tamamlandı. Eklenen: ${
          json?.insertedCount || 0
        }, Atlanan: ${json?.skippedCount || 0}`
      );
      setServerErrors(
        Array.isArray(json?.errors)
          ? json.errors.map(String)
          : []
      );
      await onCompleted?.();
      setFile(null);
    } catch (cause) {
      console.error(cause);
      setResult(
        cause instanceof Error
          ? cause.message
          : "Toplu yükleme sırasında hata oluştu."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span>Participant Import Center</span>
          <h2>Toplu Katılımcı Yükleme</h2>
          <p>
            CSV veya Excel dosyasını yüklemeden önce satırları
            önizleyin ve zorunlu alanları kontrol edin.
          </p>
        </div>

        <button type="button" onClick={downloadTemplate}>
          Şablon İndir
        </button>
      </header>

      <div
        className={styles.dropZone}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const selectedFile = event.dataTransfer.files?.[0];

          if (selectedFile) {
            void parseFileForPreview(selectedFile);
          }
        }}
      >
        <strong>Dosyayı buraya sürükleyip bırakın</strong>
        <span>CSV veya XLSX • UTF-8 önerilir</span>
        <label>
          Dosya Seç
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];

              if (selectedFile) {
                void parseFileForPreview(selectedFile);
              }
            }}
          />
        </label>
        <em>{fileLabel}</em>
      </div>

      <div className={styles.formatNote}>
        Zorunlu sütunlar:
        <code>full_name</code>
        <code>email</code>
        <code>password</code>
        <code>company_id</code>
        <code>is_active</code>
      </div>

      {previewLoading ? (
        <div className={styles.loading}>
          Önizleme hazırlanıyor...
        </div>
      ) : previewRows.length > 0 ? (
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div>
              <h3>Yükleme Önizlemesi</h3>
              <p>
                Hatalı satırlar kırmızı, uygun satırlar yeşil
                gösterilir.
              </p>
            </div>

            <div className={styles.stats}>
              <div>
                <span>Toplam</span>
                <strong>{previewRows.length}</strong>
              </div>
              <div>
                <span>Uygun</span>
                <strong>{validCount}</strong>
              </div>
              <div>
                <span>Hatalı</span>
                <strong>{errorCount}</strong>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Firma ID</th>
                  <th>Durum</th>
                  <th>Kontrol</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => {
                  const errors = previewErrors[index] || [];

                  return (
                    <tr
                      key={`${String(row.email || "")}-${index}`}
                      className={
                        errors.length > 0
                          ? styles.invalidRow
                          : styles.validRow
                      }
                    >
                      <td>{index + 1}</td>
                      <td>{String(row.full_name || "-")}</td>
                      <td>{String(row.email || "-")}</td>
                      <td>{String(row.company_id || "-")}</td>
                      <td>
                        {String(row.is_active || "true")}
                      </td>
                      <td>
                        {errors.length > 0 ? (
                          <span className={styles.errorBadge}>
                            {errors.join(", ")}
                          </span>
                        ) : (
                          <span className={styles.successBadge}>
                            Hazır
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result ? (
        <div
          className={
            result.includes("tamamlandı")
              ? styles.resultSuccess
              : styles.resultError
          }
        >
          {result}
        </div>
      ) : null}

      {serverErrors.length > 0 ? (
        <div className={styles.serverErrors}>
          <strong>Sunucu doğrulama sonuçları</strong>
          {serverErrors.map((error, index) => (
            <span key={`${error}-${index}`}>{error}</span>
          ))}
        </div>
      ) : null}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.resetButton}
          disabled={!file && previewRows.length === 0}
          onClick={reset}
        >
          Temizle
        </button>

        <button
          type="button"
          className={styles.uploadButton}
          disabled={
            !file ||
            previewLoading ||
            uploading ||
            previewRows.length === 0
          }
          onClick={() => void upload()}
        >
          {uploading ? "Yükleniyor..." : "Katılımcıları Yükle"}
        </button>
      </footer>
    </section>
  );
}
