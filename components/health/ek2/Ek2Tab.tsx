"use client";

import { useMemo, useState } from "react";

import OfficialEk2Print from "./OfficialEk2Print";
import AudiometrySection from "./AudiometrySection";
import SftSection from "./SftSection";
import VisionSection from "./VisionSection";
import VaccinationSection from "./VaccinationSection";
import PdfPreviewSection from "./PdfPreviewSection";

import {
  Ek2Form,
  FormType,
  FormStatus,
} from "./Ek2Types";

import {
  calculateBmi,
  buildWarnings,
  generateFileNo,
  validateForm,
} from "./Ek2Helpers";

type Props = {
  employee?: any;
};

const initialForm: Ek2Form = {
  employeeId: "",
  companyId: "",

  formType: "İşe Giriş",
  status: "Taslak",

  fileNo: generateFileNo(),
  revisionNo: "0",

  examDate: "",
  nextExamDate: "",
  doctorName: "",

  employeeName: "",
  identityNumber: "",
  birthDate: "",
  gender: "",
  bloodGroup: "",
  phone: "",

  companyName: "",
  workplaceAddress: "",
  department: "",
  jobTitle: "",
  startDate: "",

  dangerClass: "",
  naceCode: "",

  previousJobs: "",
  currentJobDescription: "",
  exposures: "",
  ppeUsage: "",
  previousAccidents: "",
  occupationalDiseaseHistory: "",

  chronicDiseases: "",
  surgeries: "",
  medicines: "",
  allergies: "",
  habits: "",
  familyHistory: "",

  height: "",
  weight: "",
  bmi: "",

  systolic: "",
  diastolic: "",
  pulse: "",
  respiration: "",
  temperature: "",
  spo2: "",

  headNeck: "",
  eye: "",
  earNoseThroat: "",
  respiratory: "",
  cardiovascular: "",
  digestive: "",
  genitourinary: "",
  musculoskeletal: "",
  neurological: "",
  skin: "",
  psychological: "",

  hemogram: "",
  biochemistry: "",
  urine: "",
  radiology: "",
  ekg: "",
  otherTests: "",

  riskEvaluation: "",
  restrictions: "",
  recommendations: "",

  decision: "Çalışabilir",

  doctorOpinion: "",
  signatureNote: "",

  audiometry: {
    testDate: "",
    rightEar500: "",
    rightEar1000: "",
    rightEar2000: "",
    rightEar4000: "",
    leftEar500: "",
    leftEar1000: "",
    leftEar2000: "",
    leftEar4000: "",
    result: "",
    note: "",
  },

  sft: {
    testDate: "",
    fvc: "",
    fev1: "",
    fev1fvc: "",
    pef: "",
    fef2575: "",
    result: "",
    doctorNote: "",
  },

  vision: {
    testDate: "",
    rightFar: "",
    leftFar: "",
    rightNear: "",
    leftNear: "",
    colorVision: "",
    depthVision: "",
    glasses: false,
    result: "",
    note: "",
  },

  vaccines: [],
};

export default function Ek2Tab({
  employee,
}: Props) {

  const [form, setForm] = useState<Ek2Form>({
    ...initialForm,

    employeeId: employee?.id ?? "",
    employeeName: employee?.full_name ?? "",
    identityNumber: employee?.identity_number ?? "",
    birthDate: employee?.birth_date ?? "",
    gender: employee?.gender ?? "",
    bloodGroup: employee?.blood_group ?? "",
    phone: employee?.phone ?? "",

    companyId: employee?.company_id ?? "",
    companyName: employee?.company_name ?? "",

    jobTitle: employee?.job_title ?? "",
    startDate: employee?.start_date ?? "",
  });

  const warnings = useMemo(() => {

    const bmi = calculateBmi(
      form.height,
      form.weight
    );

    return buildWarnings({
      ...form,
      bmi,
    });

  }, [form]);
    function update<K extends keyof Ek2Form>(
    key: K,
    value: Ek2Form[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function saveDraft() {
    const errors = validateForm(form);

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    setForm((prev) => ({
      ...prev,
      status: "Taslak",
    }));

    alert("Taslak kaydedildi.");
  }

  async function completeForm() {
  const errors = validateForm(form);

  if (errors.length) {
    alert(errors.join("\n"));
    return;
  }

  const payload: Ek2Form = {
    ...form,
    status: "Tamamlandı",
    bmi: calculateBmi(form.height, form.weight),
  };

  const res = await fetch("/api/admin/ek2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    alert(json.error || "EK-2 kaydedilemedi.");
    return;
  }

  setForm(payload);

  alert("EK-2 tamamlandı ve kaydedildi.");
}

  function signForm() {
    setForm((prev) => ({
      ...prev,
      status: "İmzalandı",
    }));
  }

  return (
    <main
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <section
        style={{
          background:
            "linear-gradient(135deg,#7f1d1d,#991b1b)",
          color: "#fff",
          borderRadius: 18,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          EK-2 İşe Giriş / Periyodik Muayene
        </h2>

        <p
          style={{
            opacity: .9,
          }}
        >
          Yönetmeliğe uygun dijital sağlık
          modülü
        </p>

      </section>

      {warnings.length > 0 && (

        <section
          style={{
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <strong>
            DORA Uyarıları
          </strong>

          {warnings.map((w) => (

            <div
              key={w.title}
            >
              • {w.message}
            </div>

          ))}

        </section>

      )}

      <section
      className="no-print"
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={saveDraft}
        >
          Taslak Kaydet
        </button>

        <button
          onClick={completeForm}
        >
          Tamamla
        </button>

        <button
          onClick={signForm}
        >
          İmzala
        </button>

        <button
          onClick={() =>
            window.print()
          }
        >
          Yazdır
        </button>
      </section>
        <section
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        <GeneralInformationCard
          form={form}
          onChange={setForm}
        />

        <OccupationalHistoryCard
          form={form}
          onChange={setForm}
        />

        <MedicalHistoryCard
          form={form}
          onChange={setForm}
        />

        <PhysicalExaminationCard
          form={form}
          onChange={setForm}
        />

        <AudiometrySection
          value={form.audiometry}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              audiometry: value,
            }))
          }
        />

        <SftSection
          value={form.sft}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              sft: value,
            }))
          }
        />

        <VisionSection
          value={form.vision}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              vision: value,
            }))
          }
        />

        <VaccinationSection
          vaccines={form.vaccines}
          note={form.signatureNote}
          onVaccinesChange={(vaccines) =>
            setForm((prev) => ({
              ...prev,
              vaccines,
            }))
          }
          onNoteChange={(note) =>
            setForm((prev) => ({
              ...prev,
              signatureNote: note,
            }))
          }
        />

        <PdfPreviewSection
          employeeName={form.employeeName}
          companyName={form.companyName}
          doctorName={form.doctorName}
          examDate={form.examDate}
          decision={form.decision}
          formType={form.formType}
          onPreview={() => {}}
          onPdf={() => {}}
          onPrint={() => window.print()}
        />

        <div className="ek2-print-only">
  <OfficialEk2Print
    form={{
      ...form,
      bmi: calculateBmi(form.height, form.weight),
    }}
  />
</div>
      </section>
    </main>
  );
}

function GeneralInformationCard({
  form,
  onChange,
}: {
  form: Ek2Form;
  onChange: (form: Ek2Form) => void;
}) {
  function set<K extends keyof Ek2Form>(key: K, value: Ek2Form[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <section style={card}>
      <h3 style={sectionTitle}>Genel Bilgiler</h3>

      <div style={grid}>
        <Field label="Form Türü">
          <select
            value={form.formType}
            onChange={(e) => set("formType", e.target.value as FormType)}
            style={input}
          >
            <option>İşe Giriş</option>
            <option>Periyodik</option>
          </select>
        </Field>

        <Field label="Durum">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as FormStatus)}
            style={input}
          >
            <option>Taslak</option>
            <option>Tamamlandı</option>
            <option>İmzalandı</option>
          </select>
        </Field>

        <Field label="Muayene Tarihi">
          <input
            type="date"
            value={form.examDate}
            onChange={(e) => set("examDate", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Sonraki Muayene Tarihi">
          <input
            type="date"
            value={form.nextExamDate}
            onChange={(e) => set("nextExamDate", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="İşyeri Hekimi">
          <input
            value={form.doctorName}
            onChange={(e) => set("doctorName", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Dosya No">
          <input value={form.fileNo} readOnly style={readonlyInput} />
        </Field>
      </div>
    </section>
  );
}

function OccupationalHistoryCard({
  form,
  onChange,
}: {
  form: Ek2Form;
  onChange: (form: Ek2Form) => void;
}) {
  function set<K extends keyof Ek2Form>(key: K, value: Ek2Form[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <section style={card}>
      <h3 style={sectionTitle}>Mesleki Anamnez</h3>

      <Field label="Önceki İşler">
        <textarea
          value={form.previousJobs}
          onChange={(e) => set("previousJobs", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Yaptığı İş">
        <textarea
          value={form.currentJobDescription}
          onChange={(e) => set("currentJobDescription", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Maruziyetler">
        <textarea
          value={form.exposures}
          onChange={(e) => set("exposures", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="KKD Kullanımı">
        <textarea
          value={form.ppeUsage}
          onChange={(e) => set("ppeUsage", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Geçirilmiş İş Kazaları">
        <textarea
          value={form.previousAccidents}
          onChange={(e) => set("previousAccidents", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Meslek Hastalığı Öyküsü">
        <textarea
          value={form.occupationalDiseaseHistory}
          onChange={(e) => set("occupationalDiseaseHistory", e.target.value)}
          style={textarea}
        />
      </Field>
    </section>
  );
}

function MedicalHistoryCard({
  form,
  onChange,
}: {
  form: Ek2Form;
  onChange: (form: Ek2Form) => void;
}) {
  function set<K extends keyof Ek2Form>(key: K, value: Ek2Form[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <section style={card}>
      <h3 style={sectionTitle}>Özgeçmiş / Soygeçmiş</h3>

      <Field label="Kronik Hastalıklar">
        <textarea
          value={form.chronicDiseases}
          onChange={(e) => set("chronicDiseases", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Geçirilmiş Ameliyatlar">
        <textarea
          value={form.surgeries}
          onChange={(e) => set("surgeries", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Kullanılan İlaçlar">
        <textarea
          value={form.medicines}
          onChange={(e) => set("medicines", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Alerjiler">
        <textarea
          value={form.allergies}
          onChange={(e) => set("allergies", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Alışkanlıklar">
        <textarea
          value={form.habits}
          onChange={(e) => set("habits", e.target.value)}
          style={textarea}
        />
      </Field>

      <Field label="Soygeçmiş">
        <textarea
          value={form.familyHistory}
          onChange={(e) => set("familyHistory", e.target.value)}
          style={textarea}
        />
      </Field>
    </section>
  );
}

function PhysicalExaminationCard({
  form,
  onChange,
}: {
  form: Ek2Form;
  onChange: (form: Ek2Form) => void;
}) {
  function set<K extends keyof Ek2Form>(key: K, value: Ek2Form[K]) {
    const next = { ...form, [key]: value };

    if (key === "height" || key === "weight") {
      next.bmi = calculateBmi(
        String(key === "height" ? value : form.height),
        String(key === "weight" ? value : form.weight)
      );
    }

    onChange(next);
  }

  return (
    <section style={card}>
      <h3 style={sectionTitle}>Fizik Muayene / Vital Bulgular</h3>

      <div style={grid}>
        <Field label="Boy">
          <input
            value={form.height}
            onChange={(e) => set("height", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Kilo">
          <input
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="BMI">
          <input value={form.bmi} readOnly style={readonlyInput} />
        </Field>

        <Field label="TA Sistolik">
          <input
            value={form.systolic}
            onChange={(e) => set("systolic", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="TA Diyastolik">
          <input
            value={form.diastolic}
            onChange={(e) => set("diastolic", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Nabız">
          <input
            value={form.pulse}
            onChange={(e) => set("pulse", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Ateş">
          <input
            value={form.temperature}
            onChange={(e) => set("temperature", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="SpO₂">
          <input
            value={form.spo2}
            onChange={(e) => set("spo2", e.target.value)}
            style={input}
          />
        </Field>
      </div>

      <Field label="Baş Boyun">
        <textarea value={form.headNeck} onChange={(e) => set("headNeck", e.target.value)} style={textarea} />
      </Field>

      <Field label="Göz">
        <textarea value={form.eye} onChange={(e) => set("eye", e.target.value)} style={textarea} />
      </Field>

      <Field label="KBB">
        <textarea value={form.earNoseThroat} onChange={(e) => set("earNoseThroat", e.target.value)} style={textarea} />
      </Field>

      <Field label="Solunum">
        <textarea value={form.respiratory} onChange={(e) => set("respiratory", e.target.value)} style={textarea} />
      </Field>

      <Field label="Kardiyovasküler">
        <textarea value={form.cardiovascular} onChange={(e) => set("cardiovascular", e.target.value)} style={textarea} />
      </Field>

      <Field label="Sindirim">
        <textarea value={form.digestive} onChange={(e) => set("digestive", e.target.value)} style={textarea} />
      </Field>

      <Field label="Ürogenital">
        <textarea value={form.genitourinary} onChange={(e) => set("genitourinary", e.target.value)} style={textarea} />
      </Field>

      <Field label="Kas İskelet">
        <textarea value={form.musculoskeletal} onChange={(e) => set("musculoskeletal", e.target.value)} style={textarea} />
      </Field>

      <Field label="Nörolojik">
        <textarea value={form.neurological} onChange={(e) => set("neurological", e.target.value)} style={textarea} />
      </Field>

      <Field label="Deri">
        <textarea value={form.skin} onChange={(e) => set("skin", e.target.value)} style={textarea} />
      </Field>

      <Field label="Psikiyatrik">
        <textarea value={form.psychological} onChange={(e) => set("psychological", e.target.value)} style={textarea} />
      </Field>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={field}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 18,
  padding: 24,
  display: "grid",
  gap: 16,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
};

const field: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 900,
  color: "#64748b",
};

const input: React.CSSProperties = {
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "0 12px",
};

const readonlyInput: React.CSSProperties = {
  ...input,
  background: "#f8fafc",
  color: "#475569",
};

const textarea: React.CSSProperties = {
  minHeight: 90,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 10,
  resize: "vertical",
};
