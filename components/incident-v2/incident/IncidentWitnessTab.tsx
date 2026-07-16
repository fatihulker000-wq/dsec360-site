"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentWitnessTab({

    value,

}: Props) {

    return (

        <div>

            <h3>Tanık Bilgileri</h3>

            <div
                style={{
                    marginTop:24,
                    display:"grid",
                    gap:16
                }}
            >

                <input
                    placeholder="Tanık Ad Soyad"
                />

                <input
                    placeholder="Görevi"
                />

                <input
                    placeholder="Departman"
                />

                <input
                    placeholder="Telefon"
                />

                <input
                    placeholder="E-Posta"
                />

                <textarea
                    rows={8}
                    placeholder="Tanık İfadesi"
                />

                <textarea
                    rows={5}
                    placeholder="Ek Açıklamalar"
                />

            </div>

        </div>

    );

}