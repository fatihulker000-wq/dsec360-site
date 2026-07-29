"use client";

import { useEffect, useMemo, useState } from "react";

import {
    GitBranch,
    Loader2,
    Pencil,
    Plus,
    X
} from "lucide-react";

import DocumentForm from "./DocumentForm";

import type {
    DocumentDialogProps,
    DocumentFormData
} from "./types";

export default function DocumentDialog({
    open,
    mode = "CREATE",
    companyId,
    companyName,
    record,
    onClose,
    onSaved
}: DocumentDialogProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    const title = useMemo(() => {
        switch (mode) {
            case "EDIT":
                return "Doküman Düzenle";

            case "REVISION":
                return "Yeni Revizyon Oluştur";

            default:
                return "Yeni Doküman";
        }
    }, [mode]);

    /*
     * DocumentationRecord verisini DocumentFormData biçimine çevirir.
     * Alan isimleri backend tipinize göre farklıysa yalnızca bu bölümü
     * güncellemeniz yeterlidir.
     */
    
    const millisToDateInput = (
    value?: number | null
): string => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getFileNameFromUrl = (
    fileUrl: string
): string => {
    try {
        const url = new URL(fileUrl);

        const fileName =
            url.pathname
                .split("/")
                .pop();

        return fileName
            ? decodeURIComponent(fileName)
            : "document";
    } catch {
        const fileName =
            fileUrl
                .split("/")
                .pop();

        return fileName || "document";
    }
};

const getFileExtension = (
    fileName: string
): string => {
    return (
        fileName
            .split(".")
            .pop()
            ?.toLowerCase()
            .trim() || ""
    );
};

const getMimeType = (
    extension: string
): string => {
    switch (extension) {
        case "pdf":
            return "application/pdf";

        case "doc":
            return "application/msword";

        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        case "xls":
            return "application/vnd.ms-excel";

        case "xlsx":
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        case "jpg":
        case "jpeg":
            return "image/jpeg";

        case "png":
            return "image/png";

        default:
            return "application/octet-stream";
    }
};

const initialFormData =
    useMemo<
        Partial<DocumentFormData> | undefined
    >(() => {
        if (!record) {
            return undefined;
        }

        const fileName =
            record.fileUrl
                ? getFileNameFromUrl(
                      record.fileUrl
                  )
                : "";

        const extension =
            getFileExtension(fileName);

        return {
            firmId: companyId,

            title:
                record.title ?? "",

            documentNo:
                record.documentNo ?? "",

            category:
                record.category,

            department:
                record.department ?? "",

            revisionNo:
                mode === "REVISION"
                    ? ""
                    : record.revisionNo ?? "",

            /*
             * DocumentationRecord içinde revisionReason
             * bulunmadığı için yeni revizyonda boş başlar.
             */
            revisionReason: "",

            publishedAt:
                millisToDateInput(
                    record.publishedAtMillis
                ),

            validUntil:
                millisToDateInput(
                    record.validUntilMillis
                ),

            preparedBy:
                record.preparedBy ?? "",

            /*
             * DocumentationRecord içinde controlledBy
             * bulunmadığı için boş başlar.
             */
            controlledBy: "",

            approvedBy:
                record.approvedBy ?? "",

            description:
                record.description ?? "",

            /*
             * status özellikle aktarılmıyor.
             * Çünkü DocumentationRecord status tipi
             * ARCHIVED içerebilir; form tipi bunu kabul etmiyor.
             * DocumentForm kendi varsayılan durumunu kullanacak.
             */

            file:
                mode === "REVISION"
                    ? null
                    : record.fileUrl
                      ? {
                            storagePath: "",

                            fileUrl:
                                record.fileUrl,

                            originalFileName:
                                fileName ||
                                record.title ||
                                "Doküman",

                            storedFileName:
                                fileName ||
                                "document",

                            mimeType:
                                getMimeType(
                                    extension
                                ),

                            fileSize: 0,

                            extension
                        }
                      : null
        };
    }, [
        record,
        companyId,
        mode
    ]);

    const handleSubmit = async (
        form: DocumentFormData
    ) => {
        if (loading) return;

        try {
            setLoading(true);

            if (
                mode === "EDIT" &&
                !record?.id
            ) {
                throw new Error(
                    "Düzenlenecek doküman bulunamadı."
                );
            }

            if (
                mode === "REVISION" &&
                !record?.id
            ) {
                throw new Error(
                    "Revizyon oluşturulacak doküman bulunamadı."
                );
            }

           const recordId =
    record?.id;

if (
    (mode === "EDIT" ||
        mode === "REVISION") &&
    !recordId
) {
    throw new Error(
        mode === "EDIT"
            ? "Düzenlenecek doküman bulunamadı."
            : "Revizyon oluşturulacak doküman bulunamadı."
    );
}

const url =
    mode === "EDIT"
        ? `/api/admin/documentation/${recordId}`
        : "/api/admin/documentation";

            const method =
                mode === "EDIT"
                    ? "PUT"
                    : "POST";

            const payload = {
    ...form,

    firmId: companyId,

    ...(mode === "REVISION" &&
    recordId
        ? {
              parentDocumentId:
                  recordId,

              revisionOfId:
                  recordId,

              operation:
                  "REVISION"
          }
        : {})
};

            const response = await fetch(
                url,
                {
                    method,

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)
                }
            );

            const json = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    json?.error ??
                    json?.message ??
                    "Doküman kaydedilemedi."
                );
            }

            await Promise.resolve(
                onSaved(json?.data ?? json)
            );

            onClose();
        } catch (error) {
            console.error(
                "DocumentDialog kayıt hatası:",
                error
            );

            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;

        onClose();
    };

    const handleOverlayClick = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        if (
            event.target === event.currentTarget
        ) {
            handleClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className="dialogRoot"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-dialog-title"
            onMouseDown={handleOverlayClick}
        >
            <aside
                className="drawer"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <header className="header">
                    <div>
                        <h2 id="document-dialog-title">
                            {title}
                        </h2>

                        <p>
                            {companyName || "Firma"}
                            {" • "}
                            Dokümantasyon Merkezi
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close"
                        onClick={handleClose}
                        disabled={loading}
                        aria-label="Pencereyi kapat"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="modeBar">
                    {mode === "CREATE" && (
                        <span className="badge create">
                            <Plus size={16} />
                            Yeni Doküman
                        </span>
                    )}

                    {mode === "EDIT" && (
                        <span className="badge edit">
                            <Pencil size={16} />
                            Düzenleme Modu
                        </span>
                    )}

                    {mode === "REVISION" && (
                        <span className="badge revision">
                            <GitBranch size={16} />
                            Revizyon Oluştur
                        </span>
                    )}
                </div>

                <main className="content">
                    <DocumentForm
                        firmId={companyId}
                        initialData={initialFormData}
                        loading={loading}
                        onSubmit={handleSubmit}
                        onCancel={handleClose}
                    />
                </main>

                {loading && (
                    <div
                        className="loading"
                        role="status"
                        aria-live="polite"
                    >
                        <Loader2
                            size={26}
                            className="spin"
                        />

                        <span>
                            Kaydediliyor...
                        </span>
                    </div>
                )}
            </aside>

            <style jsx>{`
                .dialogRoot {
                    position: fixed;
                    inset: 0;
                    z-index: 1200;
                    display: flex;
                    justify-content: flex-end;
                    background: rgba(15, 23, 42, 0.45);
                }

                .drawer {
                    position: relative;
                    width: min(980px, 100%);
                    height: 100dvh;
                    background: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
                    animation: slide 0.25s ease;
                }

                @keyframes slide {
                    from {
                        transform: translateX(100%);
                    }

                    to {
                        transform: translateX(0);
                    }
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #fff;
                    flex-shrink: 0;
                }

                h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    color: #111827;
                }

                p {
                    margin: 6px 0 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .close {
                    width: 42px;
                    height: 42px;
                    border: none;
                    border-radius: 10px;
                    background: #f3f4f6;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #374151;
                    flex-shrink: 0;
                }

                .close:hover:not(:disabled) {
                    background: #e5e7eb;
                }

                .close:disabled {
                    cursor: not-allowed;
                    opacity: 0.55;
                }

                .modeBar {
                    padding: 16px 24px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #fff;
                    flex-shrink: 0;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border-radius: 999px;
                    font-weight: 600;
                    font-size: 13px;
                }

                .create {
                    background: #dcfce7;
                    color: #166534;
                }

                .edit {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .revision {
                    background: #ede9fe;
                    color: #6d28d9;
                }

                .content {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    padding: 24px;
                }

                .loading {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.78);
                    backdrop-filter: blur(2px);
                    color: #991b1b;
                    font-weight: 700;
                }

                .spin {
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 768px) {
                    .drawer {
                        width: 100%;
                    }

                    .header {
                        padding: 18px;
                    }

                    h2 {
                        font-size: 20px;
                    }

                    .modeBar {
                        padding: 14px 18px;
                    }

                    .content {
                        padding: 16px;
                    }
                }
            `}</style>
        </div>
    );
}