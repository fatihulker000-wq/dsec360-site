"use client";

interface AiSuggestion {

    title: string;

    severity: number;

    confidence: number;

    rootCauses: string[];

    correctiveActions: string[];

    trainings: string[];

    risks: string[];

    notifications: string[];

}

interface Props {

    description: string;

    suggestion?: AiSuggestion;

    onAnalyze(): void;

}

export default function IncidentAiAssistant({

    description,

    suggestion,

    onAnalyze,

}: Props) {

    return (

        <div
            style={{

                background:"#fff",

                borderRadius:20,

                padding:24,

                border:"1px solid #e5e7eb"

            }}

        >

            <div
                style={{

                    display:"flex",

                    justifyContent:"space-between",

                    alignItems:"center",

                    marginBottom:20

                }}

            >

                <div>

                    <h2>

                        🤖 DORA AI Incident Assistant

                    </h2>

                    <div
                        style={{
                            color:"#64748b"
                        }}
                    >

                        Olay açıklamasını analiz ederek
                        otomatik sınıflandırma yapar.

                    </div>

                </div>

                <button
                    onClick={onAnalyze}
                >

                    AI Analiz Et

                </button>

            </div>

            <textarea

                value={description}

                readOnly

                rows={6}

                style={{

                    width:"100%",

                    marginBottom:24

                }}

            />

            {!suggestion && (

                <div>

                    Analiz bekleniyor...

                </div>

            )}

            {suggestion && (

                <>

                    <Info
                        title="Tahmini Severity"

                        value={String(
                            suggestion.severity
                        )}

                    />

                    <Info
                        title="AI Güveni"

                        value={`${suggestion.confidence}%`}

                    />

                    <Section
                        title="Muhtemel Kök Nedenler"

                        items={suggestion.rootCauses}

                    />

                    <Section
                        title="Önerilen DÖF"

                        items={suggestion.correctiveActions}

                    />

                    <Section
                        title="Önerilen Eğitimler"

                        items={suggestion.trainings}

                    />

                    <Section
                        title="İlgili Riskler"

                        items={suggestion.risks}

                    />

                    <Section
                        title="Gerekli Bildirimler"

                        items={suggestion.notifications}

                    />

                </>

            )}

        </div>

    );

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

                display:"flex",

                justifyContent:"space-between",

                padding:"12px 0",

                borderBottom:"1px solid #eee"

            }}

        >

            <strong>

                {title}

            </strong>

            {value}

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
                marginTop:24
            }}
        >

            <h4>{title}</h4>

            <ul>

                {items.map(item=>(

                    <li key={item}>

                        {item}

                    </li>

                ))}

            </ul>

        </div>

    );

}