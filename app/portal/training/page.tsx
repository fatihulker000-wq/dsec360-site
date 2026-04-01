"use client";

import { useEffect, useMemo, useState } from "react";

type TrainingStatus = "not_started" | "in_progress" | "completed";

type TrainingRecord = {
  id: string;
  status: TrainingStatus;
  started_at?: string | null;
  completed_at?: string | null;
  watch_completed?: boolean | null;
  training?: {
    id: string;
    title?: string;
    description?: string;
    content_url?: string;
    type?: string;
  } | null;
};

function getStatusLabel(status: TrainingStatus) {
  if (status === "completed") return "Tamamlandı";
  if (status === "in_progress") return "Devam Ediyor";
  return "Başlanmadı";
}

function getStatusStyle(status: TrainingStatus): React.CSSProperties {
  if (status === "completed") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (status === "in_progress") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    };
  }

  return {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
  };
}

function formatDateTr(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR");
}

export default function TrainingPortalPage() {
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrainings = async () => {
    try {
      setError("");

      const res = await fetch("/api/training/my", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Eğitimler alınamadı.");
        setTrainings([]);
        return;
      }

      setTrainings(json?.data || []);
    } catch (err) {
      console.error(err);
      setError("Bağlantı hatası oluştu.");
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const stats = useMemo(() => {
    const total = trainings.length;
    const completed = trainings.filter((x) => x.status === "completed").length;
    const inProgress = trainings.filter((x) => x.status === "in_progress").length;
    const notStarted = trainings.filter((x) => x.status === "not_started").length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      inProgress,
      notStarted,
      percent,
    };
  }, [trainings]);

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Eğitim Portalı</div>
          <h1 className="hero-title">Online Eğitimler</h1>
          <p className="hero-desc">
            Size atanmış eğitimleri açın, aktif izleme ile tamamlayın ve belgelerinizi alın.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "26px",
            }}
          >
            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Toplam Eğitim</div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  marginTop: "8px",
                }}
              >
                {stats.total}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#b91c1c" }}>Başlanmadı</div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  marginTop: "8px",
                }}
              >
                {stats.notStarted}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#92400e" }}>Devam Ediyor</div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  marginTop: "8px",
                }}
              >
                {stats.inProgress}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#166534" }}>Tamamlanma</div>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  marginTop: "8px",
                }}
              >
                %{stats.percent}
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "24px",
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#374151",
                marginBottom: "10px",
              }}
            >
              Genel İlerleme
            </div>

            <div
              style={{
                width: "100%",
                height: "14px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${stats.percent}%`,
                  height: "100%",
                  background: "#16a34a",
                  transition: "width 0.25s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {stats.completed} / {stats.total} eğitim tamamlandı
            </div>
          </div>

          {error ? (
            <div className="card" style={{ marginBottom: "20px" }}>
              <h3 className="card-title">Hata</h3>
              <p className="card-text">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="card">Yükleniyor...</div>
          ) : !error && trainings.length === 0 ? (
            <div className="card">
              <h3 className="card-title">Eğitim bulunamadı</h3>
              <p className="card-text">
                Bu kullanıcıya atanmış eğitim görünmüyor.
              </p>
            </div>
          ) : !error ? (
            <div className="grid-3">
              {trainings.map((item) => {
                const localPercent =
                  item.status === "completed"
                    ? 100
                    : item.watch_completed
                    ? 100
                    : item.status === "in_progress"
                    ? 50
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      borderRadius: "22px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start",
                        marginBottom: "14px",
                      }}
                    >
                      <h3 className="card-title" style={{ marginRight: "8px" }}>
                        {item.training?.title || "Adsız Eğitim"}
                      </h3>

                      <div
                        style={{
                          ...getStatusStyle(item.status),
                          borderRadius: "999px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getStatusLabel(item.status)}
                      </div>
                    </div>

                    <p className="card-text">
                      {item.training?.description || "Açıklama bulunmuyor."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#374151",
                        }}
                      >
                        Tür: {item.training?.type || "online"}
                      </div>

                      {item.watch_completed ? (
                        <div
                          style={{
                            display: "inline-flex",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#dcfce7",
                            border: "1px solid #86efac",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#166534",
                          }}
                        >
                          İzleme Tamam
                        </div>
                      ) : null}
                    </div>

                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "10px",
                          background: "#e5e7eb",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${localPercent}%`,
                            height: "100%",
                            background: localPercent === 100 ? "#16a34a" : "#f59e0b",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        İlerleme: %{localPercent}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        fontSize: "12px",
                        color: "#6b7280",
                        lineHeight: 1.7,
                      }}
                    >
                      Başlangıç: {formatDateTr(item.started_at)}
                      <br />
                      Tamamlanma: {formatDateTr(item.completed_at)}
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {item.status !== "completed" && (
                        <button
                          className="cbs-button"
                          style={{
                            background:
                              item.status === "not_started" ? "#f59e0b" : "#2563eb",
                          }}
                          onClick={() => {
                            window.location.href = `/portal/training/${item.id}`;
                          }}
                        >
                          {item.status === "not_started" ? "Eğitimi Aç" : "Tekrar Aç"}
                        </button>
                      )}

                      {item.status === "completed" && (
                        <>
                          <button
                            className="cbs-button"
                            style={{ background: "#111827" }}
                            disabled
                          >
                            Tamamlandı
                          </button>

                          <a
                            href={`/api/training/certificate/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cbs-button"
                            style={{
                              background: "#7c3aed",
                              textDecoration: "none",
                            }}
                          >
                            Eğitim Sertifikası
                          </a>

                          <a
                            href={`/api/training/attendance-certificate/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cbs-button"
                            style={{
                              background: "#0f766e",
                              textDecoration: "none",
                            }}
                          >
                            Katılım Belgesi
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}