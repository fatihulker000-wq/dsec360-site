"use client";

import { useEffect, useMemo, useState } from "react";

type TrainingStatus = "not_started" | "in_progress" | "completed";

type ReportRow = {
  user?: string;
  training?: string;
  status?: TrainingStatus | string;
  company?: string;
};

function getStatusMeta(status?: string) {
  if (status === "completed") {
    return {
      label: "Tamamlandı",
      bg: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (status === "in_progress") {
    return {
      label: "Devam Ediyor",
      bg: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    };
  }

  return {
    label: "Başlanmadı",
    bg: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
  };
}

export default function TrainingReportPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/training-report", {
          cache: "no-store",
        });
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const companies = useMemo(() => {
    const items = Array.from(
      new Set(
        data
          .map((x) => (x.company || "").trim())
          .filter(Boolean)
      )
    );
    return items.sort((a, b) => a.localeCompare(b, "tr"));
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !search ||
        `${item.user || ""} ${item.training || ""} ${item.company || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const matchesCompany =
        companyFilter === "all" ? true : item.company === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [data, search, statusFilter, companyFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter((x) => x.status === "completed").length;
    const inProgress = filtered.filter((x) => x.status === "in_progress").length;
    const notStarted = filtered.filter((x) => x.status === "not_started").length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate,
    };
  }, [filtered]);

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Eğitim Yönetimi</div>
          <h1 className="hero-title">Premium Eğitim Takip Dashboard</h1>
          <p className="hero-desc">
            Firma, çalışan ve eğitim bazlı ilerlemeyi tek ekrandan izleyin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Toplam Kayıt</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {stats.total}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#b91c1c" }}>Başlanmadı</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {stats.notStarted}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#92400e" }}>Devam Ediyor</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {stats.inProgress}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#166534" }}>Tamamlanma</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                %{stats.completionRate}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Ara
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Çalışan, eğitim veya firma ara..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Durum
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Tümü</option>
                  <option value="not_started">Başlanmadı</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Firma
                </div>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Tüm Firmalar</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#374151",
                marginBottom: "10px",
              }}
            >
              Genel Tamamlanma Oranı
            </div>

            <div
              style={{
                width: "100%",
                height: "14px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${stats.completionRate}%`,
                  height: "100%",
                  background: "#16a34a",
                  transition: "width 0.25s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {stats.completed} / {stats.total} kayıt tamamlandı
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <h3 className="card-title" style={{ margin: 0 }}>
                Eğitim Durum Listesi
              </h3>

              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                Gösterilen kayıt: {filtered.length}
              </div>
            </div>

            {loading ? (
              <div className="card-text">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="card-text">Gösterilecek kayıt bulunamadı.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 10px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#6b7280",
                          padding: "0 12px 8px 12px",
                        }}
                      >
                        Çalışan
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#6b7280",
                          padding: "0 12px 8px 12px",
                        }}
                      >
                        Firma
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#6b7280",
                          padding: "0 12px 8px 12px",
                        }}
                      >
                        Eğitim
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#6b7280",
                          padding: "0 12px 8px 12px",
                        }}
                      >
                        Durum
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((item, i) => {
                      const statusMeta = getStatusMeta(item.status);

                      return (
                        <tr key={`${item.user}-${item.training}-${i}`}>
                          <td
                            style={{
                              background: "#f9fafb",
                              padding: "14px 12px",
                              borderTopLeftRadius: "14px",
                              borderBottomLeftRadius: "14px",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {item.user || "-"}
                          </td>

                          <td
                            style={{
                              background: "#f9fafb",
                              padding: "14px 12px",
                              color: "#374151",
                            }}
                          >
                            {item.company || "-"}
                          </td>

                          <td
                            style={{
                              background: "#f9fafb",
                              padding: "14px 12px",
                              color: "#374151",
                            }}
                          >
                            {item.training || "-"}
                          </td>

                          <td
                            style={{
                              background: "#f9fafb",
                              padding: "14px 12px",
                              borderTopRightRadius: "14px",
                              borderBottomRightRadius: "14px",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px 12px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 800,
                                background: statusMeta.bg,
                                color: statusMeta.color,
                                border: statusMeta.border,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}