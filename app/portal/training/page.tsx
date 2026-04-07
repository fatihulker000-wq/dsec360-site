"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TrainingItem = {
  id: string;
  status?: "not_started" | "in_progress" | "completed";
  watch_completed?: boolean | null;
  pre_exam_completed?: boolean | null;
  final_exam_passed?: boolean | null;
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  training?: {
    title?: string;
    description?: string;
    type?: string | null;
  } | null;
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();
  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";
  return "asenkron";
}

export default function TrainingListPage() {
  const router = useRouter();
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/training/my", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          setError(`API hata verdi: ${res.status}`);
          setItems([]);
          return;
        }

        const json = await res.json();

        if (!json || !Array.isArray(json.data)) {
          setError("Eğitim verisi bulunamadı.");
          setItems([]);
          return;
        }

        setItems(json.data);
      } catch (err) {
        console.error("training list fetch hatası:", err);
        setError("Bağlantı hatası oluştu.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTrainings();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Yükleniyor...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Hata</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Eğitimlerim</h1>
        <p>Size atanmış eğitim bulunamadı.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "20px" }}>Eğitimlerim</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {items.map((item) => {
            const title = item.training?.title || "Eğitim";
            const description =
              item.training?.description || "Açıklama bulunmuyor.";
            const type = normalizeType(item.training?.type);

            const completed = item.final_exam_passed === true;
            const videoCompleted =
              item.status === "completed" || item.watch_completed === true;

            const finalAttempts = Number(item.final_exam_attempts || 0);
            const finalAttemptsLeft = Math.max(0, 3 - finalAttempts);

            const finalScore =
              item.final_exam_score !== null &&
              item.final_exam_score !== undefined
                ? Number(item.final_exam_score)
                : null;

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: "10px" }}>{title}</h3>

                <p
                  style={{
                    color: "#4b5563",
                    lineHeight: 1.6,
                    minHeight: "48px",
                  }}
                >
                  {description}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Tür: {type}
                  </span>

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: completed
                        ? "#dcfce7"
                        : videoCompleted
                        ? "#ecfccb"
                        : "#eff6ff",
                      border: completed
                        ? "1px solid #86efac"
                        : videoCompleted
                        ? "1px solid #bef264"
                        : "1px solid #bfdbfe",
                      color: completed
                        ? "#166534"
                        : videoCompleted
                        ? "#3f6212"
                        : "#1d4ed8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {completed
                      ? "Tamamlandı"
                      : videoCompleted
                      ? "Eğitim Tamamlandı"
                      : "Devam Ediyor"}
                  </span>

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: item.pre_exam_completed
                        ? "#eff6ff"
                        : "#fef2f2",
                      border: item.pre_exam_completed
                        ? "1px solid #bfdbfe"
                        : "1px solid #fecaca",
                      color: item.pre_exam_completed ? "#1d4ed8" : "#991b1b",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {item.pre_exam_completed
                      ? "Ön Sınav Tamam"
                      : "Ön Sınav Bekliyor"}
                  </span>

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#fff7ed",
                      border: "1px solid #fdba74",
                      color: "#9a3412",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Final Hak: {finalAttemptsLeft}
                  </span>

                  {finalScore !== null ? (
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: finalScore >= 60 ? "#dcfce7" : "#fee2e2",
                        border:
                          finalScore >= 60
                            ? "1px solid #86efac"
                            : "1px solid #fca5a5",
                        color: finalScore >= 60 ? "#166534" : "#b91c1c",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Final: {finalScore}
                    </span>
                  ) : null}

                  {completed ? (
                    <>
                      <button
                        onClick={() =>
                          window.open(
                            `/api/training/certificate/${item.id}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#ede9fe",
                          border: "1px solid #c4b5fd",
                          color: "#5b21b6",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Sertifika
                      </button>

                      <button
                        onClick={() =>
                          window.open(
                            `/api/training/attendance-certificate/${item.id}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#ecfeff",
                          border: "1px solid #99f6e4",
                          color: "#0f766e",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Katılım Belgesi
                      </button>
                    </>
                  ) : null}
                </div>

                <button
                  onClick={() => router.push(`/portal/training/${item.id}`)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: completed ? "#16a34a" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Eğitime Git
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}