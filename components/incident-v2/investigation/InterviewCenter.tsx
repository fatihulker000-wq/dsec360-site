"use client";

import { InvestigationInterview, InvestigationPerson } from "./types";

interface Props {

    interviews: InvestigationInterview[];

    people: InvestigationPerson[];

    onChange(
        interviews: InvestigationInterview[]
    ): void;

}

export default function InterviewCenter({

    interviews,

    people,

    onChange,

}: Props) {

    function addInterview() {

        onChange([

            ...interviews,

            {

                id: crypto.randomUUID(),

                personId: "",

                interviewDate: new Date()
                    .toISOString()
                    .substring(0, 16),

                interviewer: "",

                summary: "",

                statement: "",

            },

        ]);

    }

    function update(

        id: string,

        field: keyof InvestigationInterview,

        value: any

    ) {

        onChange(

            interviews.map(item =>

                item.id === id

                    ? {

                          ...item,

                          [field]: value,

                      }

                    : item

            )

        );

    }

    function remove(id: string) {

        onChange(

            interviews.filter(

                x => x.id !== id

            )

        );

    }

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

                <h3>

                    Görüşme Merkezi

                </h3>

                <button
                    onClick={addInterview}
                >

                    + Görüşme Ekle

                </button>

            </div>

            {interviews.length === 0 && (

                <div
                    style={{
                        padding: 40,
                        textAlign: "center",
                        border: "2px dashed #cbd5e1",
                        borderRadius: 16,
                        color: "#64748b",
                    }}
                >

                    Henüz görüşme kaydı bulunmuyor.

                </div>

            )}

            {interviews.map(item => (

                <div
                    key={item.id}
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2,minmax(0,1fr))",
                        gap: 16,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        padding: 20,
                    }}
                >

                    <select
                        value={item.personId}
                        onChange={(e) =>
                            update(
                                item.id,
                                "personId",
                                e.target.value
                            )
                        }
                    >

                        <option value="">

                            Görüşülen Kişi

                        </option>

                        {people.map(person => (

                            <option
                                key={person.id}
                                value={person.id}
                            >

                                {person.fullName}

                            </option>

                        ))}

                    </select>

                    <input
                        type="datetime-local"
                        value={item.interviewDate}
                        onChange={(e) =>
                            update(
                                item.id,
                                "interviewDate",
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Görüşmeyi Yapan"
                        value={item.interviewer}
                        onChange={(e) =>
                            update(
                                item.id,
                                "interviewer",
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Görüşme Özeti"
                        value={item.summary}
                        onChange={(e) =>
                            update(
                                item.id,
                                "summary",
                                e.target.value
                            )
                        }
                    />

                    <textarea
                        rows={8}
                        placeholder="İfade / Görüşme Tutanığı"
                        value={item.statement}
                        onChange={(e) =>
                            update(
                                item.id,
                                "statement",
                                e.target.value
                            )
                        }
                        style={{
                            gridColumn:
                                "1 / span 2",
                        }}
                    />

                    <div
                        style={{
                            gridColumn:
                                "1 / span 2",
                            display: "flex",
                            justifyContent:
                                "flex-end",
                        }}
                    >

                        <button
                            onClick={() =>
                                remove(item.id)
                            }
                            style={{
                                background:
                                    "#dc2626",
                                color: "#fff",
                                border: "none",
                                borderRadius: 10,
                                padding:
                                    "10px 18px",
                                cursor:
                                    "pointer",
                            }}
                        >

                            Görüşmeyi Sil

                        </button>

                    </div>

                </div>

            ))}

        </div>

    );

}