"use client";

import type { CSSProperties } from "react";

type Props = {
  form: any;
  bmi?: string;
};

export default function Ek2OfficialPrint({ form, bmi }: Props) {
  return (
    <div style={pageWrap}>
      <section style={a4}>
        <Title />

        <Block title="İŞYERİNİN / İŞVERENİN">
          <Row label="Unvanı" value={form.companyName} />
          <Row label="SGK Sicil No." value={form.sgkNo} />
          <Row label="Adresi" value={form.workplaceAddress} />
          <Row label="Tel ve Faks" value={form.companyPhone} />
          <Row label="E-Posta" value={form.companyEmail} />
        </Block>

        <div style={declaration}>
          İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında
          verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.
          <div style={signLine}>
            Çalışanın Adı Soyadı: {v(form.employeeName)} &nbsp;&nbsp;&nbsp; İMZA:
          </div>
        </div>

        <Block title="ÇALIŞANIN / İŞE GİRENİN">
          <PhotoRow label="Adı ve Soyadı" value={form.employeeName} />
          <Row label="T.C. Kimlik No" value={form.identityNumber} />
          <Row label="Doğum Yeri ve Tarihi" value={form.birthDate} />
          <Row label="Cinsiyeti" value={form.gender} />
          <Row label="Eğitim Durumu" value={form.educationStatus} />
          <Row label="Medeni Durumu / Çocuk Sayısı" value={form.maritalStatus} />
          <Row label="Ev Adresi" value={form.homeAddress} />
          <Row label="Tel No." value={form.phone} />
          <Row label="Mesleği / Meslek Dalı" value={form.jobTitle} />
          <BigRow label="Yaptığı İş" value={form.currentJobDescription} />
          <Row label="Çalıştığı Bölüm" value={form.department} />
        </Block>

        <Block title="DAHA ÖNCE ÇALIŞTIĞI YERLER">
          <WorkHistory form={form} />
        </Block>

        <Block title="ÖZGEÇMİŞİ">
          <Row label="Kan Grubu" value={form.bloodGroup} />
          <Row label="Konjenital / Kronik Hastalık" value={form.chronicDiseases} />
          <Row label="Bağışıklama - Tetanoz" value={form.tetanus || form.vaccines} />
          <Row label="Bağışıklama - Hepatit" value={form.hepatitis} />
          <Row label="Bağışıklama - Diğer" value={form.otherVaccines} />
        </Block>

        <Block title="SOYGEÇMİŞİ">
          <Row label="Anne / Baba / Kardeş / Çocuk" value={form.familyHistory} />
        </Block>

        <Block title="TIBBİ ANAMNEZ">
          <CheckLine text="Balgamlı öksürük" />
          <CheckLine text="Nefes darlığı" />
          <CheckLine text="Göğüs ağrısı" />
          <CheckLine text="Çarpıntı" />
          <CheckLine text="Sırt ağrısı" />
          <CheckLine text="İshal veya kabızlık" />
          <CheckLine text="Eklemlerde ağrı" />
          <CheckLine text="Kalp hastalığı" />
          <CheckLine text="Şeker hastalığı" />
          <CheckLine text="Böbrek rahatsızlığı" />
          <CheckLine text="Sarılık" />
        </Block>
      </section>

      <section style={a4}>
        <Title />

        <Block title="TIBBİ ANAMNEZ - DEVAM">
          <CheckLine text="Mide veya on iki parmak ülseri" />
          <CheckLine text="İşitme kaybı" />
          <CheckLine text="Görme bozukluğu" />
          <CheckLine text="Sinir sistemi hastalığı" />
          <CheckLine text="Deri hastalığı" />
          <CheckLine text="Besin zehirlenmesi" />
          <Question label="Hastanede yattınız mı?" value={form.hospitalization} />
          <Question label="Ameliyat geçirdiniz mi?" value={form.surgeries} />
          <Question label="İş kazası geçirdiniz mi?" value={form.previousAccidents} />
          <Question label="Meslek hastalığı şüphesi ile tetkik/muayene oldunuz mu?" value={form.occupationalDiseaseHistory} />
          <Question label="Maluliyet aldınız mı?" value={form.disability} />
          <Question label="Şu anda tedavi görüyor musunuz?" value={form.medicines} />
          <Question label="Sigara kullanımı" value={form.smoking || form.habits} />
          <Question label="Alkol kullanımı" value={form.alcohol} />
        </Block>

        <Block title="FİZİK MUAYENE SONUÇLARI">
          <BigRow label="Göz" value={form.eye} />
          <BigRow label="Kulak-Burun-Boğaz" value={form.earNoseThroat} />
          <BigRow label="Deri" value={form.skin} />
          <BigRow label="Kardiyovasküler Sistem" value={form.cardiovascular} />
          <BigRow label="Solunum Sistemi" value={form.respiratory} />
          <BigRow label="Sindirim Sistemi" value={form.digestive} />
          <BigRow label="Ürogenital Sistem" value={form.genitourinary} />
          <BigRow label="Kas-İskelet Sistemi" value={form.musculoskeletal} />
          <BigRow label="Nörolojik Muayene" value={form.neurological} />
          <BigRow label="Psikiyatrik Muayene" value={form.psychological} />
          <Row label="TA / Nabız" value={`${v(form.systolic)}/${v(form.diastolic)} mmHg - ${v(form.pulse)} /dk`} />
          <Row label="Boy / Kilo / VKİ" value={`${v(form.height)} cm - ${v(form.weight)} kg - ${v(bmi)}`} />
        </Block>

        <Block title="LABORATUVAR BULGULARI">
          <BigRow label="Kan" value={form.hemogram || form.biochemistry} />
          <BigRow label="İdrar" value={form.urine} />
          <BigRow label="Radyolojik Analizler" value={form.radiology} />
          <BigRow label="Odyometre" value={form.audiometry} />
          <BigRow label="SFT" value={form.sft} />
          <BigRow label="Psikolojik Testler" value={form.psychologicalTests} />
          <BigRow label="Diğer" value={form.otherTests} />
        </Block>

        <Block title="KANAAT VE SONUÇ">
          <ResultLine form={form} />
          <BigRow label="Kısıt / Öneriler" value={form.restrictions || form.recommendations} />
          <BigRow label="Hekim Kanaati" value={form.doctorOpinion} />
        </Block>

        <div style={doctorArea}>
          <div>…… / …… / 20……</div>
          <div style={{ marginTop: 18, fontWeight: 800 }}>İMZA</div>
          <div>Adı Soyadı: {v(form.doctorName)}</div>
          <div>Diploma Tarih ve No:</div>
          <div>Diploma Tescil Tarih ve No:</div>
          <div>İşyeri Hekimliği Belgesi Tarih ve No:</div>
        </div>
      </section>
    </div>
  );
}

function Title() {
  return <div style={title}>İŞE GİRİŞ / PERİYODİK MUAYENE FORMU Ek-2</div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={block}>
      <div style={blockTitle}>{title}</div>
      <table style={table}><tbody>{children}</tbody></table>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: any }) {
  return (
    <tr>
      <td style={left}>{label}</td>
      <td style={right}>{v(value)}</td>
    </tr>
  );
}

function BigRow({ label, value }: { label: string; value?: any }) {
  return (
    <tr>
      <td style={leftBig}>{label}</td>
      <td style={rightBig}>{v(value)}</td>
    </tr>
  );
}

function PhotoRow({ label, value }: { label: string; value?: any }) {
  return (
    <tr>
      <td style={left}>{label}</td>
      <td style={right}>{v(value)}</td>
      <td rowSpan={6} style={photo}>Fotoğraf</td>
    </tr>
  );
}

function WorkHistory({ form }: { form: any }) {
  return (
    <>
      <tr>
        <td style={miniHead}>İşkolu</td>
        <td style={miniHead}>Yaptığı İş</td>
        <td style={miniHead}>Giriş-Çıkış Tarihi</td>
      </tr>
      {[1, 2, 3].map((n) => (
        <tr key={n}>
          <td style={miniCell}>{form[`oldWorkSector${n}`] || ""}</td>
          <td style={miniCell}>{form[`oldWorkJob${n}`] || ""}</td>
          <td style={miniCell}>{form[`oldWorkDate${n}`] || ""}</td>
        </tr>
      ))}
    </>
  );
}

function CheckLine({ text }: { text: string }) {
  return (
    <tr>
      <td style={questionCell}>{text}</td>
      <td style={checkCell}>Hayır □</td>
      <td style={checkCell}>Evet □</td>
    </tr>
  );
}

function Question({ label, value }: { label: string; value?: any }) {
  return (
    <tr>
      <td style={questionCell}>{label}</td>
      <td style={checkCell}>Hayır □</td>
      <td style={answerCell}>Evet ise: {v(value)}</td>
    </tr>
  );
}

function ResultLine({ form }: { form: any }) {
  return (
    <tr>
      <td style={resultCell} colSpan={2}>
        1- {form.jobTitle || "................................"} işinde bedenen ve ruhen çalışmaya{" "}
        {form.decision === "Çalışamaz" ? "elverişli değildir." : "elverişlidir."}
        <br />
        2- {form.restrictions || "................................"} şartı ile çalışmaya elverişlidir.
      </td>
    </tr>
  );
}

function v(value?: any) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

const pageWrap: CSSProperties = { display: "grid", gap: "12mm" };

const a4: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  color: "#000",
  padding: "9mm",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 10.5,
};

const title: CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  fontSize: 15,
  marginBottom: 8,
};

const block: CSSProperties = { marginTop: 5 };

const blockTitle: CSSProperties = {
  fontWeight: 900,
  fontSize: 11,
  marginBottom: 2,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const left: CSSProperties = {
  width: "32%",
  border: "1px solid #000",
  padding: "3px 5px",
  fontWeight: 700,
};

const right: CSSProperties = {
  border: "1px solid #000",
  padding: "3px 5px",
  height: 18,
  whiteSpace: "pre-wrap",
};

const leftBig: CSSProperties = {
  ...left,
  height: 28,
  verticalAlign: "top",
};

const rightBig: CSSProperties = {
  ...right,
  height: 28,
  verticalAlign: "top",
};

const declaration: CSSProperties = {
  borderTop: "1px dashed #000",
  borderBottom: "1px dashed #000",
  padding: 6,
  marginTop: 6,
  fontSize: 10.5,
};

const signLine: CSSProperties = { marginTop: 8, fontWeight: 700 };

const photo: CSSProperties = {
  width: 90,
  border: "1px solid #000",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: 700,
};

const miniHead: CSSProperties = {
  border: "1px solid #000",
  padding: 4,
  fontWeight: 900,
  textAlign: "center",
};

const miniCell: CSSProperties = {
  border: "1px solid #000",
  padding: 4,
  height: 20,
};

const questionCell: CSSProperties = {
  border: "1px solid #000",
  padding: 4,
  width: "65%",
};

const checkCell: CSSProperties = {
  border: "1px solid #000",
  padding: 4,
  width: "15%",
  textAlign: "center",
};

const answerCell: CSSProperties = {
  border: "1px solid #000",
  padding: 4,
};

const resultCell: CSSProperties = {
  border: "1px solid #000",
  padding: 8,
  minHeight: 70,
  lineHeight: 1.6,
};

const doctorArea: CSSProperties = {
  marginTop: 18,
  marginLeft: "auto",
  width: "55%",
  lineHeight: 1.8,
  fontSize: 11,
};
