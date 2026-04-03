"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ExamQuestion = {
  id: string;
  training_id: string;
  exam_type: "pre" | "final";
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  sort_order?: number | null;
  is_active?: boolean | null;
};

function normalizeCorrectOption(value?: string | null): number {
  const v = (value || "").trim().toUpperCase();

  if (v === "A") return 0;
  if (v === "B") return 1;
  if (v === "C") return 2;
  if (v === "D") return 3;

  return -1;
}

export default function FinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedAttempts = localStorage.getItem(`finalAttempts_${id}`);
    if (savedAttempts) {
      const parsed = Number(savedAttempts);
      if (!Number.isNaN(parsed)) {
        setAttempts(parsed);
      }
    }
  }, [id]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/training/exam/${id}?type=final`, {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.error || "Final sınav soruları alınamadı.");
          setQuestions([]);
          return;
        }

        const rows = Array.isArray(json?.data) ? json.data : [];
        const activeRows = rows.filter(
          (item: ExamQuestion) => item.is_active !== false
        );

        setQuestions(activeRows);
      } catch (err) {
        console.error(err);
        setError("Bağlantı hatası oluştu.");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchQuestions();
    }
  }, [id]);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleFinish = () => {
    if (questions.length === 0) return;

    let correct = 0;

    questions.forEach((q, i) => {
      const correctIndex = normalizeCorrectOption(q.correct_option);
      if (answers[i] === correctIndex) {
        correct++;
      }
    });

    const percent = Math.round((correct / questions.length) * 100);
    setScore(percent);

    if (percent >= 60) {
      localStorage.setItem(`trainingCompleted_${id}`, "true");
      localStorage.setItem(`finalScore_${id}`, String(percent));
    } else {
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);
      localStorage.setItem(`finalAttempts_${id}`, String(nextAttempts));
      localStorage.setItem(`finalScore_${id}`, String(percent));
    }
  };

  const handleRetry = () => {
    setAnswers([]);
    setScore(null);
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p>Bu eğitim için final sınav sorusu bulunamadı.</p>
      </main>
    );
  }

  if (attempts <= 0) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınav Hakkı Bitti</h1>
        <p>Bu eğitim başarısız sayıldı. Eğitimin yeniden alınması gerekir.</p>
        <button
          onClick={() => router.push("/portal/training")}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Eğitim Listesine Dön
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Final Sınavı</h1>
      <p>Kalan hak: {attempts}</p>

      {score === null ? (
        <>
          {questions.map((q, i) => {
            const options = [q.option_a, q.option_b, q.option_c, q.option_d];

            return (
              <div key={q.id} style={{ marginBottom: "24px" }}>
                <p>
                  <b>{q.question}</b>
                </p>

                {options.map((opt, j) => (
                  <div key={j}>
                    <label>
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === j}
                        onChange={() => handleSelect(i, j)}
                      />
                      {opt}
                    </label>
                  </div>
                ))}
              </div>
            );
          })}

          <button
            onClick={handleFinish}
            style={{
              padding: "12px 20px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Final Sınavını Bitir
          </button>
        </>
      ) : (
        <>
          <h2>Sonuç: %{score}</h2>

          {score >= 60 ? (
            <>
              <h3 style={{ color: "#166534" }}>Başarılı</h3>
              <p>Eğitim tamamlandı. Sertifika ve katılım belgesi açılabilir.</p>
              <button
                onClick={() => router.push("/portal/training")}
                style={{
                  marginTop: "16px",
                  padding: "12px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Eğitim Listesine Dön
              </button>
            </>
          ) : (
            <>
              <h3 style={{ color: "#b91c1c" }}>Başarısız</h3>
              <p>60 puan altı. Kalan hakkın varsa tekrar deneyebilirsin.</p>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: "16px",
                  padding: "12px 20px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Tekrar Dene
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}