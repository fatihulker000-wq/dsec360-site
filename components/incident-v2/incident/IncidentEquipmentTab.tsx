"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentEquipmentTab({

    value,

    onChange,

}: Props) {

    function update(

        field: keyof IncidentFormData["equipment"],

        fieldValue: any

    ) {

        onChange({

            ...value,

            equipment: {

                ...value.equipment,

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
                placeholder="Ekipman Adı"
                value={value.equipment.equipmentName ?? ""}
                onChange={(e)=>
                    update(
                        "equipmentName",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Ekipman No"
                value={value.equipment.equipmentId ?? ""}
                onChange={(e)=>
                    update(
                        "equipmentId",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Seri No"
                value={value.equipment.serialNo ?? ""}
                onChange={(e)=>
                    update(
                        "serialNo",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="QR Kod"
                value={value.equipment.qrCode ?? ""}
                onChange={(e)=>
                    update(
                        "qrCode",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="Barkod"
                value={value.equipment.barcode ?? ""}
                onChange={(e)=>
                    update(
                        "barcode",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="RFID"
                value={value.equipment.rfidTag ?? ""}
                onChange={(e)=>
                    update(
                        "rfidTag",
                        e.target.value
                    )
                }
            />

            <input
                placeholder="NFC"
                value={value.equipment.nfcTag ?? ""}
                onChange={(e)=>
                    update(
                        "nfcTag",
                        e.target.value
                    )
                }
            />

            <select>

                <option>Bakım Durumu</option>

                <option>Bakımlı</option>

                <option>Bakım Gerekli</option>

                <option>Arızalı</option>

            </select>

            <select>

                <option>LOTO Uygulandı</option>

                <option>Evet</option>

                <option>Hayır</option>

            </select>

            <select>

                <option>Makine Koruyucu Mevcut</option>

                <option>Evet</option>

                <option>Hayır</option>

            </select>

            <textarea
                rows={6}
                placeholder="Ekipman Açıklamaları"
                style={{
                    gridColumn:
                        "1 / span 2"
                }}
            />

        </div>

    );

}