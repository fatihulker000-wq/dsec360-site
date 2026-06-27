"use client";

import { CSSProperties } from "react";
import type { Ek2Form } from "./Ek2Types";

type Props = {
  form: Ek2Form;
};

export default function OfficialEk2Print({ form }: Props) {
  const audiometryText =
    form.audiometry?.note || form.audiometry?.result || "";

  const sftText =
    form.sft?.doctorNote || form.sft?.result || "";

  const visionText =
    form.vision?.note || form.vision?.result || "";

  const vaccinesText = (form.vaccines || [])
    .map((v) => `${v.name || "Aşı"} - ${v.status || "-"} ${v.date ? `(${v.date})` : ""}`)
    .join("\n");

  return (
    <div style={page}>
      <OfficialPage pageNo="1/3">
        <Header form={form} />

        <Title text="1. ÇALIŞAN BİLGİLERİ" />
        <Table>
          <Row label="Adı Soyadı" value={form.employeeName} />
          <Row label="T.C. Kimlik No" value={form.identityNumber} />
          <Row label="Doğum Tarihi" value={form.birthDate} />
          <Row label="Cinsiyet" value={form.gender} />
          <Row label="Kan Grubu" value={form.bloodGroup} />
          <Row label="Telefon" value={form.phone} />
        </Table>

        <Title text="2. İŞYERİ BİLGİLERİ" />
        <Table>
          <Row label="İşyeri / Firma" value={form.companyName} />
          <Row label="İşyeri Adresi" value={form.workplaceAddress} />
          <Row label="Görevi / Mesleği" value={form.jobTitle} />
          <Row label="İşe Giriş Tarihi" value={form.startDate} />
          <Row label="NACE Kodu" value={form.naceCode} />
          <Row label="Tehlike Sınıfı" value={form.dangerClass} />
        </Table>

        <Title text="3. MESLEKİ ANAMNEZ" />
        <Table>
          <RowBig label="Önceki İşler" value={form.previousJobs} />
          <RowBig label="Yaptığı İş" value={form.currentJobDescription} />
          <RowBig label="Maruziyetler" value={form.exposures} />
          <RowBig label="KKD Kullanımı" value={form.ppeUsage} />
          <RowBig label="Geçirilmiş İş Kazaları" value={form.previousAccidents} />
          <RowBig label="Meslek Hastalığı Öyküsü" value={form.occupationalDiseaseHistory} />
        </Table>
      </OfficialPage>

      <OfficialPage pageNo="2/3">
        <Header form={form} />

        <Title text="4. ÖZGEÇMİŞ / SOYGEÇMİŞ" />
        <Table>
          <RowBig label="Kronik Hastalıklar" value={form.chronicDiseases} />
          <RowBig label="Geçirilmiş Ameliyatlar" value={form.surgeries} />
          <RowBig label="Kullanılan İlaçlar" value={form.medicines} />
          <RowBig label="Alerjiler" value={form.allergies} />
          <RowBig label="Alışkanlıklar" value={form.habits} />
          <RowBig label="Soygeçmiş" value={form.familyHistory} />
        </Table>

        <Title text="5. FİZİK MUAYENE / VİTAL BULGULAR" />
        <Table>
          <Row label="Boy" value={form.height} />
          <Row label="Kilo" value={form.weight} />
          <Row label="BMI" value={form.bmi} />
          <Row label="Tansiyon" value={`${form.systolic || "-"}/${form.diastolic || "-"}`} />
          <Row label="Nabız" value={form.pulse} />
          <Row label="Solunum" value={form.respiration} />
          <Row label="Ateş" value={form.temperature} />
          <Row label="SpO₂" value={form.spo2} />
        </Table>

        <Title text="6. SİSTEM MUAYENESİ" />
        <SystemTable form={form} />
      </OfficialPage>

      <OfficialPage pageNo="3/3">
        <Header form={form} />

        <Title text="7. LABORATUVAR VE TETKİKLER" />
        <Table>
          <RowBig label="Hemogram" value={form.hemogram} />
          <RowBig label="Biyokimya" value={form.biochemistry} />
          <RowBig label="İdrar Tetkiki" value={form.urine} />
          <RowBig label="PA Akciğer Grafisi" value={form.radiology} />
          <RowBig label="Odyometri" value={audiometryText} />
          <RowBig label="SFT" value={sftText} />
          <RowBig label="Görme Testi" value={visionText} />
          <RowBig label="EKG" value={form.ekg} />
          <RowBig label="Aşılar" value={vaccinesText} />
          <RowBig label="Diğer Tetkikler" value={form.otherTests} />
        </Table>

        <Title text="8. İŞE UYGUNLUK KANAATİ" />
        <Table>
          <Row label="Karar" value={form.decision} />
          <RowBig label="Çalışma Kısıtlamaları" value={form.restrictions} />
          <RowBig label="Öneriler" value={form.recommendations} />
          <RowBig label="Hekim Kanaati" value={form.doctorOpinion} />
        </Table>

        <div style={signatureArea}>
          <div style={signatureBox}>
            <strong>Çalışanın İmzası</strong>
            <div style={signatureLine}></div>
          </div>

          <div style={signatureBox}>
            <strong>İşyeri Hekimi</strong>
            <br />
            {form.doctorName || "-"}
            <br />
            Muayene Tarihi: {form.examDate || "-"}
            <div style={signatureLine}>Kaşe / İmza</div>
          </div>
        </div>

        <div style={footer}>
          <span>D-SEC doğrulama kodu: {form.fileNo || "-"}</span>
          <span>Sayfa 3/3</span>
        </div>
      </OfficialPage>
    </div>
  );
}

function OfficialPage({
  children,
  pageNo,
}: {
  children: React.ReactNode;
  pageNo: string;
}) {
  return (
    <section style={a4}>
      {children}
      <div style={pageFooter}>Sayfa {pageNo}</div>
    </section>
  );
}

function Header({ form }: { form: Ek2Form }) {
  return (
    <table style={headerTable}>
      <tbody>
        <tr>
          <td style={logoCell}>D-SEC</td>
          <td style={titleCell}>
            İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
            <br />
            EK-2
          </td>
          <td style={docCell}>
            Form No: {form.fileNo || "-"}
            <br />
            Revizyon: {form.revisionNo || "0"}
            <br />
            Tarih: {form.examDate || "-"}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Title({ text }: { text: string }) {
  return <div style={sectionTitle}>{text}</div>;
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <table style={table}>
      <tbody>{children}</tbody>
    </table>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td style={left}>{label}</td>
      <td style={right}>{value || "-"}</td>
    </tr>
  );
}

function RowBig({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td style={leftBig}>{label}</td>
      <td style={rightBig}>{value || "-"}</td>
    </tr>
  );
}

function SystemTable({ form }: { form: Ek2Form }) {
  const rows = [
    ["Baş - Boyun", form.headNeck],
    ["Göz", form.eye],
    ["Kulak Burun Boğaz", form.earNoseThroat],
    ["Solunum Sistemi", form.respiratory],
    ["Kardiyovasküler Sistem", form.cardiovascular],
    ["Sindirim Sistemi", form.digestive],
    ["Ürogenital Sistem", form.genitourinary],
    ["Kas İskelet Sistemi", form.musculoskeletal],
    ["Nörolojik Sistem", form.neurological],
    ["Deri", form.skin],
    ["Psikiyatrik Değerlendirme", form.psychological],
  ];

  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Sistem</th>
          <th style={thSmall}>Normal</th>
          <th style={thSmall}>Patolojik</th>
          <th style={th}>Açıklama</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={left}>{label}</td>
            <td style={centerCell}>{value ? "" : "✓"}</td>
            <td style={centerCell}>{value ? "✓" : ""}</td>
            <td style={right}>{value || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const page: CSSProperties = {
  display: "grid",
  gap: 30,
};

const a4: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  background: "#fff",
  padding: "10mm",
  border: "1px solid #000",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#000",
  pageBreakAfter: "always",
  position: "relative",
};

const headerTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 12,
};

const logoCell: CSSProperties = {
  width: 110,
  border: "1px solid #000",
  textAlign: "center",
  fontWeight: 900,
  fontSize: 20,
};

const titleCell: CSSProperties = {
  border: "1px solid #000",
  textAlign: "center",
  fontWeight: 900,
  fontSize: 16,
  padding: 8,
};

const docCell: CSSProperties = {
  width: 180,
  border: "1px solid #000",
  padding: 8,
  fontSize: 11,
};

const sectionTitle: CSSProperties = {
  marginTop: 10,
  marginBottom: 4,
  background: "#e5e7eb",
  border: "1px solid #000",
  padding: "6px 8px",
  fontWeight: 900,
  fontSize: 13,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: CSSProperties = {
  border: "1px solid #000",
  padding: 6,
  background: "#f3f4f6",
  fontWeight: 900,
  textAlign: "left",
};

const thSmall: CSSProperties = {
  ...th,
  width: 70,
  textAlign: "center",
};

const left: CSSProperties = {
  width: 210,
  border: "1px solid #000",
  padding: 6,
  fontWeight: 700,
  fontSize: 11,
  verticalAlign: "top",
};

const right: CSSProperties = {
  border: "1px solid #000",
  padding: 6,
  fontSize: 11,
  whiteSpace: "pre-wrap",
  verticalAlign: "top",
};

const leftBig: CSSProperties = {
  ...left,
  height: 48,
};

const rightBig: CSSProperties = {
  ...right,
  height: 48,
};

const centerCell: CSSProperties = {
  border: "1px solid #000",
  padding: 6,
  textAlign: "center",
  fontWeight: 900,
};

const signatureArea: CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 30,
};

const signatureBox: CSSProperties = {
  border: "1px solid #000",
  minHeight: 120,
  padding: 12,
  textAlign: "center",
  fontSize: 12,
};

const signatureLine: CSSProperties = {
  marginTop: 38,
  borderTop: "1px solid #000",
  paddingTop: 8,
};

const footer: CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "space-between",
  fontSize: 10,
};

const pageFooter: CSSProperties = {
  position: "absolute",
  bottom: "6mm",
  right: "10mm",
  fontSize: 10,
};
