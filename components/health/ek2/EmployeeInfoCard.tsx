"use client";

type Props = {
  employee: {
    full_name?: string;
    identity_number?: string;
    birth_date?: string;
    gender?: string;
    blood_group?: string;
    phone?: string;

    company_name?: string;
    job_title?: string;
    start_date?: string;

    workplace_address?: string;
    nace_code?: string;
    danger_class?: string;
  };
};

function Row({
  label,
  value,
}: {
  label: string;
  value?: string;
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

export default function EmployeeInfoCard({
  employee,
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
          background: "#7f1d1d",
          color: "#fff",
          padding: 12,
          fontWeight: 900,
          fontSize: 18,
        }}
      >
        ÇALIŞAN BİLGİLERİ
      </div>

      <Row
        label="Adı Soyadı"
        value={employee.full_name}
      />

      <Row
        label="T.C. Kimlik No"
        value={employee.identity_number}
      />

      <Row
        label="Doğum Tarihi"
        value={employee.birth_date}
      />

      <Row
        label="Cinsiyet"
        value={employee.gender}
      />

      <Row
        label="Kan Grubu"
        value={employee.blood_group}
      />

      <Row
        label="Telefon"
        value={employee.phone}
      />

      <Row
        label="İşyeri / Firma"
        value={employee.company_name}
      />

      <Row
        label="Görevi / Mesleği"
        value={employee.job_title}
      />

      <Row
        label="İşe Giriş Tarihi"
        value={employee.start_date}
      />

      <Row
        label="İşyeri Adresi"
        value={employee.workplace_address}
      />

      <Row
        label="NACE Kodu"
        value={employee.nace_code}
      />

      <Row
        label="Tehlike Sınıfı"
        value={employee.danger_class}
      />
    </section>
);
}