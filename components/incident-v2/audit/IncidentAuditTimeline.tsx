"use client";

import { IncidentAuditLog } from "./types";

interface Props {
  logs: IncidentAuditLog[];
}

export default function IncidentAuditTimeline({
  logs,
}: Props) {

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 24,
      }}
    >
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          INCIDENT TIMELINE
        </div>

        <h2
          style={{
            marginTop: 8,
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          İşlem Zaman Çizelgesi
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gap: 22,
        }}
      >
        {sorted.map((log, index) => (
          <TimelineCard
            key={log.id}
            log={log}
            last={index === sorted.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineCard({

  log,

  last,

}:{

  log:IncidentAuditLog;

  last:boolean;

}){

  return(

    <div
      style={{
        display:"grid",
        gridTemplateColumns:"70px 1fr",
        gap:18,
      }}
    >

      <div
        style={{
          display:"flex",
          justifyContent:"center",
          position:"relative",
        }}
      >

        {!last && (

          <div
            style={{
              position:"absolute",
              width:3,
              background:"#dbeafe",
              top:54,
              bottom:-24,
            }}
          />

        )}

        <div
          style={{
            width:46,
            height:46,
            borderRadius:"50%",
            display:"grid",
            placeItems:"center",
            background:getColor(log.status),
            color:"#fff",
            fontWeight:900,
            fontSize:18,
          }}
        >
          {icon(log.status)}
        </div>

      </div>

      <article
        style={{
          background:"#fff",
          border:"1px solid #e5e7eb",
          borderRadius:18,
          padding:18,
        }}
      >

        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            gap:18,
            flexWrap:"wrap",
          }}
        >

          <div>

            <h3
              style={{
                margin:0,
                fontWeight:900,
                fontSize:18,
              }}
            >
              {log.title}
            </h3>

            <div
              style={{
                marginTop:6,
                color:"#64748b",
                lineHeight:1.7,
              }}
            >
              {log.description}
            </div>

          </div>

          <StatusChip
            status={log.status}
          />

        </div>

        <div
          style={{
            display:"flex",
            gap:8,
            flexWrap:"wrap",
            marginTop:16,
          }}
        >

          <Chip value={log.module}/>

          <Chip value={log.action}/>

          <Chip value={log.severity}/>

        </div>

        <div
          style={{
            display:"grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap:12,
            marginTop:18,
          }}
        >

          <Info
            title="Kullanıcı"
            value={log.userName}
          />

          <Info
            title="Tarih"
            value={format(log.createdAt)}
          />

          <Info
            title="Firma"
            value={log.companyName ?? "-"}
          />

          <Info
            title="Olay"
            value={log.incidentNo ?? "-"}
          />

        </div>

      </article>

    </div>

  )

}

function Chip({

  value,

}:{

  value:string;

}){

  return(

    <span
      style={{
        padding:"5px 11px",
        borderRadius:999,
        background:"#f1f5f9",
        fontSize:12,
        fontWeight:700,
      }}
    >
      {value}
    </span>

  )

}

function StatusChip({

  status,

}:{

  status:string;

}){

  return(

    <span
      style={{
        padding:"7px 14px",
        borderRadius:999,
        background:getBackground(status),
        color:getColor(status),
        fontWeight:900,
        fontSize:12,
      }}
    >
      {status}
    </span>

  )

}

function Info({

  title,

  value,

}:{

  title:string;

  value:string;

}){

  return(

    <div
      style={{
        background:"#f8fafc",
        borderRadius:12,
        padding:12,
      }}
    >

      <div
        style={{
          fontSize:11,
          color:"#64748b",
          fontWeight:800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:5,
          fontWeight:700,
        }}
      >
        {value}
      </div>

    </div>

  )

}

function format(date:string){

  return new Date(date)
    .toLocaleString("tr-TR");

}

function icon(status:string){

  switch(status){

    case "SUCCESS":

      return "✓";

    case "FAILED":

      return "✕";

    case "WARNING":

      return "!";

    default:

      return "•";

  }

}

function getColor(status:string){

  switch(status){

    case "SUCCESS":

      return "#16a34a";

    case "FAILED":

      return "#dc2626";

    case "WARNING":

      return "#ca8a04";

    default:

      return "#2563eb";

  }

}

function getBackground(status:string){

  switch(status){

    case "SUCCESS":

      return "#dcfce7";

    case "FAILED":

      return "#fee2e2";

    case "WARNING":

      return "#fef3c7";

    default:

      return "#dbeafe";

  }

}