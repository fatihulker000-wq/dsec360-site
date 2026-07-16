"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentGeneralTab({

    value,

    onChange,

}: Props) {

    function update(
        field: keyof IncidentFormData["general"],
        fieldValue: any
    ) {

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

            <Input
                label="Olay No"
                value={value.general.incidentNo}
                onChange={(v) =>
                    update("incidentNo", v)
                }
            />

            <Input
                label="Firma"
                value={value.general.companyName}
                onChange={(v) =>
                    update("companyName", v)
                }
            />

            <Input
                label="Departman"
                value={value.general.department}
                onChange={(v) =>
                    update("department", v)
                }
            />

            <Input
                label="Lokasyon"
                value={value.general.location}
                onChange={(v) =>
                    update("location", v)
                }
            />

            <Input
                label="Faaliyet"
                value={value.general.activity}
                onChange={(v) =>
                    update("activity", v)
                }
            />

            <Input
                label="İş Emri No"
                value={
                    value.general.workOrderNo ?? ""
                }
                onChange={(v) =>
                    update("workOrderNo", v)
                }
            />

            <Input
                label="Permit No"
                value={
                    value.general.permitNo ?? ""
                }
                onChange={(v) =>
                    update("permitNo", v)
                }
            />

            <Input
                label="Tarih"
                type="date"
                value={value.general.incidentDate}
                onChange={(v) =>
                    update("incidentDate", v)
                }
            />

            <Input
                label="Saat"
                type="time"
                value={value.general.incidentTime}
                onChange={(v) =>
                    update("incidentTime", v)
                }
            />

            <Input
                label="Vardiya"
                value={value.general.shift}
                onChange={(v) =>
                    update("shift", v)
                }
            />

        </div>

    );

}

function Input({

    label,

    value,

    onChange,

    type = "text",

}: {

    label: string;

    value: any;

    onChange(v: string): void;

    type?: string;

}) {

    return (

        <div>

            <label
                style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 700,
                }}
            >
                {label}
            </label>

            <input
                type={type}
                value={value ?? ""}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border:
                        "1px solid #d1d5db",
                }}
            />

        </div>

    );

}