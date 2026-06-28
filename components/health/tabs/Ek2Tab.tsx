"use client";

import { useMemo, useState, type CSSProperties } from "react";

type FormType = "İşe Giriş" | "Periyodik";
type FormStatus = "Taslak" | "Tamamlandı" | "İmzalandı";
type Decision = "Çalışabilir" | "Şartlı Çalışabilir" | "Çalışamaz";
import { calculateBmi } from "../ek2/Ek2Helpers";


type TabKey =
  | "genel"
  | "anamnez"
  | "ozgecmis"
  | "soygecmis"
  | "fizik"
  | "tetkikler"
  | "riskler"
  | "kanaat"
  | "pdf";

type Ek2Form = {
  formType: FormType;
  status: FormStatus;
  fileNo: string;
  revisionNo: string;
  employeeId: string;
  companyId: string;
  examDate: string;
  nextExamDate: string;
  doctorName: string;

  employeeName: string;
  identityNumber: string;
  birthDate: string;
  gender: string;
  bloodGroup: string;
  phone: string;

  companyName: string;
  workplaceAddress: string;
  jobTitle: string;
  department: string;
  startDate: string;
  dangerClass: string;
  naceCode: string;

  previousJobs: string;
  currentJobDescription: string;
  exposures: string;
  ppeUsage: string;
  previousAccidents: string;
  occupationalDiseaseHistory: string;

  chronicDiseases: string;
  surgeries: string;
  medicines: string;
  allergies: string;
  habits: string;
  familyHistory: string;

  height: string;
  weight: string;
  systolic: string;
  diastolic: string;
  pulse: string;
  temperature: string;
  spo2: string;

  headNeck: string;
  eye: string;
  earNoseThroat: string;
  respiratory: string;
  cardiovascular: string;
  digestive: string;
  genitourinary: string;
  musculoskeletal: string;
  neurological: string;
  skin: string;
  psychological: string;

  hemogram: string;
  biochemistry: string;
  urine: string;
  radiology: string;
  audiometry: string;
  sft: string;
  vision: string;
  ekg: string;
  vaccines: string;
  otherTests: string;

  riskEvaluation: string;
  restrictions: string;
  recommendations: string;
  decision: Decision;
  doctorOpinion: string;
  signatureNote: string;
};

const initialForm: Ek2Form = {
  formType: "İşe Giriş",
  status: "Taslak",
  fileNo: "",
  revisionNo: "0",
  examDate: "",
  nextExamDate: "",
  doctorName: "",
  employeeId: "",
  companyId: "",

  employeeName: "",
  identityNumber: "",
  birthDate: "",
  gender: "",
  bloodGroup: "",
  phone: "",

  companyName: "",
  workplaceAddress: "",
  jobTitle: "",
  department: "",
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
  systolic: "",
  diastolic: "",
  pulse: "",
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
  audiometry: "",
  sft: "",
  vision: "",
  ekg: "",
  vaccines: "",
  otherTests: "",

  riskEvaluation: "",
  restrictions: "",
  recommendations: "",
  decision: "Çalışabilir",
  doctorOpinion: "",
  signatureNote: "",
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "genel", label: "Genel Bilgiler" },
  { key: "anamnez", label: "Mesleki Anamnez" },
  { key: "ozgecmis", label: "Özgeçmiş" },
  { key: "soygecmis", label: "Soygeçmiş" },
  { key: "fizik", label: "Fizik Muayene" },
  { key: "tetkikler", label: "Tetkikler" },
  { key: "riskler", label: "Mesleki Riskler" },
  { key: "kanaat", label: "Kanaat" },
  { key: "pdf", label: "PDF / İmza" },
];

type Ek2TabProps = {
  employee?: {
    id: string;
    full_name?: string;
    email?: string;
    company_id?: string;
    company_name?: string;
    job_title?: string;
    start_date?: string;
    identity_number?: string;
    birth_date?: string;
    gender?: string;
    blood_group?: string;
    phone?: string;
  };
};

export default function Ek2Tab({ employee }: Ek2TabProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("genel");
  const [form, setForm] = useState<Ek2Form>({
  ...initialForm,

  employeeId: employee?.id || "",
  companyId: employee?.company_id || "",
  employeeName: employee?.full_name || "",
  identityNumber: employee?.identity_number || "",
  birthDate: employee?.birth_date || "",
  gender: employee?.gender || "",
  bloodGroup: employee?.blood_group || "",
  phone: employee?.phone || "",
  companyName: employee?.company_name || "",
  jobTitle: employee?.job_title || "",
  startDate: employee?.start_date || "",
});

  const bmi = useMemo(() => {
    const h = Number(form.height) / 100;
    const w = Number(form.weight);
    if (!h || !w) return "";
    return (w / (h * h)).toFixed(1);
  }, [form.height, form.weight]);

  const warnings = useMemo(() => {
    const list: string[] = [];

    if (Number(bmi) >= 30) list.push("BMI obezite aralığında.");
    if (Number(form.systolic) >= 140 || Number(form.diastolic) >= 90) {
      list.push("Tansiyon yüksek görünüyor.");
    }
    if (Number(form.spo2) > 0 && Number(form.spo2) < 92) {
      list.push("SpO₂ düşük görünüyor.");
    }
    if (form.decision === "Çalışamaz") {
      list.push("Çalışamaz kararı kritik takip gerektirir.");
    }

    return list;
  }, [bmi, form.systolic, form.diastolic, form.spo2, form.decision]);

  function update<K extends keyof Ek2Form>(key: K, value: Ek2Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildEmployeeForm(type: FormType): Ek2Form {
  return {
    ...initialForm,

    employeeId: employee?.id || "",
    companyId: employee?.company_id || "",

    employeeName: employee?.full_name || "",
    identityNumber: employee?.identity_number || "",
    birthDate: employee?.birth_date || "",
    gender: employee?.gender || "",
    bloodGroup: employee?.blood_group || "",
    phone: employee?.phone || "",

    companyName: employee?.company_name || "",
    jobTitle: employee?.job_title || "",
    startDate: employee?.start_date || "",

    formType: type,
  };
}

function newEntry() {
  setForm(buildEmployeeForm("İşe Giriş"));
  setActiveTab("genel");
}

function newPeriodic() {
  setForm(buildEmployeeForm("Periyodik"));
  setActiveTab("genel");
}

  function saveDraft() {
    update("status", "Taslak");
    alert("EK-2 taslak olarak hazırlandı. API bağlantısı sonraki adımda eklenecek.");
  }

  async function completeForm() {
  const payload: Ek2Form = {
  ...form,
  status: "Tamamlandı" as FormStatus,

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
    update("status", "İmzalandı");
    alert("EK-2 imza akışı sonraki adımda bağlanacak.");
  }

  function printForm() {
    window.print();
  }

  return (
    <div style={pageStyle}>
      <style jsx global>{`
  @media screen {
    .ek2-print-area {
      display: none;
    }
  }

  @media print {
    body * {
      visibility: hidden !important;
    }

    .ek2-print-area,
    .ek2-print-area * {
      visibility: visible !important;
    }

    .ek2-print-area {
      display: block !important;
      position: absolute !important;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
    }

    .no-print {
      display: none !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm;
    }
  }
`}</style>
      <section style={headerStyle}>
        <div>
          <div style={headerLabelStyle}>D-SEC SAĞLIK MODÜLÜ</div>
          <h2 style={headerTitleStyle}>
            EK-2 İşe Giriş / Periyodik Muayene Formu
          </h2>
          <p style={headerTextStyle}>
            Resmi EK-2 form akışına uygun dijital işyeri hekimi çalışma alanı.
          </p>
        </div>

        <div style={headerStatusStyle}>
          <span>{form.status}</span>
          <strong>{form.formType}</strong>
        </div>
      </section>

      <section className="no-print" style={toolbarStyle}>
        <button type="button" onClick={newEntry} style={primaryButtonStyle}>
          + Yeni İşe Giriş
        </button>
        <button type="button" onClick={newPeriodic} style={secondaryButtonStyle}>
          + Yeni Periyodik
        </button>
        <button type="button" onClick={saveDraft} style={secondaryButtonStyle}>
          Taslak Kaydet
        </button>
        <button type="button" onClick={completeForm} style={successButtonStyle}>
          Tamamla
        </button>
        <button type="button" onClick={printForm} style={secondaryButtonStyle}>
          Yazdır
        </button>
        <button type="button" onClick={signForm} style={darkButtonStyle}>
          İmzala
        </button>
      </section>

      <section style={officialFormStyle}>
        <div style={officialTitleStyle}>
          İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
        </div>

        <div style={topSummaryGridStyle}>
          <SummaryBox label="Form Türü" value={form.formType} />
          <SummaryBox label="Durum" value={form.status} />
          <SummaryBox label="Muayene Tarihi" value={form.examDate || "-"} />
          <SummaryBox label="Sonraki Muayene" value={form.nextExamDate || "-"} />
          <SummaryBox label="Karar" value={form.decision} />
          <SummaryBox label="BMI" value={bmi || "-"} />
        </div>

        {warnings.length > 0 && (
          <div style={warningStyle}>
            <strong>DORA Ön Uyarıları:</strong>{" "}
            {warnings.map((item, index) => (
  <div key={index}>⚠️ {item}</div>
))}
          </div>
        )}

        <div style={tabBarStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...tabStyle,
                background: activeTab === tab.key ? "#7f1d1d" : "#fff",
                color: activeTab === tab.key ? "#fff" : "#334155",
                borderColor: activeTab === tab.key ? "#7f1d1d" : "#e5e7eb",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "genel" && (
          <Section title="1. Genel Bilgiler">
            <SubTitle>Form Bilgileri</SubTitle>

            <div style={gridStyle}>
              <Field label="Form Türü">
                <select
                  value={form.formType}
                  onChange={(e) => update("formType", e.target.value as FormType)}
                  style={inputStyle}
                >
                  <option>İşe Giriş</option>
                  <option>Periyodik</option>
                </select>
              </Field>

              <Field label="Durum">
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as FormStatus)}
                  style={inputStyle}
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
                  onChange={(e) => update("examDate", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Sonraki Muayene Tarihi">
                <input
                  type="date"
                  value={form.nextExamDate}
                  onChange={(e) => update("nextExamDate", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="İşyeri Hekimi">
                <input
                  value={form.doctorName}
                  onChange={(e) => update("doctorName", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Dosya No">
                <input
                  value={form.fileNo}
                  onChange={(e) => update("fileNo", e.target.value)}
                  placeholder="EK2-2026-0001"
                  style={inputStyle}
                />
              </Field>

              <Field label="Revizyon No">
                <input
                  value={form.revisionNo}
                  onChange={(e) => update("revisionNo", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            <SubTitle>Çalışan Bilgileri</SubTitle>

            <div style={gridStyle}>
              <Field label="Adı Soyadı">
  <input
    value={form.employeeName}
    readOnly
    style={{
      ...inputStyle,
      background: "#f8fafc",
      color: "#475569",
      cursor: "not-allowed",
    }}
  />
</Field>

              <Field label="T.C. Kimlik No">
  <input
    value={form.identityNumber}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

             <Field label="Doğum Tarihi">
  <input
    type="date"
    value={form.birthDate}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="Cinsiyet">
  <input
    value={form.gender}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="Kan Grubu">
  <input
    value={form.bloodGroup}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="Telefon">
  <input
    value={form.phone}
    readOnly
    style={readonlyInputStyle}
  />
</Field>
            </div>

            <SubTitle>İşyeri Bilgileri</SubTitle>

            <div style={gridStyle}>
              <Field label="İşyeri / Firma">
                <input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="İşyeri / Firma">
  <input
    value={form.companyName}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="Görevi / Mesleği">
  <input
    value={form.jobTitle}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="İşe Giriş Tarihi">
  <input
    type="date"
    value={form.startDate}
    readOnly
    style={readonlyInputStyle}
  />
</Field>

              <Field label="İşe Giriş Tarihi">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Tehlike Sınıfı">
                <select
                  value={form.dangerClass}
                  onChange={(e) => update("dangerClass", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Seçiniz</option>
                  <option>Az Tehlikeli</option>
                  <option>Tehlikeli</option>
                  <option>Çok Tehlikeli</option>
                </select>
              </Field>

              <Field label="NACE Kodu">
                <input
                  value={form.naceCode}
                  onChange={(e) => update("naceCode", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>
        )}

        {activeTab === "anamnez" && (
          <Section title="2. Mesleki Anamnez">
            <Field label="Önceki İşler / Çalışma Öyküsü">
              <textarea
                value={form.previousJobs}
                onChange={(e) => update("previousJobs", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Mevcut İşin Tanımı">
              <textarea
                value={form.currentJobDescription}
                onChange={(e) => update("currentJobDescription", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Mesleki Maruziyetler">
              <textarea
                value={form.exposures}
                onChange={(e) => update("exposures", e.target.value)}
                placeholder="Gürültü, toz, kimyasal, biyolojik, ergonomik, titreşim, radyasyon vb."
                style={textareaStyle}
              />
            </Field>

            <Field label="Kişisel Koruyucu Donanım Kullanımı">
              <textarea
                value={form.ppeUsage}
                onChange={(e) => update("ppeUsage", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Geçirilmiş İş Kazaları">
              <textarea
                value={form.previousAccidents}
                onChange={(e) => update("previousAccidents", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Meslek Hastalığı Öyküsü / Şüphesi">
              <textarea
                value={form.occupationalDiseaseHistory}
                onChange={(e) =>
                  update("occupationalDiseaseHistory", e.target.value)
                }
                style={textareaStyle}
              />
            </Field>
          </Section>
        )}

        {activeTab === "ozgecmis" && (
          <Section title="3. Özgeçmiş">
            <Field label="Kronik / Sistemik Hastalıklar">
              <textarea
                value={form.chronicDiseases}
                onChange={(e) => update("chronicDiseases", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Geçirilmiş Ameliyatlar">
              <textarea
                value={form.surgeries}
                onChange={(e) => update("surgeries", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Sürekli Kullanılan İlaçlar">
              <textarea
                value={form.medicines}
                onChange={(e) => update("medicines", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Alerjiler">
              <textarea
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Alışkanlıklar">
              <textarea
                value={form.habits}
                onChange={(e) => update("habits", e.target.value)}
                placeholder="Sigara, alkol, madde kullanımı, uyku, beslenme vb."
                style={textareaStyle}
              />
            </Field>
          </Section>
        )}

        {activeTab === "soygecmis" && (
          <Section title="4. Soygeçmiş">
            <Field label="Aile Hastalık Öyküsü">
              <textarea
                value={form.familyHistory}
                onChange={(e) => update("familyHistory", e.target.value)}
                placeholder="Anne, baba, kardeşlerde kalp hastalığı, diyabet, hipertansiyon, kanser, genetik hastalıklar vb."
                style={textareaStyle}
              />
            </Field>
          </Section>
        )}

        {activeTab === "fizik" && (
          <Section title="5. Fizik Muayene">
            <SubTitle>Vital Bulgular</SubTitle>

            <div style={gridStyle}>
              <Field label="Boy (cm)">
                <input
                  value={form.height}
                  onChange={(e) => update("height", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Kilo (kg)">
                <input
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <ReadOnly label="BMI" value={bmi || "-"} />

              <Field label="Tansiyon Sistolik">
                <input
                  value={form.systolic}
                  onChange={(e) => update("systolic", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Tansiyon Diyastolik">
                <input
                  value={form.diastolic}
                  onChange={(e) => update("diastolic", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Nabız">
                <input
                  value={form.pulse}
                  onChange={(e) => update("pulse", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Ateş">
                <input
                  value={form.temperature}
                  onChange={(e) => update("temperature", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="SpO₂">
                <input
                  value={form.spo2}
                  onChange={(e) => update("spo2", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

           <SubTitle>Sistem Muayenesi</SubTitle>

<div style={systemTableStyle}>

  <div style={systemHeaderStyle}>
    <div>Sistem</div>
    <div>Normal</div>
    <div>Patolojik</div>
    <div>Açıklama</div>
  </div>

  {[
    "Baş - Boyun",
    "Göz",
    "Kulak Burun Boğaz",
    "Solunum Sistemi",
    "Kardiyovasküler Sistem",
    "Sindirim Sistemi",
    "Ürogenital Sistem",
    "Kas İskelet Sistemi",
    "Nörolojik Sistem",
    "Deri",
    "Psikiyatrik Değerlendirme",
  ].map((item) => (
    <div key={item} style={systemRowStyle}>

      <strong>{item}</strong>

      <input
        type="radio"
        name={item}
        defaultChecked
      />

      <input
        type="radio"
        name={item}
      />

      <input
        placeholder="Açıklama..."
        style={inputStyle}
      />

    </div>
  ))}

</div>

          </Section>
        )}

        {activeTab === "tetkikler" && (
          <Section title="6. Laboratuvar ve Tetkikler">
            <div style={gridStyle}>
              <Field label="Hemogram">
                <textarea
                  value={form.hemogram}
                  onChange={(e) => update("hemogram", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Biyokimya">
                <textarea
                  value={form.biochemistry}
                  onChange={(e) => update("biochemistry", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="İdrar Tetkiki">
                <textarea
                  value={form.urine}
                  onChange={(e) => update("urine", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Radyoloji / Akciğer Grafisi">
                <textarea
                  value={form.radiology}
                  onChange={(e) => update("radiology", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Odyometri">
                <textarea
                  value={form.audiometry}
                  onChange={(e) => update("audiometry", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Solunum Fonksiyon Testi">
                <textarea
                  value={form.sft}
                  onChange={(e) => update("sft", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Görme Testi">
                <textarea
                  value={form.vision}
                  onChange={(e) => update("vision", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="EKG">
                <textarea
                  value={form.ekg}
                  onChange={(e) => update("ekg", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Aşı Durumu">
                <textarea
                  value={form.vaccines}
                  onChange={(e) => update("vaccines", e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Diğer Tetkikler">
                <textarea
                  value={form.otherTests}
                  onChange={(e) => update("otherTests", e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </div>
          </Section>
        )}

        {activeTab === "riskler" && (
          <Section title="7. Mesleki Riskler">
            <Field label="Görev ve Maruziyetlere Göre Risk Değerlendirmesi">
              <textarea
                value={form.riskEvaluation}
                onChange={(e) => update("riskEvaluation", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Çalışma Kısıtları">
              <textarea
                value={form.restrictions}
                onChange={(e) => update("restrictions", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Öneriler">
              <textarea
                value={form.recommendations}
                onChange={(e) => update("recommendations", e.target.value)}
                style={textareaStyle}
              />
            </Field>
          </Section>
        )}

        {activeTab === "kanaat" && (
          <Section title="8. Kanaat ve Sonuç">
            <SubTitle>İşe Uygunluk Kararı</SubTitle>

            <div style={decisionGridStyle}>
              {(["Çalışabilir", "Şartlı Çalışabilir", "Çalışamaz"] as Decision[]).map(
                (item) => (
                  <label
                    key={item}
                    style={{
                      ...decisionBoxStyle,
                      borderColor: form.decision === item ? "#7f1d1d" : "#e5e7eb",
                      background: form.decision === item ? "#fff1f2" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="decision"
                      checked={form.decision === item}
                      onChange={() => update("decision", item)}
                    />
                    <strong>{item}</strong>
                  </label>
                )
              )}
            </div>

            <Field label="Hekim Kanaati">
              <textarea
                value={form.doctorOpinion}
                onChange={(e) => update("doctorOpinion", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <Field label="Kontrol / Sonraki Muayene Açıklaması">
              <textarea
                value={form.recommendations}
                onChange={(e) => update("recommendations", e.target.value)}
                style={textareaStyle}
              />
            </Field>
          </Section>
        )}

        {activeTab === "pdf" && (
          <Section title="9. PDF / Yazdırma / İmza">
            <div style={pdfBoxStyle}>
              <h3 style={{ marginTop: 0 }}>EK-2 PDF Önizleme</h3>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                Bu alandaki verilerden sonraki adımda resmi EK-2 formatına yakın
                PDF çıktısı oluşturulacak. Yazdırma işlemi mevcut ekranı baskıya
                gönderir.
              </p>

              <div style={gridStyle}>
                <SummaryBox label="Form Türü" value={form.formType} />
                <SummaryBox label="Muayene Tarihi" value={form.examDate || "-"} />
                <SummaryBox label="Karar" value={form.decision} />
                <SummaryBox label="Hekim" value={form.doctorName || "-"} />
              </div>
            </div>

            <Field label="İmza / Kaşe Notu">
              <textarea
                value={form.signatureNote}
                onChange={(e) => update("signatureNote", e.target.value)}
                style={textareaStyle}
              />
            </Field>

            <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={printForm} style={primaryButtonStyle}>
  PDF Önizle
</button>
              <button type="button" onClick={printForm} style={secondaryButtonStyle}>
                Yazdır
              </button>
              <button type="button" onClick={signForm} style={darkButtonStyle}>
                İmzala
              </button>
            </div>
          </Section>
        )}
     </section>

      <div className="ek2-print-area">
        <Ek2OfficialPrint form={form} bmi={bmi} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 style={subTitleStyle}>{children}</h4>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={readOnlyStyle}>{value}</div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryBoxStyle}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontWeight: 950 }}>{value}</div>
    </div>
  );
}

function Ek2OfficialPrint({
  form,
  bmi,
}: {
  form: Ek2Form;
  bmi: string;
}) {
  return (
    <div style={printPageStyle}>
      <div style={printHeaderStyle}>
        <div style={printLogoStyle}>D-SEC</div>

        <div style={printTitleStyle}>
          İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
          <br />
          EK-2
        </div>

        <div style={printInfoStyle}>
          Form No: {form.fileNo || "-"}
          <br />
          Revizyon: {form.revisionNo || "0"}
          <br />
          Tarih: {form.examDate || "-"}
        </div>
      </div>

      <PrintSection title="1. ÇALIŞAN BİLGİLERİ">
        <PrintRow label="Adı Soyadı" value={form.employeeName} />
        <PrintRow label="T.C. Kimlik No" value={form.identityNumber} />
        <PrintRow label="Doğum Tarihi" value={form.birthDate} />
        <PrintRow label="Cinsiyet" value={form.gender} />
        <PrintRow label="Kan Grubu" value={form.bloodGroup} />
        <PrintRow label="Telefon" value={form.phone} />
      </PrintSection>

      <PrintSection title="2. İŞYERİ BİLGİLERİ">
        <PrintRow label="İşyeri / Firma" value={form.companyName} />
        <PrintRow label="İşyeri Adresi" value={form.workplaceAddress} />
        <PrintRow label="Görevi / Mesleği" value={form.jobTitle} />
        <PrintRow label="İşe Giriş Tarihi" value={form.startDate} />
        <PrintRow label="Tehlike Sınıfı" value={form.dangerClass} />
        <PrintRow label="NACE Kodu" value={form.naceCode} />
      </PrintSection>

      <PrintSection title="3. MESLEKİ ANAMNEZ">
        <PrintBigRow label="Önceki İşler" value={form.previousJobs} />
        <PrintBigRow label="Mevcut İşin Tanımı" value={form.currentJobDescription} />
        <PrintBigRow label="Maruziyetler" value={form.exposures} />
        <PrintBigRow label="KKD Kullanımı" value={form.ppeUsage} />
        <PrintBigRow label="İş Kazaları" value={form.previousAccidents} />
        <PrintBigRow label="Meslek Hastalığı" value={form.occupationalDiseaseHistory} />
      </PrintSection>

      <PrintSection title="4. ÖZGEÇMİŞ / SOYGEÇMİŞ">
        <PrintBigRow label="Kronik Hastalıklar" value={form.chronicDiseases} />
        <PrintBigRow label="Ameliyatlar" value={form.surgeries} />
        <PrintBigRow label="İlaçlar" value={form.medicines} />
        <PrintBigRow label="Alerjiler" value={form.allergies} />
        <PrintBigRow label="Alışkanlıklar" value={form.habits} />
        <PrintBigRow label="Soygeçmiş" value={form.familyHistory} />
      </PrintSection>

      <PrintSection title="5. FİZİK MUAYENE / VİTAL BULGULAR">
        <PrintRow label="Boy" value={form.height} />
        <PrintRow label="Kilo" value={form.weight} />
        <PrintRow label="BMI" value={bmi} />
        <PrintRow label="Tansiyon" value={`${form.systolic || "-"}/${form.diastolic || "-"}`} />
        <PrintRow label="Nabız" value={form.pulse} />
        <PrintRow label="Ateş" value={form.temperature} />
        <PrintRow label="SpO₂" value={form.spo2} />
      </PrintSection>

      <PrintSection title="6. TETKİKLER">
        <PrintBigRow label="Hemogram" value={form.hemogram} />
        <PrintBigRow label="Biyokimya" value={form.biochemistry} />
        <PrintBigRow label="İdrar" value={form.urine} />
        <PrintBigRow label="Radyoloji" value={form.radiology} />
        <PrintBigRow label="Odyometri" value={form.audiometry} />
        <PrintBigRow label="SFT" value={form.sft} />
        <PrintBigRow label="Görme" value={form.vision} />
        <PrintBigRow label="EKG" value={form.ekg} />
        <PrintBigRow label="Aşı" value={form.vaccines} />
        <PrintBigRow label="Diğer" value={form.otherTests} />
      </PrintSection>

      <PrintSection title="7. İŞE UYGUNLUK KANAATİ">
        <PrintRow label="Karar" value={form.decision} />
        <PrintBigRow label="Kısıtlamalar" value={form.restrictions} />
        <PrintBigRow label="Öneriler" value={form.recommendations} />
        <PrintBigRow label="Hekim Kanaati" value={form.doctorOpinion} />
      </PrintSection>

      <div style={printSignatureAreaStyle}>
        <div style={printSignatureBoxStyle}>
          Çalışanın İmzası
        </div>

        <div style={printSignatureBoxStyle}>
          İşyeri Hekimi
          <br />
          {form.doctorName || "-"}
          <br /><br />
          Kaşe / İmza
        </div>
      </div>
    </div>
  );
}

function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={printSectionTitleStyle}>{title}</div>
      <table style={printTableStyle}>
        <tbody>{children}</tbody>
      </table>
    </>
  );
}

function PrintRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td style={printLeftStyle}>{label}</td>
      <td style={printRightStyle}>{value || "-"}</td>
    </tr>
  );
}

function PrintBigRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td style={printLeftBigStyle}>{label}</td>
      <td style={printRightBigStyle}>{value || "-"}</td>
    </tr>
  );
}

const pageStyle: CSSProperties = {
  display: "grid",
  gap: 18,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "center",
  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  color: "#fff",
  borderRadius: 24,
  padding: 28,
};

const headerLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  opacity: 0.85,
};

const headerTitleStyle: CSSProperties = {
  margin: "8px 0 8px",
  fontSize: 30,
  fontWeight: 950,
};

const headerTextStyle: CSSProperties = {
  margin: 0,
  opacity: 0.9,
  lineHeight: 1.6,
};

const headerStatusStyle: CSSProperties = {
  minWidth: 190,
  borderRadius: 18,
  padding: 16,
  background: "rgba(255,255,255,.16)",
  border: "1px solid rgba(255,255,255,.25)",
  display: "grid",
  gap: 5,
  fontWeight: 900,
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 14,
};

const officialFormStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 24,
  display: "grid",
  gap: 18,
};

const officialTitleStyle: CSSProperties = {
  textAlign: "center",
  border: "2px solid #111827",
  padding: 14,
  fontWeight: 950,
  fontSize: 18,
  letterSpacing: 0.4,
};

const topSummaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
  gap: 12,
};

const summaryBoxStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
};

const warningStyle: CSSProperties = {
  border: "1px solid #fed7aa",
  background: "#fff7ed",
  color: "#9a3412",
  borderRadius: 14,
  padding: 14,
  fontWeight: 800,
  fontSize: 13,
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: 12,
};

const tabStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "9px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 18,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
};

const subTitleStyle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 16,
  color: "#7f1d1d",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "0 12px",
  outline: "none",
  fontWeight: 700,
};

const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#f8fafc",
  color: "#475569",
  cursor: "not-allowed",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 115,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 12,
  outline: "none",
  resize: "vertical",
  fontWeight: 650,
};

const readOnlyStyle: CSSProperties = {
  minHeight: 44,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#f8fafc",
  padding: "12px 14px",
  fontWeight: 950,
};

const decisionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const decisionBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
};

const pdfBoxStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#f8fafc",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#fff",
  color: "#334155",
  fontWeight: 950,
  cursor: "pointer",
};

const successButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const darkButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#111827",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};
const systemTableStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const systemRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 120px 130px 2fr",
  gap: 10,
  alignItems: "center",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "#fff",
};

const radioLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 800,
  color: "#334155",
};


const systemHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 90px 110px 1fr",
  gap: 10,
  padding: "12px 14px",
  background: "#7f1d1d",
  color: "#fff",
  borderRadius: 12,
  fontWeight: 900,
  alignItems: "center",
};

const printPageStyle: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  background: "#fff",
  color: "#000",
  padding: "10mm",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const printHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr 180px",
  border: "1px solid #000",
};

const printLogoStyle: CSSProperties = {
  borderRight: "1px solid #000",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 20,
};

const printTitleStyle: CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  padding: 10,
  borderRight: "1px solid #000",
};

const printInfoStyle: CSSProperties = {
  padding: 8,
  fontSize: 11,
};

const printSectionTitleStyle: CSSProperties = {
  marginTop: 10,
  background: "#e5e7eb",
  border: "1px solid #000",
  padding: 6,
  fontWeight: 900,
  fontSize: 12,
};

const printTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const printLeftStyle: CSSProperties = {
  width: 210,
  border: "1px solid #000",
  padding: 5,
  fontSize: 11,
  fontWeight: 700,
};

const printRightStyle: CSSProperties = {
  border: "1px solid #000",
  padding: 5,
  fontSize: 11,
  whiteSpace: "pre-wrap",
};

const printLeftBigStyle: CSSProperties = {
  ...printLeftStyle,
  height: 42,
  verticalAlign: "top",
};

const printRightBigStyle: CSSProperties = {
  ...printRightStyle,
  height: 42,
  verticalAlign: "top",
};

const printSignatureAreaStyle: CSSProperties = {
  marginTop: 24,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 30,
};

const printSignatureBoxStyle: CSSProperties = {
  border: "1px solid #000",
  height: 110,
  textAlign: "center",
  padding: 12,
  fontSize: 12,
  fontWeight: 700,
};
