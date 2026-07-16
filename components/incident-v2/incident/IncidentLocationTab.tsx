"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentLocationTab({

    value,

    onChange,

}: Props) {

    function update(field: string, fieldValue: any) {

        onChange({

            ...value,

            general: {

                ...value.general,

                [field]: fieldValue,

            },

        });

    }

    return (

        <div
            style={{

                display: "grid",

                gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",

                gap: 20,

            }}
        >

            <input
                placeholder="Tesis"
                value={value.general.location}
                onChange={(e) =>
                    update(
                        "location",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Bina"
            />

            <input
                placeholder="Kat"
            />

            <input
                placeholder="Bölge"
            />

            <input
                placeholder="Alan"
            />

            <input
                placeholder="GPS Konumu"
            />

            <input
                placeholder="QR Kod"
            />

            <input
                placeholder="RFID"
            />

            <textarea
                rows={6}
                placeholder="Lokasyon Açıklaması"
                style={{
                    gridColumn: "1 / span 2",
                }}
            />

        </div>

    );

}