"use client";

import type {
  ExecutiveTimelineItem,
} from "./types";

export default function ExecutiveTimeline({
  timeline,
}: {
  timeline: ExecutiveTimelineItem[];
}) {

  return (

    <section
      style={{
        padding:24,
        borderRadius:22,
        background:"#fff",
        border:"1px solid #e5e7eb",
      }}
    >

      <div
        style={{
          marginBottom:24,
        }}
      >

        <div
          style={{
            color:"#2563eb",
            fontWeight:900,
            fontSize:12,
            letterSpacing:1,
          }}
        >
          DORA AI
        </div>

        <h2
          style={{
            marginTop:6,
            fontSize:28,
            fontWeight:900,
            color:"#111827",
          }}
        >
          Executive Timeline
        </h2>

      </div>

      <div
        style={{
          position:"relative",
          display:"grid",
          gap:22,
        }}
      >

        {timeline.map((item,index)=>(

          <TimelineItem

            key={index}

            item={item}

            last={
              index===timeline.length-1
            }

          />

        ))}

      </div>

    </section>

  );

}

function TimelineItem({

  item,

  last,

}:{

  item:ExecutiveTimelineItem;

  last:boolean;

}){

  const color=

    item.targetDay<=7

      ?"#dc2626"

      :item.targetDay<=15

      ?"#ea580c"

      :item.targetDay<=30

      ?"#2563eb"

      :"#16a34a";

  return(

    <div
      style={{
        display:"grid",
        gridTemplateColumns:"60px 1fr",
        columnGap:18,
      }}
    >

      <div
        style={{
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
        }}
      >

        <div
          style={{
            width:22,
            height:22,
            borderRadius:"50%",
            background:color,
            zIndex:2,
          }}
        />

        {!last&&(

          <div
            style={{
              width:4,
              flex:1,
              background:"#dbeafe",
              minHeight:60,
            }}
          />

        )}

      </div>

      <div
        style={{
          padding:18,
          borderRadius:18,
          border:`2px solid ${color}`,
          background:"#f8fafc",
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
              color:"#111827",
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              padding:"6px 12px",
              borderRadius:999,
              background:color,
              color:"#fff",
              fontWeight:900,
            }}
          >
            {item.targetDay} Gün
          </div>

        </div>

        <div
          style={{
            marginTop:12,
            lineHeight:1.6,
            color:"#475569",
          }}
        >
          {item.description}
        </div>

      </div>

    </div>

  );

}