"use client";

import { IncidentWorkflowResult } from "./types";

interface Props {
  workflow: IncidentWorkflowResult;
}

export default function WorkflowDashboard({
  workflow,
}: Props) {
  return (
    <section
      style={{
        display: "grid",
        gap: 22,
      }}
    >
      <header
        style={{
          borderRadius: 22,
          padding: 24,
          color: "#fff",
          background:
            "linear-gradient(135deg,#0f172a 0%,#7a0017 100%)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            opacity: .85,
            letterSpacing: 1,
          }}
        >
          D-SEC WORKFLOW CENTER
        </div>

        <h2
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          Incident Workflow Engine
        </h2>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <HeroCard
            title="Workflow"
            value={workflow.workflowId.substring(0,8)}
          />

          <HeroCard
            title="Durum"
            value={workflow.status}
          />

          <HeroCard
            title="İlerleme"
            value={`%${workflow.progress}`}
          />

          <HeroCard
            title="Toplam Adım"
            value={workflow.steps.length}
          />
        </div>
      </header>

      <div
        style={{
          display:"grid",
          gap:18,
        }}
      >
        {workflow.steps.map((step,index)=>(
          <WorkflowCard
            key={step.id}
            index={index+1}
            step={step}
          />
        ))}
      </div>

    </section>
  );
}

function WorkflowCard({

    step,

    index,

}:{

    step:any,

    index:number,

}){

    return(

        <article
            style={{
                borderRadius:18,
                background:"#fff",
                border:"1px solid #e5e7eb",
                padding:20,
                display:"grid",
                gridTemplateColumns:"70px 1fr auto",
                gap:20,
                alignItems:"center",
            }}
        >

            <div
                style={{
                    width:52,
                    height:52,
                    borderRadius:"50%",
                    background:getColor(step.status),
                    color:"#fff",
                    display:"grid",
                    placeItems:"center",
                    fontWeight:900,
                    fontSize:20,
                }}
            >
                {index}
            </div>

            <div>

                <div
                    style={{
                        fontSize:19,
                        fontWeight:900,
                    }}
                >
                    {step.title}
                </div>

                <div
                    style={{
                        marginTop:6,
                        color:"#64748b",
                        lineHeight:1.7,
                    }}
                >
                    {step.description}
                </div>

                <div
                    style={{
                        marginTop:10,
                        display:"flex",
                        gap:8,
                        flexWrap:"wrap",
                    }}
                >

                    <Tag value={step.type}/>

                    <Tag value={step.priority}/>

                    <Tag value={step.status}/>

                </div>

            </div>

            <div
                style={{
                    textAlign:"right",
                }}
            >

                <div
                    style={{
                        color:"#64748b",
                        fontSize:12,
                    }}
                >
                    Başlangıç
                </div>

                <div
                    style={{
                        fontWeight:700,
                        marginBottom:10,
                    }}
                >
                    {format(step.startedAt)}
                </div>

                <div
                    style={{
                        color:"#64748b",
                        fontSize:12,
                    }}
                >
                    Bitiş
                </div>

                <div
                    style={{
                        fontWeight:700,
                    }}
                >
                    {format(step.completedAt)}
                </div>

            </div>

        </article>

    )

}

function HeroCard({

    title,

    value,

}:{

    title:string,

    value:string|number,

}){

    return(

        <div
            style={{
                minWidth:160,
                padding:18,
                borderRadius:16,
                background:"rgba(255,255,255,.12)",
            }}
        >

            <div
                style={{
                    fontSize:12,
                    opacity:.8,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    marginTop:8,
                    fontSize:28,
                    fontWeight:900,
                }}
            >
                {value}
            </div>

        </div>

    )

}

function Tag({

    value,

}:{

    value:string,

}){

    return(

        <span
            style={{
                padding:"4px 10px",
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

function getColor(status:string){

    switch(status){

        case "COMPLETED":

            return "#16a34a";

        case "FAILED":

            return "#dc2626";

        case "RUNNING":

            return "#2563eb";

        case "SKIPPED":

            return "#94a3b8";

        default:

            return "#ca8a04";

    }

}

function format(date?:string){

    if(!date) return "-";

    return new Date(date).toLocaleString("tr-TR");

}