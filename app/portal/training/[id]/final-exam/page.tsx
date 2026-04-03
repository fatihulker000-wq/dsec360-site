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
  attemptsUsed?: number;
  attemptsLeft?: number;
  resetRequired?: boolean;
  message?: string;
  error?: string;
};

export default function FinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(
    {}
  );
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [attempts, setAttempts] = useState(3);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedAttempts = localStorage.getItem(`finalAttempts_${assignmentId}`);
    if (savedAttempts) {
      const parsed = Number(savedAttempts);
      if (!Number.isNaN(parsed)) {
        setAttempts(parsed);
      }
    }
  }, [assignmentId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/training/exam/${assignmentId}?type=final`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

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
        console.error("final exam fetch hatası:", err);
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
        examType: "final",
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
        setError(json?.error || "Final sınav sonucu kaydedilemedi.");
        return;
      }

      setResult(json);

      const safeScore = Number(json.score || 0);
      localStorage.setItem(`finalScore_${assignmentId}`, String(safeScore));

      if (typeof json.attemptsLeft === "number") {
        setAttempts(json.attemptsLeft);
        localStorage.setItem(
          `finalAttempts_${assignmentId}`,
          String(json.attemptsLeft)
        );
      }

      if (json.passed) {
        localStorage.setItem(`trainingCompleted_${assignmentId}`, "true");
      } else {
        localStorage.setItem(`trainingCompleted_${assignmentId}`, "false");
      }

      if (json.resetRequired) {
        localStorage.removeItem(`preExamScore_${assignmentId}`);
      }
    } catch (err) {
      console.error("final exam submit hatası:", err);
      setError("Sınav sonucu gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError("");
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p>Yükleniyor...</p>
      </main>
    );
  }

  if (error && questions.length === 0) {
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

  if ((result?.attemptsLeft === 0 || attempts <= 0) && !result?.passed) {
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

      {!result ? (
        <>
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: "24px" }}>
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
              padding: "12px 20px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "Kaydediliyor..." : "Final Sınavını Bitir"}
          </button>
        </>
      ) : (
        <>
          <h2>Sonuç: %{result.score}</h2>

          {result.passed ? (
            <>
              <h3 style={{ color: "#166534" }}>Başarılı</h3>
              <p>{result.message || "Eğitim tamamlandı."}</p>
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
              <p>{result.message || "60 puan altı. Kalan hakkın varsa tekrar deneyebilirsin."}</p>
              <p>Kalan hak: {result.attemptsLeft}</p>

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