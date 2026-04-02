"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function TrainingDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;

  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const trainingType = normalizeType(training.training?.type);
  const contentUrl = training.training?.content_url || "";

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>{training.training?.title || "Eğitim"}</h1>

      <p style={{ marginTop: "12px", color: "#444" }}>
        {training.training?.description || "Açıklama bulunmuyor."}
      </p>

      <div style={{ marginTop: "16px" }}>
        <strong>Tür:</strong> {trainingType}
      </div>

      {trainingType === "senkron" ? (
        <div style={{ marginTop: "24px" }}>
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
        </div>
      ) : contentUrl ? (
        <div style={{ marginTop: "24px" }}>
          <iframe
            src={contentUrl.replace("watch?v=", "embed/")}
            width="100%"
            height="500"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              border: "none",
              borderRadius: "16px",
              background: "#000",
            }}
          />
        </div>
      ) : (
        <p style={{ marginTop: "24px", color: "#b91c1c" }}>
          Eğitim içeriği bulunamadı.
        </p>
      )}
    </main>
  );
  console.log("training detail page loaded")
}