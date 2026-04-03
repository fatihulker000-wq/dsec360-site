"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TrainingStatus = "not_started" | "in_progress" | "completed";

type TrainingDetail = {
  id: string;
  status: TrainingStatus;
  watch_completed?: boolean;
  started_at?: string | null;
  completed_at?: string | null;
  training?: {
    id: string;
    title?: string;
    description?: string;
    content_url?: string;
    type?: string;
  } | null;
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();

  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";

  return "asenkron";
}

function toEmbedUrl(url: string) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  return url;
}

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [finalAttempts, setFinalAttempts] = useState(3);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/training/my", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.error || "Eğitim alınamadı.");
          setTraining(null);
          return;
        }

        const found = Array.isArray(json?.data)
          ? json.data.find((item: TrainingDetail) => item.id === assignmentId)
          : null;

        if (!found) {
          setError("Eğitim kaydı bulunamadı.");
          setTraining(null);
          return;
        }

        setTraining(found);
      } catch (err) {
        console.error(err);
        setError("Bağlantı hatası oluştu.");
        setTraining(null);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      void fetchTraining();
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) return;

    const savedAttempts = localStorage.getItem(`finalAttempts_${assignmentId}`);
    const savedCompleted = localStorage.getItem(`trainingCompleted_${assignmentId}`);
    const savedFinalScore = localStorage.getItem(`finalScore_${assignmentId}`);

    if (savedAttempts !== null) {
      const parsed = Number(savedAttempts);
      if (!Number.isNaN(parsed)) {
        setFinalAttempts(parsed);
      }
    }

    if (savedFinalScore !== null) {
      const parsed = Number(savedFinalScore);
      if (!Number.isNaN(parsed)) {
        setFinalScore(parsed);
      }
    }

    setTrainingCompleted(savedCompleted === "true");
  }, [assignmentId]);

  const trainingType = useMemo(
    () => normalizeType(training?.training?.type),
    [training?.training?.type]
  );

  const contentUrl = training?.training?.content_url || "";
  const embedUrl = useMemo(() => toEmbedUrl(contentUrl), [contentUrl]);

  const canTakeFinalExam = finalAttempts > 0 && !trainingCompleted;

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Yükleniyor...</h1>
      </main>
    );
  }

  if (error || !training) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Hata</h1>
        <p>{error || "Eğitim bulunamadı."}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ margin: 0 }}>
            {training.training?.title || "Eğitim"}
          </h1>

          <p style={{ marginTop: "12px", color: "#444", lineHeight: 1.7 }}>
            {training.training?.description || "Açıklama bulunmuyor."}
          </p>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Tür: {trainingType}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: trainingCompleted ? "#dcfce7" : "#eff6ff",
                border: trainingCompleted
                  ? "1px solid #86efac"
                  : "1px solid #bfdbfe",
                color: trainingCompleted ? "#166534" : "#1d4ed8",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {trainingCompleted ? "Eğitim Başarılı" : "Eğitim Devam Ediyor"}
            </div>

            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                color: "#9a3412",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Kalan Final Hakkı: {finalAttempts}
            </div>

            {finalScore !== null ? (
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: finalScore >= 60 ? "#dcfce7" : "#fee2e2",
                  border:
                    finalScore >= 60
                      ? "1px solid #86efac"
                      : "1px solid #fca5a5",
                  color: finalScore >= 60 ? "#166534" : "#b91c1c",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Final Puanı: %{finalScore}
              </div>
            ) : null}
          </div>

          {trainingType === "senkron" ? (
            <div style={{ marginTop: "24px" }}>
              {contentUrl ? (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "12px 18px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Canlı Eğitime Katıl
                </a>
              ) : (
                <p style={{ color: "#b91c1c" }}>Canlı eğitim linki bulunamadı.</p>
              )}
            </div>
          ) : contentUrl ? (
            <div style={{ marginTop: "24px" }}>
              <iframe
                src={embedUrl}
                width="100%"
                height="500"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  border: "none",
                  borderRadius: "16px",
                  background: "#000",
                }}
                title="Eğitim İçeriği"
              />
            </div>
          ) : (
            <p style={{ marginTop: "24px", color: "#b91c1c" }}>
              Eğitim içeriği bulunamadı.
            </p>
          )}

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {canTakeFinalExam ? (
              <button
                onClick={() => {
                  router.push(`/portal/training/${assignmentId}/final-exam`);
                }}
                style={{
                  padding: "12px 20px",
                  background: "#7c3aed",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Final Sınavına Gir
              </button>
            ) : trainingCompleted ? (
              <button
                disabled
                style={{
                  padding: "12px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                Eğitim Tamamlandı
              </button>
            ) : (
              <button
                disabled
                style={{
                  padding: "12px 20px",
                  background: "#9ca3af",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                Final Hakkı Bitti
              </button>
            )}

            <button
              onClick={() => {
                router.push("/portal/training");
              }}
              style={{
                padding: "12px 20px",
                background: "#111827",
                color: "#fff",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Eğitim Listesine Dön
            </button>
          </div>

          {!trainingCompleted && finalAttempts <= 0 && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                lineHeight: 1.6,
              }}
            >
              Final sınav haklarınız bitti. Bu eğitim tamamlanmadı olarak
              değerlendirilecektir ve eğitimin yeniden alınması gerekir.
            </div>
          )}

          {trainingCompleted && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                lineHeight: 1.6,
              }}
            >
              Tebrikler. Final sınavı başarıyla tamamlandı. Eğitim başarılı
              durumda.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}