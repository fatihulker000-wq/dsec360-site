"use client";

import { useMemo, useState } from "react";
import { InvestigationReport } from "./types";
import { FiveWhyEngine } from "./FiveWhyEngine";
import { FishboneEngine } from "./FishboneEngine";
import { RootCauseEngine } from "./RootCauseEngine";

interface Props {

    report: InvestigationReport;

    onChange(
        report: InvestigationReport
    ): void;

    onFinish(): void;

}

const STEPS = [

    "Genel",

    "5 Why",

    "Fishbone",

    "Kök Neden",

    "Deliller",

    "Tanıklar",

    "Görüşmeler",

    "Aksiyonlar",

    "Özet",

];

export default function InvestigationWizard({

    report,

    onChange,

    onFinish,

}: Props) {

    const [step, setStep] =

        useState(0);

    const fiveWhy =

        useMemo(

            () =>

                FiveWhyEngine.analyze(

                    report.fiveWhy

                ),

            [report.fiveWhy]

        );

    const fishbone =

        useMemo(

            () =>

                FishboneEngine.analyze(

                    report.fishbone

                ),

            [report.fishbone]

        );

    const rootCause =

        useMemo(

            () =>

                RootCauseEngine.analyze(

                    report.rootCauses

                ),

            [report.rootCauses]

        );

    const progress =

        Math.round(

            ((step + 1) /

                STEPS.length) *

                100

        );

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >

                <div>

                    <h2>

                        Investigation Wizard

                    </h2>

                    <div
                        style={{
                            color:"#64748b"
                        }}
                    >

                        Adım {step + 1} / {STEPS.length}

                    </div>

                </div>

                <div
                    style={{
                        fontSize:28,
                        fontWeight:900,
                    }}
                >

                    %{progress}

                </div>

            </div>

            <div
                style={{
                    display:"flex",
                    gap:10,
                    flexWrap:"wrap",
                }}
            >

                {STEPS.map((item,index)=>(

                    <button

                        key={item}

                        onClick={()=>

                            setStep(index)

                        }

                        style={{

                            padding:"10px 18px",

                            borderRadius:12,

                            border:"none",

                            cursor:"pointer",

                            background:

                                step===index

                                ? "#2563eb"

                                : "#e5e7eb",

                            color:

                                step===index

                                ? "#fff"

                                : "#111827",

                            fontWeight:700,

                        }}

                    >

                        {item}

                    </button>

                ))}

            </div>

            <div
                style={{

                    background:"#fff",

                    borderRadius:18,

                    padding:24,

                    border:"1px solid #e5e7eb",

                    minHeight:450,

                }}

            >

                {step===0 && (

                    <GeneralTab

                        report={report}

                        onChange={onChange}

                    />

                )}

                {step===1 && (

                    <FiveWhyTab

                        report={report}

                        analysis={fiveWhy}

                    />

                )}

                {step===2 && (

                    <FishboneTab

                        report={report}

                        analysis={fishbone}

                    />

                )}

                {step===3 && (

                    <RootCauseTab

                        report={report}

                        analysis={rootCause}

                    />

                )}

                {step===4 && (

                    <Placeholder

                        title="Evidence Center"

                    />

                )}

                {step===5 && (

                    <Placeholder

                        title="Witness Center"

                    />

                )}

                {step===6 && (

                    <Placeholder

                        title="Interview Center"

                    />

                )}

                {step===7 && (

                    <Placeholder

                        title="Action Tracking"

                    />

                )}

                {step===8 && (

                    <Placeholder

                        title="Investigation Summary"

                    />

                )}

            </div>

            <div
                style={{

                    display:"flex",

                    justifyContent:"space-between",

                }}

            >

                <button

                    disabled={step===0}

                    onClick={()=>

                        setStep(step-1)

                    }

                >

                    ← Geri

                </button>

                {step===STEPS.length-1 ? (

                    <button

                        onClick={onFinish}

                    >

                        Soruşturmayı Tamamla

                    </button>

                ) : (

                    <button

                        onClick={()=>

                            setStep(step+1)

                        }

                    >

                        Devam →

                    </button>

                )}

            </div>

        </div>

    );

}

function GeneralTab({

    report,

}:any){

    return(

        <div>

            <h3>

                Genel Bilgiler

            </h3>

            <p>

                No:

                {" "}

                {report.investigationNo}

            </p>

            <p>

                Araştırmacı:

                {" "}

                {report.investigator}

            </p>

            <p>

                Öncelik:

                {" "}

                {report.priority}

            </p>

        </div>

    );

}

function FiveWhyTab({

    analysis,

}:any){

    return(

        <div>

            <h3>

                5 Why Analizi

            </h3>

            <p>

                Skor:

                {" "}

                {analysis.score}

            </p>

            <p>

                Kök Neden:

                {" "}

                {analysis.rootCause}

            </p>

        </div>

    );

}

function FishboneTab({

    analysis,

}:any){

    return(

        <div>

            <h3>

                Fishbone

            </h3>

            <p>

                Toplam Neden:

                {" "}

                {analysis.totalCauses}

            </p>

            <p>

                En Güçlü Kategori:

                {" "}

                {analysis.strongestCategory}

            </p>

        </div>

    );

}

function RootCauseTab({

    analysis,

}:any){

    return(

        <div>

            <h3>

                Root Cause

            </h3>

            <p>

                Skor:

                {" "}

                {analysis.score}

            </p>

            <p>

                Seçilen:

                {" "}

                {

                    analysis

                    .selectedRootCauses

                    .length

                }

            </p>

        </div>

    );

}

function Placeholder({

    title,

}:{

    title:string;

}){

    return(

        <div
            style={{
                padding:40,
                textAlign:"center",
                color:"#64748b",
            }}
        >

            <h3>

                {title}

            </h3>

            <p>

                Bu ekran bir sonraki
                dosyada oluşturulacaktır.

            </p>

        </div>

    );

}