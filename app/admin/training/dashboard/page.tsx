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
  trainings?: Training[];
  risky_users?: RiskUser[];
  in_progress_users?: RiskUser[];
  completed_users?: RiskUser[];
  error?: string;
};

type KPIItem = {
  title: string;
  value: string;
  sub: string;
  tone: "blue" | "green" | "orange" | "red";
};

export default function TrainingDashboardPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"risk" | "progress" | "done">("risk");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/training-dashboard", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const json: DashboardResponse = await res.json();

        if (!res.ok) {
          setError(json?.error || "Dashboard yüklenemedi.");
          return;
        }

        setTrainings(Array.isArray(json.trainings) ? json.trainings : []);
        setRiskyUsers(Array.isArray(json.risky_users) ? json.risky_users : []);
        setInProgressUsers(
          Array.isArray(json.in_progress_users) ? json.in_progress_users : []
        );
        setCompletedUsers(
          Array.isArray(json.completed_users) ? json.completed_users : []
        );
      } catch (e) {
        console.error("training dashboard load error:", e);
        setError("Dashboard yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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

  const percent = (part: number, total: number) => {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  };

  const completionRate = percent(totals.completed, totals.assigned);
  const progressRate = percent(totals.inProgress, totals.assigned);
  const riskRate = percent(totals.notStarted, totals.assigned);

  const companyStats = useMemo(() => {
    const map = new Map<string, number>();

    riskyUsers.forEach((u) => {
      const key = (u.company_id || "Bilinmiyor").trim() || "Bilinmiyor";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [riskyUsers]);

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const topCompletedTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.completed_count - a.completed_count)
      .slice(0, 6);
  }, [trainings]);

  const filteredRiskyUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return riskyUsers;

    return riskyUsers.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.training_title || "").toLowerCase().includes(q) ||
        (u.company_id || "").toLowerCase().includes(q)
    );
  }, [riskyUsers, search]);

  const filteredInProgressUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inProgressUsers;

    return inProgressUsers.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.training_title || "").toLowerCase().includes(q) ||
        (u.company_id || "").toLowerCase().includes(q)
    );
  }, [inProgressUsers, search]);

  const filteredCompletedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completedUsers;

    return completedUsers.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.training_title || "").toLowerCase().includes(q) ||
        (u.company_id || "").toLowerCase().includes(q)
    );
  }, [completedUsers, search]);

  const kpis: KPIItem[] = [
    {
      title: "Toplam Atama",
      value: String(totals.assigned),
      sub: "Tüm eğitim atamaları",
      tone: "blue",
    },
    {
      title: "Tamamlanma Oranı",
      value: `%${completionRate}`,
      sub: `${totals.completed} çalışan tamamladı`,
      tone: "green",
    },
    {
      title: "Devam Eden Oran",
      value: `%${progressRate}`,
      sub: `${totals.inProgress} çalışan süreçte`,
      tone: "orange",
    },
    {
      title: "Riskli Oran",
      value: `%${riskRate}`,
      sub: `${totals.notStarted} çalışan başlamadı`,
      tone: "red",
    },
  ];

  const systemInsight = useMemo(() => {
    if (totals.assigned === 0) {
      return "Henüz eğitim ataması bulunmuyor.";
    }

    if (riskRate >= 40) {
      return "Başlamayan eğitim oranı yüksek. Öncelik riskli çalışanlara ve zorunlu eğitimlere verilmelidir.";
    }

    if (completionRate >= 75) {
      return "Genel eğitim performansı güçlü görünüyor. Tamamlanma oranı yüksek seviyede.";
    }

    if (progressRate >= 30) {
      return "Sistemde ciddi sayıda devam eden eğitim var. Yakın takiple tamamlanma oranı hızla yükseltilebilir.";
    }

    return "Eğitim süreçleri aktif durumda. Riskli eğitim grupları takip edilerek performans artırılabilir.";
  }, [totals.assigned, riskRate, completionRate, progressRate]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={heroSkeletonStyle} />
          <div style={kpiGridStyle}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={cardSkeletonStyle} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={errorBoxStyle}>
            <h1 style={{ marginTop: 0 }}>Hata</h1>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroStyle}>
          <div style={heroBadgeStyle}>D-SEC • Admin Eğitim Yönetimi</div>
          <h1 style={heroTitleStyle}>Eğitim Performans ve Risk Dashboard</h1>
          <p style={heroTextStyle}>
            Eğitim atamaları, ilerleme, riskli çalışanlar, firma yoğunluğu ve
            tamamlanma trendlerini tek ekrandan yönetin.
          </p>

          <div style={heroStatsRowStyle}>
            <HeroMiniStat label="Eğitim" value={String(trainings.length)} />
            <HeroMiniStat label="Riskli Çalışan" value={String(riskyUsers.length)} />
            <HeroMiniStat
              label="Devam Eden"
              value={String(inProgressUsers.length)}
            />
            <HeroMiniStat
              label="Tamamlanan"
              value={String(completedUsers.length)}
            />
          </div>
        </section>

        <section style={kpiGridStyle}>
          {kpis.map((item) => (
            <KpiCard key={item.title} item={item} />
          ))}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>Genel Analiz</div>
              <h2 style={sectionTitleStyle}>Durum Özeti</h2>
            </div>
          </div>

          <div style={twoColGridStyle}>
            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>Genel Performans</h3>

              <ProgressRow
                label="Tamamlandı"
                value={completionRate}
                color="#16a34a"
              />
              <ProgressRow
                label="Devam Ediyor"
                value={progressRate}
                color="#2563eb"
              />
              <ProgressRow
                label="Başlamadı"
                value={riskRate}
                color="#dc2626"
              />
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>Sistem Yorumu</h3>
              <div style={insightBoxStyle}>{systemInsight}</div>

              <div style={{ marginTop: 18 }}>
                <SimpleInfoRow
                  label="Toplam Eğitim"
                  value={String(trainings.length)}
                />
                <SimpleInfoRow
                  label="Toplam Atama"
                  value={String(totals.assigned)}
                />
                <SimpleInfoRow
                  label="En Kritik Grup"
                  value={
                    topRiskTrainings[0]?.title
                      ? topRiskTrainings[0].title
                      : "Veri yok"
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>Firma ve Eğitim Dağılımı</div>
              <h2 style={sectionTitleStyle}>Risk ve Başarı Analizi</h2>
            </div>
          </div>

          <div style={twoColGridStyle}>
            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>Firma Bazlı Risk</h3>
              {companyStats.length === 0 ? (
                <EmptyState text="Firma bazlı risk verisi bulunamadı." />
              ) : (
                companyStats.slice(0, 8).map(([company, count]) => (
                  <ProgressRow
                    key={company}
                    label={company}
                    value={count}
                    maxValue={Math.max(...companyStats.map((x) => x[1]), 1)}
                    color="#dc2626"
                    rawNumber
                  />
                ))
              )}
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>En Riskli Eğitimler</h3>
              {topRiskTrainings.length === 0 ? (
                <EmptyState text="Riskli eğitim verisi bulunamadı." />
              ) : (
                topRiskTrainings.map((t) => (
                  <MiniTrainingCard
                    key={t.id}
                    title={t.title}
                    leftLabel="Başlamayan"
                    leftValue={t.not_started_count}
                    rightLabel="Atanan"
                    rightValue={t.assigned_count}
                    tone="red"
                  />
                ))
              )}
            </div>
          </div>

          <div style={{ ...twoColGridStyle, marginTop: 18 }}>
            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>En Başarılı Eğitimler</h3>
              {topCompletedTrainings.length === 0 ? (
                <EmptyState text="Tamamlanan eğitim verisi bulunamadı." />
              ) : (
                topCompletedTrainings.map((t) => (
                  <MiniTrainingCard
                    key={t.id}
                    title={t.title}
                    leftLabel="Tamamlanan"
                    leftValue={t.completed_count}
                    rightLabel="Atanan"
                    rightValue={t.assigned_count}
                    tone="green"
                  />
                ))
              )}
            </div>

            <div style={panelStyle}>
              <h3 style={panelTitleStyle}>Eğitim Dağılımı</h3>
              {trainings.length === 0 ? (
                <EmptyState text="Eğitim verisi bulunamadı." />
              ) : (
                trainings.slice(0, 6).map((t) => (
                  <div key={t.id} style={distributionRowStyle}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {t.title}
                    </div>
                    <div style={distributionBadgesStyle}>
                      <SmallBadge text={`Atama ${t.assigned_count}`} tone="blue" />
                      <SmallBadge
                        text={`Tamamlanan ${t.completed_count}`}
                        tone="green"
                      />
                      <SmallBadge
                        text={`Devam ${t.in_progress_count}`}
                        tone="orange"
                      />
                      <SmallBadge
                        text={`Başlamadı ${t.not_started_count}`}
                        tone="red"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>Çalışan Yönetimi</div>
              <h2 style={sectionTitleStyle}>Detaylı Kullanıcı Takibi</h2>
            </div>

            <div style={toolbarStyle}>
              <button
                onClick={() => setActiveTab("risk")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "risk" ? activeTabButtonStyle : {}),
                }}
              >
                Riskli
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "progress" ? activeTabButtonStyle : {}),
                }}
              >
                Devam Eden
              </button>
              <button
                onClick={() => setActiveTab("done")}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === "done" ? activeTabButtonStyle : {}),
                }}
              >
                Tamamlanan
              </button>
            </div>
          </div>

          <div style={searchBoxWrapStyle}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, e-posta, eğitim veya firma ile ara..."
              style={searchInputStyle}
            />
          </div>

          <div style={listWrapStyle}>
            {activeTab === "risk" &&
              (filteredRiskyUsers.length === 0 ? (
                <EmptyState text="Riskli çalışan bulunamadı." />
              ) : (
                filteredRiskyUsers.map((u) => (
                  <UserRowCard
                    key={u.assignment_id}
                    user={u}
                    badgeText="Başlamadı"
                    badgeBg="#fee2e2"
                    badgeBorder="#fca5a5"
                    badgeColor="#b91c1c"
                  />
                ))
              ))}

            {activeTab === "progress" &&
              (filteredInProgressUsers.length === 0 ? (
                <EmptyState text="Devam eden çalışan bulunamadı." />
              ) : (
                filteredInProgressUsers.map((u) => (
                  <UserRowCard
                    key={u.assignment_id}
                    user={u}
                    badgeText="Devam Ediyor"
                    badgeBg="#eff6ff"
                    badgeBorder="#93c5fd"
                    badgeColor="#1d4ed8"
                  />
                ))
              ))}

            {activeTab === "done" &&
              (filteredCompletedUsers.length === 0 ? (
                <EmptyState text="Tamamlanan çalışan bulunamadı." />
              ) : (
                filteredCompletedUsers.map((u) => (
                  <UserRowCard
                    key={u.assignment_id}
                    user={u}
                    badgeText="Tamamlandı"
                    badgeBg="#f0fdf4"
                    badgeBorder="#86efac"
                    badgeColor="#166534"
                  />
                ))
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={heroMiniStatStyle}>
      <div style={heroMiniLabelStyle}>{label}</div>
      <div style={heroMiniValueStyle}>{value}</div>
    </div>
  );
}

function KpiCard({ item }: { item: KPIItem }) {
  const toneMap = {
    blue: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      value: "#1d4ed8",
    },
    green: {
      bg: "#f0fdf4",
      border: "#86efac",
      value: "#166534",
    },
    orange: {
      bg: "#fff7ed",
      border: "#fdba74",
      value: "#c2410c",
    },
    red: {
      bg: "#fef2f2",
      border: "#fca5a5",
      value: "#b91c1c",
    },
  };

  const tone = toneMap[item.tone];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          padding: "6px 10px",
          borderRadius: 999,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          fontSize: 12,
          fontWeight: 700,
          color: tone.value,
          marginBottom: 12,
        }}
      >
        {item.title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: "#0f172a",
          lineHeight: 1,
        }}
      >
        {item.value}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {item.sub}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
  maxValue = 100,
  rawNumber = false,
}: {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
  rawNumber?: boolean;
}) {
  const safePercent = Math.max(
    0,
    Math.min(100, Math.round((value / maxValue) * 100))
  );

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
          fontSize: 13,
          fontWeight: 700,
          color: "#334155",
        }}
      >
        <span>{label}</span>
        <span>{rawNumber ? value : `%${value}`}</span>
      </div>

      <div
        style={{
          width: "100%",
          height: 10,
          background: "#e5e7eb",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${safePercent}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function MiniTrainingCard({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  tone,
}: {
  title: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  tone: "red" | "green";
}) {
  const tones = {
    red: {
      bg: "#fff5f5",
      border: "#fecaca",
      pill: "#fee2e2",
      color: "#b91c1c",
    },
    green: {
      bg: "#f6fff8",
      border: "#bbf7d0",
      pill: "#dcfce7",
      color: "#166534",
    },
  };

  const t = tones[tone];

  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        background: t.bg,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: t.pill,
            color: t.color,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {leftLabel}: {leftValue}
        </span>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "#ffffff",
            color: "#334155",
            fontSize: 12,
            fontWeight: 700,
            border: "1px solid #e5e7eb",
          }}
        >
          {rightLabel}: {rightValue}
        </span>
      </div>
    </div>
  );
}

function SmallBadge({
  text,
  tone,
}: {
  text: string;
  tone: "blue" | "green" | "orange" | "red";
}) {
  const toneMap = {
    blue: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      color: "#1d4ed8",
    },
    green: {
      bg: "#f0fdf4",
      border: "#86efac",
      color: "#166534",
    },
    orange: {
      bg: "#fff7ed",
      border: "#fdba74",
      color: "#c2410c",
    },
    red: {
      bg: "#fef2f2",
      border: "#fca5a5",
      color: "#b91c1c",
    },
  };

  const item = toneMap[tone];

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: item.bg,
        border: `1px solid ${item.border}`,
        color: item.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

function SimpleInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #e5e7eb",
        fontSize: 14,
      }}
    >
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 800, color: "#0f172a" }}>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        background: "#f8fafc",
        borderRadius: 14,
        padding: 18,
        color: "#64748b",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function UserRowCard({
  user,
  badgeText,
  badgeBg,
  badgeBorder,
  badgeColor,
}: {
  user: RiskUser;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 900,
              color: "#0f172a",
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            {user.full_name || "Adsız kullanıcı"}
          </div>

          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            {user.email || "Email yok"}
            <br />
            Eğitim: {user.training_title || "-"}
            <br />
            Firma: {user.company_id || "Bilinmiyor"}
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            padding: "7px 11px",
            borderRadius: 999,
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
            fontSize: 12,
            fontWeight: 800,
            color: badgeColor,
          }}
        >
          {badgeText}
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f8fbff 0%, #f8fafc 38%, #eef4ff 100%)",
  padding: "32px 20px",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #2563eb 100%)",
  color: "#fff",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 20px 50px rgba(37,99,235,0.22)",
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: 12,
  fontWeight: 800,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.05,
  margin: "16px 0 10px 0",
  fontWeight: 900,
};

const heroTextStyle: React.CSSProperties = {
  maxWidth: 860,
  lineHeight: 1.7,
  fontSize: 15,
  color: "rgba(255,255,255,0.88)",
  marginBottom: 22,
};

const heroStatsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const heroMiniStatStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 16,
};

const heroMiniLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.76)",
  marginBottom: 8,
  fontWeight: 700,
};

const heroMiniValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
};

const sectionStyle: React.CSSProperties = {
  marginTop: 24,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 18,
};

const sectionEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  marginBottom: 6,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "#0f172a",
  fontWeight: 900,
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 24,
};

const twoColGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 18,
  background: "#fcfdff",
};

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  color: "#0f172a",
  fontSize: 18,
  fontWeight: 800,
};

const insightBoxStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
  borderRadius: 16,
  padding: 16,
  lineHeight: 1.7,
  fontWeight: 700,
};

const distributionRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  padding: "12px 0",
};

const distributionBadgesStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 8,
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const tabButtonStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  background: "#fff",
  color: "#334155",
  borderRadius: 999,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const activeTabButtonStyle: React.CSSProperties = {
  background: "#2563eb",
  border: "1px solid #2563eb",
  color: "#fff",
};

const searchBoxWrapStyle: React.CSSProperties = {
  marginBottom: 18,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #dbe3ef",
  outline: "none",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
};

const listWrapStyle: React.CSSProperties = {
  marginTop: 8,
};

const heroSkeletonStyle: React.CSSProperties = {
  height: 220,
  borderRadius: 24,
  background: "#e5e7eb",
};

const cardSkeletonStyle: React.CSSProperties = {
  height: 140,
  borderRadius: 18,
  background: "#e5e7eb",
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #fecaca",
  borderRadius: 18,
  padding: 24,
  color: "#991b1b",
};