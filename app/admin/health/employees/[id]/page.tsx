"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EmployeeHealthTabs from "@/components/health/EmployeeHealthTabs";
import GeneralTab from "@/components/health/tabs/GeneralTab";
import PrescriptionTab from "@/components/health/tabs/PrescriptionTab";
import Ek2Tab from "@/components/health/tabs/Ek2Tab";
import ExaminationTab from "@/components/health/tabs/ExaminationTab";

type Employee = {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  company_name: string;
  job_title: string;
  start_date: string;
};

export default function HealthEmployeeDetailPage() {
  const params = useParams();
  const employeeId = String(params?.id || "");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("Genel");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch("/api/admin/health-employees", {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          setEmployee(null);
          return;
        }

        const found = (json.employees || []).find(
          (item: Employee) => String(item.id) === employeeId
        );

        setEmployee(found || null);
      } catch {
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    }

    void loadEmployee();
  }, [employeeId]);

  return (
    <main
      style={{
        padding: 24,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <Link
            href="/admin/health/employees"
            style={{
              color: "#7f1d1d",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Çalışan Sağlık Kartlarına Dön
          </Link>
        </div>

        {loading ? (
          <div style={{ color: "#64748b", fontWeight: 700 }}>Yükleniyor...</div>
        ) : !employee ? (
          <div style={{ color: "#991b1b", fontWeight: 800 }}>
            Çalışan bulunamadı.
          </div>
        ) : (
          <>
            <section
              style={{
                background: "linear-gradient(135deg, #7f1d1d, #b91c1c)",
                color: "#fff",
                borderRadius: 24,
                padding: 28,
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 800 }}>
                D-SEC Sağlık Kartı
              </div>

              <h1 style={{ margin: "8px 0 6px", fontSize: 36 }}>
                {employee.full_name}
              </h1>

              <p style={{ margin: 0, opacity: 0.9 }}>
                {employee.company_name} • {employee.job_title || "Görev bilgisi yok"}
              </p>
            </section>

<EmployeeHealthTabs
  activeTab={activeTab}
  setActiveTab={setActiveTab}
/>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 20,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  border: "1px solid #e5e7eb",
                  padding: 22,
                }}
              >
               {activeTab === "Genel" && (
  <GeneralTab employee={employee} />
)}

{activeTab === "EK-2" && (
  <Ek2Tab />
)}

{activeTab === "Reçeteler" && (
  <PrescriptionTab employee={employee} />
)}

{activeTab === "Muayeneler" && (
  <ExaminationTab employee={employee as any} />
)}

{!["Genel", "EK-2", "Reçeteler"].includes(activeTab) && (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #e5e7eb",
      padding: 24,
      textAlign: "center",
      color: "#64748b",
      fontWeight: 700,
    }}
  >
    <h3 style={{ marginTop: 0 }}>{activeTab}</h3>

    <p>Bu sekme geliştiriliyor...</p>
  </div>
)}
              </div>

              <aside
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  border: "1px solid #e5e7eb",
                  padding: 22,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Sağlık Özeti</h3>

                <div style={{ display: "grid", gap: 12 }}>
                  <SummaryRow label="E-posta" value={employee.email || "-"} />
                  <SummaryRow label="İşe Giriş" value={employee.start_date || "-"} />
                  <SummaryRow label="Son Muayene" value="-" />
                  <SummaryRow label="Son EK-2" value="-" />
                  <SummaryRow label="Son Reçete" value="-" />
                  <SummaryRow label="Risk" value="Normal" />
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 10,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <span style={{ color: "#64748b", fontWeight: 700 }}>{label}</span>
      <strong style={{ textAlign: "right" }}>{value}</strong>
    </div>
  );
}