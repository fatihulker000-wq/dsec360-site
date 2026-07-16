"use client";

import { IncidentAuditLog } from "./types";

interface Props {
  logs: IncidentAuditLog[];
}

export default function IncidentAuditTable({
  logs,
}: Props) {

  return (

    <section
      style={{
        background:"#fff",
        borderRadius:20,
        border:"1px solid #e5e7eb",
        overflow:"hidden",
      }}
    >

      <div
        style={{
          padding:22,
          borderBottom:"1px solid #e5e7eb",
        }}
      >

        <div
          style={{
            fontSize:12,
            color:"#64748b",
            fontWeight:900,
          }}
        >
          AUDIT LOGS
        </div>

        <h2
          style={{
            marginTop:6,
            fontSize:24,
            fontWeight:900,
          }}
        >
          Audit Kayıtları
        </h2>

      </div>

      <div
        style={{
          overflowX:"auto",
        }}
      >

        <table
          style={{
            width:"100%",
            borderCollapse:"collapse",
            minWidth:1200,
          }}
        >

          <thead>

          <tr>

            <Head>Tarih</Head>

            <Head>Olay</Head>

            <Head>İşlem</Head>

            <Head>Modül</Head>

            <Head>Kullanıcı</Head>

            <Head>Durum</Head>

            <Head>Önem</Head>

            <Head>Açıklama</Head>

          </tr>

          </thead>

          <tbody>

          {logs.map(log=>(

            <tr key={log.id}>

              <Cell>
                {format(log.createdAt)}
              </Cell>

              <Cell>
                {log.incidentNo ?? "-"}
              </Cell>

              <Cell>
                {log.title}
              </Cell>

              <Cell>
                {log.module}
              </Cell>

              <Cell>
                {log.userName}
              </Cell>

              <Cell>

                <Badge
                  color={statusColor(log.status)}
                >
                  {log.status}
                </Badge>

              </Cell>

              <Cell>

                <Badge
                  color={severityColor(log.severity)}
                >
                  {log.severity}
                </Badge>

              </Cell>

              <Cell>
                {log.description}
              </Cell>

            </tr>

          ))}

          </tbody>

        </table>

      </div>

    </section>

  )

}

function Head({children}:any){

  return(

    <th
      style={{
        textAlign:"left",
        padding:14,
        background:"#f8fafc",
        borderBottom:"1px solid #e5e7eb",
      }}
    >
      {children}
    </th>

  )

}

function Cell({children}:any){

  return(

    <td
      style={{
        padding:14,
        borderBottom:"1px solid #f1f5f9",
        verticalAlign:"top",
      }}
    >
      {children}
    </td>

  )

}

function Badge({

  children,

  color,

}:any){

  return(

    <span
      style={{
        padding:"5px 10px",
        borderRadius:999,
        color:"#fff",
        background:color,
        fontSize:12,
        fontWeight:700,
      }}
    >
      {children}
    </span>

  )

}

function statusColor(status:string){

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

function severityColor(level:string){

  switch(level){

    case "CRITICAL":

      return "#dc2626";

    case "HIGH":

      return "#ea580c";

    case "MEDIUM":

      return "#2563eb";

    default:

      return "#64748b";

  }

}

function format(date:string){

  return new Date(date)
    .toLocaleString("tr-TR");

}