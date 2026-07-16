"use client";

import { InvestigationAction } from "./types";

interface Props {

    actions: InvestigationAction[];

    onChange(
        actions: InvestigationAction[]
    ): void;

}

export default function ActionTracking({

    actions,

    onChange,

}: Props) {

    function addAction() {

        onChange([

            ...actions,

            {

                id: crypto.randomUUID(),

                title: "",

                responsible: "",

                dueDate: "",

                status: "OPEN",

            },

        ]);

    }

    function update(

        id: string,

        field: keyof InvestigationAction,

        value: any

    ) {

        onChange(

            actions.map(item =>

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

            actions.filter(

                x => x.id !== id

            )

        );

    }

    const total = actions.length;

    const open =
        actions.filter(
            x => x.status === "OPEN"
        ).length;

    const progress =
        actions.filter(
            x => x.status === "IN_PROGRESS"
        ).length;

    const completed =
        actions.filter(
            x => x.status === "COMPLETED"
        ).length;

    return (

        <div
            style={{
                display:"grid",
                gap:24,
            }}
        >

            <div
                style={{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                }}
            >

                <h3>

                    DÖF / Aksiyon Takibi

                </h3>

                <button
                    onClick={addAction}
                >

                    + Aksiyon Ekle

                </button>

            </div>

            <div
                style={{
                    display:"grid",
                    gridTemplateColumns:
                        "repeat(4,1fr)",
                    gap:16,
                }}
            >

                <Stat
                    title="Toplam"
                    value={total}
                />

                <Stat
                    title="Açık"
                    value={open}
                />

                <Stat
                    title="Devam Eden"
                    value={progress}
                />

                <Stat
                    title="Tamamlanan"
                    value={completed}
                />

            </div>

            {actions.map(item=>(

                <div
                    key={item.id}
                    style={{
                        display:"grid",
                        gridTemplateColumns:
                            "repeat(2,minmax(0,1fr))",
                        gap:16,
                        border:"1px solid #e5e7eb",
                        borderRadius:16,
                        padding:20,
                        background:"#fff",
                    }}
                >

                    <input
                        placeholder="Aksiyon Başlığı"
                        value={item.title}
                        onChange={(e)=>
                            update(
                                item.id,
                                "title",
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Sorumlu Kişi"
                        value={item.responsible}
                        onChange={(e)=>
                            update(
                                item.id,
                                "responsible",
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e)=>
                            update(
                                item.id,
                                "dueDate",
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={item.status}
                        onChange={(e)=>
                            update(
                                item.id,
                                "status",
                                e.target.value
                            )
                        }
                    >

                        <option value="OPEN">
                            Açık
                        </option>

                        <option value="IN_PROGRESS">
                            Devam Ediyor
                        </option>

                        <option value="COMPLETED">
                            Tamamlandı
                        </option>

                    </select>

                    <div
                        style={{
                            gridColumn:
                                "1 / span 2",
                            display:"flex",
                            justifyContent:"flex-end",
                        }}
                    >

                        <button
                            onClick={()=>
                                remove(item.id)
                            }
                            style={{
                                background:"#dc2626",
                                color:"#fff",
                                border:"none",
                                borderRadius:10,
                                padding:"10px 18px",
                                cursor:"pointer",
                            }}
                        >

                            Sil

                        </button>

                    </div>

                </div>

            ))}

        </div>

    );

}

function Stat({

    title,

    value,

}:{

    title:string;

    value:number;

}){

    return(

        <div
            style={{
                background:"#fff",
                border:"1px solid #e5e7eb",
                borderRadius:14,
                padding:18,
            }}
        >

            <div
                style={{
                    color:"#64748b",
                    fontSize:13,
                }}
            >

                {title}

            </div>

            <div
                style={{
                    marginTop:8,
                    fontWeight:800,
                    fontSize:28,
                }}
            >

                {value}

            </div>

        </div>

    );

}