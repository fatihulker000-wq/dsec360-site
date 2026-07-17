"use client";

import type {
  ExecutiveRecommendation,
} from "./types";

export default function ExecutiveRecommendationCard({
  recommendations,
}: {
  recommendations: ExecutiveRecommendation[];
}) {

  return (

    <section
      style={{
        padding:24,
        borderRadius:22,
        background:"#ffffff",
        border:"1px solid #e5e7eb",
        display:"grid",
        gap:18,
      }}
    >

      <div>

        <div
          style={{
            fontSize:12,
            color:"#2563eb",
            fontWeight:900,
            letterSpacing:1,
          }}
        >
          DORA AI
        </div>

        <h2
          style={{
            margin:"6px 0 0",
            fontSize:28,
            fontWeight:900,
            color:"#111827",
          }}
        >
          Öncelikli Aksiyonlar
        </h2>

      </div>

      {
        recommendations.length===0 &&

        <div
          style={{
            padding:20,
            borderRadius:16,
            background:"#ecfdf5",
            color:"#166534",
            fontWeight:700,
          }}
        >
          Kritik aksiyon bulunamadı.
        </div>

      }

      {
        recommendations.map((item,index)=>(

          <RecommendationItem

            key={item.id}

            order={index+1}

            recommendation={item}

          />

        ))
      }

    </section>

  );

}

function RecommendationItem({

  recommendation,

  order,

}:{

  recommendation:ExecutiveRecommendation;

  order:number;

}){

  const color=

    recommendation.priority==="CRITICAL"

      ?"#dc2626"

      :recommendation.priority==="HIGH"

      ?"#ea580c"

      :recommendation.priority==="MEDIUM"

      ?"#2563eb"

      :"#16a34a";

  return(

    <div

      style={{

        padding:18,

        borderRadius:18,

        border:`2px solid ${color}`,

        display:"grid",

        gap:10,

        background:"#fafafa",

      }}

    >

      <div

        style={{

          display:"flex",

          justifyContent:"space-between",

          alignItems:"center",

        }}

      >

        <div

          style={{

            fontWeight:900,

            fontSize:20,

            color,

          }}

        >

          #{order}

        </div>

        <div

          style={{

            padding:"6px 12px",

            borderRadius:999,

            background:color,

            color:"#fff",

            fontWeight:900,

            fontSize:12,

          }}

        >

          {recommendation.priority}

        </div>

      </div>

      <div

        style={{

          fontSize:22,

          fontWeight:900,

          color:"#111827",

        }}

      >

        {recommendation.title}

      </div>

      <div

        style={{

          color:"#475569",

          lineHeight:1.6,

        }}

      >

        {recommendation.description}

      </div>

      <div

        style={{

          display:"flex",

          justifyContent:"space-between",

          alignItems:"center",

          marginTop:8,

        }}

      >

        <span

          style={{

            color:"#64748b",

            fontWeight:700,

          }}

        >

          Hedef Süre

        </span>

        <strong

          style={{

            color,

            fontSize:20,

          }}

        >

          {recommendation.dueDays} Gün

        </strong>

      </div>

    </div>

  );

}