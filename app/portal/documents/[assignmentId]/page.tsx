"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import EmployeeDocumentPdfReader from "@/components/portal/employee-documents/EmployeeDocumentPdfReader";

type DocItem = {
  assignmentId: string;
  title: string;
  description: string;
  versionNo: number;
  readingPolicy: string;
  minActiveReadSeconds: number;
  requiresAcknowledgement: boolean;
  pageCount: number | null;
  requireLastPage: boolean;
  requireAllPages: boolean;
  activeReadSeconds: number;
  totalOpenSeconds: number;
  pagesViewed: number[];
  lastPageViewed: number | null;
  readingCompletedAt?: string | null;
  acknowledgementAt?: string | null;
  acknowledgementCode?: string | null;
};

function formatSeconds(value: number) {
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  if (minutes <= 0) return `${seconds} sn`;
  if (seconds === 0) return `${minutes} dk`;
  return `${minutes} dk ${seconds} sn`;
}

export default function EmployeeDocumentReaderPage() {
  const params = useParams();
  const assignmentId = String(
    params?.assignmentId || ""
  );

  const [doc, setDoc] = useState<DocItem | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pageNo, setPageNo] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pagesViewed, setPagesViewed] = useState<number[]>([]);

  const [activeReadSeconds, setActiveReadSeconds] =
    useState(0);
  const [totalOpenSeconds, setTotalOpenSeconds] =
    useState(0);
  const [requirementMet, setRequirementMet] =
    useState(false);

  const [acknowledging, setAcknowledging] =
    useState(false);
  const [ackCode, setAckCode] = useState("");
  const [ackAt, setAckAt] = useState("");

  const activeRef = useRef(true);
  const currentPageRef = useRef(1);
  const pageCountRef = useRef(0);
  const lastHeartbeatRef = useRef(Date.now());

  const loadDoc = useCallback(async () => {
    const response = await fetch(
      "/api/employee-documents/my",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error || "Belge bilgisi alınamadı."
      );
    }

    const item = (
      Array.isArray(json?.data) ? json.data : []
    ).find(
      (row: DocItem) =>
        row.assignmentId === assignmentId
    );

    if (!item) {
      throw new Error("Belge ataması bulunamadı.");
    }

    setDoc(item);
    setActiveReadSeconds(
      Number(item.activeReadSeconds || 0)
    );
    setTotalOpenSeconds(
      Number(item.totalOpenSeconds || 0)
    );
    setRequirementMet(
      Boolean(item.readingCompletedAt)
    );
    setAckCode(
      String(item.acknowledgementCode || "")
    );
    setAckAt(
      String(item.acknowledgementAt || "")
    );

    const initialPage = Math.max(
      1,
      Number(item.lastPageViewed || 1)
    );

    currentPageRef.current = initialPage;
    setPageNo(initialPage);

    const initialCount = Math.max(
      0,
      Number(item.pageCount || 0)
    );

    pageCountRef.current = initialCount;
    setPageCount(initialCount);

    setPagesViewed(
      Array.isArray(item.pagesViewed)
        ? item.pagesViewed.map(Number)
        : []
    );
  }, [assignmentId]);

  const start = useCallback(async () => {
    const response = await fetch(
      "/api/employee-documents/read",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          assignmentId,
          action: "START",
        }),
      }
    );

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error ||
          "Okuma oturumu başlatılamadı."
      );
    }

    setSessionId(String(json?.sessionId || ""));
    setActiveReadSeconds(
      Number(json?.activeReadSeconds || 0)
    );
    setTotalOpenSeconds(
      Number(json?.totalOpenSeconds || 0)
    );
    setRequirementMet(
      Boolean(json?.requirementMet)
    );

    if (Array.isArray(json?.pagesViewed)) {
      setPagesViewed(
        json.pagesViewed.map(Number)
      );
    }
  }, [assignmentId]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError("");
        await loadDoc();
        await start();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Belge açılamadı."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDoc, start]);

  const postReadAction = useCallback(
    async (
      action: string,
      extra: Record<string, unknown> = {}
    ) => {
      if (!sessionId) return null;

      const response = await fetch(
        "/api/employee-documents/read",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            assignmentId,
            sessionId,
            action,
            ...extra,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Okuma kaydı güncellenemedi."
        );
      }

      return json;
    },
    [assignmentId, sessionId]
  );

  useEffect(() => {
    const syncActiveState = () => {
      activeRef.current =
        document.visibilityState === "visible" &&
        document.hasFocus();
    };

    const onVisibility = () => {
      syncActiveState();

      if (!sessionId) return;

      void postReadAction(
        activeRef.current ? "FOCUS" : "BLUR"
      ).catch(() => {});
    };

    const onFocus = () => {
      activeRef.current = true;

      if (sessionId) {
        void postReadAction("FOCUS").catch(() => {});
      }
    };

    const onBlur = () => {
      activeRef.current = false;

      if (sessionId) {
        void postReadAction("BLUR").catch(() => {});
      }
    };

    syncActiveState();

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [postReadAction, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    lastHeartbeatRef.current = Date.now();

    const interval = window.setInterval(async () => {
      const now = Date.now();

      const delta = Math.max(
        1,
        Math.min(
          10,
          Math.round(
            (now - lastHeartbeatRef.current) / 1000
          )
        )
      );

      lastHeartbeatRef.current = now;

      try {
        const json = await postReadAction(
          "HEARTBEAT",
          {
            active: activeRef.current === true,
            deltaSeconds: delta,
            pageNo: currentPageRef.current,
            pageCount: pageCountRef.current || 1,
          }
        );

        if (!json) return;

        setActiveReadSeconds(
          Number(json.activeReadSeconds || 0)
        );
        setTotalOpenSeconds(
          Number(json.totalOpenSeconds || 0)
        );
        setRequirementMet(
          Boolean(json.requirementMet)
        );

        if (Array.isArray(json.pagesViewed)) {
          setPagesViewed(
            json.pagesViewed.map(Number)
          );
        }
      } catch {}
    }, 10000);

    return () => {
      window.clearInterval(interval);

      void fetch(
        "/api/employee-documents/read",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          keepalive: true,
          body: JSON.stringify({
            assignmentId,
            sessionId,
            action: "CLOSE",
          }),
        }
      );
    };
  }, [
    assignmentId,
    postReadAction,
    sessionId,
  ]);

  const handlePdfReady = useCallback(
    (detectedPageCount: number) => {
      const count = Math.max(
        1,
        detectedPageCount
      );

      pageCountRef.current = count;
      setPageCount(count);

      if (sessionId) {
        void postReadAction("PDF_READY", {
          pageCount: count,
        }).catch(() => {});
      }
    },
    [postReadAction, sessionId]
  );

  const handlePageChange = useCallback(
    (nextPage: number, totalPages: number) => {
      currentPageRef.current = nextPage;
      pageCountRef.current = totalPages;

      setPageNo(nextPage);
      setPageCount(totalPages);

      setPagesViewed((current) => {
        if (current.includes(nextPage)) {
          return current;
        }

        return [...current, nextPage].sort(
          (a, b) => a - b
        );
      });

      if (sessionId) {
        void postReadAction("HEARTBEAT", {
          active: activeRef.current === true,
          deltaSeconds: 0,
          pageNo: nextPage,
          pageCount: totalPages,
        })
          .then((json) => {
            if (!json) return;

            setRequirementMet(
              Boolean(json.requirementMet)
            );

            if (Array.isArray(json.pagesViewed)) {
              setPagesViewed(
                json.pagesViewed.map(Number)
              );
            }
          })
          .catch(() => {});
      }
    },
    [postReadAction, sessionId]
  );

  const progressPercent = useMemo(() => {
    const required = Math.max(
      1,
      Number(doc?.minActiveReadSeconds || 0)
    );

    return Math.min(
      100,
      Math.round(
        (activeReadSeconds / required) * 100
      )
    );
  }, [
    activeReadSeconds,
    doc?.minActiveReadSeconds,
  ]);

  const pagePercent = useMemo(() => {
    if (pageCount <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        (new Set(pagesViewed).size / pageCount) *
          100
      )
    );
  }, [pageCount, pagesViewed]);

  const acknowledge = async () => {
    try {
      setAcknowledging(true);
      setError("");

      const response = await fetch(
        "/api/employee-documents/acknowledge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            assignmentId,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error ||
            "Belge onayı kaydedilemedi."
        );
      }

      setAckCode(
        String(json?.acknowledgementCode || "")
      );
      setAckAt(
        String(json?.acknowledgementAt || "")
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge onayı kaydedilemedi."
      );
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) {
    return (
      <main style={centerPage}>
        <Loader2 size={28} />
        Belge hazırlanıyor...
      </main>
    );
  }

  if (!doc) {
    return (
      <main style={centerPage}>
        <AlertTriangle size={28} />
        {error || "Belge bulunamadı."}
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <section style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <a
                href="/portal/documents"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                  color: "#6d28d9",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                <ArrowLeft size={15} />
                Belgelerim
              </a>

              <h1
                style={{
                  margin: "10px 0 0",
                  color: "#0f172a",
                  fontSize: 27,
                  fontWeight: 950,
                }}
              >
                {doc.title}
              </h1>

              <div
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                V{doc.versionNo} •{" "}
                {doc.readingPolicy}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 5,
                textAlign: "right",
              }}
            >
              <strong
                style={{
                  color: requirementMet
                    ? "#166534"
                    : "#6d28d9",
                }}
              >
                {requirementMet
                  ? "Okuma şartları tamamlandı"
                  : "Okuma devam ediyor"}
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Sayfa {pageNo} /{" "}
                {pageCount || "-"}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <section style={errorBox}>
            <AlertTriangle size={17} />
            {error}
          </section>
        ) : null}

        <section style={panelStyle}>
          <div
            className="employeeReaderGrid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) 320px",
              gap: 16,
            }}
          >
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 15,
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <EmployeeDocumentPdfReader
                fileUrl={`/api/employee-documents/${assignmentId}/file`}
                title={doc.title}
                initialPage={doc.lastPageViewed || 1}
                onReady={handlePdfReady}
                onPageChange={handlePageChange}
              />
            </div>

            <aside
              style={{
                display: "grid",
                gap: 12,
                alignContent: "start",
              }}
            >
              <div style={sideCard}>
                <div style={sideTitle}>
                  <Clock3 size={17} />
                  Aktif Okuma
                </div>

                <div style={metric}>
                  <span>Aktif süre</span>
                  <strong>
                    {formatSeconds(
                      activeReadSeconds
                    )}
                  </strong>
                </div>

                <div style={metric}>
                  <span>Gerekli süre</span>
                  <strong>
                    {formatSeconds(
                      doc.minActiveReadSeconds
                    )}
                  </strong>
                </div>

                <div style={barTrack}>
                  <div
                    style={{
                      ...barFill,
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  Toplam açık süre:{" "}
                  {formatSeconds(
                    totalOpenSeconds
                  )}
                </div>
              </div>

              <div style={sideCard}>
                <div style={sideTitle}>
                  <Eye size={17} />
                  Sayfa Takibi
                </div>

                <div style={metric}>
                  <span>Görülen</span>
                  <strong>
                    {new Set(pagesViewed).size} /{" "}
                    {pageCount || "-"}
                  </strong>
                </div>

                <div style={barTrack}>
                  <div
                    style={{
                      ...barFill,
                      width: `${pagePercent}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 9,
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  {doc.requireAllPages
                    ? "Tüm sayfaların görüntülenmesi zorunludur."
                    : doc.requireLastPage
                    ? "Belgenin son sayfasına ulaşılması zorunludur."
                    : "Sayfa görüntüleme zorunluluğu bulunmuyor."}
                </div>
              </div>

              {ackCode ? (
                <div
                  style={{
                    ...sideCard,
                    background: "#f0fdf4",
                    border:
                      "1px solid #bbf7d0",
                  }}
                >
                  <div
                    style={{
                      ...sideTitle,
                      color: "#166534",
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Belge Onaylandı
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      color: "#166534",
                      fontWeight: 950,
                      wordBreak: "break-word",
                    }}
                  >
                    {ackCode}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "#4b5563",
                      fontSize: 11,
                    }}
                  >
                    {ackAt
                      ? new Date(
                          ackAt
                        ).toLocaleString("tr-TR")
                      : ""}
                  </div>
                </div>
              ) : (
                <div style={sideCard}>
                  <div style={sideTitle}>
                    <ShieldCheck size={17} />
                    Elektronik Onay
                  </div>

                  <p
                    style={{
                      margin: "7px 0 10px",
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    Süre ve sayfa şartları
                    tamamlandığında onay aktif olur.
                  </p>

                  <button
                    type="button"
                    disabled={
                      !requirementMet ||
                      acknowledging
                    }
                    onClick={() =>
                      void acknowledge()
                    }
                    style={{
                      width: "100%",
                      minHeight: 43,
                      borderRadius: 11,
                      border: 0,
                      background: requirementMet
                        ? "#166534"
                        : "#cbd5e1",
                      color: "#ffffff",
                      fontWeight: 900,
                      cursor: requirementMet
                        ? "pointer"
                        : "not-allowed",
                    }}
                  >
                    {acknowledging
                      ? "Kaydediliyor..."
                      : "Okudum ve Onaylıyorum"}
                  </button>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 950px) {
          .employeeReaderGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 17,
  boxShadow:
    "0 10px 26px rgba(15,23,42,.05)",
};

const sideCard: React.CSSProperties = {
  borderRadius: 15,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 14,
};

const sideTitle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#0f172a",
  fontWeight: 950,
};

const metric: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "#64748b",
  fontSize: 12,
};

const barTrack: React.CSSProperties = {
  marginTop: 9,
  height: 8,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
};

const barFill: React.CSSProperties = {
  height: "100%",
  background: "#6d28d9",
  transition: "width .2s ease",
};

const errorBox: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
};

const centerPage: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 10,
  background: "#f8fafc",
  color: "#475569",
};