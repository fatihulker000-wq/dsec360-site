"use client";

type Props = {
  employee: any;
};

export default function GeneralTab({
  employee,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 22,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Genel Bilgiler
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
          }}
        >
          <Info title="Ad Soyad" value={employee?.full_name} />
          <Info title="Firma" value={employee?.company_name} />
          <Info title="Görev" value={employee?.job_title} />
          <Info title="E-posta" value={employee?.email} />
          <Info title="İşe Giriş" value={employee?.start_date} />
          <Info title="Risk Seviyesi" value="Normal" />
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          padding: 22,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 16,
          }}
        >
          Sağlık Özeti
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 16,
          }}
        >
          <Kpi
  title="EK-2"
  value={String(employee?.ek2_count ?? 0)}
/>

<Kpi
  title="Muayene"
  value={String(employee?.examination_count ?? 0)}
/>

<Kpi
  title="Reçete"
  value={String(employee?.prescription_count ?? 0)}
/>

<Kpi
  title="Tetkik"
  value={String(employee?.lab_count ?? 0)}
/>

<Kpi
  title="Aşı"
  value={String(employee?.vaccine_count ?? 0)}
/>

<Kpi
  title="İş Kazası"
  value={String(employee?.accident_count ?? 0)}
/>
        </div>
      </div>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#64748b",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontWeight: 800,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 14,
        padding: 18,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontWeight: 900,
          fontSize: 30,
        }}
      >
        {value}
      </div>
    </div>
  );
}