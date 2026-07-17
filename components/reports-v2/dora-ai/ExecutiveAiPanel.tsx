"use client";

import ExecutiveScoreCard from "./ExecutiveScoreCard";
import ExecutiveRecommendationCard from "./ExecutiveRecommendationCard";
import ExecutivePredictionCard from "./ExecutivePredictionCard";
import ExecutiveTimeline from "./ExecutiveTimeline";

import type {
    ExecutiveSummary,
} from "./types";

export default function ExecutiveAiPanel({

    summary,

}:{

    summary: ExecutiveSummary;

}){

    return(

        <main

            style={{

                display:"grid",

                gap:24,

            }}

        >

            {/* HERO */}

            <ExecutiveScoreCard

                summary={summary}

            />

            {/* SUMMARY */}

            <section

                style={{

                    padding:24,

                    borderRadius:22,

                    background:"#ffffff",

                    border:"1px solid #e5e7eb",

                }}

            >

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

                        marginTop:8,

                        fontSize:28,

                        fontWeight:900,

                    }}

                >

                    Executive Summary

                </h2>

                <div

                    style={{

                        marginTop:20,

                        whiteSpace:"pre-wrap",

                        lineHeight:1.9,

                        color:"#334155",

                        fontSize:16,

                    }}

                >

                    {summary.executiveText}

                </div>

            </section>

            {/* GRID */}

            <section

                style={{

                    display:"grid",

                    gridTemplateColumns:

                        "repeat(auto-fit,minmax(500px,1fr))",

                    gap:24,

                }}

            >

                <ExecutiveRecommendationCard

                    recommendations={

                        summary.recommendations

                    }

                />

                <ExecutivePredictionCard

                    predictions={

                        summary.predictions

                    }

                />

            </section>

            {/* TIMELINE */}

            <ExecutiveTimeline

                timeline={

                    summary.timeline

                }

            />

            {/* MODULE SCORE */}

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

                        marginTop:6,

                        fontSize:28,

                        fontWeight:900,

                    }}

                >

                    Modül Performansları

                </h2>

                <div

                    style={{

                        marginTop:20,

                        display:"grid",

                        gap:16,

                    }}

                >

                    {

                        summary.modules.map(

                            module=>(

                                <ModuleRow

                                    key={module.key}

                                    module={module}

                                />

                            )

                        )

                    }

                </div>

            </section>

        </main>

    );

}

function ModuleRow({

    module,

}:any){

    const color=

        module.score>=90

        ?"#16a34a"

        :module.score>=75

        ?"#2563eb"

        :module.score>=60

        ?"#ea580c"

        :"#dc2626";

    return(

        <div

            style={{

                display:"grid",

                gridTemplateColumns:

                    "220px 1fr 80px",

                alignItems:"center",

                gap:18,

            }}

        >

            <strong>

                {module.title}

            </strong>

            <div

                style={{

                    height:12,

                    borderRadius:999,

                    background:"#e5e7eb",

                    overflow:"hidden",

                }}

            >

                <div

                    style={{

                        width:`${module.score}%`,

                        height:"100%",

                        background:color,

                    }}

                />

            </div>

            <strong

                style={{

                    color,

                    textAlign:"right",

                }}

            >

                {module.score}

            </strong>

        </div>

    );

}