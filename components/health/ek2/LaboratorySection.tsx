"use client";

import { CSSProperties } from "react";

export type LaboratorySectionModel = {
  hemogram: string;
  biochemistry: string;
  urine: string;

  paLung: string;
  audiometry: string;
  sft: string;

  vision: string;
  ekg: string;
  vaccination: string;

  other: string;
};

type Props = {
  value: LaboratorySectionModel;
  onChange: (v: LaboratorySectionModel) => void;
};

function setValue(
  value: LaboratorySectionModel,
  onChange: (v: LaboratorySectionModel) => void,
  key: keyof LaboratorySectionModel,
  data: string
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function LaboratorySection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        LABORATUVAR / TETKİKLER
      </h2>

      <table style={table}>

        <thead>

          <tr>

            <th style={thLeft}>Tetkik</th>

            <th style={thResult}>Sonuç</th>

            <th style={thComment}>Değerlendirme</th>

          </tr>

        </thead>

        <tbody>

          <Row
            title="Hemogram"
            value={value.hemogram}
            onChange={(v)=>
              setValue(value,onChange,"hemogram",v)
            }
          />

          <Row
            title="Biyokimya"
            value={value.biochemistry}
            onChange={(v)=>
              setValue(value,onChange,"biochemistry",v)
            }
          />

          <Row
            title="Tam İdrar"
            value={value.urine}
            onChange={(v)=>
              setValue(value,onChange,"urine",v)
            }
          />

          <Row
            title="PA Akciğer Grafisi"
            value={value.paLung}
            onChange={(v)=>
              setValue(value,onChange,"paLung",v)
            }
          />

          <Row
            title="Odyometri"
            value={value.audiometry}
            onChange={(v)=>
              setValue(value,onChange,"audiometry",v)
            }
          />

          <Row
            title="SFT"
            value={value.sft}
            onChange={(v)=>
              setValue(value,onChange,"sft",v)
            }
          />

          <Row
            title="Görme Testi"
            value={value.vision}
            onChange={(v)=>
              setValue(value,onChange,"vision",v)
            }
          />

          <Row
            title="EKG"
            value={value.ekg}
            onChange={(v)=>
              setValue(value,onChange,"ekg",v)
            }
          />

          <Row
            title="Aşı Durumu"
            value={value.vaccination}
            onChange={(v)=>
              setValue(value,onChange,"vaccination",v)
            }
          />

          <Row
            title="Diğer Tetkikler"
            value={value.other}
            onChange={(v)=>
              setValue(value,onChange,"other",v)
            }
          />

        </tbody>

      </table>

    </section>
  );
}

function Row({
  title,
  value,
  onChange,
}:{
  title:string;
  value:string;
  onChange:(v:string)=>void;
}){

  return(

    <tr>

      <td style={tdTitle}>
        {title}
      </td>

      <td style={tdInput}>

        <textarea
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          style={textarea}
        />

      </td>

      <td style={tdComment}>
        <textarea
          placeholder="Normal / Patolojik / Açıklama..."
          style={textarea}
        />
      </td>

    </tr>

  );

}

const card:CSSProperties={
  background:"#fff",
  border:"1px solid #d1d5db",
  borderRadius:18,
  padding:24,
};

const title:CSSProperties={
  marginTop:0,
  marginBottom:18,
  fontSize:24,
  fontWeight:900,
};

const table:CSSProperties={
  width:"100%",
  borderCollapse:"collapse",
};

const thLeft:CSSProperties={
  border:"1px solid #94a3b8",
  background:"#f1f5f9",
  padding:10,
  width:240,
  fontWeight:900,
};

const thResult:CSSProperties={
  border:"1px solid #94a3b8",
  background:"#f1f5f9",
  padding:10,
  width:320,
  fontWeight:900,
};

const thComment:CSSProperties={
  border:"1px solid #94a3b8",
  background:"#f1f5f9",
  padding:10,
  fontWeight:900,
};

const tdTitle:CSSProperties={
  border:"1px solid #cbd5e1",
  padding:10,
  fontWeight:800,
  verticalAlign:"top",
};

const tdInput:CSSProperties={
  border:"1px solid #cbd5e1",
  padding:8,
};

const tdComment:CSSProperties={
  border:"1px solid #cbd5e1",
  padding:8,
};

const textarea:CSSProperties={
  width:"100%",
  minHeight:70,
  resize:"vertical",
  border:"1px solid #d1d5db",
  borderRadius:8,
  padding:8,
};