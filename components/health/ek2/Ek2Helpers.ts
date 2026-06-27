// Ek2Helpers.ts

import {
  Decision,
  DoraWarning,
  Ek2Form,
} from "./Ek2Types";

/* ------------------------------------------------ */
/* BMI                                              */
/* ------------------------------------------------ */

export function calculateBmi(
  height: string,
  weight: string
): string {

  const h = Number(height) / 100;
  const w = Number(weight);

  if (!h || !w) return "";

  return (w / (h * h)).toFixed(1);

}

/* ------------------------------------------------ */
/* BMI TEXT                                         */
/* ------------------------------------------------ */

export function bmiText(
  bmi: string
): string {

  const value = Number(bmi);

  if (!value) return "-";

  if (value < 18.5) return "Zayıf";

  if (value < 25) return "Normal";

  if (value < 30) return "Fazla Kilolu";

  if (value < 35) return "Obez";

  if (value < 40) return "İleri Obez";

  return "Morbid Obez";

}

/* ------------------------------------------------ */
/* NEXT EXAM                                        */
/* ------------------------------------------------ */

export function calculateNextExamDate(
  examDate: string,
  year: number
) {

  if (!examDate) return "";

  const d = new Date(examDate);

  d.setFullYear(
    d.getFullYear() + year
  );

  return d
    .toISOString()
    .substring(0, 10);

}

/* ------------------------------------------------ */
/* BLOOD PRESSURE                                   */
/* ------------------------------------------------ */

export function bloodPressureText(
  systolic: string,
  diastolic: string
) {

  const s = Number(systolic);
  const d = Number(diastolic);

  if (!s || !d) return "-";

  if (s >= 180 || d >= 120)
    return "Hipertansif Kriz";

  if (s >= 140 || d >= 90)
    return "Hipertansiyon";

  if (s >= 120 || d >= 80)
    return "Yüksek";

  return "Normal";

}

/* ------------------------------------------------ */
/* SpO2                                             */
/* ------------------------------------------------ */

export function spo2Text(
  spo2: string
) {

  const v = Number(spo2);

  if (!v) return "-";

  if (v < 90)
    return "Kritik";

  if (v < 95)
    return "Düşük";

  return "Normal";

}

/* ------------------------------------------------ */
/* DORA                                             */
/* ------------------------------------------------ */

export function buildWarnings(
  form: Ek2Form
): DoraWarning[] {

  const list: DoraWarning[] = [];

  const bmi =
    Number(form.bmi);

  if (bmi >= 30) {

    list.push({

      title: "BMI",

      level: "warning",

      message:
        "Obezite nedeniyle yakın takip önerilir.",

    });

  }

  if (
    Number(form.systolic) >= 140 ||
    Number(form.diastolic) >= 90
  ) {

    list.push({

      title: "Hipertansiyon",

      level: "danger",

      message:
        "Kan basıncı yüksek.",

    });

  }

  if (
    Number(form.spo2) > 0 &&
    Number(form.spo2) < 92
  ) {

    list.push({

      title: "SpO₂",

      level: "danger",

      message:
        "Oksijen satürasyonu düşük.",

    });

  }

  if (
    form.decision === "Çalışamaz"
  ) {

    list.push({

      title: "İşe Uygunluk",

      level: "danger",

      message:
        "Çalışamaz kararı verilmiş.",

    });

  }

  if (
    form.audiometry.result ===
    "Patolojik"
  ) {

    list.push({

      title: "Odyometri",

      level: "warning",

      message:
        "İşitme kaybı değerlendirilmelidir.",

    });

  }

  if (
    form.sft.result ===
    "Obstrüktif"
  ) {

    list.push({

      title: "SFT",

      level: "warning",

      message:
        "Solunum fonksiyon bozukluğu.",

    });

  }

  if (
    form.vision.result ===
    "Uygun Değil"
  ) {

    list.push({

      title: "Görme",

      level: "warning",

      message:
        "Görme değerlendirmesi tekrar edilmelidir.",

    });

  }

  return list;

}

/* ------------------------------------------------ */
/* DECISION COLOR                                   */
/* ------------------------------------------------ */

export function decisionColor(
  decision: Decision
) {

  switch (decision) {

    case "Çalışabilir":
      return "#16a34a";

    case "Şartlı Çalışabilir":
      return "#ca8a04";

    case "Çalışamaz":
      return "#dc2626";

    default:
      return "#64748b";

  }

}

/* ------------------------------------------------ */
/* FILE NO                                          */
/* ------------------------------------------------ */

export function generateFileNo() {

  const d = new Date();

  const year = d.getFullYear();

  const random =
    Math.floor(
      1000 +
        Math.random() * 9000
    );

  return `EK2-${year}-${random}`;

}

/* ------------------------------------------------ */
/* EMPTY CHECK                                      */
/* ------------------------------------------------ */

export function isEmpty(
  value?: string
) {

  return (
    !value ||
    value.trim() === ""
  );

}

/* ------------------------------------------------ */
/* FORM VALIDATION                                  */
/* ------------------------------------------------ */

export function validateForm(
  form: Ek2Form
) {

  const errors: string[] = [];

  if (
    isEmpty(form.employeeName)
  ) {
    errors.push(
      "Çalışan adı zorunludur."
    );
  }

  if (
    isEmpty(form.examDate)
  ) {
    errors.push(
      "Muayene tarihi zorunludur."
    );
  }

  if (
    isEmpty(form.doctorName)
  ) {
    errors.push(
      "İşyeri hekimi zorunludur."
    );
  }

  if (
    isEmpty(form.decision)
  ) {
    errors.push(
      "İşe uygunluk kararı zorunludur."
    );
  }

  return errors;

}
