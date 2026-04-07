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
  status?: "not_started" | "in_progress" | "completed";
  pre_exam_completed?: boolean | null;
  watch_completed?: boolean | null;
  watch_seconds?: number | null;
  click_count?: number | null;
  final_exam_attempts?: number | null;
  final_exam_score?: number | null;
  final_exam_passed?: boolean | null;
  completed_at?: string | null;
  training_reset_required?: boolean | null;
  training?: {
    type?: string | null;
  } | null;
};

type TrainingSnapshot = {
  preExamCompleted: boolean;
  watchCompleted: boolean;
  watchSeconds: number;
  clickCount: number;
  status: "not_started" | "in_progress" | "completed";
};

function normalizeType(type?: string | null) {
  const value = (type || "").trim().toLowerCase();

  if (value === "senkron") return "senkron";
  if (value === "asenkron") return "asenkron";

  return "asenkron";
}

function LoadingPanel() {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          width: "220px",
          height: "30px",
          borderRadius: "10px",
          background: "#f3f4f6",
          marginBottom: "18px",
        }}
      />
      <div
        style={{
          width: "140px",
          height: "14px",
          borderRadius: "8px",
          background: "#f3f4f6",
          marginBottom: "28px",
        }}
      />
      <div
        style={{
          width: "100%",
          height: "120px",
          borderRadius: "16px",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
        }}
      />
    </div>
  );
}

function PageBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ marginTop: 0, marginBottom: "20px" }}>{title}</h1>
        {children}
      </div>
    </main>
  );
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

  const [trainingSnapshot, setTrainingSnapshot] = useState<TrainingSnapshot>({
    preExamCompleted: false,
    watchCompleted: false,
    watchSeconds: 0,
    clickCount: 0,
    status: "not_started",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [assignmentId]);

  const readAssignment = async () => {
    const res = await fetch("/api/training/my", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const currentTraining = rows.find(
      (item: TrainingRow) => item?.id === assignmentId
    ) as TrainingRow | undefined;

    return currentTraining || null;
  };

  useEffect(() => {
    if (!assignmentId) return;

    const fetchTrainingInfoAndGuard = async () => {
      try {
        const currentTraining = await readAssignment();

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

        const preExamCompleted = currentTraining.pre_exam_completed === true;
        const watchCompleted = currentTraining.watch_completed === true;
        const watchSeconds = Number(currentTraining.watch_seconds || 0);
        const clickCount = Number(currentTraining.click_count || 0);
        const status =
          currentTraining.status === "completed"
            ? "completed"
            : currentTraining.status === "in_progress"
            ? "in_progress"
            : "not_started";

        const attemptsUsed = Number(currentTraining.final_exam_attempts || 0);

        setTrainingSnapshot({
          preExamCompleted,
          watchCompleted,
          watchSeconds,
          clickCount,
          status,
        });

        if (!preExamCompleted) {
          setGuardState({
            ok: false,
            message:
              "Ön sınav tamamlanmadan final sınavına girilemez. Önce ön sınavı tamamlamalısınız.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        if (currentTraining.training_reset_required === true) {
          setGuardState({
            ok: false,
            message:
              "Bu eğitim yeniden başlatılmıştır. Ön sınavı tekrar tamamlayıp videoyu baştan izlemelisiniz.",
          });
          setGuardChecked(true);
          setLoading(false);
          return;
        }

        setAttemptsLeft(Math.max(0, 3 - attemptsUsed));

        if (type === "senkron") {
          setGuardState({ ok: true, message: "" });
          setGuardChecked(true);
          return;
        }

        if (!watchCompleted) {
          setGuardState({
            ok: false,
            message:
              "Asenkron eğitim tamamlanmadan final sınavına girilemez. Önce videoyu kurallara uygun şekilde tamamlamalısınız.",
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

  const answeredCount = useMemo(() => {
    return questions.length - unansweredCount;
  }, [questions.length, unansweredCount]);

  const handleSelect = (
    questionId: string,
    option: "A" | "B" | "C" | "D"
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const submitFinalOnce = async () => {
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
    return { res, json };
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

      const latestAssignment = await readAssignment();

      if (!latestAssignment) {
        setError("Eğitim kaydı bulunamadı.");
        return;
      }

      const latestType = normalizeType(latestAssignment?.training?.type);

      if (!latestAssignment.pre_exam_completed) {
        setError("Ön sınav tamamlanmadan final sınavı gönderilemez.");
        return;
      }

      if (latestAssignment.training_reset_required === true) {
        setError(
          "Bu eğitim yeniden başlatılmıştır. Ön sınavı tekrar tamamlayıp videoyu baştan izlemelisiniz."
        );
        return;
      }

      if (latestType === "asenkron" && latestAssignment.watch_completed !== true) {
        setError(
          "Asenkron eğitim tamamlanmadan final sınavına girilemez. Önce videoyu tamamlamalısınız."
        );
        return;
      }

      const { res, json } = await submitFinalOnce();

      if (!res.ok || json.error) {
        setError(json?.error || "Final sınav sonucu kaydedilemedi.");
        return;
      }

      setResult(json);

      if (typeof json.attemptsLeft === "number") {
        setAttemptsLeft(json.attemptsLeft);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <PageBox title="Final Sınavı">
        <LoadingPanel />
      </PageBox>
    );
  }

  if (!guardState.ok) {
    return (
      <PageBox title="Final Sınavı">
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 12px 32px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Erişim Kısıtlandı
          </div>

          <p style={{ color: "#991b1b", lineHeight: 1.8, marginTop: 0 }}>
            {guardState.message}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => router.replace(`/portal/training/${assignmentId}`)}
              style={{
                marginTop: "8px",
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
                marginTop: "8px",
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
        </div>
      </PageBox>
    );
  }

  if (error && questions.length === 0) {
    return (
      <PageBox title="Final Sınavı">
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "20px",
            padding: "24px",
            color: "#991b1b",
          }}
        >
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      </PageBox>
    );
  }

  if (questions.length === 0) {
    return (
      <PageBox title="Final Sınavı">
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <p style={{ margin: 0 }}>Bu eğitim için final sınav sorusu bulunamadı.</p>
        </div>
      </PageBox>
    );
  }

  if ((result?.attemptsLeft === 0 || attemptsLeft <= 0) && !result?.passed) {
    return (
      <PageBox title="Final Sınav Hakkı Bitti">
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 12px 32px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Eğitim Yeniden Atanmalı
          </div>

          <p style={{ color: "#374151", lineHeight: 1.8, marginTop: 0 }}>
            Bu eğitim başarısız sayıldı. Final sınav hakkınız bittiği için
            eğitimin yeniden alınması gerekir.
          </p>

          <button
            onClick={() => router.push("/portal/training")}
            style={{
              marginTop: "8px",
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
        </div>
      </PageBox>
    );
  }

  return (
    <PageBox title="Final Sınavı">
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "22px",
          padding: "24px",
          boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#9a3412",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Kalan Hak: {attemptsLeft}
          </span>

          <span
            style={{
              display: "inline-flex",
              padding: "8px 12px",
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

          {!result ? (
            <span
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                color: "#4338ca",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Cevaplanan: {answeredCount} / {questions.length}
            </span>
          ) : null}
        </div>

        {!result ? (
          <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.7 }}>
            Tüm soruları dikkatlice cevaplayın. Final sınavı sonucu eğitim
            tamamlanma durumunu etkiler.
          </p>
        ) : (
          <div
            style={{
              marginTop: "4px",
              borderRadius: "18px",
              padding: "24px",
              background: result.passed
                ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)",
              border: result.passed
                ? "1px solid #86efac"
                : "1px solid #fdba74",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: result.passed ? "#dcfce7" : "#fee2e2",
                  border: result.passed
                    ? "1px solid #86efac"
                    : "1px solid #fca5a5",
                  color: result.passed ? "#166534" : "#b91c1c",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {result.passed ? "Başarılı" : "Başarısız"}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  color: "#111827",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Puan: {result.score ?? 0}
              </span>

              {typeof result.attemptsLeft === "number" ? (
                <span
                  style={{
                    display: "inline-flex",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    color: "#111827",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Kalan Hak: {result.attemptsLeft}
                </span>
              ) : null}
            </div>

            <h2
              style={{
                marginTop: 0,
                marginBottom: "10px",
                color: result.passed ? "#166534" : "#9a3412",
              }}
            >
              {result.passed
                ? "Final sınavı başarıyla tamamlandı"
                : "Final sınavı başarıyla tamamlanamadı"}
            </h2>

            <p
              style={{
                marginTop: 0,
                color: "#374151",
                lineHeight: 1.8,
                marginBottom: "18px",
              }}
            >
              {result.message ||
                (result.passed
                  ? "Eğitim başarıyla tamamlandı. Sertifika veya sonraki adımlar açılabilir."
                  : "60 puanın altında kaldınız. Kalan hakkınız varsa tekrar deneyebilirsiniz.")}
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {result.passed ? (
                <button
                  onClick={() => router.push("/portal/training")}
                  style={{
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
              ) : (
                <button
                  onClick={handleRetry}
                  style={{
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
              )}

              <button
                onClick={() => router.push(`/portal/training/${assignmentId}`)}
                style={{
                  padding: "12px 20px",
                  background: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Eğitim Detayına Dön
              </button>
            </div>
          </div>
        )}
      </div>

      {!result ? (
        <>
          {questions.map((q, index) => (
            <div
              key={q.id}
              style={{
                marginBottom: "20px",
                padding: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              }}
            >
              <p style={{ marginTop: 0, marginBottom: "14px", lineHeight: 1.7 }}>
                <b>
                  {index + 1}. {q.question}
                </b>
              </p>

              {(["A", "B", "C", "D"] as const).map((opt) => {
                const optionText =
                  q[`option_${opt.toLowerCase()}` as keyof ExamQuestion];

                const checked = answers[q.id] === opt;

                return (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: checked
                        ? "1px solid #8b5cf6"
                        : "1px solid #e5e7eb",
                      background: checked ? "#f5f3ff" : "#ffffff",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => handleSelect(q.id, opt)}
                    />
                    <span style={{ lineHeight: 1.6 }}>
                      <b>{opt})</b> {String(optionText || "")}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}

          {error ? (
            <div
              style={{
                marginBottom: "16px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                lineHeight: 1.7,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            onClick={handleFinish}
            disabled={submitting}
            style={{
              padding: "14px 22px",
              background: submitting ? "#a78bfa" : "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 10px 20px rgba(124,58,237,0.20)",
            }}
          >
            {submitting ? "Kaydediliyor..." : "Final Sınavını Bitir"}
          </button>
        </>
      ) : null}
    </PageBox>
  );
}