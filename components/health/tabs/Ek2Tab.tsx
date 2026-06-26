"use client";

import { useMemo, useState, type CSSProperties } from "react";

type Ek2FormType = "İşe Giriş" | "Periyodik";
type Ek2Status = "Taslak" | "Tamamlandı" | "İmzalandı";
type Decision = "Uygun" | "Kısıtlı Uygun" | "Uygun Değil";

const tabs = [
  "Genel Bilgiler",
  "Mesleki Anamnez",
  "Özgeçmiş",
  "Soygeçmiş",
  "Fizik Muayene",
  "Vital Bulgular",
  "Sistem Muayenesi",
  "Laboratuvar",
  "Odyometri",
  "SFT",
  "Görme",
  "Aşılar",
  "Mesleki Riskler",
  "Kanaat",
  "PDF / İmza",
];

export default function Ek2Tab() {
  const [activeTab, setActiveTab] = useState("Genel Bilgiler");

  const [formType, setFormType] = useState<Ek2FormType>("İşe Giriş");
  const [status, setStatus] = useState<Ek2Status>("Taslak");
  const [decision, setDecision] = useState<Decision>("Uygun");

  const [examDate, setExamDate] = useState("");
  const [nextExamDate, setNextExamDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [fileNo, setFileNo] = useState("");
  const [revisionNo, setRevisionNo] = useState("0");

  const [workHistory, setWorkHistory] = useState("");
  const [exposures, setExposures] = useState("");
  const [previousAccidents, setPreviousAccidents] = useState("");
  const [occupationalDisease, setOccupationalDisease] = useState("");

  const [personalHistory, setPersonalHistory] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [medicines, setMedicines] = useState("");
  const [allergies, setAllergies] = useState("");
  const [habits, setHabits] = useState("");

  const [familyHistory, setFamilyHistory] = useState("");

  const [physicalExam, setPhysicalExam] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");

  const [labNote, setLabNote] = useState("");
  const [audiometryNote, setAudiometryNote] = useState("");
  const [sftNote, setSftNote] = useState("");
  const [visionNote, setVisionNote] = useState("");
  const [vaccineNote, setVaccineNote] = useState("");

  const [riskNote, setRiskNote] = useState("");
  const [restrictionNote, setRestrictionNote] = useState("");
  const [doctorOpinion, setDoctorOpinion] = useState("");
  const [signatureNote, setSignatureNote] = useState("");

  const bmi = useMemo(() => {
    const h = Number(height) / 100;
    const w = Number(weight);
    if (!h || !w) return "";
    return (w / (h * h)).toFixed(1);
  }, [height, weight]);

  const alerts = useMemo(() => {
    const list: string[] = [];

    if (Number(bmi) >= 30) list.push("BMI obezite aralığında.");
    if (Number(systolic) >= 140 || Number(diastolic) >= 90) {
      list.push("Tansiyon yüksek görünüyor.");
    }
    if (Number(spo2) > 0 && Number(spo2) < 92) {
      list.push("SpO₂ düşük görünüyor.");
    }
    if (decision === "Uygun Değil") {
      list.push("İşe uygunluk kararı kritik.");
    }

    return list;
  }, [bmi, systolic, diastolic, spo2, decision]);

  function newEntryForm() {
    setFormType("İşe Giriş");
    setStatus("Taslak");
    setDecision("Uygun");
    setActiveTab("Genel Bilgiler");
  }

  function newPeriodicForm() {
    setFormType("Periyodik");
    setStatus("Taslak");
    setDecision("Uygun");
    setActiveTab("Genel Bilgiler");
  }

  function saveDraft() {
    setStatus("Taslak");
    alert("EK-2 taslak olarak hazırlandı. API bağlantısı sonraki adımda eklenecek.");
  }

  function completeForm() {
    setStatus("Tamamlandı");
    alert("EK-2 formu tamamlandı olarak işaretlendi.");
  }

  function signForm() {
    setStatus("İmzalandı");
    alert("EK-2 imza akışı sonraki adımda aktif edilecek.");
  }

  function printForm() {
    window.print();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={heroStyle}>
        <div>
          <div style={heroLabelStyle}>D-SEC EK-2 ÇALIŞMA ALANI</div>

          <h2 style={{ margin: "8px 0 8px", fontSize: 28 }}>
            İşe Giriş / Periyodik Muayene Formu
          </h2>

          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
            İşyeri hekiminin EK-2 formunu dijital olarak hazırladığı,
            değerlendirdiği, yazdırdığı ve imzaladığı profesyonel çalışma alanı.
          </p>
        </div>

        <div style={statusBoxStyle}>
          <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
            FORM DURUMU
          </div>
          <div style={{ fontSize: 24, fontWeight: 950 }}>{status}</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            {formType} Muayenesi
          </div>
        </div>
      </section>

      <section style={toolbarStyle}>
        <button type="button" onClick={newEntryForm} style={primaryButtonStyle}>
          + Yeni İşe Giriş
        </button>

        <button type="button" onClick={newPeriodicForm} style={secondaryButtonStyle}>
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

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr) 280px",
          gap: 18,
          alignItems: "start",
        }}
      >
        <aside style={sideCardStyle}>
          <h3 style={sideTitleStyle}>EK-2 Bölümleri</h3>

          <div style={{ display: "grid", gap: 8 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  ...tabButtonStyle,
                  background: activeTab === tab ? "#7f1d1d" : "#fff",
                  color: activeTab === tab ? "#fff" : "#334155",
                  borderColor: activeTab === tab ? "#7f1d1d" : "#e5e7eb",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </aside>

        <main style={contentCardStyle}>
          {activeTab === "Genel Bilgiler" && (
            <Section title="Genel Bilgiler">
              <div style={gridStyle}>
                <Field label="Form Türü">
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Ek2FormType)}
                    style={inputStyle}
                  >
                    <option>İşe Giriş</option>
                    <option>Periyodik</option>
                  </select>
                </Field>

                <Field label="Durum">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Ek2Status)}
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
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Sonraki Muayene Tarihi">
                  <input
                    type="date"
                    value={nextExamDate}
                    onChange={(e) => setNextExamDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="İşyeri Hekimi">
                  <input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Hekim adı soyadı"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Dosya No">
                  <input
                    value={fileNo}
                    onChange={(e) => setFileNo(e.target.value)}
                    placeholder="EK2-2026-0001"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Revizyon No">
                  <input
                    value={revisionNo}
                    onChange={(e) => setRevisionNo(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <InfoBlock
                title="Çalışan bilgileri"
                text="Ad soyad, firma, görev, işe giriş tarihi ve iletişim bilgileri çalışan sağlık kartından otomatik alınacaktır."
              />
            </Section>
          )}

          {activeTab === "Mesleki Anamnez" && (
            <Section title="Mesleki Anamnez">
              <Field label="Önceki İşler / Çalışma Öyküsü">
                <textarea
                  value={workHistory}
                  onChange={(e) => setWorkHistory(e.target.value)}
                  style={textareaStyle}
                  placeholder="Çalışanın daha önce yaptığı işler, çalışma süreleri ve maruziyetleri..."
                />
              </Field>

              <Field label="Mesleki Maruziyetler">
                <textarea
                  value={exposures}
                  onChange={(e) => setExposures(e.target.value)}
                  style={textareaStyle}
                  placeholder="Gürültü, toz, kimyasal, ergonomik riskler, biyolojik etkenler..."
                />
              </Field>

              <Field label="Geçirilmiş İş Kazaları">
                <textarea
                  value={previousAccidents}
                  onChange={(e) => setPreviousAccidents(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Meslek Hastalığı Şüphesi / Öyküsü">
                <textarea
                  value={occupationalDisease}
                  onChange={(e) => setOccupationalDisease(e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </Section>
          )}

          {activeTab === "Özgeçmiş" && (
            <Section title="Özgeçmiş">
              <Field label="Hastalık Öyküsü">
                <textarea
                  value={personalHistory}
                  onChange={(e) => setPersonalHistory(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Geçirilmiş Ameliyatlar">
                <textarea
                  value={surgeries}
                  onChange={(e) => setSurgeries(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Sürekli Kullanılan İlaçlar">
                <textarea
                  value={medicines}
                  onChange={(e) => setMedicines(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Alerjiler">
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Alışkanlıklar">
                <textarea
                  value={habits}
                  onChange={(e) => setHabits(e.target.value)}
                  style={textareaStyle}
                  placeholder="Sigara, alkol, madde kullanımı, uyku, beslenme..."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Soygeçmiş" && (
            <Section title="Soygeçmiş">
              <Field label="Aile Hastalık Öyküsü">
                <textarea
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  style={textareaStyle}
                  placeholder="Ailede kalp hastalığı, hipertansiyon, diyabet, kanser vb."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Fizik Muayene" && (
            <Section title="Fizik Muayene">
              <Field label="Genel Fizik Muayene Bulguları">
                <textarea
                  value={physicalExam}
                  onChange={(e) => setPhysicalExam(e.target.value)}
                  style={textareaStyle}
                  placeholder="Genel görünüm, baş-boyun, toraks, abdomen, ekstremite, nörolojik gözlem..."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Vital Bulgular" && (
            <Section title="Vital Bulgular">
              <div style={gridStyle}>
                <Field label="Boy (cm)">
                  <input value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Kilo (kg)">
                  <input value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
                </Field>

                <Info label="BMI" value={bmi || "-"} />

                <Field label="Tansiyon Sistolik">
                  <input value={systolic} onChange={(e) => setSystolic(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Tansiyon Diyastolik">
                  <input value={diastolic} onChange={(e) => setDiastolic(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Nabız">
                  <input value={pulse} onChange={(e) => setPulse(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Ateş">
                  <input value={temperature} onChange={(e) => setTemperature(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="SpO₂">
                  <input value={spo2} onChange={(e) => setSpo2(e.target.value)} style={inputStyle} />
                </Field>
              </div>
            </Section>
          )}

          {activeTab === "Sistem Muayenesi" && (
            <Section title="Sistem Muayenesi">
              <div style={checkGridStyle}>
                {[
                  "Göz",
                  "Kulak Burun Boğaz",
                  "Solunum Sistemi",
                  "Kardiyovasküler Sistem",
                  "Gastrointestinal Sistem",
                  "Ürogenital Sistem",
                  "Nörolojik Sistem",
                  "Kas İskelet Sistemi",
                  "Deri",
                  "Psikolojik Değerlendirme",
                ].map((item) => (
                  <label key={item} style={checkStyle}>
                    <input type="checkbox" />
                    {item}
                  </label>
                ))}
              </div>

              <InfoBlock
                title="Not"
                text="İşaretlenen sistemlere ilişkin detaylı açıklamalar sonraki fazda ayrı yorum alanlarıyla genişletilecektir."
              />
            </Section>
          )}

          {activeTab === "Laboratuvar" && (
            <Section title="Laboratuvar">
              <Field label="Laboratuvar / Tetkik Notları">
                <textarea
                  value={labNote}
                  onChange={(e) => setLabNote(e.target.value)}
                  style={textareaStyle}
                  placeholder="Hemogram, biyokimya, idrar, radyoloji veya ek tetkikler..."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Odyometri" && (
            <Section title="Odyometri">
              <Field label="Odyometri Değerlendirmesi">
                <textarea
                  value={audiometryNote}
                  onChange={(e) => setAudiometryNote(e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </Section>
          )}

          {activeTab === "SFT" && (
            <Section title="Solunum Fonksiyon Testi">
              <Field label="SFT Değerlendirmesi">
                <textarea
                  value={sftNote}
                  onChange={(e) => setSftNote(e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </Section>
          )}

          {activeTab === "Görme" && (
            <Section title="Görme">
              <Field label="Görme Testi Değerlendirmesi">
                <textarea
                  value={visionNote}
                  onChange={(e) => setVisionNote(e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </Section>
          )}

          {activeTab === "Aşılar" && (
            <Section title="Aşılar">
              <Field label="Aşı Durumu / Öneriler">
                <textarea
                  value={vaccineNote}
                  onChange={(e) => setVaccineNote(e.target.value)}
                  style={textareaStyle}
                  placeholder="Tetanoz, Hepatit, Grip, COVID vb."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Mesleki Riskler" && (
            <Section title="Mesleki Riskler">
              <Field label="Risk Değerlendirme Notu">
                <textarea
                  value={riskNote}
                  onChange={(e) => setRiskNote(e.target.value)}
                  style={textareaStyle}
                  placeholder="Çalışanın görevi, maruziyetleri ve sağlık bulgularına göre risk değerlendirmesi..."
                />
              </Field>
            </Section>
          )}

          {activeTab === "Kanaat" && (
            <Section title="İşe Uygunluk Kanaati">
              <div style={checkGridStyle}>
                {(["Uygun", "Kısıtlı Uygun", "Uygun Değil"] as Decision[]).map((item) => (
                  <label key={item} style={checkStyle}>
                    <input
                      type="radio"
                      name="decision"
                      checked={decision === item}
                      onChange={() => setDecision(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>

              <Field label="Kısıt / Açıklama">
                <textarea
                  value={restrictionNote}
                  onChange={(e) => setRestrictionNote(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <Field label="Hekim Kanaati">
                <textarea
                  value={doctorOpinion}
                  onChange={(e) => setDoctorOpinion(e.target.value)}
                  style={textareaStyle}
                />
              </Field>
            </Section>
          )}

          {activeTab === "PDF / İmza" && (
            <Section title="PDF / İmza">
              <InfoBlock
                title="PDF çıktısı"
                text="Sonraki adımda bu form resmi EK-2 çıktısına yakın PDF formatında oluşturulacaktır."
              />

              <Field label="İmza Notu">
                <textarea
                  value={signatureNote}
                  onChange={(e) => setSignatureNote(e.target.value)}
                  style={textareaStyle}
                />
              </Field>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={primaryButtonStyle}>
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
        </main>

        <aside style={sideCardStyle}>
          <h3 style={sideTitleStyle}>Canlı Özet</h3>

          <div style={{ display: "grid", gap: 12 }}>
            <SummaryRow label="Form Türü" value={formType} />
            <SummaryRow label="Durum" value={status} />
            <SummaryRow label="Muayene" value={examDate || "-"} />
            <SummaryRow label="Sonraki" value={nextExamDate || "-"} />
            <SummaryRow label="Karar" value={decision} />
            <SummaryRow label="BMI" value={bmi || "-"} />
          </div>

          {alerts.length > 0 && (
            <div style={warningBoxStyle}>
              <strong>DORA Ön Uyarıları</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {alerts.map((item) => (
                  <div key={item}>⚠️ {item}</div>
                ))}
              </div>
            </div>
          )}

          <div style={autoSaveStyle}>
            <strong>Otomatik kayıt</strong>
            <span>✓ Hazır</span>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <h3 style={{ margin: 0, fontSize: 22 }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={infoBoxStyle}>{value}</div>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div style={infoBlockStyle}>
      <strong>{title}</strong>
      <p style={{ margin: "6px 0 0", color: "#64748b", lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "center",
  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  color: "#fff",
  borderRadius: 22,
  padding: 26,
};

const heroLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  opacity: 0.85,
};

const statusBoxStyle: CSSProperties = {
  minWidth: 180,
  background: "rgba(255,255,255,.15)",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 18,
  padding: 16,
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

const sideCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 18,
};

const contentCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 24,
  minHeight: 620,
};

const sideTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
};

const tabButtonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 850,
  cursor: "pointer",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "0 12px",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 110,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 12,
  outline: "none",
  resize: "vertical",
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 850,
};

const infoBoxStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: "12px 14px",
  fontWeight: 900,
};

const checkGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const checkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 850,
  color: "#334155",
};

const infoBlockStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
};

const warningBoxStyle: CSSProperties = {
  marginTop: 18,
  border: "1px solid #fed7aa",
  background: "#fff7ed",
  color: "#9a3412",
  borderRadius: 14,
  padding: 14,
  fontSize: 13,
  fontWeight: 800,
};

const autoSaveStyle: CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  background: "#f0fdf4",
  color: "#15803d",
  borderRadius: 14,
  padding: 14,
  fontWeight: 900,
};

const summaryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  paddingBottom: 10,
  borderBottom: "1px solid #e5e7eb",
  color: "#334155",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#fff",
  color: "#334155",
  fontWeight: 900,
  cursor: "pointer",
};

const successButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const darkButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};