"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentEnvironmentTab({

    value,

    onChange,

}: Props) {

    function update(

        field: keyof IncidentFormData["environment"],

        fieldValue: any

    ) {

        onChange({

            ...value,

            environment: {

                ...value.environment,

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
                placeholder="Hava Durumu"
                value={value.environment.weather}
                onChange={(e)=>
                    update(
                        "weather",
                        e.target.value
                    )
                }
            />

            <input
                type="number"
                placeholder="Sıcaklık (°C)"
                value={value.environment.temperature}
                onChange={(e)=>
                    update(
                        "temperature",
                        Number(e.target.value)
                    )
                }
            />

            <input
                type="number"
                placeholder="Nem (%)"
                value={value.environment.humidity}
                onChange={(e)=>
                    update(
                        "humidity",
                        Number(e.target.value)
                    )
                }
            />

            <input
                placeholder="Aydınlatma"
                value={value.environment.lighting}
                onChange={(e)=>
                    update(
                        "lighting",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Gürültü Seviyesi"
                value={value.environment.noise}
                onChange={(e)=>
                    update(
                        "noise",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Havalandırma"
                value={value.environment.ventilation}
                onChange={(e)=>
                    update(
                        "ventilation",
                        e.target.value
                    )
                }
            />

            <textarea
                rows={6}
                placeholder="Çevresel Açıklamalar"
                style={{
                    gridColumn:"1 / span 2"
                }}
            />

        </div>

    );

}