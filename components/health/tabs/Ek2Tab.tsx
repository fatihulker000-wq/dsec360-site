"use client";

export default function Ek2Tab() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
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
        <h2 style={{ marginTop: 0 }}>
          EK-2 İşe Giriş / Periyodik Muayene Formu
        </h2>

        <p style={{ color: "#64748b" }}>
          Bu ekran işyeri hekiminin EK-2 formunu dijital olarak hazırladığı ana çalışma alanıdır.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {[
          "Genel",
          "Mesleki Anamnez",
          "Özgeçmiş",
          "Soygeçmiş",
          "Fizik Muayene",
          "Vital Bulgular",
          "Laboratuvar",
          "Mesleki Riskler",
          "Kanaat",
          "PDF",
        ].map((item) => (
          <button
            key={item}
            style={{
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          minHeight: 500,
          padding: 24,
        }}
      >
        Burada aktif EK-2 sekmesi görüntülenecek.
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8fafc",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <strong>Otomatik Kaydediliyor</strong>

        <span style={{ color: "#16a34a", fontWeight: 700 }}>
          ✓ Son kayıt: Az önce
        </span>
      </div>
    </div>
  );
}