"use client";

import { CSSProperties } from "react";

export type DecisionSectionModel = {
  examinationType: "İşe Giriş" | "Periyodik";

  decision:
    | "Çalışabilir"
    | "Şartlı Çalışabilir"
    | "Çalışamaz";

  restrictionReason: string;

  controlPeriod: string;

  recommendations: string;

  doctorOpinion: string;

  doctorName: string;

  diplomaNo: string;

  signatureDate: string;

  digitalSignature: boolean;
};

type Props = {
  value: DecisionSectionModel;
  onChange: (v: DecisionSectionModel) => void;
};

function update(
  value: DecisionSectionModel,
  onChange: (v: DecisionSectionModel) => void,
  key: keyof DecisionSectionModel,
  data: any
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function DecisionSection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        İŞE GİRİŞ / PERİYODİK MUAYENE KANAATİ
      </h2>

      <div style={decisionGrid}>

        {[
          "Çalışabilir",
          "Şartlı Çalışabilir",
          "Çalışamaz",
        ].map((item) => (
          <label
            key={item}
            style={{
              ...decisionCard,
              borderColor:
                value.decision === item
                  ? "#991b1b"
                  : "#d1d5db",
            }}
          >
            <input
              type="radio"
              checked={value.decision === item}
              onChange={() =>
                update(
                  value,
                  onChange,
                  "decision",
                  item
                )
              }
            />

            <strong>{item}</strong>
          </label>
        ))}

      </div>

      <Field label="Çalışma Kısıtlaması">

        <textarea
          value={value.restrictionReason}
          onChange={(e)=>
            update(
              value,
              onChange,
              "restrictionReason",
              e.target.value
            )
          }
          style={textarea}
        />

      </Field>

      <Field label="Kontrol Muayene Süresi">

        <input
          value={value.controlPeriod}
          onChange={(e)=>
            update(
              value,
              onChange,
              "controlPeriod",
              e.target.value
            )
          }
          style={input}
          placeholder="6 Ay / 1 Yıl / 2 Yıl"
        />

      </Field>

      <Field label="İşyeri Hekimi Önerileri">

        <textarea
          value={value.recommendations}
          onChange={(e)=>
            update(
              value,
              onChange,
              "recommendations",
              e.target.value
            )
          }
          style={textarea}
        />

      </Field>

      <Field label="Hekim Kanaati">

        <textarea
          value={value.doctorOpinion}
          onChange={(e)=>
            update(
              value,
              onChange,
              "doctorOpinion",
              e.target.value
            )
          }
          style={bigTextarea}
        />

      </Field>

      <div style={signatureArea}>

        <div style={signatureBox}>

          <div style={signatureTitle}>
            İşyeri Hekimi
          </div>

          <input
            value={value.doctorName}
            onChange={(e)=>
              update(
                value,
                onChange,
                "doctorName",
                e.target.value
              )
            }
            placeholder="Ad Soyad"
            style={input}
          />

          <input
            value={value.diplomaNo}
            onChange={(e)=>
              update(
                value,
                onChange,
                "diplomaNo",
                e.target.value
              )
            }
            placeholder="Diploma No"
            style={input}
          />

          <input
            type="date"
            value={value.signatureDate}
            onChange={(e)=>
              update(
                value,
                onChange,
                "signatureDate",
                e.target.value
              )
            }
            style={input}
          />

        </div>

        <div style={signatureBox}>

          <div style={signatureTitle}>
            Kaşe / İmza
          </div>

          <label style={digitalCheck}>

            <input
              type="checkbox"
              checked={value.digitalSignature}
              onChange={(e)=>
                update(
                  value,
                  onChange,
                  "digitalSignature",
                  e.target.checked
                )
              }
            />

            Dijital İmza Kullan

          </label>

          <div style={signPlaceholder}>
            İMZA
          </div>

        </div>

      </div>

    </section>
  );
}

function Field({
  label,
  children,
}:{
  label:string;
  children:React.ReactNode;
}){
  return(
    <div style={{display:"grid",gap:6}}>
      <strong>{label}</strong>
      {children}
    </div>
  );
}

const card:CSSProperties={
  background:"#fff",
  border:"1px solid #d1d5db",
  borderRadius:18,
  padding:24,
  display:"grid",
  gap:18,
};

const title:CSSProperties={
  margin:0,
  fontSize:24,
  fontWeight:900,
};

const decisionGrid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:14,
};

const decisionCard:CSSProperties={
  border:"2px solid",
  borderRadius:14,
  padding:16,
  display:"flex",
  gap:10,
  alignItems:"center",
};

const input:CSSProperties={
  width:"100%",
  height:44,
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:"0 12px",
};

const textarea:CSSProperties={
  width:"100%",
  minHeight:90,
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:10,
  resize:"vertical",
};

const bigTextarea:CSSProperties={
  width:"100%",
  minHeight:160,
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:10,
  resize:"vertical",
};

const signatureArea:CSSProperties={
  display:"grid",
  gridTemplateColumns:"1fr 1fr",
  gap:24,
};

const signatureBox:CSSProperties={
  border:"2px solid #d1d5db",
  borderRadius:16,
  padding:20,
  display:"grid",
  gap:14,
};

const signatureTitle:CSSProperties={
  fontSize:18,
  fontWeight:900,
};

const digitalCheck:CSSProperties={
  display:"flex",
  gap:10,
  alignItems:"center",
  fontWeight:700,
};

const signPlaceholder:CSSProperties={
  height:180,
  border:"2px dashed #94a3b8",
  borderRadius:14,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontSize:32,
  color:"#94a3b8",
  fontWeight:900,
};