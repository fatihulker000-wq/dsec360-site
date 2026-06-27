"use client";

import { CSSProperties } from "react";

export type SystemExamination = {
  generalAppearance: string;

  headNeck: string;
  eye: string;
  ear: string;
  nose: string;
  throat: string;

  mouthTeeth: string;

  respiratory: string;
  cardiovascular: string;

  digestive: string;

  genitourinary: string;

  musculoskeletal: string;

  neurological: string;

  skin: string;

  psychiatric: string;

  lymphNodes: string;

  other: string;
};

type Props = {
  value: SystemExamination;
  onChange: (value: SystemExamination) => void;
};

function setValue(
  value: SystemExamination,
  onChange: (v: SystemExamination) => void,
  key: keyof SystemExamination,
  data: string
) {
  onChange({
    ...value,
    [key]: data,
  });
}

export default function SystemExaminationTable({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        SİSTEM MUAYENESİ
      </h2>

      <table style={table}>

        <thead>

          <tr>

            <th style={th}>Muayene Alanı</th>

            <th style={th}>Normal</th>

            <th style={th}>Patolojik Bulgular</th>

          </tr>

        </thead>

        <tbody>

          <Row
            title="Genel Görünüm"
            value={value.generalAppearance}
            onChange={(v)=>
              setValue(value,onChange,"generalAppearance",v)
            }
          />

          <Row
            title="Baş / Boyun"
            value={value.headNeck}
            onChange={(v)=>
              setValue(value,onChange,"headNeck",v)
            }
          />

          <Row
            title="Göz"
            value={value.eye}
            onChange={(v)=>
              setValue(value,onChange,"eye",v)
            }
          />

          <Row
            title="Kulak"
            value={value.ear}
            onChange={(v)=>
              setValue(value,onChange,"ear",v)
            }
          />

          <Row
            title="Burun"
            value={value.nose}
            onChange={(v)=>
              setValue(value,onChange,"nose",v)
            }
          />

          <Row
            title="Boğaz"
            value={value.throat}
            onChange={(v)=>
              setValue(value,onChange,"throat",v)
            }
          />

          <Row
            title="Ağız / Diş"
            value={value.mouthTeeth}
            onChange={(v)=>
              setValue(value,onChange,"mouthTeeth",v)
            }
          />

          <Row
            title="Solunum Sistemi"
            value={value.respiratory}
            onChange={(v)=>
              setValue(value,onChange,"respiratory",v)
            }
          />

          <Row
            title="Kardiyovasküler Sistem"
            value={value.cardiovascular}
            onChange={(v)=>
              setValue(value,onChange,"cardiovascular",v)
            }
          />

          <Row
            title="Sindirim Sistemi"
            value={value.digestive}
            onChange={(v)=>
              setValue(value,onChange,"digestive",v)
            }
          />

          <Row
            title="Genitoüriner Sistem"
            value={value.genitourinary}
            onChange={(v)=>
              setValue(value,onChange,"genitourinary",v)
            }
          />

          <Row
            title="Kas İskelet Sistemi"
            value={value.musculoskeletal}
            onChange={(v)=>
              setValue(value,onChange,"musculoskeletal",v)
            }
          />

          <Row
            title="Nörolojik Sistem"
            value={value.neurological}
            onChange={(v)=>
              setValue(value,onChange,"neurological",v)
            }
          />

          <Row
            title="Deri"
            value={value.skin}
            onChange={(v)=>
              setValue(value,onChange,"skin",v)
            }
          />

          <Row
            title="Psikiyatrik"
            value={value.psychiatric}
            onChange={(v)=>
              setValue(value,onChange,"psychiatric",v)
            }
          />

          <Row
            title="Lenf Bezleri"
            value={value.lymphNodes}
            onChange={(v)=>
              setValue(value,onChange,"lymphNodes",v)
            }
          />

          <Row
            title="Diğer"
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

      <td style={tdCenter}>
        ☑️
      </td>

      <td style={tdInput}>

        <textarea
          value={value}
          onChange={(e)=>onChange(e.target.value)}
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

const th:CSSProperties={
  border:"1px solid #94a3b8",
  background:"#f1f5f9",
  padding:10,
  fontWeight:900,
};

const tdTitle:CSSProperties={
  border:"1px solid #cbd5e1",
  padding:10,
  width:240,
  fontWeight:800,
};

const tdCenter:CSSProperties={
  border:"1px solid #cbd5e1",
  width:80,
  textAlign:"center",
  fontSize:22,
};

const tdInput:CSSProperties={
  border:"1px solid #cbd5e1",
  padding:8,
};

const textarea:CSSProperties={
  width:"100%",
  minHeight:55,
  resize:"vertical",
  border:"1px solid #d1d5db",
  borderRadius:8,
  padding:8,
};