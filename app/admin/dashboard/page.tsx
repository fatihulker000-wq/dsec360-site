"use client";

import { useEffect, useMemo, useState } from "react";

type Training = {
  id: string;
  title: string;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
};

type RiskUser = {
  assignment_id: string;
  user_id: string;
  training_id: string;
  full_name: string;
  email: string;
  company_id: string;
  training_title: string;
  status: "not_started" | "in_progress" | "completed";
};

type DashboardResponse = {
  success?: boolean;
  trainings?: Training[];
  risky_users?: RiskUser[];
  in_progress_users?: RiskUser[];
  completed_users?: RiskUser[];
  error?: string;
  detail?: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  redSoft: "#fff1f1",
  green: "#166534",
  greenSoft: "#f0fdf4",
  blue: "#1d4ed8",
  blueSoft: "#eff6ff",
  amber: "#92400e",
  amberSoft: "#fff7ed",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 20,
    padding: 20,
    boxShadow: BRAND.shadow,
  };
}

function badgeStyle(
  bg: string,
  color: string,
  border?: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: bg,
    color,
    border: `1px solid ${border || bg}`,
  };
}

export default function AdminDashboardPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/training-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: DashboardResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Veri alınamadı.");
        setTrainings([]);
        setRiskyUsers([]);
        setInProgressUsers([]);
        setCompletedUsers([]);
        return;
      }

      setTrainings(json.trainings || []);
      setRiskyUsers(json.risky_users || []);
      setInProgressUsers(json.in_progress_users || []);
      setCompletedUsers(json.completed_users || []);
    } catch (err) {
      console.error(err);
      setError("Veri alınamadı.");
      setTrainings([]);
      setRiskyUsers([]);
      setInProgressUsers([]);
      setCompletedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const element = document.getElementById("admin-dashboard-pdf");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 1.2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("dsec-dashboard.pdf");
  };

  const totals = useMemo(() => {
    let assigned = 0;
    let completed = 0;
    let notStarted = 0;
    let inProgress = 0;

    trainings.forEach((t) => {
      assigned += Number(t.assigned_count || 0);
      completed += Number(t.completed_count || 0);
      notStarted += Number(t.not_started_count || 0);
      inProgress += Number(t.in_progress_count || 0);
    });

    return { assigned, completed, notStarted, inProgress };
  }, [trainings]);

  const completionRate = totals.assigned
    ? Math.round((totals.completed / totals.assigned) * 100)
    : 0;

  const inProgressRate = totals.assigned
    ? Math.round((totals.inProgress / totals.assigned) * 100)
    : 0;

  const riskRate = totals.assigned
    ? Math.round((totals.notStarted / totals.assigned) * 100)
    : 0;

  const companies = useMemo(() => {
    const set = new Set<string>();
    riskyUsers.forEach((u) => set.add((u.company_id || "Firma Yok").trim() || "Firma Yok"));
    inProgressUsers.forEach((u) =>
      set.add((u.company_id || "Firma Yok").trim() || "Firma Yok")
    );
    completedUsers.forEach((u) =>
      set.add((u.company_id || "Firma Yok").trim() || "Firma Yok")
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [riskyUsers, inProgressUsers, completedUsers]);

  const filteredRiskUsers = useMemo(() => {
    if (selectedCompany === "all") return riskyUsers;
    return riskyUsers.filter(
      (u) => ((u.company_id || "Firma Yok").trim() || "Firma Yok") === selectedCompany
    );
  }, [selectedCompany, riskyUsers]);

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const groupedRiskCompanies = useMemo(() => {
    const map = new Map<string, number>();
    filteredRiskUsers.forEach((u) => {
      const key = (u.company_id || "Firma Yok").trim() || "Firma Yok";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRiskUsers]);

  const groupedRiskTrainings = useMemo(() => {
    const map = new Map<string, number>();
    filteredRiskUsers.forEach((u) => {
      const key = u.training_title || "Eğitim";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRiskUsers]);

  const aiComment =
    riskRate >= 60
      ? "Risk yüksek. Başlamayan eğitimler için hızlı aksiyon, hatırlatma ve firma bazlı takip önerilir."
      : riskRate >= 30
      ? "Risk orta seviyede. Devam eden ve başlamayan kullanıcı kümeleri yakından izlenmeli."
      : "Genel görünüm kontrollü. Tamamlanma oranı desteklenerek süreç sürdürülebilir.";

  if (loading) {
    return <div style={{ padding: 24 }}>Yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: BRAND.red, fontWeight: 700 }}>{error}</div>;
  }

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: 24,
      }}
    >
      <div id="admin-dashboard-pdf" style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  ...badgeStyle("rgba(255,255,255,0.16)", "#fff", "rgba(255,255,255,0.22)"),
                  marginBottom: 12,
                }}
              >
                D-SEC • Admin Dashboard
              </div>
              <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900 }}>
                Eğitim Yönetim Paneli
              </h1>
              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: 820,
                  lineHeight: 1.7,
                }}
              >
                Eğitim atamaları, riskli kullanıcılar, firma yoğunluğu ve tamamlanma
                oranları tek panelde izlenir.
              </p>
            </div>

            <button
              onClick={exportPDF}
              style={{
                border: "none",
                borderRadius: 14,
                padding: "12px 18px",
                background: "#fff",
                color: BRAND.red,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              PDF İndir
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Atama</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
              {totals.assigned}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.green }}>Tamamlanma</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
              %{completionRate}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.blue }}>Devam Eden</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
              %{inProgressRate}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.amber }}>Riskli Oran</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>
              %{riskRate}
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: BRAND.text }}>
              Yönetici Yorumu
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted, lineHeight: 1.7 }}>
              {aiComment}
            </div>
          </div>

          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontWeight: 700,
                minWidth: 220,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
              En Riskli Eğitimler
            </h2>

            {topRiskTrainings.length === 0 ? (
              <div style={{ color: BRAND.muted }}>Veri bulunamadı.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {topRiskTrainings.map((item) => {
                  const percent = totals.notStarted
                    ? Math.round((item.not_started_count / totals.notStarted) * 100)
                    : 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        borderRadius: 16,
                        padding: 14,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 800, color: BRAND.text }}>{item.title}</div>
                        <div style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                          {item.not_started_count}
                        </div>
                      </div>

                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "#f3f4f6",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(4, percent)}%`,
                            height: "100%",
                            background: BRAND.red,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
              Firma Bazlı Risk
            </h2>

            {groupedRiskCompanies.length === 0 ? (
              <div style={{ color: BRAND.muted }}>Veri bulunamadı.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {groupedRiskCompanies.map((item) => {
                  const percent = filteredRiskUsers.length
                    ? Math.round((item.count / filteredRiskUsers.length) * 100)
                    : 0;

                  return (
                    <div key={item.name}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.text }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.red }}>
                          {item.count}
                        </div>
                      </div>

                      <div
                        style={{
                          height: 12,
                          borderRadius: 999,
                          background: "#f3f4f6",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(4, percent)}%`,
                            height: "100%",
                            background: BRAND.red,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
        >
          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
              Riskli Kullanıcılar
            </h2>
            <div style={{ fontSize: 32, fontWeight: 900, color: BRAND.red }}>
              {filteredRiskUsers.length}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Seçili firma filtresine göre toplam riskli kullanıcı
            </div>
          </section>

          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
              Devam Eden
            </h2>
            <div style={{ fontSize: 32, fontWeight: 900, color: BRAND.blue }}>
              {inProgressUsers.length}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Süreci devam eden kullanıcı sayısı
            </div>
          </section>

          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
              Tamamlayanlar
            </h2>
            <div style={{ fontSize: 32, fontWeight: 900, color: BRAND.green }}>
              {completedUsers.length}
            </div>
            <div style={{ marginTop: 8, color: BRAND.muted }}>
              Final başarıyla kapanan kullanıcı sayısı
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle(), marginTop: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
            Riskli Eğitim Dağılımı
          </h2>

          {groupedRiskTrainings.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Veri bulunamadı.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {groupedRiskTrainings.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    borderBottom: `1px solid ${BRAND.border}`,
                    paddingBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 700, color: BRAND.text }}>{item.name}</div>
                  <div style={badgeStyle(BRAND.redSoft, BRAND.red, "#f3c8c8")}>
                    {item.count} kişi
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}