"use client";

import { InvestigationPerson } from "./types";

interface Props {

    witnesses: InvestigationPerson[];

    onChange(
        witnesses: InvestigationPerson[]
    ): void;

}

export default function WitnessCenter({

    witnesses,

    onChange,

}: Props) {

    function addWitness() {

        onChange([

            ...witnesses,

            {

                id: crypto.randomUUID(),

                fullName: "",

                department: "",

                title: "",

                role: "WITNESS",

            },

        ]);

    }

    function update(

        id: string,

        field: keyof InvestigationPerson,

        value: any

    ) {

        onChange(

            witnesses.map(item =>

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

            witnesses.filter(

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

                    Tanık Yönetimi

                </h3>

                <button
                    onClick={addWitness}
                >

                    + Tanık Ekle

                </button>

            </div>

            {witnesses.length === 0 && (

                <div
                    style={{
                        padding: 40,
                        textAlign: "center",
                        border: "2px dashed #cbd5e1",
                        borderRadius: 16,
                        color: "#64748b",
                    }}
                >

                    Henüz tanık eklenmedi.

                </div>

            )}

            {witnesses.map(item => (

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

                    <input
                        placeholder="Ad Soyad"
                        value={item.fullName}
                        onChange={(e) =>
                            update(
                                item.id,
                                "fullName",
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Görev"
                        value={item.title}
                        onChange={(e) =>
                            update(
                                item.id,
                                "title",
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Departman"
                        value={item.department}
                        onChange={(e) =>
                            update(
                                item.id,
                                "department",
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={item.role}
                        onChange={(e) =>
                            update(
                                item.id,
                                "role",
                                e.target.value
                            )
                        }
                    >

                        <option value="WITNESS">
                            Tanık
                        </option>

                        <option value="SUPERVISOR">
                            Amir
                        </option>

                        <option value="EMPLOYER">
                            İşveren
                        </option>

                        <option value="OTHER">
                            Diğer
                        </option>

                    </select>

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
                                padding:
                                    "10px 18px",
                                borderRadius: 10,
                                cursor:
                                    "pointer",
                            }}
                        >

                            Tanığı Sil

                        </button>

                    </div>

                </div>

            ))}

        </div>

    );

}