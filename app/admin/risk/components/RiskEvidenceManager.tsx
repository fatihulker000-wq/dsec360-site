"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

export type RiskEvidenceCategory =
  | "BEFORE"
  | "PROCESS"
  | "AFTER"
  | "DOCUMENT";

export type RiskEvidenceItem = {
  id: string;
  riskId: string;
  firmId: string;
  category: RiskEvidenceCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
  signedUrl: string;
};

type Props = {
  riskId: string;
  firmId: string;
  readOnly?: boolean;
};

const CATEGORY_INFO: Record<
  RiskEvidenceCategory,
  {
    title: string;
    description: string;
  }
> = {
  BEFORE: {
    title: "Önlem Öncesi",
    description:
      "Riskin ve mevcut uygunsuzluğun kontrol tedbirleri uygulanmadan önceki durumunu gösteren fotoğraflar.",
  },
  PROCESS: {
    title: "Uygulama Süreci",
    description:
      "Düzeltici faaliyetin, montajın, bakımın veya iyileştirme çalışmalarının devam ettiği aşamaya ait kanıtlar.",
  },
  AFTER: {
    title: "Önlem Sonrası",
    description:
      "Kontrol tedbirleri tamamlandıktan sonra riskin azaltıldığını ve uygulamanın sahada gerçekleştirildiğini gösteren fotoğraflar.",
  },
  DOCUMENT: {
    title: "Belgeler",
    description:
      "Risk değerlendirmesiyle ilişkili rapor, ölçüm sonucu, kontrol formu, PDF, Word, Excel, video veya diğer kanıt dosyaları.",
  },
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024))
  );

  return `${(value / 1024 ** index).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isImage(item: RiskEvidenceItem) {
  return item.mimeType.startsWith("image/");
}

function isVideo(item: RiskEvidenceItem) {
  return item.mimeType.startsWith("video/");
}

export default function RiskEvidenceManager({
  riskId,
  firmId,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<RiskEvidenceItem[]>([]);
  const [category, setCategory] =
    useState<RiskEvidenceCategory>("BEFORE");

  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewItem, setPreviewItem] =
    useState<RiskEvidenceItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadItems = useCallback(async () => {
    if (!riskId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/risk-management/evidence?riskId=${encodeURIComponent(
          riskId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.message ||
            json.error ||
            "Risk kanıtları yüklenemedi."
        );
      }

      setItems(
        Array.isArray(json.items) ? json.items : []
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Risk kanıtları yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const grouped = useMemo(() => {
    return {
      BEFORE: items.filter(
        (item) => item.category === "BEFORE"
      ),
      PROCESS: items.filter(
        (item) => item.category === "PROCESS"
      ),
      AFTER: items.filter(
        (item) => item.category === "AFTER"
      ),
      DOCUMENT: items.filter(
        (item) => item.category === "DOCUMENT"
      ),
    };
  }, [items]);

  const selectFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextFiles = Array.from(event.target.files || []);

    setSelectedFiles(nextFiles);
    setSuccess("");
    setError("");
  };

  const uploadFiles = async () => {
    if (!riskId || !firmId) {
      setError("Risk veya firma bilgisi bulunamadı.");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Yüklenecek en az bir dosya seçin.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      for (const file of selectedFiles) {
        const formData = new FormData();

        formData.append("riskId", riskId);
        formData.append("firmId", firmId);
        formData.append("category", category);
        formData.append("description", description.trim());
        formData.append("file", file);

        const response = await fetch(
          "/api/admin/risk-management/evidence",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json.message ||
              json.error ||
              `${file.name} yüklenemedi.`
          );
        }
      }

      setSelectedFiles([]);
      setDescription("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setSuccess(
        `${selectedFiles.length} dosya başarıyla yüklendi.`
      );

      await loadItems();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Dosya yükleme işlemi tamamlanamadı."
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (item: RiskEvidenceItem) => {
    const accepted = window.confirm(
      `"${item.fileName}" dosyası silinsin mi?`
    );

    if (!accepted) return;

    try {
      setDeletingId(item.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/risk-management/evidence?id=${encodeURIComponent(
          item.id
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.message ||
            json.error ||
            "Dosya silinemedi."
        );
      }

      setSuccess("Kanıt dosyası silindi.");
      await loadItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Dosya silinemedi."
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!readOnly ? (
        <section
          style={{
            borderRadius: 17,
            border: "1px solid #dbe3ec",
            background: "#ffffff",
            padding: 14,
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              Fotoğraf ve Kanıt Ekle
            </h3>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              Birden fazla fotoğraf veya belge seçebilirsiniz.
              Dosyaları önlem öncesi, uygulama süreci, önlem
              sonrası ya da belge olarak sınıflandırın.
            </p>
          </div>

          <div
            className="evidenceCategoryGrid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4,minmax(0,1fr))",
              gap: 8,
            }}
          >
            {(
              Object.keys(
                CATEGORY_INFO
              ) as RiskEvidenceCategory[]
            ).map((value) => {
              const active = category === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  style={{
                    minHeight: 68,
                    borderRadius: 12,
                    border: active
                      ? "2px solid #6b1020"
                      : "1px solid #dbe3ec",
                    background: active
                      ? "#fff1f2"
                      : "#f8fafc",
                    color: active
                      ? "#6b1020"
                      : "#475569",
                    padding: 9,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {CATEGORY_INFO[value].title}
                </button>
              );
            })}
          </div>

          <div
            style={{
              borderRadius: 12,
              background: "#f8fafc",
              color: "#64748b",
              padding: 10,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            {CATEGORY_INFO[category].description}
          </div>

          <label
            style={{
              minHeight: 105,
              borderRadius: 14,
              border: "2px dashed #cbd5e1",
              background: "#f8fafc",
              display: "grid",
              placeItems: "center",
              padding: 16,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.dwg"
              onChange={selectFiles}
              style={{ display: "none" }}
            />

            <div>
              <UploadCloud size={30} color="#6b1020" />

              <div
                style={{
                  marginTop: 8,
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                Dosyaları seçmek için tıklayın
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#94a3b8",
                  fontSize: 10,
                }}
              >
                Fotoğraf, video, PDF, Word, Excel, DWG veya ZIP
              </div>
            </div>
          </label>

          {selectedFiles.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: 7,
              }}
            >
              {selectedFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  style={{
                    borderRadius: 11,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    padding: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      color: "#334155",
                      fontSize: 11,
                      fontWeight: 850,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Fotoğraf veya belgenin neyi gösterdiğini, hangi uygunsuzluğa ya da kontrol tedbirine kanıt olduğunu açıklayın."
            style={{
              minHeight: 80,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              padding: 10,
              resize: "vertical",
            }}
          />

          <button
            type="button"
            onClick={() => void uploadFiles()}
            disabled={
              uploading || selectedFiles.length === 0
            }
            style={{
              minHeight: 43,
              borderRadius: 11,
              border: 0,
              background: "#6b1020",
              color: "#ffffff",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              padding: "0 15px",
              fontWeight: 900,
              cursor: uploading ? "wait" : "pointer",
              opacity:
                selectedFiles.length === 0 ? 0.6 : 1,
            }}
          >
            {uploading ? (
              <Loader2
                size={16}
                className="evidenceSpin"
              />
            ) : (
              <Plus size={16} />
            )}

            {uploading
              ? "Dosyalar yükleniyor"
              : "Seçilen Dosyaları Yükle"}
          </button>
        </section>
      ) : null}

      {error ? (
        <div
          style={{
            borderRadius: 13,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: 11,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          style={{
            borderRadius: 13,
            border: "1px solid #a7f3d0",
            background: "#ecfdf5",
            color: "#047857",
            padding: 11,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          <CheckCircle2 size={16} />
          {success}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 15,
            fontWeight: 950,
          }}
        >
          Risk Kanıt Merkezi
        </h3>

        <button
          type="button"
          onClick={() => void loadItems()}
          disabled={loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid #dbe3ec",
            background: "#ffffff",
            display: "grid",
            placeItems: "center",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: 240,
            display: "grid",
            placeItems: "center",
            color: "#64748b",
          }}
        >
          <Loader2
            size={25}
            className="evidenceSpin"
          />
        </div>
      ) : (
        (
          Object.keys(
            CATEGORY_INFO
          ) as RiskEvidenceCategory[]
        ).map((groupKey) => {
          const groupItems = grouped[groupKey];

          return (
            <section
              key={groupKey}
              style={{
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                padding: 13,
                display: "grid",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  {groupKey === "DOCUMENT" ? (
                    <Paperclip size={16} />
                  ) : (
                    <Camera size={16} />
                  )}

                  {CATEGORY_INFO[groupKey].title}

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "3px 7px",
                      background: "#f1f5f9",
                      color: "#64748b",
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {groupItems.length}
                  </span>
                </div>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#94a3b8",
                    fontSize: 10,
                    lineHeight: 1.4,
                  }}
                >
                  {CATEGORY_INFO[groupKey].description}
                </p>
              </div>

              {groupItems.length === 0 ? (
                <div
                  style={{
                    minHeight: 95,
                    borderRadius: 12,
                    border: "1px dashed #cbd5e1",
                    display: "grid",
                    placeItems: "center",
                    color: "#94a3b8",
                    fontSize: 11,
                    textAlign: "center",
                    padding: 14,
                  }}
                >
                  Bu kategoriye henüz kanıt eklenmemiş.
                </div>
              ) : (
                <div
                  className="evidenceGrid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill,minmax(190px,1fr))",
                    gap: 10,
                  }}
                >
                  {groupItems.map((item) => (
                    <article
                      key={item.id}
                      style={{
                        borderRadius: 13,
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                        background: "#ffffff",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItem(item)
                        }
                        style={{
                          width: "100%",
                          height: 128,
                          border: 0,
                          background: "#f1f5f9",
                          padding: 0,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        {isImage(item) ? (
                          <img
                            src={item.signedUrl}
                            alt={item.fileName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : isVideo(item) ? (
                          <video
                            src={item.signedUrl}
                            muted
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FileText
                            size={34}
                            color="#64748b"
                          />
                        )}
                      </button>

                      <div
                        style={{
                          padding: 10,
                          display: "grid",
                          gap: 7,
                        }}
                      >
                        <div
                          title={item.fileName}
                          style={{
                            color: "#0f172a",
                            fontSize: 11,
                            fontWeight: 900,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.fileName}
                        </div>

                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: 9,
                            lineHeight: 1.4,
                          }}
                        >
                          {formatBytes(item.sizeBytes)} ·{" "}
                          {formatDateTime(item.createdAt)}
                        </div>

                        {item.description ? (
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 10,
                              lineHeight: 1.45,
                            }}
                          >
                            {item.description}
                          </div>
                        ) : null}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
                          <a
                            href={item.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              border:
                                "1px solid #bfdbfe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              display: "grid",
                              placeItems: "center",
                              textDecoration: "none",
                            }}
                          >
                            <Download size={14} />
                          </a>

                          {!readOnly ? (
                            <button
                              type="button"
                              onClick={() =>
                                void deleteItem(item)
                              }
                              disabled={
                                deletingId === item.id
                              }
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 9,
                                border:
                                  "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                display: "grid",
                                placeItems: "center",
                                cursor:
                                  deletingId === item.id
                                    ? "wait"
                                    : "pointer",
                              }}
                            >
                              {deletingId === item.id ? (
                                <Loader2
                                  size={14}
                                  className="evidenceSpin"
                                />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}

      {previewItem ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 220,
            background: "rgba(15,23,42,.88)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            style={{
              width: "min(1100px,100%)",
              maxHeight: "94vh",
              borderRadius: 18,
              background: "#ffffff",
              overflow: "hidden",
              display: "grid",
              gridTemplateRows: "auto minmax(0,1fr)",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header
              style={{
                padding: 12,
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {previewItem.fileName}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewItem(null)
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 0,
                  background: "#f1f5f9",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </header>

            <div
              style={{
                minHeight: 0,
                overflow: "auto",
                background: "#0f172a",
                display: "grid",
                placeItems: "center",
                padding: 12,
              }}
            >
              {isImage(previewItem) ? (
                <img
                  src={previewItem.signedUrl}
                  alt={previewItem.fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "82vh",
                    objectFit: "contain",
                  }}
                />
              ) : isVideo(previewItem) ? (
                <video
                  src={previewItem.signedUrl}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "82vh",
                  }}
                />
              ) : (
                <a
                  href={previewItem.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    borderRadius: 13,
                    background: "#ffffff",
                    color: "#1d4ed8",
                    padding: "13px 17px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 900,
                    textDecoration: "none",
                  }}
                >
                  <Paperclip size={17} />
                  Dosyayı aç
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .evidenceSpin {
          animation: evidence-spin 0.9s linear infinite;
        }

        @keyframes evidence-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          .evidenceCategoryGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}