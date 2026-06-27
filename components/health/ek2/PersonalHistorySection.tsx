"use client";

import { CSSProperties } from "react";

export type PersonalHistory = {
  chronicDiseases: string;
  surgeries: string;
  medicines: string;
  allergies: string;

  smoking: boolean;
  alcohol: boolean;
  substance: boolean;

  diabetes: boolean;
  hypertension: boolean;
  asthma: boolean;
  epilepsy: boolean;
  heartDisease: boolean;
  thyroid: boolean;
  psychiatric: boolean;

  other: string;
};

type Props = {
  value: PersonalHistory;
  onChange: (value: PersonalHistory) => void;
};

function update(
  value: PersonalHistory,
  onChange: (v: PersonalHistory) => void,
  key: keyof PersonalHistory,
  data: any
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function PersonalHistorySection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        ÖZGEÇMİŞ
      </h2>

      <div style={diseaseGrid}>

        <Check
          label="Diyabet"
          checked={value.diabetes}
          onChange={(v)=>update(value,onChange,"diabetes",v)}
        />

        <Check
          label="Hipertansiyon"
          checked={value.hypertension}
          onChange={(v)=>update(value,onChange,"hypertension",v)}
        />

        <Check
          label="Astım"
          checked={value.asthma}
          onChange={(v)=>update(value,onChange,"asthma",v)}
        />

        <Check
          label="Epilepsi"
          checked={value.epilepsy}
          onChange={(v)=>update(value,onChange,"epilepsy",v)}
        />

        <Check
          label="Kalp Hastalığı"
          checked={value.heartDisease}
          onChange={(v)=>update(value,onChange,"heartDisease",v)}
        />

        <Check
          label="Tiroid"
          checked={value.thyroid}
          onChange={(v)=>update(value,onChange,"thyroid",v)}
        />

        <Check
          label="Psikiyatrik"
          checked={value.psychiatric}
          onChange={(v)=>update(value,onChange,"psychiatric",v)}
        />

      </div>

      <Field label="Kronik Hastalıklar">
        <textarea
          style={textarea}
          value={value.chronicDiseases}
          onChange={(e)=>
            update(value,onChange,"chronicDiseases",e.target.value)
          }
        />
      </Field>

      <Field label="Geçirilmiş Ameliyatlar">
        <textarea
          style={textarea}
          value={value.surgeries}
          onChange={(e)=>
            update(value,onChange,"surgeries",e.target.value)
          }
        />
      </Field>

      <Field label="Sürekli Kullanılan İlaçlar">
        <textarea
          style={textarea}
          value={value.medicines}
          onChange={(e)=>
            update(value,onChange,"medicines",e.target.value)
          }
        />
      </Field>

      <Field label="Alerjiler">
        <textarea
          style={textarea}
          value={value.allergies}
          onChange={(e)=>
            update(value,onChange,"allergies",e.target.value)
          }
        />
      </Field>

      <h3 style={subTitle}>
        ALIŞKANLIKLAR
      </h3>

      <div style={habitGrid}>

        <Check
          label="Sigara"
          checked={value.smoking}
          onChange={(v)=>update(value,onChange,"smoking",v)}
        />

        <Check
          label="Alkol"
          checked={value.alcohol}
          onChange={(v)=>update(value,onChange,"alcohol",v)}
        />

        <Check
          label="Madde Kullanımı"
          checked={value.substance}
          onChange={(v)=>update(value,onChange,"substance",v)}
        />

      </div>

      <Field label="Diğer Açıklamalar">
        <textarea
          style={textarea}
          value={value.other}
          onChange={(e)=>
            update(value,onChange,"other",e.target.value)
          }
        />
      </Field>

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

function Check({
  label,
  checked,
  onChange,
}:{
  label:string;
  checked:boolean;
  onChange:(v:boolean)=>void;
}){
  return(
    <label style={check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e)=>onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

const card:CSSProperties={
  background:"#fff",
  border:"1px solid #e5e7eb",
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

const subTitle:CSSProperties={
  marginBottom:0,
  color:"#7f1d1d",
};

const textarea:CSSProperties={
  minHeight:90,
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:10,
};

const diseaseGrid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
  gap:12,
};

const habitGrid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:12,
};

const check:CSSProperties={
  display:"flex",
  alignItems:"center",
  gap:8,
};