"use client";

interface GraphNode {

    id: string;

    type:
        | "INCIDENT"
        | "EMPLOYEE"
        | "RISK"
        | "INSPECTION"
        | "TRAINING"
        | "ACTION"
        | "EQUIPMENT"
        | "HEALTH";

    title: string;

    subtitle?: string;

    color: string;

}

interface GraphGroup {

    title: string;

    nodes: GraphNode[];

}

interface Props {

    incidentId: string;

    groups: GraphGroup[];

    onOpenNode?(
        node: GraphNode
    ): void;

}

export default function IncidentKnowledgeGraph({

    groups,

    onOpenNode,

}: Props) {

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            {groups.map(group => (

                <section
                    key={group.title}
                >

                    <h3
                        style={{
                            marginBottom: 16,
                        }}
                    >
                        {group.title}
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill,minmax(220px,1fr))",
                            gap: 16,
                        }}
                    >

                        {group.nodes.map(node => (

                            <div
                                key={node.id}
                                onClick={() =>
                                    onOpenNode?.(node)
                                }
                                style={{
                                    cursor: "pointer",
                                    borderRadius: 14,
                                    padding: 18,
                                    background: "#fff",
                                    borderLeft:
                                        `6px solid ${node.color}`,
                                    border:
                                        "1px solid #e5e7eb",
                                    boxShadow:
                                        "0 8px 20px rgba(0,0,0,.05)",
                                }}
                            >

                                <div
                                    style={{
                                        fontWeight: 800,
                                    }}
                                >
                                    {node.title}
                                </div>

                                {node.subtitle && (

                                    <div
                                        style={{
                                            marginTop: 8,
                                            color: "#64748b",
                                            fontSize: 13,
                                        }}
                                    >
                                        {node.subtitle}
                                    </div>

                                )}

                                <div
                                    style={{
                                        marginTop: 14,
                                        fontSize: 12,
                                        color: node.color,
                                        fontWeight: 700,
                                    }}
                                >
                                    {node.type}
                                </div>

                            </div>

                        ))}

                    </div>

                </section>

            ))}

        </div>

    );

}