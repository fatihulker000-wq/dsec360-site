  "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HealthEmployee = {

ek2_count?: number;
last_ek2?: string;
last_ek2_date?: string;
last_ek2_status?: string;
  id: string;
  full_name: string;
  email: string;
  company_id: string;
  company_name: string;
  job_title: string;
  start_date: string;

  examination_count: number;
  last_examination_date: string;
  last_examination_decision: string;
  next_examination_date: string;
};

export default function HealthEmployeesPage() {
  const [employees, setEmployees] = useState<HealthEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [firm, setFirm] = useState("ALL");
  const [risk, setRisk] = useState("ALL");

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/admin/health-employees", {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();

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

  const firmOptions = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((x) => x.company_name || "Firma Yok")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "tr"));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const nameOk =
        !q ||
        employee.full_name.toLowerCase().includes(q) ||
        employee.email.toLowerCase().includes(q) ||
        employee.job_title.toLowerCase().includes(q) ||
        employee.company_name.toLowerCase().includes(q);

      const firmOk = firm === "ALL" || employee.company_name === firm;

      const riskOk = risk === "ALL" || risk === "NORMAL";

      return nameOk && firmOk && riskOk;
    });
  }, [employees, search, firm, risk]);

  const activeFirmName =
    firm === "ALL" ? "Tüm Firmalar" : firm;

  const totalEmployees = filteredEmployees.length;

  return (
    <main
      style={{
        padding: 24,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 34, fontWeight: 950, margin: 0 }}>
            Çalışan Sağlık Kartları
          </h1>

          <p style={{ color: "#64748b", marginTop: 8 }}>
            Çalışanların muayene, EK-2, reçete ve sağlık geçmişi tek ekrandan yönetilir.
          </p>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
            color: "#fff",
            borderRadius: 24,
            padding: 26,
            marginBottom: 22,
            boxShadow: "0 18px 40px rgba(127,29,29,.18)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.85 }}>
            SAĞLIK YÖNETİM MERKEZİ
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr repeat(5, 1fr)",
              gap: 16,
              alignItems: "end",
              marginTop: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 950 }}>
                {activeFirmName}
              </div>
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                Çalışan sağlık kayıtları ve hekim çalışma alanı
              </div>
            </div>

            <MiniStat title="Çalışan" value={totalEmployees} />
           <MiniStat
  title="Yaklaşan Muayene"
  value={
    employees.filter((e) => !!e.next_examination_date).length
  }
/>
            <MiniStat title="EK-2 Bekleyen" value={0} />
            <MiniStat title="Aşı Bekleyen" value={0} />
            <MiniStat title="Kritik" value={0} />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Çalışan, görev, firma veya e-posta ara..."
            style={inputStyle}
          />

          <select
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            style={inputStyle}
          >
            <option value="ALL">Tüm Firmalar</option>
            {firmOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            style={inputStyle}
          >
            <option value="ALL">Tüm Risk Durumları</option>
            <option value="NORMAL">Normal</option>
          </select>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 22,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 14px 34px rgba(15,23,42,.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 1.3fr 1.1fr 1fr 1fr 1fr 1fr 170px",
              gap: 10,
              padding: 16,
              background: "#f1f5f9",
              fontWeight: 950,
              fontSize: 13,
              color: "#334155",
            }}
          >
            <div>Çalışan</div>
            <div>Firma</div>
            <div>Görev</div>
            <div>Son Muayene</div>
            <div>EK-2</div>
            <div>Reçete</div>
            <div>Risk</div>
            <div>İşlem</div>
          </div>

          {loading ? (
            <EmptyRow text="Çalışanlar yükleniyor..." />
          ) : filteredEmployees.length === 0 ? (
            <EmptyRow text="Çalışan bulunamadı." />
          ) : (
            filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2.2fr 1.3fr 1.1fr 1fr 1fr 1fr 1fr 170px",
                  gap: 10,
                  padding: 16,
                  borderTop: "1px solid #e5e7eb",
                  alignItems: "center",
                  background: index % 2 === 0 ? "#fff" : "#fbfbfd",
                  fontSize: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#fff1f2",
                      color: "#7f1d1d",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 950,
                    }}
                  >
                    {getInitial(employee.full_name)}
                  </div>

                  <div>
                    <div style={{ fontWeight: 950, color: "#111827" }}>
                      {employee.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                      {employee.email || "-"}
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: 800, color: "#334155" }}>
                  {employee.company_name || "Firma Yok"}
                </div>

                <div style={{ color: "#475569", fontWeight: 750 }}>
                  {employee.job_title || "-"}
                </div>

                <Badge
  text={employee.last_examination_date || "-"}
  tone="neutral"
/>

<Badge
  text={(employee as any).last_ek2 || (employee as any).last_ek2_date || "-"}
  tone="neutral"
/>


<Badge
  text={employee.last_examination_decision || "Normal"}
  tone={
    employee.last_examination_decision === "Uygun Değil"
      ? "bad"
      : employee.last_examination_decision === "Kısıtlı Uygun"
      ? "warning"
      : "good"
  }
/>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/admin/health/employees/${employee.id}`}
                    style={buttonStyle}
                  >
                    Detay
                  </Link>

                  <Link
                    href={`/admin/health/employees/${employee.id}?tab=Muayeneler`}
                    style={lightButtonStyle}
                  >
                    Muayene
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Link
            href="/admin/health"
            style={{
              padding: "12px 18px",
              borderRadius: 14,
              textDecoration: "none",
              background: "#7f1d1d",
              color: "#fff",
              fontWeight: 900,
            }}
          >
            Sağlık Dashboard'a Dön
          </Link>
        </div>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.14)",
        border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 18,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 950, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "#64748b",
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: "good" | "warning" | "bad" | "neutral";
}) {
  const styles = {
    good: { bg: "#f0fdf4", color: "#15803d" },
    warning: { bg: "#fff7ed", color: "#c2410c" },
    bad: { bg: "#fef2f2", color: "#b91c1c" },
    neutral: { bg: "#f8fafc", color: "#64748b" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        justifyContent: "center",
        padding: "7px 10px",
        borderRadius: 999,
        background: styles.bg,
        color: styles.color,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

function getInitial(name: string) {
  return String(name || "Ç").trim().charAt(0).toUpperCase();
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  outline: "none",
  fontWeight: 700,
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
};

const lightButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  background: "#fff1f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  fontWeight: 900,
  fontSize: 13,
};
