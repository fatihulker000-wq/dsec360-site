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
  correct_option: "A" | "B" | "C" | "D";
  sort_order?: number | null;
  is_active?: boolean | null;
};

type SubmitResponse = {
  success?: boolean;
  examType?: "pre" | "final";
  score?: number;
  passed?: boolean;
  message?: string;
  error?: string;
};

export default function PreExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(
    {}
  );
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/training/exam/${assignmentId}?type=pre`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
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
        console.error("pre exam fetch hatası:", err);
        setError("Bağlantı hatası oluştu.");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      void fetchQuestions();
    }
  }, [assignmentId]);

  const handleSelect = (
    questionId: string,
    option: "A" | "B" | "C" | "D"
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        assignmentId,
        examType: "pre",
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOption: answers[q.id],
        })),
      };

      const res = await fetch("/api/training/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as SubmitResponse;

      if (!res.ok || json.error) {
        setError(json?.error || "Ön değerlendirme kaydedilemedi.");
        return;
      }

      const examScore = Number(json.score || 0);
      setScore(examScore);
      setFinished(true);

      localStorage.setItem(`preExamScore_${assignmentId}`, String(examScore));
    } catch (err) {
      console.error("pre exam submit hatası:", err);
      setError("Sınav sonucu gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setFinished(false);
    setScore(0);
    setError("");
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Ön Değerlendirme Sınavı</h1>
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (error && questions.length === 0) {
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
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "20px" }}>
              <p>
                <b>{q.question}</b>
              </p>

              {(["A", "B", "C", "D"] as const).map((opt) => {
                const optionText = q[`option_${opt.toLowerCase()}` as keyof ExamQuestion];

                return (
                  <div key={opt}>
                    <label>
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => handleSelect(q.id, opt)}
                      />
                      {String(optionText || "")}
                    </label>
                  </div>
                );
              })}
            </div>
          ))}

          {error ? (
            <p style={{ color: "#b91c1c" }}>{error}</p>
          ) : null}

          <button
            onClick={handleFinish}
            disabled={submitting}
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
            {submitting ? "Kaydediliyor..." : "Sınavı Bitir"}
          </button>
        </>
      )}

      {finished && (
        <>
          <h2>Sonuç: %{score}</h2>

          {score >= 60 ? (
            <button
              onClick={() => router.push(`/portal/training/${assignmentId}`)}
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
              Eğitime Git
            </button>
          ) : (
            <>
              <p style={{ color: "#b91c1c" }}>
                60 puan altında kaldın. Devam etmek için tekrar çözmelisin.
              </p>

              <button
                onClick={handleRetry}
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
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