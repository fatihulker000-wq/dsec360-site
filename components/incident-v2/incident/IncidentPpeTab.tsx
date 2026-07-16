"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentPpeTab({

    value,

    onChange,

}: Props) {

    function update(

        field: keyof IncidentFormData["ppe"]

    ) {

        onChange({

            ...value,

            ppe: {

                ...value.ppe,

                [field]:
                    !value.ppe[field],

            },

        });

    }

    return (

        <div
            style={{

                display:"grid",

                gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",

                gap:20

            }}
        >

            <Check
                title="Baret"
                checked={value.ppe.helmet}
                onClick={()=>update("helmet")}
            />

            <Check
                title="Koruyucu Gözlük"
                checked={value.ppe.glasses}
                onClick={()=>update("glasses")}
            />

            <Check
                title="İş Eldiveni"
                checked={value.ppe.gloves}
                onClick={()=>update("gloves")}
            />

            <Check
                title="İş Ayakkabısı"
                checked={value.ppe.shoes}
                onClick={()=>update("shoes")}
            />

            <Check
                title="İkaz Yeleği"
                checked={value.ppe.vest}
                onClick={()=>update("vest")}
            />

            <Check
                title="Solunum Koruyucu"
                checked={value.ppe.respiratory}
                onClick={()=>update("respiratory")}
            />

            <textarea

                rows={6}

                placeholder="Diğer KKD Açıklamaları"

                value={value.ppe.other ?? ""}

                onChange={(e)=>

                    onChange({

                        ...value,

                        ppe:{

                            ...value.ppe,

                            other:e.target.value

                        }

                    })

                }

                style={{

                    gridColumn:"1 / span 2"

                }}

            />

        </div>

    );

}

function Check({

    title,

    checked,

    onClick,

}:{

    title:string;

    checked:boolean;

    onClick():void;

}){

    return(

        <label

            style={{

                display:"flex",

                alignItems:"center",

                gap:12,

                padding:16,

                border:"1px solid #ddd",

                borderRadius:12,

                cursor:"pointer"

            }}

        >

            <input

                type="checkbox"

                checked={checked}

                onChange={onClick}

            />

            {title}

        </label>

    );

}