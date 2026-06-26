"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HealthEmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadEmployees() {
    try {
      const res = await fetch("/api/admin/health-employees", {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();
      console.log("API RESPONSE:", json);
console.log("EMPLOYEES:", json.employees);

      if (!res.ok) {
        setEmployees([]);
        return;
      }

      setEmployees(json.employees || []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  void loadEmployees();
}, []);

  return (
    <main
      style={{
        padding: 24,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 34,
            fontWeight: 900,
            marginBottom: 8,
          }}
        >
          Çalışan Sağlık Kartları
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom: 30,
          }}
        >
          Çalışanların tüm sağlık kayıtları tek ekrandan yönetilir.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <input
            placeholder="Çalışan ara..."
            style={{
              flex: 1,
              minWidth: 280,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #d1d5db",
            }}
          />

          <select
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #d1d5db",
            }}
          >
            <option>Tüm Firmalar</option>
          </select>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr 1fr 1fr 1fr 160px",
              padding: 16,
              background: "#f1f5f9",
              fontWeight: 800,
            }}
          >
            <div>Çalışan</div>
            <div>Son Muayene</div>
            <div>EK-2</div>
            <div>Reçete</div>
            <div>Risk</div>
            <div>İşlem</div>
          </div>

          {loading ? (
  <div
    style={{
      padding: 40,
      textAlign: "center",
      color: "#64748b",
    }}
  >
    Yükleniyor...
  </div>
) : employees.length === 0 ? (
  <div
    style={{
      padding: 40,
      textAlign: "center",
      color: "#64748b",
    }}
  >
    Çalışan bulunamadı.
  </div>
) : (
  employees.map((employee) => (
    <div
      key={employee.id}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 160px",
        padding: 16,
        borderTop: "1px solid #e5e7eb",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 800 }}>
          {employee.full_name}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          {employee.company_name}
        </div>
      </div>

      <div>-</div>
      <div>-</div>
      <div>-</div>

      <div
        style={{
          color: "#16a34a",
          fontWeight: 700,
        }}
      >
        Normal
      </div>

      <div>
        <Link
          href={`/admin/health/employees/${employee.id}`}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            textDecoration: "none",
            background: "#7f1d1d",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Detay
        </Link>
      </div>
    </div>
  ))
)}
        </div>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Link
            href="/admin/health"
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              textDecoration: "none",
              background: "#7f1d1d",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Sağlık Dashboard'a Dön
          </Link>
        </div>
      </div>
    </main>
  );
}
