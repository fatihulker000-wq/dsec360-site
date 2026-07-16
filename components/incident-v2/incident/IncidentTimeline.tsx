"use client";

export interface TimelineItem {

    id: string;

    title: string;

    description?: string;

    user?: string;

    createdAt: string;

    status:
        | "SUCCESS"
        | "WARNING"
        | "INFO"
        | "ERROR";

}

interface Props {

    items: TimelineItem[];

}

export default function IncidentTimeline({

    items,

}: Props) {

    return (

        <div
            style={{
                display: "grid",
                gap: 18,
            }}
        >

            {items.map(item => (

                <TimelineCard
                    key={item.id}
                    item={item}
                />

            ))}

        </div>

    );

}

function TimelineCard({

    item,

}:{

    item:TimelineItem;

}){

    const color={

        SUCCESS:"#16a34a",

        WARNING:"#ca8a04",

        INFO:"#2563eb",

        ERROR:"#dc2626",

    }[item.status];

    return(

        <div
            style={{

                display:"grid",

                gridTemplateColumns:
                    "70px 18px 1fr",

                gap:20,

                alignItems:"start"

            }}
        >

            <div
                style={{

                    fontWeight:700,

                    color:"#64748b",

                    fontSize:13

                }}
            >

                {new Date(item.createdAt)
                    .toLocaleTimeString(
                        "tr-TR",
                        {
                            hour:"2-digit",
                            minute:"2-digit"
                        }
                    )}

            </div>

            <div
                style={{

                    display:"flex",

                    flexDirection:"column",

                    alignItems:"center"

                }}
            >

                <div
                    style={{

                        width:16,

                        height:16,

                        borderRadius:"50%",

                        background:color

                    }}
                />

                <div
                    style={{

                        flex:1,

                        width:2,

                        background:"#d1d5db",

                        minHeight:60

                    }}
                />

            </div>

            <div
                style={{

                    border:"1px solid #e5e7eb",

                    borderLeft:`5px solid ${color}`,

                    borderRadius:14,

                    padding:18,

                    background:"#fff"

                }}
            >

                <div
                    style={{

                        fontWeight:800,

                        fontSize:16

                    }}
                >

                    {item.title}

                </div>

                {item.description && (

                    <div
                        style={{

                            marginTop:8,

                            color:"#64748b",

                            lineHeight:1.6

                        }}
                    >

                        {item.description}

                    </div>

                )}

                {item.user && (

                    <div
                        style={{

                            marginTop:12,

                            fontSize:12,

                            color:"#94a3b8"

                        }}
                    >

                        İşlemi yapan:

                        {" "}

                        <strong>

                            {item.user}

                        </strong>

                    </div>

                )}

            </div>

        </div>

    );

}