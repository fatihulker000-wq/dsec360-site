"use client";

import { useState } from "react";

import {
    IncidentGeneralTab,
    IncidentClassificationTab,
    IncidentPeopleTab,
    IncidentWitnessTab,
    IncidentLocationTab,
    IncidentEnvironmentTab,
    IncidentEquipmentTab,
    IncidentPpeTab,
    IncidentPhotoTab,
    IncidentVideoTab,
    IncidentDocumentTab,
    IncidentRelatedRecordsTab,
} from ".";

import { IncidentFormData } from "./types";

const tabs = [

    "Genel",

    "Sınıflandırma",

    "Yaralananlar",

    "Tanıklar",

    "Lokasyon",

    "Çevre",

    "Ekipman",

    "KKD",

    "Fotoğraf",

    "Video",

    "Belgeler",

    "İlişkili Kayıtlar",

    "Önizleme",

];

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

    onSave(): void;

}

export default function IncidentForm({

    value,

    onChange,

    onSave,

}: Props) {

    const [tab, setTab] =
        useState(0);

    function renderTab() {

        switch (tab) {

            case 0:
                return (
                    <IncidentGeneralTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 1:
                return (
                    <IncidentClassificationTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 2:
                return (
                    <IncidentPeopleTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 3:
                return (
                    <IncidentWitnessTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 4:
                return (
                    <IncidentLocationTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 5:
                return (
                    <IncidentEnvironmentTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 6:
                return (
                    <IncidentEquipmentTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 7:
                return (
                    <IncidentPpeTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 8:
                return (
                    <IncidentPhotoTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 9:
                return (
                    <IncidentVideoTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 10:
                return (
                    <IncidentDocumentTab
                        value={value}
                        onChange={onChange}
                    />
                );

            case 11:
                return (
                    <IncidentRelatedRecordsTab
                        value={value}
                        onChange={onChange}
                    />
                );

            default:

                return (

                    <div>

                        Incident Önizleme

                    </div>

                );

        }

    }

    return (

        <div>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    marginBottom: 24,
                }}
            >

                {tabs.map((title, i) => (

                    <button

                        key={title}

                        onClick={() => setTab(i)}

                        style={{

                            padding:
                                "10px 18px",

                            borderRadius: 12,

                            border: "none",

                            cursor: "pointer",

                            background:
                                tab === i
                                    ? "#2563eb"
                                    : "#e5e7eb",

                            color:
                                tab === i
                                    ? "#fff"
                                    : "#111",

                            fontWeight: 700,

                        }}

                    >

                        {i + 1}. {title}

                    </button>

                ))}

            </div>

            {renderTab()}

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    marginTop: 32,
                }}
            >

                <button
                    disabled={tab === 0}
                    onClick={() =>
                        setTab(tab - 1)
                    }
                >
                    Geri
                </button>

                {tab < tabs.length - 1 ? (

                    <button
                        onClick={() =>
                            setTab(tab + 1)
                        }
                    >
                        Devam
                    </button>

                ) : (

                    <button
                        onClick={onSave}
                    >
                        Kaydet
                    </button>

                )}

            </div>

        </div>

    );

}