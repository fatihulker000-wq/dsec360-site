"use client";

import { CSSProperties, useMemo } from "react";

export type VitalSigns = {
  height: string;
  weight: string;

  systolic: string;
  diastolic: string;

  pulse: string;
  respiration: string;

  temperature: string;
  spo2: string;

  waist: string;

  bmi: string;
};

type Props = {
  value: VitalSigns;
  onChange: (value: VitalSigns) => void;
};

function update(
  value: VitalSigns,
  onChange: (v: VitalSigns) => void,
  key: keyof VitalSigns,
  data: string
) {
  const next = {
    ...value,
    [key]: data,
  };

  const h = Number(next.height) / 100;
  const w = Number(next.weight);

  if (h > 0 && w > 0) {
    next.bmi = (w / (h * h)).toFixed(1);
  } else {
    next.bmi = "";
  }

  onChange(next);
}

export default function VitalSignsCard({
  value,
  onChange,
}: Props) {

  const warnings = useMemo(() => {

    const list: string[] = [];

    if (Number(value.bmi) >= 30)
      list.push("BMI obezite sınırında.");

    if (
      Number(value.systolic) >= 140 ||
      Number(value.diastolic) >= 90
    )
      list.push("Hipertansiyon şüphesi.");

    if (
      Number(value.temperature) >= 38
    )
      list.push("Ateş yüksek.");

    if (
      Number(value.spo2) > 0 &&
      Number(value.spo2) < 92
    )
      list.push("SpO₂ düşük.");

    if (
      Number(value.pulse) > 120
    )
      list.push("Taşikardi.");

    if (
      Number(value.pulse) > 0 &&
      Number(value.pulse) < 50
    )
      list.push("Bradikardi.");

    return list;

  }, [value]);

  return (

    <section style={card}>

      <h2 style={title}>
        VİTAL BULGULAR
      </h2>

      <div style={grid}>

        <Input
          label="Boy (cm)"
          value={value.height}
          onChange={(v)=>
            update(value,onChange,"height",v)
          }
        />

        <Input
          label="Kilo (kg)"
          value={value.weight}
          onChange={(v)=>
            update(value,onChange,"weight",v)
          }
        />

        <ReadOnly
          label="BMI"
          value={value.bmi}
        />

        <Input
          label="Bel Çevresi"
          value={value.waist}
          onChange={(v)=>
            update(value,onChange,"waist",v)
          }
        />

        <Input
          label="TA Sistolik"
          value={value.systolic}
          onChange={(v)=>
            update(value,onChange,"systolic",v)
          }
        />

        <Input
          label="TA Diyastolik"
          value={value.diastolic}
          onChange={(v)=>
            update(value,onChange,"diastolic",v)
          }
        />

        <Input
          label="Nabız"
          value={value.pulse}
          onChange={(v)=>
            update(value,onChange,"pulse",v)
          }
        />

        <Input
          label="Solunum"
          value={value.respiration}
          onChange={(v)=>
            update(value,onChange,"respiration",v)
          }
        />

        <Input
          label="Ateş"
          value={value.temperature}
          onChange={(v)=>
            update(value,onChange,"temperature",v)
          }
        />

        <Input
          label="SpO₂"
          value={value.spo2}
          onChange={(v)=>
            update(value,onChange,"spo2",v)
          }
        />

      </div>

      {warnings.length > 0 && (

        <div style={warning}>

          <strong>
            DORA Ön Uyarıları
          </strong>

          <div
            style={{
              marginTop:10,
              display:"grid",
              gap:8,
            }}
          >

            {warnings.map((item,index)=>(
              <div key={index}>
                ⚠️ {item}
              </div>
            ))}

          </div>

        </div>

      )}

    </section>

  );

}

function Input({
  label,
  value,
  onChange,
}:{
  label:string;
  value:string;
  onChange:(v:string)=>void;
}){

  return(

    <label style={field}>

      <span style={labelStyle}>
        {label}
      </span>

      <input
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        style={input}
      />

    </label>

  );

}

function ReadOnly({
  label,
  value,
}:{
  label:string;
  value:string;
}){

  return(

    <div>

      <div style={labelStyle}>
        {label}
      </div>

      <div style={readonly}>
        {value || "-"}
      </div>

    </div>

  );

}

const card:CSSProperties={
  background:"#fff",
  border:"1px solid #e5e7eb",
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

const grid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
  gap:18,
};

const field:CSSProperties={
  display:"grid",
  gap:6,
};

const labelStyle:CSSProperties={
  fontWeight:800,
  color:"#64748b",
};

const input:CSSProperties={
  height:44,
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:"0 12px",
};

const readonly:CSSProperties={
  height:44,
  border:"1px solid #e5e7eb",
  borderRadius:10,
  background:"#f8fafc",
  display:"flex",
  alignItems:"center",
  padding:"0 12px",
  fontWeight:900,
};

const warning:CSSProperties={
  background:"#fff7ed",
  border:"1px solid #fdba74",
  borderRadius:14,
  padding:16,
  color:"#9a3412",
};