"use client";

import { useEffect, useMemo, useState } from "react";
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

type ExamStats = {
  correct: number;
  wrong: number;
  empty: number;
  percent: number;
};

export default function PreExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = String(params?.id || "").trim();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(
    {}
  );
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState<ExamStats>({
    correct: 0,
    wrong: 0,
    empty: 0,
    percent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [assignmentId]);

  useEffect(() => {
    if (!finished) return;

    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);

    return () => window.clearTimeout(id);
  }, [finished]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        if (!assignmentId) {
          setError("Geçersiz eğitim ataması.");
          setQuestions([]);
          return;
        }

        const res = await fetch(
          `/api/training/exam/${assignmentId}?type=pre&_t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const json = await res.json();

        if (!res.ok) {
          setError(json?.error || "Ön sınav soruları alınamadı.");
          setQuestions([]);
          return;
        }

        const rows = Array.isArray(json?.data) ? json.data : [];

        const activeRows = rows
          .filter((item: ExamQuestion) => item.is_active !== false)
          .sort((a: ExamQuestion, b: ExamQuestion) => {
            const aOrder = a.sort_order ?? 0;
            const bOrder = b.sort_order ?? 0;
            return aOrder - bOrder;
          });

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
    } else {
      setLoading(false);
      setError("Geçersiz eğitim ataması.");
    }
  }, [assignmentId]);

  const unansweredCount = useMemo(() => {
    return questions.filter((q) => !answers[q.id]).length;
  }, [questions, answers]);

  const handleSelect = (
    questionId: string,
    option: "A" | "B" | "C" | "D"
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const calculateLocalStats = (): ExamStats => {
    let correct = 0;
    let wrong = 0;
    let empty = 0;

    for (const q of questions) {
      const selected = String(answers[q.id] || "").toUpperCase().trim();
      const correctOption = String(q.correct_option || "").toUpperCase().trim();

      if (!selected) {
        empty += 1;
      } else if (selected === correctOption) {
        correct += 1;
      } else {
        wrong += 1;
      }
    }

    const percent =
      questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    return {
      correct,
      wrong,
      empty,
      percent,
    };
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!assignmentId) {
        setError("Geçersiz eğitim ataması.");
        return;
      }

      if (questions.length === 0) {
        setError("Sınav sorusu bulunamadı.");
        return;
      }

      if (unansweredCount > 0) {
        setError(`Lütfen tüm soruları cevapla. Eksik soru: ${unansweredCount}`);
        return;
      }

      const localStats = calculateLocalStats();
      setStats(localStats);

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
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as SubmitResponse;

      if (!res.ok || json.error) {
        setError(json?.error || "Ön değerlendirme kaydedilemedi.");
        return;
      }

      localStorage.setItem(
        `preExamScore_${assignmentId}`,
        String(localStats.percent)
      );
      localStorage.setItem(`preExamCompleted_${assignmentId}`, "true");

      setFinished(true);
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
    setStats({
      correct: 0,
      wrong: 0,
      empty: 0,
      percent: 0,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Ön Değerlendirme Sınavı</h1>
        <p>Hazırlanıyor...</p>
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
          <p style={{ marginBottom: "16px", color: "#6b7280" }}>
            Toplam soru: {questions.length}
          </p>

          {questions.map((q, index) => (
            <div
              key={q.id}
              style={{
                marginBottom: "24px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                background: "#fff",
              }}
            >
              <p style={{ marginBottom: "12px" }}>
                <b>
                  {index + 1}. {q.question}
                </b>
              </p>

              {(["A", "B", "C", "D"] as const).map((opt) => {
                const optionText =
                  q[`option_${opt.toLowerCase()}` as keyof ExamQuestion];

                return (
                  <div key={opt} style={{ marginBottom: "8px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => handleSelect(q.id, opt)}
                      />
                      <span>
                        <b>{opt})</b> {String(optionText || "")}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          ))}

          {error ? (
            <p style={{ color: "#b91c1c", marginTop: "8px" }}>{error}</p>
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
          <h2>Sonuç: %{stats.percent}</h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "12px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#166534",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Doğru: {stats.correct}
            </span>

            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Yanlış: {stats.wrong}
            </span>

            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                color: "#374151",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Boş: {stats.empty}
            </span>
          </div>

          <p
            style={{
              marginTop: "10px",
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            Ön sınav tamamlandı. Bu sınav seviye ölçme amaçlıdır. Puanınız ne
            olursa olsun eğitime devam edebilirsiniz.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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

            <button
              onClick={handleRetry}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Tekrar Çöz
            </button>
          </div>
        </>
      )}
    </main>
  );
}