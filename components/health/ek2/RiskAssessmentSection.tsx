"use client";

import { CSSProperties } from "react";

export type RiskAssessmentModel = {
  physicalRisks: string;
  chemicalRisks: string;
  biologicalRisks: string;
  ergonomicRisks: string;
  psychosocialRisks: string;

  ppeRequired: string;

  workRestrictions: string;

  periodicControl: string;

  recommendation: string;

  doctorDecision:
    | "Çalışabilir"
    | "Şartlı Çalışabilir"
    | "Çalışamaz";

  doraRiskScore: number;
};

type Props = {
  value: RiskAssessmentModel;
  onChange: (v: RiskAssessmentModel) => void;
};

function update(
  value: RiskAssessmentModel,
  onChange: (v: RiskAssessmentModel) => void,
  key: keyof RiskAssessmentModel,
  data: any
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function RiskAssessmentSection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        MESLEKİ RİSK DEĞERLENDİRMESİ
      </h2>

      <Field label="Fiziksel Riskler">
        <textarea
          value={value.physicalRisks}
          onChange={(e)=>
            update(value,onChange,"physicalRisks",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Kimyasal Riskler">
        <textarea
          value={value.chemicalRisks}
          onChange={(e)=>
            update(value,onChange,"chemicalRisks",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Biyolojik Riskler">
        <textarea
          value={value.biologicalRisks}
          onChange={(e)=>
            update(value,onChange,"biologicalRisks",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Ergonomik Riskler">
        <textarea
          value={value.ergonomicRisks}
          onChange={(e)=>
            update(value,onChange,"ergonomicRisks",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Psikososyal Riskler">
        <textarea
          value={value.psychosocialRisks}
          onChange={(e)=>
            update(value,onChange,"psychosocialRisks",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Kullanılması Gereken KKD">
        <textarea
          value={value.ppeRequired}
          onChange={(e)=>
            update(value,onChange,"ppeRequired",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Çalışma Kısıtlamaları">
        <textarea
          value={value.workRestrictions}
          onChange={(e)=>
            update(value,onChange,"workRestrictions",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="Periyodik Kontrol / İzlem">
        <textarea
          value={value.periodicControl}
          onChange={(e)=>
            update(value,onChange,"periodicControl",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <Field label="İşyeri Hekimi Önerileri">
        <textarea
          value={value.recommendation}
          onChange={(e)=>
            update(value,onChange,"recommendation",e.target.value)
          }
          style={textarea}
        />
      </Field>

      <h3 style={subTitle}>
        İŞE UYGUNLUK KARARI
      </h3>

      <div style={decisionGrid}>

        {[
          "Çalışabilir",
          "Şartlı Çalışabilir",
          "Çalışamaz",
        ].map((item)=>(
          <label
            key={item}
            style={{
              ...decisionCard,
              borderColor:
                value.doctorDecision===item
                  ? "#7f1d1d"
                  : "#d1d5db",
            }}
          >

            <input
              type="radio"
              checked={value.doctorDecision===item}
              onChange={()=>
                update(
                  value,
                  onChange,
                  "doctorDecision",
                  item
                )
              }
            />

            <strong>{item}</strong>

          </label>
        ))}

      </div>

      <div style={doraCard}>

        <div>

          <div style={doraTitle}>
            DORA Risk Analizi
          </div>

          <div style={doraDesc}>
            Yapay zeka destekli ön değerlendirme
          </div>

        </div>

        <div style={scoreBox}>
          {value.doraRiskScore}
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

const subTitle:CSSProperties={
  color:"#7f1d1d",
  marginBottom:0,
};

const textarea:CSSProperties={
  width:"100%",
  minHeight:90,
  resize:"vertical",
  border:"1px solid #d1d5db",
  borderRadius:10,
  padding:10,
};

const decisionGrid:CSSProperties={
  display:"grid",
  gridTemplateColumns:"repeat(3,1fr)",
  gap:14,
};

const decisionCard:CSSProperties={
  display:"flex",
  alignItems:"center",
  gap:10,
  border:"2px solid",
  borderRadius:14,
  padding:16,
};

const doraCard:CSSProperties={
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  background:"#f8fafc",
  border:"1px solid #d1d5db",
  borderRadius:16,
  padding:20,
};

const doraTitle:CSSProperties={
  fontWeight:900,
  fontSize:18,
};

const doraDesc:CSSProperties={
  color:"#64748b",
};

const scoreBox:CSSProperties={
  width:90,
  height:90,
  borderRadius:18,
  background:"#7f1d1d",
  color:"#fff",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontWeight:900,
  fontSize:34,
};