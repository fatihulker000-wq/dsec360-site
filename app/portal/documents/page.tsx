"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type PortalDocument = {
  assignmentId: string;
  documentId: string;
  assignedAt: string;
  dueAt?: string | null;
  status: string;

  title: string;
  documentType: string;
  description: string;
  fileName: string;
  versionNo: number;
  versionLabel: string;

  readingPolicy: string;
  minActiveReadSeconds: number;
  requiresAcknowledgement: boolean;

  firstOpenedAt?: string | null;
  lastOpenedAt?: string | null;
  activeReadSeconds: number;
  readingCompletedAt?: string | null;
  acknowledgementAt?: string | null;
  acknowledgementCode?: string | null;
};

type ApiResponse = {
  success?: boolean;
  profile?: {
    fullName?: string;
    email?: string;
  };
  data?: PortalDocument[];
  warning?: string;
  error?: string;
  detail?: string;
  code?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSeconds(value?: number | null) {
  const total = Math.max(0, Number(value || 0));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  if (minutes <= 0) {
    return `${seconds} sn`;
  }

  if (seconds === 0) {
    return `${minutes} dk`;
  }

  return `${minutes} dk ${seconds} sn`;
}

function statusView(status: string) {
  if (status === "ACKNOWLEDGED") {
    return {
      label: "Onaylandı",
      color: "#166534",
      background: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (status === "READ") {
    return {
      label: "Okundu • Onay Bekliyor",
      color: "#1d4ed8",
      background: "#eff6ff",
      border: "#bfdbfe",
    };
  }

  if (status === "OPENED") {
    return {
      label: "Okunuyor",
      color: "#6d28d9",
      background: "#f5f3ff",
      border: "#ddd6fe",
    };
  }

  if (status === "OVERDUE") {
    return {
      label: "Süresi Geçti",
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  return {
    label: "Okunmadı",
    color: "#92400e",
    background: "#fffbeb",
    border: "#fde68a",
  };
}

export default function EmployeeDocumentsPortalPage() {
  const [documents, setDocuments] =
    useState<PortalDocument[]>([]);

  const [profile, setProfile] =
    useState<{
      fullName?: string;
      email?: string;
    }>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [warning, setWarning] =
    useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setWarning("");

      const response = await fetch(
        "/api/employee-documents/my",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json: ApiResponse =
        await response
          .json()
          .catch(() => ({}));

      if (
        response.status === 401 ||
        json.code === "AUTH_REQUIRED"
      ) {
        window.location.href =
          "/portal/training";
        return;
      }

      if (!response.ok) {
        throw new Error(
          json.detail ||
            json.error ||
            "Belgeleriniz alınamadı."
        );
      }

      setDocuments(
        Array.isArray(json.data)
          ? json.data
          : []
      );

      setProfile(json.profile || {});
      setWarning(json.warning || "");
    } catch (cause) {
      setDocuments([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Belgeler yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const acknowledged =
      documents.filter(
        (item) =>
          item.status ===
          "ACKNOWLEDGED"
      ).length;

    const unread = documents.filter(
      (item) =>
        ![
          "ACKNOWLEDGED",
          "READ",
          "OPENED",
        ].includes(item.status)
    ).length;

    const waitingApproval =
      documents.filter(
        (item) =>
          item.status === "READ"
      ).length;

    const overdue =
      documents.filter(
        (item) =>
          item.status === "OVERDUE"
      ).length;

    return {
      total: documents.length,
      acknowledged,
      unread,
      waitingApproval,
      overdue,
    };
  }, [documents]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href =
        "/portal/training";
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#f5f3ff 100%)",
        padding: 24,
        fontFamily:
          "Arial,Helvetica,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            borderRadius: 24,
            background:
              "linear-gradient(135deg,#312e81,#6d28d9)",
            color: "#ffffff",
            padding: 22,
            boxShadow:
              "0 22px 50px rgba(91,33,182,.20)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 7,
                  borderRadius: 999,
                  background:
                    "rgba(255,255,255,.13)",
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                <ShieldCheck
                  size={16}
                />
                D-SEC Çalışan Portalı
              </div>

              <h1
                style={{
                  margin:
                    "13px 0 0",
                  fontSize: 31,
                  fontWeight: 950,
                }}
              >
                Belgelerim
              </h1>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "rgba(255,255,255,.82)",
                  lineHeight: 1.6,
                }}
              >
                {profile.fullName ||
                  "Çalışan"}
                {" • "}
                {profile.email || ""}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <a
                href="/portal/training"
                style={headerButton}
              >
                <GraduationCap
                  size={16}
                />
                Eğitimlerim
              </a>

              <button
                type="button"
                onClick={() =>
                  void load()
                }
                style={headerButton}
              >
                <RefreshCw
                  size={16}
                />
                Yenile
              </button>

              <button
                type="button"
                onClick={() =>
                  void logout()
                }
                style={headerButton}
              >
                <LogOut size={16} />
                Çıkış
              </button>
            </div>
          </div>

          <div
            className="portalDocumentSummary"
            style={{
              marginTop: 19,
              display: "grid",
              gridTemplateColumns:
                "repeat(5,minmax(0,1fr))",
              gap: 9,
            }}
          >
            {[
              [
                "Toplam Belge",
                summary.total,
              ],
              [
                "Okunmadı",
                summary.unread,
              ],
              [
                "Onay Bekleyen",
                summary.waitingApproval,
              ],
              [
                "Onaylandı",
                summary.acknowledged,
              ],
              [
                "Geciken",
                summary.overdue,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 15,
                  background:
                    "rgba(255,255,255,.12)",
                  border:
                    "1px solid rgba(255,255,255,.12)",
                  padding: 13,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color:
                      "rgba(255,255,255,.72)",
                    fontWeight: 800,
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
        </section>

        {error ? (
          <section style={errorBox}>
            <AlertTriangle
              size={18}
            />
            {error}
          </section>
        ) : null}

        {warning ? (
          <section
            style={{
              ...errorBox,
              border:
                "1px solid #fde68a",
              background:
                "#fffbeb",
              color: "#92400e",
            }}
          >
            <AlertTriangle
              size={18}
            />
            {warning}
          </section>
        ) : null}

        <section
          style={{
            borderRadius: 22,
            border:
              "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 18,
            boxShadow:
              "0 10px 28px rgba(15,23,42,.05)",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            Atanan Belgeler
          </h2>

          <p
            style={{
              margin:
                "5px 0 16px",
              color: "#64748b",
              lineHeight: 1.55,
              fontSize: 13,
            }}
          >
            Belgeleri açın ve kurumunuzun belirlediği
            okuma/onay şartlarını tamamlayın.
          </p>

          {loading ? (
            <div
              style={{
                minHeight: 220,
                display: "grid",
                placeItems:
                  "center",
                color: "#64748b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems:
                    "center",
                  fontWeight: 800,
                }}
              >
                <Loader2
                  size={20}
                />
                Belgeler yükleniyor...
              </div>
            </div>
          ) : null}

          {!loading ? (
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {documents.map(
                (item) => {
                  const badge =
                    statusView(
                      item.status
                    );

                  return (
                    <article
                      key={
                        item.assignmentId
                      }
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius:
                          17,
                        padding: 16,
                        display:
                          "grid",
                        gridTemplateColumns:
                          "minmax(0,1fr) auto",
                        gap: 15,
                        alignItems:
                          "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display:
                              "flex",
                            gap: 8,
                            alignItems:
                              "center",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <FileText
                            size={20}
                            color="#6d28d9"
                          />

                          <h3
                            style={{
                              margin: 0,
                              color:
                                "#0f172a",
                              fontSize:
                                17,
                              fontWeight:
                                950,
                            }}
                          >
                            {item.title}
                          </h3>

                          <span
                            style={{
                              borderRadius:
                                999,
                              padding:
                                "5px 8px",
                              border: `1px solid ${badge.border}`,
                              background:
                                badge.background,
                              color:
                                badge.color,
                              fontSize:
                                10,
                              fontWeight:
                                900,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {item.description ? (
                          <p
                            style={{
                              margin:
                                "8px 0 0",
                              color:
                                "#64748b",
                              lineHeight:
                                1.55,
                              fontSize:
                                12,
                            }}
                          >
                            {
                              item.description
                            }
                          </p>
                        ) : null}

                        <div
                          style={{
                            marginTop:
                              10,
                            display:
                              "flex",
                            gap: 12,
                            flexWrap:
                              "wrap",
                            color:
                              "#64748b",
                            fontSize:
                              11,
                            fontWeight:
                              750,
                          }}
                        >
                          <span>
                            Atama:{" "}
                            {formatDate(
                              item.assignedAt
                            )}
                          </span>

                          <span>
                            Son tarih:{" "}
                            {formatDate(
                              item.dueAt
                            )}
                          </span>

                          <span>
                            V
                            {item.versionNo}
                          </span>

                          <span>
                            Minimum aktif okuma:{" "}
                            {formatSeconds(
                              item.minActiveReadSeconds
                            )}
                          </span>

                          {item.activeReadSeconds >
                          0 ? (
                            <span>
                              Kaydedilen aktif okuma:{" "}
                              {formatSeconds(
                                item.activeReadSeconds
                              )}
                            </span>
                          ) : null}
                        </div>

                        {item.acknowledgementCode ? (
                          <div
                            style={{
                              marginTop:
                                10,
                              display:
                                "inline-flex",
                              gap: 7,
                              alignItems:
                                "center",
                              borderRadius:
                                10,
                              background:
                                "#f0fdf4",
                              color:
                                "#166534",
                              padding:
                                "7px 10px",
                              fontSize:
                                11,
                              fontWeight:
                                900,
                            }}
                          >
                            <CheckCircle2
                              size={14}
                            />
                            Onay Kodu:{" "}
                            {
                              item.acknowledgementCode
                            }
                          </div>
                        ) : null}
                      </div>

                      <a
                        href={`/portal/documents/${item.assignmentId}`}
                        style={{
                          minHeight: 40,
                          borderRadius:
                            11,
                          background:
                            "#6d28d9",
                          color:
                            "#ffffff",
                          textDecoration:
                            "none",
                          padding:
                            "0 13px",
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          gap: 7,
                          fontWeight:
                            900,
                          fontSize:
                            12,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        <ExternalLink
                          size={15}
                        />
                        Belgeyi Oku
                      </a>
                    </article>
                  );
                }
              )}

              {documents.length ===
              0 ? (
                <div
                  style={{
                    minHeight: 220,
                    display: "grid",
                    placeItems:
                      "center",
                    textAlign:
                      "center",
                    color:
                      "#94a3b8",
                  }}
                >
                  <div>
                    <FileCheck2
                      size={42}
                    />
                    <div
                      style={{
                        marginTop:
                          10,
                        fontWeight:
                          900,
                      }}
                    >
                      Size atanmış belge
                      bulunmuyor.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .portalDocumentSummary {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }

          article {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 560px) {
          .portalDocumentSummary {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const headerButton: React.CSSProperties = {
  minHeight: 39,
  borderRadius: 11,
  border:
    "1px solid rgba(255,255,255,.22)",
  background:
    "rgba(255,255,255,.12)",
  color: "#ffffff",
  padding: "0 11px",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
};

const errorBox: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 15,
  padding: 13,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
};