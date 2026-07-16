"use client";

import { IncidentFormData } from "./types";

interface Props {

    value: IncidentFormData;

    onChange(
        value: IncidentFormData
    ): void;

}

export default function IncidentPeopleTab({

    value,

}: Props) {

    return (

        <div>

            <h3>Yaralanan Çalışanlar</h3>

            <div
                style={{
                    marginTop:24,
                    display:"grid",
                    gap:16
                }}
            >

                <input placeholder="Ad Soyad"/>

                <input placeholder="Sicil No"/>

                <input placeholder="TC Kimlik No"/>

                <input placeholder="Görev"/>

                <input placeholder="Departman"/>

                <input placeholder="Telefon"/>

                <select>

                    <option>İlk Yardım Yapıldı</option>

                    <option>Evet</option>

                    <option>Hayır</option>

                </select>

                <select>

                    <option>Hastaneye Sevk</option>

                    <option>Evet</option>

                    <option>Hayır</option>

                </select>

                <select>

                    <option>İş Göremezlik</option>

                    <option>Evet</option>

                    <option>Hayır</option>

                </select>

                <textarea
                    rows={5}
                    placeholder="Yaralanma Açıklaması"
                />

            </div>

        </div>

    );

}