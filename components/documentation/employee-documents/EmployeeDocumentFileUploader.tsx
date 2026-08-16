"use client";

import {
  CheckCircle2,
  FileUp,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

export type UploadedEmployeeDocumentFile = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  storageBucket?: string;
  storagePath?: string;
};

type Props = {
  firmId: string;
  uploadedFile?: UploadedEmployeeDocumentFile | null;
  onUploaded: (file: UploadedEmployeeDocumentFile) => void;
  onClear?: () => void;
};

const MAX_MB = 25;

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function EmployeeDocumentFileUploader({
  firmId,
  uploadedFile,
  onUploaded,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const upload = async () => {
    if (!firmId) {
      setError("Önce firma seçin.");
      return;
    }

    if (!selectedFile) {
      setError("Önce belge dosyasını seçin.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const body = new FormData();
      body.append("firmId", firmId);
      body.append("file", selectedFile);

      const response = await fetch(
        "/api/admin/employee-documents/upload",
        {
          method: "POST",
          credentials: "include",
          body,
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge yüklenemedi."
        );
      }

      const data = json?.data;

      if (!data?.fileUrl) {
        throw new Error(
          "Yüklenen belgenin depolama yolu alınamadı."
        );
      }

      onUploaded({
        fileUrl: String(data.fileUrl),
        fileName: String(
          data.fileName || selectedFile.name
        ),
        mimeType: String(
          data.mimeType || selectedFile.type
        ),
        fileSizeBytes: Number(
          data.fileSizeBytes || selectedFile.size
        ),
        sha256Hash: String(
          data.sha256Hash || ""
        ),
        storageBucket:
          data.storageBucket
            ? String(data.storageBucket)
            : undefined,
        storagePath:
          data.storagePath
            ? String(data.storagePath)
            : undefined,
      });

      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge yüklenirken hata oluştu."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        border: "1px solid #c4b5fd",
        background: "#ffffff",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              color: "#5b21b6",
              fontWeight: 950,
            }}
          >
            <UploadCloud size={18} />
            Belge Dosyası Yükle
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            PDF, DOC veya DOCX • En fazla {MAX_MB} MB • Dosya özel
            depolamada tutulur.
          </div>
        </div>

        {uploadedFile ? (
          <div
            style={{
              display: "inline-flex",
              gap: 7,
              alignItems: "center",
              borderRadius: 999,
              padding: "7px 10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            <CheckCircle2 size={15} />
            Dosya hazır
          </div>
        ) : null}
      </div>

      {uploadedFile ? (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            borderRadius: 13,
            padding: 12,
          }}
        >
          <div>
            <div
              style={{
                color: "#0f172a",
                fontWeight: 900,
              }}
            >
              {uploadedFile.fileName}
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#64748b",
                fontSize: 11,
              }}
            >
              {formatBytes(uploadedFile.fileSizeBytes)}
              {" • "}
              SHA-256:{" "}
              {uploadedFile.sha256Hash
                ? `${uploadedFile.sha256Hash.slice(0, 12)}…`
                : "-"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClear?.();
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            title="Yeni dosya seç"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <label
            style={{
              minHeight: 44,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              background: "#f8fafc",
              padding: "0 11px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: "#334155",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <FileUp size={18} color="#6d28d9" />

            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedFile?.name || "Bilgisayardan belge seç"}
            </span>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              hidden
              onChange={(event) => {
                const file =
                  event.target.files?.[0] || null;

                setSelectedFile(file);
                setError("");
              }}
            />
          </label>

          <button
            type="button"
            disabled={uploading || !selectedFile}
            onClick={() => void upload()}
            style={{
              minHeight: 44,
              borderRadius: 12,
              border: 0,
              background:
                uploading || !selectedFile
                  ? "#c4b5fd"
                  : "#6d28d9",
              color: "#ffffff",
              padding: "0 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 900,
              cursor:
                uploading || !selectedFile
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {uploading ? (
              <Loader2
                size={17}
                style={{
                  animation: "employee-doc-upload-spin .9s linear infinite",
                }}
              />
            ) : (
              <UploadCloud size={17} />
            )}

            {uploading ? "Yükleniyor..." : "Dosyayı Yükle"}
          </button>
        </div>
      )}

      {error ? (
        <div
          style={{
            marginTop: 9,
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes employee-doc-upload-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 720px) {
          div[style*="grid-template-columns: minmax(0,1fr) auto"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}