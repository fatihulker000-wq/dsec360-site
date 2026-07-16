"use client";

interface Props {
    value: any;
    onChange(value: any): void;
}

export default function IncidentRelatedRecordsTab({

    value,

}: Props) {

    return (

        <div
            style={{
                display: "grid",
                gap: 20
            }}
        >

            <RelatedCard
                title="İlgili Risk Değerlendirmeleri"
                color="#2563eb"
                items={value.relatedRiskAssessments ?? []}
            />

            <RelatedCard
                title="İlgili Denetimler"
                color="#16a34a"
                items={value.relatedInspections ?? []}
            />

            <RelatedCard
                title="İlgili DÖF Kayıtları"
                color="#ea580c"
                items={value.relatedCorrectiveActions ?? []}
            />

            <RelatedCard
                title="İlgili Eğitimler"
                color="#7c3aed"
                items={value.relatedTrainings ?? []}
            />

            <RelatedCard
                title="İlgili Sağlık Kayıtları"
                color="#dc2626"
                items={value.relatedHealthRecords ?? []}
            />

            <RelatedCard
                title="İlgili Ekipmanlar"
                color="#0f766e"
                items={value.relatedEquipments ?? []}
            />

            <RelatedCard
                title="Benzer Olaylar"
                color="#ca8a04"
                items={value.similarIncidents ?? []}
            />

        </div>

    );

}

function RelatedCard({

    title,

    color,

    items,

}: {

    title: string;

    color: string;

    items: any[];

}) {

    return (

        <div
            style={{
                border: `2px solid ${color}`,
                borderRadius: 16,
                overflow: "hidden"
            }}
        >

            <div
                style={{
                    background: color,
                    color: "#fff",
                    padding: 14,
                    fontWeight: 800
                }}
            >
                {title}
            </div>

            {items.length === 0 ? (

                <div
                    style={{
                        padding: 18,
                        color: "#64748b"
                    }}
                >
                    İlişkili kayıt bulunamadı.
                </div>

            ) : (

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse"
                    }}
                >

                    <tbody>

                        {items.map((item: any) => (

                            <tr key={item.id}>

                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #eee"
                                    }}
                                >
                                    {item.title}
                                </td>

                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #eee"
                                    }}
                                >
                                    {item.code}
                                </td>

                                <td
                                    style={{
                                        padding: 12,
                                        borderBottom: "1px solid #eee"
                                    }}
                                >
                                    {item.status}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            )}

        </div>

    );

}