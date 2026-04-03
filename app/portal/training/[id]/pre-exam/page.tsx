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

export default function PreExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/training/exam/${id}?type=pre`, {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.error || "Ön sınav soruları alınamadı.");
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
    setFinished(true);

    localStorage.setItem(`preExamScore_${id}`, String(percent));
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Ön Değerlendirme Sınavı</h1>
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Ön Değerlendirme Sınavı</h1>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Ön Değerlendirme Sınavı</h1>
        <p>Bu eğitim için ön sınav sorusu bulunamadı.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Ön Değerlendirme Sınavı</h1>

      {!finished && (
        <>
          {questions.map((q, i) => {
            const options = [q.option_a, q.option_b, q.option_c, q.option_d];

            return (
              <div key={q.id} style={{ marginBottom: "20px" }}>
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
              marginTop: "20px",
              padding: "10px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Sınavı Bitir
          </button>
        </>
      )}

      {finished && (
        <>
          <h2>Sonuç: %{score}</h2>

          <button
            onClick={() => router.push("/portal/training")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Eğitime Dön
          </button>
        </>
      )}
    </main>
  );
}