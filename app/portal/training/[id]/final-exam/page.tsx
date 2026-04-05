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
  attemptsUsed?: number;
  attemptsLeft?: number;
  resetRequired?: boolean;
  message?: string;
  error?: string;
};

type GuardState = {
  ok: boolean;
  message: string;
};

type TrainingRow = {
  id: string;
  pre_exam_completed?: boolean | null;
  watch_completed?: boolean | null;
  watch_seconds?: number | null;
  click_count?: number | null;
  final_exam_attempts?: number | null;
  final_exam_score?: number | null;
  final_exam_passed?: boolean | null;
  training?: {
    type?: string | null;
  } | null;
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();

  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";

  return "asenkron";
}

export default function FinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [trainingType, setTrainingType] = useState<"senkron" | "asenkron">(
    "asenkron"
  );
  const [guardChecked, setGuardChecked] = useState(false);
  const [guardState, setGuardState] = useState<GuardState>({
    ok: false,
    message: "",
  });

 const [questions, setQuestions] = useState<ExamQuestion[]>([]);
const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>(
  {}
);
const [result, setResult] = useState<SubmitResponse | null>(null);
const [attemptsLeft, setAttemptsLeft] = useState(3);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
  window.scrollTo({ top: 0, behavior: "auto" });
}, [assignmentId]);

useEffect(() => {
  if (!assignmentId) return;

  const fetchTrainingInfoAndGuard = async () => {
      try {
        const res = await fetch("/api/training/my", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const currentTraining = rows.find(
          (item: TrainingRow) => item?.id === assignmentId
        );

        if (!currentTraining) {
          setGuardState({
            ok: false,
            message: "Eğitim kaydı bulunamadı.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        const type = normalizeType(currentTraining?.training?.type);
        setTrainingType(type);

        if (!currentTraining.pre_exam_completed) {
          setGuardState({
            ok: false,
            message:
              "Ön sınav tamamlanmadan final sınavına girilemez. Önce ön sınavı tamamlamalısınız.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        const attemptsUsed = Number(currentTraining.final_exam_attempts || 0);
        setAttemptsLeft(Math.max(0, 3 - attemptsUsed));

        if (type === "senkron") {
          setGuardState({ ok: true, message: "" });
          setGuardChecked(true);
          return;
        }

        if (!currentTraining.watch_completed) {
          setGuardState({
            ok: false,
            message:
              "Asenkron eğitim tamamlanmadan final sınavına girilemez. Önce videoyu kurallara uygun şekilde tamamlamalısınız.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        if (Number(currentTraining.watch_seconds || 0) <= 0) {
          setGuardState({
            ok: false,
            message: "İzleme süresi kaydı bulunamadı.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        if (Number(currentTraining.click_count || 0) <= 0) {
          setGuardState({
            ok: false,
            message: "Ekran başı doğrulama kaydı bulunamadı.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        setGuardState({ ok: true, message: "" });
        setGuardChecked(true);
      } catch (err) {
        console.error("final exam guard hatası:", err);
        setGuardState({
          ok: false,
          message:
            "Final sınav kontrolü yapılırken bir hata oluştu. Eğitim sayfasına dönüp tekrar deneyin.",
        });
        setGuardChecked(true);
        setLoading(false);
      }
    };

    void fetchTrainingInfoAndGuard();
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId || !guardChecked || !guardState.ok) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/training/exam/${assignmentId}?type=final&_t=${Date.now()}`,
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
        const activeRows = rows
          .filter((item: ExamQuestion) => item.is_active !== false)
          .sort((a: ExamQuestion, b: ExamQuestion) => {
            const aOrder = a.sort_order ?? 0;
            const bOrder = b.sort_order ?? 0;
            return aOrder - bOrder;
          });

        setQuestions(activeRows);
      } catch (err) {
        console.error("final exam fetch hatası:", err);
        setError("Bağlantı hatası oluştu.");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchQuestions();
  }, [assignmentId, guardChecked, guardState.ok]);

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

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (questions.length === 0) {
        setError("Sınav sorusu bulunamadı.");
        return;
      }

      if (unansweredCount > 0) {
        setError(`Lütfen tüm soruları cevapla. Eksik soru: ${unansweredCount}`);
        return;
      }

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
window.scrollTo({ top: 0, behavior: "smooth" });

if (typeof json.attemptsLeft === "number") {
  setAttemptsLeft(json.attemptsLeft);
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
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  if (!guardChecked || loading) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p>Kontrol ediliyor...</p>
      </main>
    );
  }

  if (!guardState.ok) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Final Sınavı</h1>
        <p style={{ color: "#b91c1c", lineHeight: 1.7 }}>{guardState.message}</p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => router.replace(`/portal/training/${assignmentId}`)}
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
            Eğitime Dön
          </button>

          <button
            onClick={() =>
              router.replace(`/portal/training/${assignmentId}/pre-exam`)
            }
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ön Sınava Git
          </button>
        </div>
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

  if ((result?.attemptsLeft === 0 || attemptsLeft <= 0) && !result?.passed) {
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

      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0 }}>Kalan hak: {attemptsLeft}</p>
        <span
          style={{
            display: "inline-flex",
            padding: "6px 10px",
            borderRadius: "999px",
            background: trainingType === "senkron" ? "#eff6ff" : "#f8fafc",
            border:
              trainingType === "senkron"
                ? "1px solid #bfdbfe"
                : "1px solid #e5e7eb",
            color: trainingType === "senkron" ? "#1d4ed8" : "#374151",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          Tür: {trainingType}
        </span>
      </div>

      {!result ? (
        <>
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
              <p>
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

          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

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
              <p>
                {result.message || "Eğitim tamamlandı. Sertifika açılabilir."}
              </p>
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
              <p>
                {result.message ||
                  "60 puan altı. Kalan hakkın varsa tekrar deneyebilirsin."}
              </p>
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