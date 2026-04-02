"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

export default function PreExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 🔥 Soruları çek
  useEffect(() => {
    fetch(`/api/training/exam/questions?assignmentId=${assignmentId}&type=pre`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.data || []);
      })
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleSelect = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const submitExam = async () => {
    const formattedAnswers = Object.entries(answers).map(
      ([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      })
    );

    const res = await fetch("/api/training/exam/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId,
        examType: "pre",
        answers: formattedAnswers,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Hata oluştu");
      return;
    }

    alert("Ön değerlendirme tamamlandı");

    // 👉 Eğitime geri dön
    router.push(`/portal/training/${assignmentId}`);
  };

  if (loading) return <div className="card">Yükleniyor...</div>;

  return (
    <main className="page-container">
      <div className="card">
        <h2>Ön Değerlendirme</h2>

        {questions.map((q, index) => (
          <div key={q.id} style={{ marginBottom: 20 }}>
            <strong>
              {index + 1}. {q.question}
            </strong>

            {["A", "B", "C", "D"].map((opt) => {
              const text =
                opt === "A"
                  ? q.option_a
                  : opt === "B"
                  ? q.option_b
                  : opt === "C"
                  ? q.option_c
                  : q.option_d;

              return (
                <div key={opt}>
                  <label>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      onChange={() => handleSelect(q.id, opt)}
                    />
                    {opt}) {text}
                  </label>
                </div>
              );
            })}
          </div>
        ))}

        <button className="cbs-button" onClick={submitExam}>
          Sınavı Gönder
        </button>
      </div>
    </main>
  );
}