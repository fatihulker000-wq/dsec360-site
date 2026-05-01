"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  full_name: string;
  job_title?: string;
  phone?: string;
  email?: string;
  active: boolean;
};

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/employees")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Çalışanlar</h1>

      <div style={{ marginTop: 20 }}>
        {data.map((emp) => (
          <div
            key={emp.id}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <b>{emp.full_name}</b>
            <div>{emp.job_title}</div>
            <div>{emp.phone}</div>
            <div>{emp.email}</div>
            <div>
              Durum:{" "}
              {emp.active ? (
                <span style={{ color: "green" }}>Aktif</span>
              ) : (
                <span style={{ color: "red" }}>Pasif</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}