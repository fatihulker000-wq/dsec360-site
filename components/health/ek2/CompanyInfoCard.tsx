"use client";

type Props = {
  company: {
    company_name?: string;
    workplace_address?: string;
    nace_code?: string;
    danger_class?: string;
    employee_count?: number | string;
    sector?: string;
    employer?: string;
    isg_expert?: string;
    workplace_doctor?: string;
  };
};

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        borderBottom: "1px solid #e5e7eb",
        minHeight: 46,
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          padding: "10px 14px",
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          padding: "10px 14px",
          fontWeight: 700,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

export default function CompanyInfoCard({
  company,
}: Props) {
  return (
    <section
      style={{
        border: "2px solid #111827",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          background: "#0f766e",
          color: "#fff",
          padding: 12,
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        İŞYERİ BİLGİLERİ
      </div>

      <Row
        label="İşyeri / Firma"
        value={company.company_name}
      />

      <Row
        label="İşyeri Adresi"
        value={company.workplace_address}
      />

      <Row
        label="NACE Kodu"
        value={company.nace_code}
      />

      <Row
        label="Tehlike Sınıfı"
        value={company.danger_class}
      />

      <Row
        label="Faaliyet Alanı"
        value={company.sector}
      />

      <Row
        label="Çalışan Sayısı"
        value={company.employee_count}
      />

      <Row
        label="İşveren"
        value={company.employer}
      />

      <Row
        label="İSG Uzmanı"
        value={company.isg_expert}
      />

      <Row
        label="İşyeri Hekimi"
        value={company.workplace_doctor}
      />
    </section>
  );
}