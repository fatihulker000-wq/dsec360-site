"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./TrainingExamQuestionManager.module.css";

type ExamType = "pre" | "final";
type CorrectOption = "A" | "B" | "C" | "D";

type QuestionRow = {
  id: string;
  training_id: string;
  exam_type: ExamType;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
};

type QuestionForm = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: CorrectOption;
  sortOrder: number;
  isActive: boolean;
};

type TextOptionKey =
  | "optionA"
  | "optionB"
  | "optionC"
  | "optionD";

type Props = {
  trainingId: string;
  trainingTitle: string;
  onChanged?: () => void | Promise<void>;
};

function createEmptyForm(): QuestionForm {
  return {
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    sortOrder: 0,
    isActive: true,
  };
}

export default function TrainingExamQuestionManager({
  trainingId,
  trainingTitle,
  onChanged,
}: Props) {
  const [examType, setExamType] =
    useState<ExamType>("pre");

  const [questions, setQuestions] = useState<
    QuestionRow[]
  >([]);

  const [form, setForm] = useState<QuestionForm>(
    createEmptyForm()
  );

  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQuestions = useCallback(async () => {
    if (!trainingId) {
      setQuestions([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/training-exam-questions?trainingId=${encodeURIComponent(
          trainingId
        )}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Sorular alınamadı."
        );
      }

      setQuestions(
        Array.isArray(json?.data) ? json.data : []
      );
    } finally {
      setLoading(false);
    }
  }, [trainingId]);

  useEffect(() => {
    setEditingId("");
    setForm(createEmptyForm());
    setMessage("");
    setError("");

    loadQuestions().catch((cause: unknown) => {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sorular alınamadı."
      );
    });
  }, [loadQuestions]);

  const visibleQuestions = useMemo(
    () =>
      questions.filter(
        (item) => item.exam_type === examType
      ),
    [questions, examType]
  );

  function resetForm() {
    setEditingId("");
    setForm(createEmptyForm());
  }

  function changeExamType(nextType: ExamType) {
    setExamType(nextType);
    resetForm();
    setMessage("");
    setError("");
  }

  function renderOptionInput(
    key: TextOptionKey,
    label: string
  ) {
    return (
      <label className={styles.field}>
        <span>{label}</span>

        <input
          value={form[key]}
          onChange={(event) => {
            const value = event.target.value;

            setForm((current) => ({
              ...current,
              [key]: value,
            }));
          }}
          placeholder={`${label} yazınız`}
        />
      </label>
    );
  }

  async function saveQuestion() {
    if (!trainingId) {
      setError("Önce bir eğitim seçmelisiniz.");
      return;
    }

    if (
      !form.question.trim() ||
      !form.optionA.trim() ||
      !form.optionB.trim() ||
      !form.optionC.trim() ||
      !form.optionD.trim()
    ) {
      setError(
        "Soru metni ve dört cevap seçeneği zorunludur."
      );
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/training-exam-questions/${editingId}`
        : "/api/admin/training-exam-questions";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainingId,
          examType,
          question: form.question,
          optionA: form.optionA,
          optionB: form.optionB,
          optionC: form.optionC,
          optionD: form.optionD,
          correctOption: form.correctOption,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        }),
      });

      const json = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Soru kaydedilemedi."
        );
      }

      const wasEditing = Boolean(editingId);

      resetForm();

      setMessage(
        wasEditing
          ? "Soru başarıyla güncellendi."
          : "Soru başarıyla eklendi."
      );

      await loadQuestions();

      if (onChanged) {
        await onChanged();
      }
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Soru kaydedilemedi."
      );
    } finally {
      setBusy(false);
    }
  }

  function editQuestion(item: QuestionRow) {
    setExamType(item.exam_type);
    setEditingId(item.id);
    setMessage("");
    setError("");

    setForm({
      question: item.question,
      optionA: item.option_a,
      optionB: item.option_b,
      optionC: item.option_c,
      optionD: item.option_d,
      correctOption: item.correct_option,
      sortOrder: item.sort_order || 0,
      isActive: item.is_active !== false,
    });

    window.setTimeout(() => {
      document
        .getElementById("training-exam-question-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  }

  async function deleteQuestion(item: QuestionRow) {
    const accepted = window.confirm(
      `"${item.question}" sorusu silinsin mi?`
    );

    if (!accepted) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/training-exam-questions/${item.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Soru silinemedi."
        );
      }

      if (editingId === item.id) {
        resetForm();
      }

      setMessage("Soru başarıyla silindi.");

      await loadQuestions();

      if (onChanged) {
        await onChanged();
      }
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Soru silinemedi."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!trainingId) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <small>SINAV İÇERİK YÖNETİMİ</small>

          <h2>Sınav Soruları Yönetimi</h2>

          <p>{trainingTitle}</p>
        </div>

        <strong>{visibleQuestions.length} soru</strong>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={
            examType === "pre" ? styles.active : ""
          }
          onClick={() => changeExamType("pre")}
        >
          Ön Sınav
        </button>

        <button
          type="button"
          className={
            examType === "final" ? styles.active : ""
          }
          onClick={() => changeExamType("final")}
        >
          Final Sınavı
        </button>
      </div>

      <div
        id="training-exam-question-form"
        className={styles.form}
      >
        <label
          className={`${styles.field} ${styles.full}`}
        >
          <span>Soru metni</span>

          <textarea
            rows={4}
            value={form.question}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                question: event.target.value,
              }))
            }
            placeholder="Sınav sorusunu yazınız"
          />
        </label>

        {renderOptionInput("optionA", "A seçeneği")}
        {renderOptionInput("optionB", "B seçeneği")}
        {renderOptionInput("optionC", "C seçeneği")}
        {renderOptionInput("optionD", "D seçeneği")}

        <label className={styles.field}>
          <span>Doğru cevap</span>

          <select
            value={form.correctOption}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                correctOption:
                  event.target.value as CorrectOption,
              }))
            }
          >
            <option value="A">A seçeneği</option>
            <option value="B">B seçeneği</option>
            <option value="C">C seçeneği</option>
            <option value="D">D seçeneği</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Soru sırası</span>

          <input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sortOrder: Math.max(
                  0,
                  Number(event.target.value)
                ),
              }))
            }
          />
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
          />

          Aktif soru
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            disabled={busy}
            onClick={saveQuestion}
          >
            {busy
              ? "İşlem yapılıyor..."
              : editingId
                ? "Soruyu Güncelle"
                : "Soru Ekle"}
          </button>

          {editingId ? (
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={resetForm}
            >
              Vazgeç
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      {message ? (
        <div className={styles.success}>{message}</div>
      ) : null}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>
            Sorular yükleniyor...
          </div>
        ) : null}

        {!loading && visibleQuestions.length === 0 ? (
          <div className={styles.empty}>
            Bu sınav türü için henüz soru eklenmedi.
          </div>
        ) : null}

        {!loading
          ? visibleQuestions.map((item, index) => (
              <article key={item.id}>
                <div className={styles.questionContent}>
                  <b>
                    {index + 1}. {item.question}
                  </b>

                  <div className={styles.options}>
                    <span>A: {item.option_a}</span>
                    <span>B: {item.option_b}</span>
                    <span>C: {item.option_c}</span>
                    <span>D: {item.option_d}</span>
                  </div>

                  <small>
                    Doğru cevap: {item.correct_option}
                    {" · "}
                    Sıra: {item.sort_order || 0}
                    {" · "}
                    {item.is_active ? "Aktif" : "Pasif"}
                  </small>
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => editQuestion(item)}
                  >
                    Düzenle
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    className={styles.danger}
                    onClick={() => deleteQuestion(item)}
                  >
                    Sil
                  </button>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  );
}