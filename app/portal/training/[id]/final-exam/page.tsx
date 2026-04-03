"use client";

import { useEffect, useState } from "react";
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
    question: "Yangın sırasında ilk yapılması gereken nedir?",
    options: ["Panik yapmak", "Alarm vermek", "Saklanmak", "Beklemek"],
    correct: 1,
  },
  {
    id: 3,
    question: "KKD kullanımı neden önemlidir?",
    options: [
      "Zaman kaybı olmaması için",
      "Yasal zorunluluk ve korunma için",
      "Sadece görüntü için",
      "Maliyet düşürmek için",
    ],
    correct: 1,
  },
];

export default function FinalExamPage() {
  const { id } = useParams();
  const router = useRouter();

  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(3);

  useEffect(() => {
    const savedAttempts = localStorage.getItem(`finalAttempts_${id}`);
    if (savedAttempts) {
      const parsed = Number(savedAttempts);
      if (!Number.isNaN(parsed)) {
        setAttempts(parsed);
      }
    }
  }, [id]);

  const handleSelect = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleFinish = () => {
    let correct = 0;

    QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.correct) {
        correct++;
      }
    });

    const percent = Math.round((correct / QUESTIONS.length) * 100);
    setScore(percent);

    if (percent >= 60) {
      localStorage.setItem(`trainingCompleted_${id}`, "true");
      localStorage.setItem(`finalScore_${id}`, String(percent));
    } else {
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);
      localStorage.setItem(`finalAttempts_${id}`, String(nextAttempts));
      localStorage.setItem(`finalScore_${id}`, String(percent));
    }
  };

  const handleRetry = () => {
    setAnswers([]);
    setScore(null);
  };

  if (attempts <= 0) {
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

      {score === null ? (
        <>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} style={{ marginBottom: "24px" }}>
              <p>
                <b>{q.question}</b>
              </p>

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
              padding: "12px 20px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
            }}
          >
            Final Sınavını Bitir
          </button>
        </>
      ) : (
        <>
          <h2>Sonuç: %{score}</h2>

          {score >= 60 ? (
            <>
              <h3 style={{ color: "#166534" }}>Başarılı</h3>
              <p>Eğitim tamamlandı. Sertifika ve katılım belgesi açılabilir.</p>
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
                }}
              >
                Eğitim Listesine Dön
              </button>
            </>
          ) : (
            <>
              <h3 style={{ color: "#b91c1c" }}>Başarısız</h3>
              <p>60 puan altı. Kalan hakkın varsa tekrar deneyebilirsin.</p>
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
