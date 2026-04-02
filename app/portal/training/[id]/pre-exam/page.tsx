"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: 1,
    question: "İş güvenliğinde en önemli unsur nedir?",
    options: ["Hız", "Dikkat", "Maliyet", "Şans"],
    correct: 1,
  },
  {
    id: 2,
    question: "KKD ne anlama gelir?",
    options: [
      "Kişisel Koruyucu Donanım",
      "Kamu Kontrol Dairesi",
      "Koruma Kurulu",
      "Kontrol Kayıt Dosyası",
    ],
    correct: 0,
  },
];

export default function PreExamPage() {
  const { id } = useParams();
  const router = useRouter();

  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

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
    setFinished(true);

    localStorage.setItem(`preExamScore_${id}`, String(percent));
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Ön Değerlendirme Sınavı</h1>

      {!finished && (
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
                      checked={answers[i] === j}
                      onChange={() => handleSelect(i, j)}
                    />
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={handleFinish}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
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
            }}
          >
            Eğitime Dön
          </button>
        </>
      )}
    </main>
  );
}