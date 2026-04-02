"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: 1,
    question: "İş kazalarının en büyük sebebi nedir?",
    options: ["Dikkatsizlik", "Hava", "Şans", "Makine"],
    correct: 0,
  },
  {
    id: 2,
    question: "Yangın söndürmede ilk adım nedir?",
    options: ["Kaçmak", "Müdahale", "Alarm vermek", "Beklemek"],
    correct: 2,
  },
];

export default function FinalExamPage() {
  const { id } = useParams();
  const router = useRouter();

  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(3);

  useEffect(() => {
    const saved = localStorage.getItem(`finalAttempts_${id}`);
    if (saved) setAttempts(Number(saved));
  }, [id]);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleFinish = () => {
    let correct = 0;

    QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });

    const percent = Math.round((correct / QUESTIONS.length) * 100);
    setScore(percent);

    if (percent >= 60) {
      localStorage.setItem(`trainingCompleted_${id}`, "true");
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      localStorage.setItem(`finalAttempts_${id}`, String(newAttempts));
    }
  };

  if (attempts <= 0) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>❌ Hak Bitti</h1>
        <p>Sınav hakkınız tükendi.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Final Sınavı</h1>

      <p>Kalan hak: {attempts}</p>

      {score === null && (
        <>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} style={{ marginBottom: "20px" }}>
              <p><b>{q.question}</b></p>

              {q.options.map((opt, j) => (
                <div key={j}>
                  <label>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      onChange={() => handleSelect(i, j)}
                    />
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          ))}

          <button onClick={handleFinish}>Sınavı Bitir</button>
        </>
      )}

      {score !== null && (
        <>
          <h2>Sonuç: %{score}</h2>

          {score >= 60 ? (
            <>
              <h3 style={{ color: "green" }}>✅ Geçtiniz</h3>
              <button onClick={() => router.push("/portal/training")}>
                Eğitime Dön
              </button>
            </>
          ) : (
            <>
              <h3 style={{ color: "red" }}>❌ Kaldınız</h3>
              <button onClick={() => setScore(null)}>
                Tekrar Dene
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
}