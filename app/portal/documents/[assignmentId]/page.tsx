"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
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
  const total = Math.max(0, value);
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

  const [doc, setDoc] =
    useState<DocItem | null>(null);

  const [sessionId, setSessionId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeReadSeconds, setActiveReadSeconds] =
    useState(0);

  const [totalOpenSeconds, setTotalOpenSeconds] =
    useState(0);

  const [requirementMet, setRequirementMet] =
    useState(false);

  const [acknowledging, setAcknowledging] =
    useState(false);

  const [ackCode, setAckCode] =
    useState("");

  const [ackAt, setAckAt] =
    useState("");

  const activeRef = useRef(true);
  const lastHeartbeatRef = useRef(Date.now());

  const loadDoc = useCallback(async () => {
    const response = await fetch(
      "/api/employee-documents/my",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const json =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error ||
          "Belge bilgisi alınamadı."
      );
    }

    const item = (
      Array.isArray(json?.data)
        ? json.data
        : []
    ).find(
      (row: DocItem) =>
        row.assignmentId === assignmentId
    );

    if (!item) {
      throw new Error(
        "Belge ataması bulunamadı."
      );
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
  }, [assignmentId]);

  const start = useCallback(async () => {
    const response = await fetch(
      "/api/employee-documents/read",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          assignmentId,
          action: "START",
        }),
      }
    );

    const json =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json?.error ||
          "Okuma oturumu başlatılamadı."
      );
    }

    setSessionId(
      String(json?.sessionId || "")
    );
    setActiveReadSeconds(
      Number(json?.activeReadSeconds || 0)
    );
    setTotalOpenSeconds(
      Number(json?.totalOpenSeconds || 0)
    );
    setRequirementMet(
      Boolean(json?.requirementMet)
    );
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

  useEffect(() => {
    const onVisibility = () => {
      activeRef.current =
        document.visibilityState === "visible";

      if (!sessionId) return;

      void fetch(
        "/api/employee-documents/read",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            assignmentId,
            sessionId,
            action:
              activeRef.current
                ? "FOCUS"
                : "BLUR",
          }),
        }
      );
    };

    const onFocus = () => {
      activeRef.current = true;
    };

    const onBlur = () => {
      activeRef.current = false;
    };

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );
    window.addEventListener(
      "focus",
      onFocus
    );
    window.addEventListener(
      "blur",
      onBlur
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
      window.removeEventListener(
        "focus",
        onFocus
      );
      window.removeEventListener(
        "blur",
        onBlur
      );
    };
  }, [assignmentId, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = window.setInterval(
      async () => {
        const now = Date.now();
        const delta = Math.max(
          1,
          Math.min(
            15,
            Math.round(
              (now -
                lastHeartbeatRef.current) /
                1000
            )
          )
        );

        lastHeartbeatRef.current = now;

        const response = await fetch(
          "/api/employee-documents/read",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              assignmentId,
              sessionId,
              action: "HEARTBEAT",
              active:
                activeRef.current === true,
              deltaSeconds: delta,
              pageNo: 1,
            }),
          }
        );

        const json =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          return;
        }

        setActiveReadSeconds(
          Number(
            json?.activeReadSeconds || 0
          )
        );

        setTotalOpenSeconds(
          Number(
            json?.totalOpenSeconds || 0
          )
        );

        setRequirementMet(
          Boolean(json?.requirementMet)
        );
      },
      10000
    );

    return () => {
      window.clearInterval(interval);

      void fetch(
        "/api/employee-documents/read",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
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
  }, [assignmentId, sessionId]);

  const progressPercent = useMemo(() => {
    const required = Math.max(
      1,
      Number(
        doc?.minActiveReadSeconds || 0
      )
    );

    return Math.min(
      100,
      Math.round(
        (activeReadSeconds / required) *
          100
      )
    );
  }, [
    activeReadSeconds,
    doc?.minActiveReadSeconds,
  ]);

  const acknowledge = async () => {
    try {
      setAcknowledging(true);
      setError("");

      const response = await fetch(
        "/api/employee-documents/acknowledge",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            assignmentId,
          }),
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error ||
            "Belge onayı kaydedilemedi."
        );
      }

      setAckCode(
        String(
          json?.acknowledgementCode || ""
        )
      );
      setAckAt(
        String(
          json?.acknowledgementAt || ""
        )
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
              justifyContent:
                "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <a
                href="/portal/documents"
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 6,
                  textDecoration:
                    "none",
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
                  margin:
                    "10px 0 0",
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
                  ? "Okuma şartı tamamlandı"
                  : "Okuma devam ediyor"}
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Aktif:{" "}
                {formatSeconds(
                  activeReadSeconds
                )}{" "}
                /{" "}
                {formatSeconds(
                  doc.minActiveReadSeconds
                )}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              height: 10,
              background: "#e5e7eb",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "#6d28d9",
                transition: "width .2s ease",
              }}
            />
          </div>
        </section>

        {error ? (
          <section style={errorBox}>
            <AlertTriangle
              size={17}
            />
            {error}
          </section>
        ) : null}

        <section style={panelStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1fr) 310px",
              gap: 16,
            }}
            className="employeeReaderGrid"
          >
            <div
              style={{
                minHeight: 720,
                border:
                  "1px solid #e5e7eb",
                borderRadius: 15,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <iframe
                title={doc.title}
                src={`/api/employee-documents/${assignmentId}/file`}
                style={{
                  width: "100%",
                  height: 720,
                  border: 0,
                  display: "block",
                }}
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
                  Okuma Kaydı
                </div>

                <div style={metric}>
                  <span>
                    Toplam Açık Süre
                  </span>
                  <strong>
                    {formatSeconds(
                      totalOpenSeconds
                    )}
                  </strong>
                </div>

                <div style={metric}>
                  <span>
                    Aktif Okuma
                  </span>
                  <strong>
                    {formatSeconds(
                      activeReadSeconds
                    )}
                  </strong>
                </div>
              </div>

              <div style={sideCard}>
                <div style={sideTitle}>
                  <Eye size={17} />
                  Okuma Şartı
                </div>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#64748b",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  Belge ekranda aktifken geçen
                  süre kaydedilir. Başka sekmeye
                  geçtiğiniz süre aktif okumaya
                  eklenmez.
                </p>
              </div>

              {ackCode ? (
                <div
                  style={{
                    ...sideCard,
                    background:
                      "#f0fdf4",
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
                    <CheckCircle2
                      size={18}
                    />
                    Belge Onaylandı
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      color: "#166534",
                      fontWeight: 950,
                      wordBreak:
                        "break-word",
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
                        ).toLocaleString(
                          "tr-TR"
                        )
                      : ""}
                  </div>
                </div>
              ) : (
                <div style={sideCard}>
                  <div style={sideTitle}>
                    <ShieldCheck
                      size={17}
                    />
                    Elektronik Onay
                  </div>

                  <p
                    style={{
                      margin:
                        "7px 0 10px",
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    Belgeyi okuduğunuzu ve
                    içeriğinin tarafınıza
                    bildirildiğini elektronik
                    olarak onaylayın.
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
                      background:
                        requirementMet
                          ? "#166534"
                          : "#cbd5e1",
                      color: "#ffffff",
                      fontWeight: 900,
                      cursor:
                        requirementMet
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