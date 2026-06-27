"use client";

import { CSSProperties } from "react";

export type VisionModel = {
  testDate: string;

  rightFar: string;
  leftFar: string;

  rightNear: string;
  leftNear: string;

  colorVision: string;
  depthVision: string;

  glasses: boolean;

  result:
    | ""
    | "Normal"
    | "Takip Gerekli"
    | "Uygun Değil";

  note: string;
};

type Props = {
  value: VisionModel;
  onChange: (value: VisionModel) => void;
};

function setField(
  model: VisionModel,
  onChange: (v: VisionModel) => void,
  key: keyof VisionModel,
  value: any
) {
  onChange({
    ...model,
    [key]: value,
  });
}

export default function VisionSection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        GÖRME MUAYENESİ
      </h2>

      <div style={grid}>

        <Field label="Test Tarihi">

          <input
            type="date"
            value={value.testDate}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "testDate",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

        <Field label="Sonuç">

          <select
            value={value.result}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "result",
                e.target.value
              )
            }
            style={input}
          >
            <option value="">Seçiniz</option>
            <option>Normal</option>
            <option>Takip Gerekli</option>
            <option>Uygun Değil</option>
          </select>

        </Field>

      </div>

      <table style={table}>

        <thead>

          <tr>

            <th style={th}></th>
            <th style={th}>Sağ</th>
            <th style={th}>Sol</th>

          </tr>

        </thead>

        <tbody>

          <VisionRow
            title="Uzak Görme"
            right={value.rightFar}
            left={value.leftFar}
            onRight={(v) =>
              setField(value, onChange, "rightFar", v)
            }
            onLeft={(v) =>
              setField(value, onChange, "leftFar", v)
            }
          />

          <VisionRow
            title="Yakın Görme"
            right={value.rightNear}
            left={value.leftNear}
            onRight={(v) =>
              setField(value, onChange, "rightNear", v)
            }
            onLeft={(v) =>
              setField(value, onChange, "leftNear", v)
            }
          />

        </tbody>

      </table>

      <div style={grid}>

        <Field label="Renk Körlüğü">

          <input
            value={value.colorVision}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "colorVision",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

        <Field label="Derinlik Algısı">

          <input
            value={value.depthVision}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "depthVision",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

      </div>

      <label style={checkboxRow}>

        <input
          type="checkbox"
          checked={value.glasses}
          onChange={(e) =>
            setField(
              value,
              onChange,
              "glasses",
              e.target.checked
            )
          }
        />

        Gözlük Kullanıyor

      </label>

      <Field label="Hekim Değerlendirmesi">

        <textarea
          value={value.note}
          onChange={(e) =>
            setField(
              value,
              onChange,
              "note",
              e.target.value
            )
          }
          style={textarea}
          placeholder="Görme değerlendirmesi..."
        />

      </Field>

    </section>
  );
}

function VisionRow({
  title,
  right,
  left,
  onRight,
  onLeft,
}:{
  title:string;
  right:string;
  left:string;
  onRight:(v:string)=>void;
  onLeft:(v:string)=>void;
}){

  return(

<tr>

<td style={tdTitle}>{title}</td>

<td style={td}>
<input
style={cellInput}
value={right}
onChange={(e)=>onRight(e.target.value)}
/>
</td>

<td style={td}>
<input
style={cellInput}
value={left}
onChange={(e)=>onLeft(e.target.value)}
/>
</td>

</tr>

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

<label style={field}>

<span style={labelStyle}>{label}</span>

{children}

</label>

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

const grid:CSSProperties={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:14,
};

const field:CSSProperties={
display:"grid",
gap:6,
};

const labelStyle:CSSProperties={
fontSize:13,
fontWeight:900,
color:"#64748b",
};

const input:CSSProperties={
height:44,
border:"1px solid #d1d5db",
borderRadius:10,
padding:"0 12px",
};

const table:CSSProperties={
width:"100%",
borderCollapse:"collapse",
};

const th:CSSProperties={
border:"1px solid #cbd5e1",
padding:10,
background:"#f8fafc",
};

const tdTitle:CSSProperties={
border:"1px solid #cbd5e1",
padding:10,
background:"#f8fafc",
fontWeight:900,
};

const td:CSSProperties={
border:"1px solid #cbd5e1",
padding:8,
};

const cellInput:CSSProperties={
width:"100%",
height:38,
border:"1px solid #d1d5db",
borderRadius:8,
padding:"0 10px",
};

const checkboxRow:CSSProperties={
display:"flex",
alignItems:"center",
gap:10,
fontWeight:700,
};

const textarea:CSSProperties={
minHeight:120,
border:"1px solid #d1d5db",
borderRadius:10,
padding:10,
resize:"vertical",
};