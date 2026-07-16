"use client";

import {
    IncidentFormData,
    IncidentSeverity,
    IncidentType,
} from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

const incidentTypes: {

    value: IncidentType;

    label: string;

}[] = [

    { value: "WORK_ACCIDENT", label: "İş Kazası" },

    { value: "NEAR_MISS", label: "Ramak Kala" },

    { value: "UNSAFE_ACT", label: "Tehlikeli Davranış" },

    { value: "UNSAFE_CONDITION", label: "Tehlikeli Durum" },

    { value: "ENVIRONMENT", label: "Çevre Olayı" },

    { value: "FIRE", label: "Yangın" },

    { value: "CHEMICAL", label: "Kimyasal Dökülme" },

    { value: "VEHICLE", label: "Araç Kazası" },

    { value: "FORKLIFT", label: "Forklift Kazası" },

    { value: "ELECTRIC", label: "Elektrik Olayı" },

    { value: "FALL", label: "Yüksekten Düşme" },

    { value: "CUT", label: "Kesilme" },

    { value: "BURN", label: "Yanık" },

    { value: "OCCUPATIONAL_DISEASE", label: "Meslek Hastalığı" },

    { value: "SECURITY", label: "Güvenlik Olayı" },

    { value: "OTHER", label: "Diğer" },

];

export default function IncidentClassificationTab({

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

                gap: 24,

            }}
        >

            <div>

                <label>

                    Olay Türü

                </label>

                <select

                    value={
                        value.general
                            .incidentType
                    }

                    onChange={(e) =>

                        update(

                            "incidentType",

                            e.target
                                .value as IncidentType

                        )

                    }

                >

                    {incidentTypes.map(

                        (item) => (

                            <option

                                key={item.value}

                                value={item.value}

                            >

                                {item.label}

                            </option>

                        )

                    )}

                </select>

            </div>

            <div>

                <label>

                    Şiddet

                </label>

                <select

                    value={
                        value.general
                            .severity
                    }

                    onChange={(e) =>

                        update(

                            "severity",

                            Number(
                                e.target.value
                            ) as IncidentSeverity

                        )

                    }

                >

                    <option value={1}>
                        1 - Çok Hafif
                    </option>

                    <option value={2}>
                        2 - Hafif
                    </option>

                    <option value={3}>
                        3 - Orta
                    </option>

                    <option value={4}>
                        4 - Ciddi
                    </option>

                    <option value={5}>
                        5 - Çok Ciddi
                    </option>

                </select>

            </div>

            <div>

                <label>

                    Olay Durumu

                </label>

                <select

                    value={
                        value.general.status
                    }

                    onChange={(e) =>

                        update(

                            "status",

                            e.target.value

                        )

                    }

                >

                    <option value="DRAFT">
                        Taslak
                    </option>

                    <option value="OPEN">
                        Açık
                    </option>

                    <option value="INVESTIGATION">
                        Soruşturma
                    </option>

                    <option value="CORRECTIVE_ACTION">
                        DÖF
                    </option>

                    <option value="EFFECTIVENESS">
                        Etkinlik Kontrolü
                    </option>

                    <option value="READY_FOR_NOTIFICATION">
                        Bildirime Hazır
                    </option>

                    <option value="CLOSED">
                        Kapatıldı
                    </option>

                </select>

            </div>

        </div>

    );

}