"use client";

import { CSSProperties } from "react";

export type OccupationalHistory = {
  previousJobs: string;
  currentJobDescription: string;
  exposureNoise: boolean;
  exposureDust: boolean;
  exposureChemical: boolean;
  exposureBiological: boolean;
  exposureRadiation: boolean;
  exposureVibration: boolean;
  exposureErgonomic: boolean;
  exposureHeight: boolean;
  exposureConfined: boolean;
  ppeUsage: string;
  previousAccidents: string;
  occupationalDisease: string;
};

type Props = {
  value: OccupationalHistory;
  onChange: (value: OccupationalHistory) => void;
};

function update(
  value: OccupationalHistory,
  onChange: (v: OccupationalHistory) => void,
  key: keyof OccupationalHistory,
  data: any
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function OccupationalHistorySection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        MESLEKİ ANAMNEZ
      </h2>

      <Field label="Önceki İşler">
        <textarea
          style={textarea}
          value={value.previousJobs}
          onChange={(e)=>
            update(value,onChange,"previousJobs",e.target.value)
          }
        />
      </Field>

      <Field label="Yaptığı İşin Tanımı">
        <textarea
          style={textarea}
          value={value.currentJobDescription}
          onChange={(e)=>
            update(value,onChange,"currentJobDescription",e.target.value)
          }
        />
      </Field>

      <h3 style={subTitle}>
        MESLEKİ MARUZİYETLER
      </h3>

      <div style={grid}>

        <Check
          label="Gürültü"
          checked={value.exposureNoise}
          onChange={(v)=>update(value,onChange,"exposureNoise",v)}
        />

        <Check
          label="Toz"
          checked={value.exposureDust}
          onChange={(v)=>update(value,onChange,"exposureDust",v)}
        />

        <Check
          label="Kimyasal"
          checked={value.exposureChemical}
          onChange={(v)=>update(value,onChange,"exposureChemical",v)}
        />

        <Check
          label="Biyolojik"
          checked={value.exposureBiological}
          onChange={(v)=>update(value,onChange,"exposureBiological",v)}
        />

        <Check
          label="Radyasyon"
          checked={value.exposureRadiation}
          onChange={(v)=>update(value,onChange,"exposureRadiation",v)}
        />

        <Check
          label="Titreşim"
          checked={value.exposureVibration}
          onChange={(v)=>update(value,onChange,"exposureVibration",v)}
        />

        <Check
          label="Ergonomi"
          checked={value.exposureErgonomic}
          onChange={(v)=>update(value,onChange,"exposureErgonomic",v)}
        />

        <Check
          label="Yüksekte Çalışma"
          checked={value.exposureHeight}
          onChange={(v)=>update(value,onChange,"exposureHeight",v)}
        />

        <Check
          label="Kapalı Alan"
          checked={value.exposureConfined}
          onChange={(v)=>update(value,onChange,"exposureConfined",v)}
        />

      </div>

      <Field label="KKD Kullanımı">
        <textarea
          style={textarea}
          value={value.ppeUsage}
          onChange={(e)=>
            update(value,onChange,"ppeUsage",e.target.value)
          }
        />
      </Field>

      <Field label="Geçirilmiş İş Kazaları">
        <textarea
          style={textarea}
          value={value.previousAccidents}
          onChange={(e)=>
            update(value,onChange,"previousAccidents",e.target.value)
          }
        />
      </Field>

      <Field label="Meslek Hastalığı Öyküsü">
        <textarea
          style={textarea}
          value={value.occupationalDisease}
          onChange={(e)=>
            update(value,onChange,"occupationalDisease",e.target.value)
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
  )
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
  )
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

const grid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
  gap:12,
};

const check:CSSProperties={
  display:"flex",
  alignItems:"center",
  gap:8,
};