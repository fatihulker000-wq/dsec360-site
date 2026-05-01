"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: string;
  firm_id?: string | null;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  tc_no?: string | null;
  start_date?: string | null;
  exit_date?: string | null;
  active: boolean;
};

type Company = {
  id: string;
  name: string;
};

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [firmFilter, setFirmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");

  const loadEmployees = async (firmId = firmFilter) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/employees?firmId=${encodeURIComponent(firmId)}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setData([]);
        setError(json?.error || "Çalışanlar alınamadı.");
        return;
      }

      setData(json?.data || []);
      setCompanies(json?.companies || []);
    } catch {
      setData([]);
      setError("Çalışan listesi yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = data;

    if (statusFilter === "active") list = list.filter((x) => x.active);
    if (statusFilter === "passive") list = list.filter((x) => !x.active);

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((emp) =>
      [
        emp.full_name,
        emp.job_title,
        emp.phone,
        emp.email,
        emp.registry_no,
        emp.tc_no,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data, search, statusFilter]);

  const activeCount = data.filter((x) => x.active).length;
  const passiveCount = data.filter((x) => !x.active).length;
 const activeEmployees = data.filter((x) => x.active);

const maleCount = activeEmployees.filter((x: any) => {
  const v = String(x.gender || "").toLowerCase().trim();
  return v === "erkek" || v === "e" || v === "male" || v === "bay";
}).length;

const femaleCount = activeEmployees.filter((x: any) => {
  const v = String(x.gender || "").toLowerCase().trim();
  return v === "kadın" || v === "kadin" || v === "k" || v === "female" || v === "bayan";
}).length;

const disabledCount = activeEmployees.filter((x: any) => {
  const v = String(x.disability_status || "").toLowerCase().trim();
  if (!v || v === "yok" || v === "hayır" || v === "hayir" || v === "0" || v === "false") return false;
  return true;
}).length;
  return (
    <main style={{ padding: 28 }}>
      <div
        style={{
          borderRadius: 28,
          padding: 28,
          background:
            "linear-gradient(135deg, #4a0d1a 0%, #7f1734 48%, #c62828 100%)",
          color: "#fff",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>
          D-SEC Çalışan Yönetimi
        </div>

        <h1 style={{ margin: "10px 0 8px", fontSize: 34, fontWeight: 900 }}>
          Çalışanlar
        </h1>

        <p style={{ margin: 0, opacity: 0.88 }}>
          Web-app entegrasyonlu çalışan listesi, aktif/pasif takip ve firma bazlı arama ekranı.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Kpi title="Toplam" value={data.length} />
<Kpi title="Aktif" value={activeCount} />
<Kpi title="Pasif" value={passiveCount} />
<Kpi title="Görünen" value={filtered.length} />
<Kpi title="Erkek" value={maleCount} />
<Kpi title="Kadın" value={femaleCount} />
<Kpi title="Engelli" value={disabledCount} />
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 22,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={firmFilter}
            onChange={(e) => {
              const nextFirmId = e.target.value;
              setFirmFilter(nextFirmId);
              void loadEmployees(nextFirmId);
            }}
            style={{
              minWidth: 240,
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
              background: "#fff",
              fontWeight: 800,
              color: "#374151",
            }}
          >
            <option value="all">Tüm firmalar</option>
            {companies.map((firm) => (
              <option key={firm.id} value={firm.id}>
                {firm.name || "Firma"}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, ünvan, telefon, e-posta, sicil veya TC ara"
            style={{
              flex: 1,
              minWidth: 260,
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 14,
            }}
          />

          <button onClick={() => setStatusFilter("all")} style={btn(statusFilter === "all")}>
            Tümü
          </button>
          <button onClick={() => setStatusFilter("active")} style={btn(statusFilter === "active")}>
            Aktif
          </button>
          <button onClick={() => setStatusFilter("passive")} style={btn(statusFilter === "passive")}>
            Pasif
          </button>

          <button
            onClick={() => loadEmployees(firmFilter)}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "12px 16px",
              background: "#111827",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
        </div>
      </section>

      {loading ? (
        <CardText title="Yükleniyor" text="Çalışan kayıtları getiriliyor..." />
      ) : error ? (
        <CardText title="Hata" text={error} />
      ) : filtered.length === 0 ? (
        <CardText title="Kayıt bulunamadı" text="Seçili filtreye uygun çalışan görünmüyor." />
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          {filtered.map((emp) => (
            <div
              key={emp.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 22,
                padding: 18,
                boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 900, color: "#111827" }}>
                    {emp.full_name || "Adsız çalışan"}
                  </div>

                  <div style={{ marginTop: 6, color: "#6b7280", lineHeight: 1.7 }}>
                    <div>Ünvan: {emp.job_title || "-"}</div>
                    <div>Telefon: {emp.phone || "-"}</div>
                    <div>E-posta: {emp.email || "-"}</div>
                    <div>Sicil: {emp.registry_no || "-"}</div>
                    <div>Firma ID: {emp.firm_id || "-"}</div>
                  </div>
                </div>

                <span
                  style={{
                    height: 34,
                    padding: "8px 12px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 900,
                    background: emp.active ? "#ecfdf5" : "#fef2f2",
                    color: emp.active ? "#166534" : "#b91c1c",
                  }}
                >
                  {emp.active ? "Aktif" : "Pasif"}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 950, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function CardText({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 22,
      }}
    >
      <h3 style={{ margin: 0, color: "#111827" }}>{title}</h3>
      <p style={{ marginBottom: 0, color: "#6b7280" }}>{text}</p>
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "12px 16px",
    background: active ? "#c62828" : "#fff",
    color: active ? "#fff" : "#374151",
    fontWeight: 800,
    cursor: "pointer",
  };
}