"use client";

import { useMemo } from "react";
import { Grid2x2, AlertTriangle } from "lucide-react";
import type { RiskRecord } from "../types";

type Props = {
  records: RiskRecord[];
  onCellClick?: (
    probability: number,
    severity: number,
    records: RiskRecord[]
  ) => void;
};

const COLORS = [
  "#dcfce7",
  "#bbf7d0",
  "#fef9c3",
  "#fed7aa",
  "#fecaca",
];

export default function HeatMapCard({
  records,
  onCellClick,
}: Props) {

  const matrix = useMemo(() => {

    const result: Record<
      string,
      RiskRecord[]
    > = {};

    records.forEach((r) => {

      const key =
        `${r.probability}_${r.severity}`;

      if (!result[key])
        result[key] = [];

      result[key].push(r);

    });

    return result;

  }, [records]);

  function getColor(score:number){

    if(score<=2) return COLORS[0];

    if(score<=5) return COLORS[1];

    if(score<=10) return COLORS[2];

    if(score<=15) return COLORS[3];

    return COLORS[4];

  }

  return (

    <section
      style={{
        background:"#fff",
        borderRadius:22,
        border:"1px solid #e5e7eb",
        padding:20,
        boxShadow:"0 12px 30px rgba(0,0,0,.05)"
      }}
    >

      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:18
        }}
      >

        <div>

          <div
            style={{
              display:"flex",
              alignItems:"center",
              gap:8,
              fontWeight:900,
              fontSize:18
            }}
          >
            <Grid2x2 size={18}/>
            5x5 Risk Isı Haritası
          </div>

          <div
            style={{
              color:"#64748b",
              fontSize:13,
              marginTop:4
            }}
          >
            Hücreye tıklayarak riskleri filtreleyebilirsiniz.
          </div>

        </div>

      </div>

      <div
        style={{
          overflowX:"auto"
        }}
      >

      <table
        style={{
          width:"100%",
          borderCollapse:"collapse"
        }}
      >

      <thead>

      <tr>

      <th></th>

      {[1,2,3,4,5].map(s=>(
        <th
        key={s}
        style={{
          padding:12,
          textAlign:"center",
          color:"#475569"
        }}
        >
          Ş:{s}
        </th>
      ))}

      </tr>

      </thead>

      <tbody>

      {[5,4,3,2,1].map(prob=>(

      <tr key={prob}>

      <td
      style={{
        padding:12,
        fontWeight:800
      }}
      >
      O:{prob}
      </td>

      {[1,2,3,4,5].map(sev=>{

        const key=`${prob}_${sev}`;

        const list=matrix[key]||[];

        return(

        <td
        key={key}
        onClick={()=>onCellClick?.(
          prob,
          sev,
          list
        )}
        style={{
          cursor:"pointer",
          textAlign:"center",
          padding:14,
          border:"1px solid #e5e7eb",
          background:getColor(prob*sev),
          fontWeight:900
        }}
        >

        {list.length}

        </td>

        );

      })}

      </tr>

      ))}

      </tbody>

      </table>

      </div>

      <div
      style={{
        marginTop:18,
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:10
      }}
      >

      {[
        ["Düşük",COLORS[0]],
        ["Kabul",COLORS[1]],
        ["Orta",COLORS[2]],
        ["Yüksek",COLORS[3]],
        ["Kritik",COLORS[4]]
      ].map(([t,c])=>(

      <div
      key={String(t)}
      style={{
        background:String(c),
        borderRadius:10,
        padding:10,
        textAlign:"center",
        fontWeight:700,
        fontSize:12
      }}
      >
      {t}
      </div>

      ))}

      </div>

      <div
      style={{
        marginTop:18,
        display:"flex",
        alignItems:"center",
        gap:8,
        color:"#b91c1c",
        fontWeight:700
      }}
      >

      <AlertTriangle size={18}/>

      Hücre seçildiğinde ilgili riskler otomatik filtrelenecek.

      </div>

    </section>

  );

}