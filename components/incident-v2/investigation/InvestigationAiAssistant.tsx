"use client";

import { InvestigationReport } from "./types";
import { FiveWhyEngine } from "./FiveWhyEngine";
import { FishboneEngine } from "./FishboneEngine";
import { RootCauseEngine } from "./RootCauseEngine";

interface Props {

    report: InvestigationReport;

    onGenerateActions?(
        actions: string[]
    ): void;

}

export default function InvestigationAiAssistant({

    report,

    onGenerateActions,

}: Props) {

    const why =
        FiveWhyEngine.analyze(
            report.fiveWhy
        );

    const fishbone =
        FishboneEngine.analyze(
            report.fishbone
        );

    const root =
        RootCauseEngine.analyze(
            report.rootCauses
        );

    const score = Math.round(

        (

            why.score +

            fishbone.score +

            root.score

        ) / 3

    );

    const level =

        score >= 90

            ? "Mükemmel"

            : score >= 75

            ? "İyi"

            : score >= 50

            ? "Geliştirilmeli"

            : "Yetersiz";

    const suggestions = buildSuggestions(

        why,

        fishbone,

        root

    );

    return (

        <div
            style={{

                display:"grid",

                gap:24,

            }}

        >

            <div
                style={{

                    borderRadius:20,

                    padding:24,

                    background:
                        "linear-gradient(135deg,#0f172a,#1d4ed8)",

                    color:"#fff",

                }}

            >

                <div
                    style={{

                        fontSize:13,

                        opacity:.85,

                        fontWeight:700,

                    }}

                >

                    D-SEC AI Investigation

                </div>

                <div
                    style={{

                        marginTop:10,

                        fontSize:58,

                        fontWeight:900,

                    }}

                >

                    {score}

                </div>

                <div
                    style={{

                        fontSize:22,

                        fontWeight:800,

                    }}

                >

                    {level}

                </div>

                <div
                    style={{

                        marginTop:16,

                        lineHeight:1.8,

                    }}

                >

                    Yapay zeka;

                    5 Why,

                    Fishbone,

                    Root Cause,

                    deliller,

                    tanıklar,

                    görüşmeler ve

                    aksiyon planlarını

                    birlikte değerlendirerek

                    soruşturma kalitesini

                    analiz etmektedir.

                </div>

            </div>

            <Section
                title="AI Önerileri"
                items={suggestions}
            />

            <Section
                title="5 Why Tavsiyeleri"
                items={why.recommendations}
            />

            <Section
                title="Fishbone Tavsiyeleri"
                items={fishbone.recommendations}
            />

            <Section
                title="Root Cause Tavsiyeleri"
                items={root.recommendations}
            />

            <button

                onClick={()=>

                    onGenerateActions?.(

                        suggestions

                    )

                }

                style={{

                    padding:16,

                    borderRadius:14,

                    border:"none",

                    background:"#2563eb",

                    color:"#fff",

                    fontWeight:800,

                    cursor:"pointer",

                }}

            >

                AI Önerilerini

                DÖF'e Dönüştür

            </button>

        </div>

    );

}

function Section({

    title,

    items,

}:{

    title:string;

    items:string[];

}){

    return(

        <div
            style={{

                background:"#fff",

                borderRadius:16,

                border:"1px solid #e5e7eb",

                padding:20,

            }}

        >

            <h3>

                {title}

            </h3>

            <ul
                style={{

                    marginTop:14,

                    lineHeight:2,

                }}

            >

                {items.map(item=>(

                    <li key={item}>

                        {item}

                    </li>

                ))}

            </ul>

        </div>

    );

}

function buildSuggestions(

    why:any,

    fishbone:any,

    root:any

){

    const list:string[]=[];

    if(why.score<80){

        list.push(

            "5 Why analizi derinleştirilmelidir."

        );

    }

    if(fishbone.score<80){

        list.push(

            "Balık Kılçığı analizine yeni nedenler eklenmelidir."

        );

    }

    if(root.score<80){

        list.push(

            "Kök neden doğrulama toplantısı yapılmalıdır."

        );

    }

    list.push(

        "Risk değerlendirmesi güncellenmelidir."

    );

    list.push(

        "İlgili personele tekrar eğitim verilmelidir."

    );

    list.push(

        "Benzer alanlarda saha denetimi planlanmalıdır."

    );

    return list;

}