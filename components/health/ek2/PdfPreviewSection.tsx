"use client";

import { CSSProperties } from "react";

type Props = {
  employeeName: string;
  companyName: string;
  doctorName: string;
  examDate: string;
  decision: string;
  formType: string;

  onPreview: () => void;
  onPrint: () => void;
  onPdf: () => void;
};

export default function PdfPreviewSection({
  employeeName,
  companyName,
  doctorName,
  examDate,
  decision,
  formType,
  onPreview,
  onPrint,
  onPdf,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        PDF ÖNİZLEME / YAZDIRMA
      </h2>

      <div style={previewCard}>

        <div style={header}>

          <div>

            <div style={logo}>
              D-SEC
            </div>

            <div style={formTitle}>
              İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
            </div>

          </div>

          <div style={badge}>
            {formType}
          </div>

        </div>

        <table style={table}>

          <tbody>

            <Row
              title="Çalışan"
              value={employeeName}
            />

            <Row
              title="Firma"
              value={companyName}
            />

            <Row
              title="Muayene Tarihi"
              value={examDate}
            />

            <Row
              title="İşyeri Hekimi"
              value={doctorName}
            />

            <Row
              title="Karar"
              value={decision}
            />

          </tbody>

        </table>

        <div style={signatureArea}>

          <div style={signatureBox}>

            Çalışan İmzası

          </div>

          <div style={signatureBox}>

            İşyeri Hekimi

          </div>

        </div>

      </div>

      <div style={buttonArea}>

        <button
          type="button"
          onClick={onPreview}
          style={primaryButton}
        >
          PDF Önizle
        </button>

        <button
          type="button"
          onClick={onPdf}
          style={successButton}
        >
          PDF Oluştur
        </button>

        <button
          type="button"
          onClick={onPrint}
          style={secondaryButton}
        >
          Yazdır
        </button>

      </div>

    </section>
  );
}

function Row({
  title,
  value,
}:{
  title:string;
  value:string;
}){

  return(

<tr>

<td style={left}>
{title}
</td>

<td style={right}>
{value || "-"}
</td>

</tr>

);

}

const card:CSSProperties={
background:"#fff",
border:"1px solid #d1d5db",
borderRadius:18,
padding:24,
display:"grid",
gap:20,
};

const title:CSSProperties={
margin:0,
fontSize:24,
fontWeight:900,
};

const previewCard:CSSProperties={
background:"#fafafa",
border:"2px solid #111827",
padding:20,
};

const header:CSSProperties={
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:20,
};

const logo:CSSProperties={
fontSize:28,
fontWeight:900,
color:"#991b1b",
};

const formTitle:CSSProperties={
fontWeight:900,
marginTop:6,
};

const badge:CSSProperties={
padding:"10px 18px",
background:"#991b1b",
color:"#fff",
borderRadius:10,
fontWeight:900,
};

const table:CSSProperties={
width:"100%",
borderCollapse:"collapse",
};

const left:CSSProperties={
width:220,
border:"1px solid #000",
padding:8,
fontWeight:900,
};

const right:CSSProperties={
border:"1px solid #000",
padding:8,
};

const signatureArea:CSSProperties={
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:30,
marginTop:40,
};

const signatureBox:CSSProperties={
border:"1px solid #000",
height:120,
display:"flex",
justifyContent:"center",
alignItems:"center",
fontWeight:900,
};

const buttonArea:CSSProperties={
display:"flex",
gap:12,
flexWrap:"wrap",
};

const primaryButton:CSSProperties={
background:"#991b1b",
color:"#fff",
border:"none",
padding:"12px 18px",
borderRadius:10,
fontWeight:900,
cursor:"pointer",
};

const successButton:CSSProperties={
background:"#15803d",
color:"#fff",
border:"none",
padding:"12px 18px",
borderRadius:10,
fontWeight:900,
cursor:"pointer",
};

const secondaryButton:CSSProperties={
background:"#fff",
border:"1px solid #d1d5db",
padding:"12px 18px",
borderRadius:10,
fontWeight:900,
cursor:"pointer",
};