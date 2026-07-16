"use client";

export interface InvestigationTimelineItem {

    id: string;

    title: string;

    description?: string;

    user: string;

    createdAt: string;

    type:
        | "INFO"
        | "SUCCESS"
        | "WARNING"
        | "ERROR";

}

interface Props {

    items: InvestigationTimelineItem[];

}

export default function InvestigationTimeline({

    items,

}: Props) {

    return (

        <div
            style={{
                display: "grid",
                gap: 20,
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

    item: InvestigationTimelineItem;

}){

    const color = {

        INFO: "#2563eb",

        SUCCESS: "#16a34a",

        WARNING: "#ca8a04",

        ERROR: "#dc2626",

    }[item.type];

    return (

        <div
            style={{

                display: "grid",

                gridTemplateColumns:
                    "70px 24px 1fr",

                gap: 18,

                alignItems: "start",

            }}

        >

            <div
                style={{

                    fontSize: 13,

                    color: "#64748b",

                    fontWeight: 700,

                }}

            >

                {new Date(item.createdAt)
                    .toLocaleTimeString(
                        "tr-TR",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                        }
                    )}

            </div>

            <div
                style={{

                    display: "flex",

                    flexDirection: "column",

                    alignItems: "center",

                }}

            >

                <div
                    style={{

                        width: 16,

                        height: 16,

                        borderRadius: "50%",

                        background: color,

                    }}

                />

                <div
                    style={{

                        width: 2,

                        flex: 1,

                        minHeight: 70,

                        background: "#d1d5db",

                    }}

                />

            </div>

            <div
                style={{

                    background: "#fff",

                    borderRadius: 16,

                    borderLeft: `5px solid ${color}`,

                    border: "1px solid #e5e7eb",

                    padding: 18,

                }}

            >

                <div
                    style={{

                        fontWeight: 800,

                        fontSize: 16,

                    }}

                >

                    {item.title}

                </div>

                {item.description && (

                    <div
                        style={{

                            marginTop: 10,

                            color: "#64748b",

                            lineHeight: 1.7,

                        }}

                    >

                        {item.description}

                    </div>

                )}

                <div
                    style={{

                        marginTop: 14,

                        fontSize: 12,

                        color: "#94a3b8",

                    }}

                >

                    İşlemi yapan:

                    {" "}

                    <strong>

                        {item.user}

                    </strong>

                </div>

            </div>

        </div>

    );

}