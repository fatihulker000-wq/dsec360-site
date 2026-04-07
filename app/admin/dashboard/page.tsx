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

export default function AdminDashboardPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
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
        setError(json?.error || "Eğitim verileri alınamadı.");
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
      console.error("training dashboard load error:", err);
      setError("Eğitim verileri alınamadı.");
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

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const companyRiskStats = useMemo(() => {
    const map = new Map<string, number>();

    riskyUsers.forEach((u) => {
      const key = (u.company_id || "Firma Yok").trim();
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [riskyUsers]);

  const progressBars = [
    {
      label: "Tamamlandı",
      value: completionRate,
      color: "#16a34a",
    },
    {
      label: "Devam Ediyor",
      value: inProgressRate,
      color: "#2563eb",
    },
    {
      label: "Başlamadı",
      value: riskRate,
      color: "#dc2626",
    },
  ];

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 18px 48px rgba(15,23,42,0.08)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Yükleniyor...</h1>
            <p style={{ color: "#475569" }}>Dashboard hazırlanıyor.</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: "24px",
              padding: "28px",
              color: "#991b1b",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Hata</h1>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 25%, #ffffff 100%)",
        padding: "32px 20px 48px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
        <div
          style={{
            borderRadius: "30px",
            padding: "30px",
            background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #0f766e 100%)",
            color: "#ffffff",
            boxShadow: "0 26px 70px rgba(15,23,42,0.20)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            D-SEC • Eğitim Yönetim Dashboard
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "48px",
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            Eğitim Performans
            <br />
            ve Risk Merkezi
          </h1>

          <p
            style={{
              marginTop: "16px",
              marginBottom: "24px",
              maxWidth: "880px",
              color: "rgba(255,255,255,0.90)",
              lineHeight: 1.8,
              fontSize: "17px",
            }}
          >
            Eğitim atamaları, başlama oranları, kritik kullanıcılar,
            tamamlama performansı ve firma bazlı risk görünümü tek merkezde.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <HeroMiniCard label="Toplam Atama" value={totals.assigned} />
            <HeroMiniCard label="Tamamlanma" value={`${completionRate}%`} />
            <HeroMiniCard label="Devam Eden" value={`${inProgressRate}%`} />
            <HeroMiniCard label="Riskli Oran" value={`${riskRate}%`} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <KpiCard
            title="Toplam Atama"
            value={totals.assigned}
            sub="Sistemdeki tüm eğitim atamaları"
          />
          <KpiCard
            title="Tamamlanan"
            value={totals.completed}
            sub="Final başarıyla biten eğitimler"
          />
          <KpiCard
            title="Devam Eden"
            value={totals.inProgress}
            sub="Süreçte olan eğitim kullanıcıları"
          />
          <KpiCard
            title="Başlamayan"
            value={totals.notStarted}
            sub="Öncelikli riskli kullanıcı grubu"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <Panel title="Genel Eğitim Durumu">
            {progressBars.map((item) => (
              <ProgressRow
                key={item.label}
                label={item.label}
                value={item.value}
                color={item.color}
              />
            ))}
          </Panel>

          <Panel title="Sistem Yorumu">
            <div
              style={{
                borderRadius: "18px",
                padding: "18px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              Çalışanların <b>%{riskRate}</b> oranı eğitime başlamamış
              durumda. Bu grup öncelikli takip edilmelidir. Tamamlanma oranı{" "}
              <b>%{completionRate}</b> seviyesinde. Devam eden kullanıcılar için
              periyodik hatırlatma ve firma bazlı takip önerilir.
            </div>
          </Panel>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <Panel title="En Riskli Eğitimler">
            {topRiskTrainings.length === 0 ? (
              <EmptyText text="Risk verisi bulunamadı." />
            ) : (
              topRiskTrainings.map((t) => (
                <ProgressCountRow
                  key={t.id}
                  label={t.title}
                  value={Number(t.not_started_count || 0)}
                  total={Math.max(Number(t.assigned_count || 0), 1)}
                  color="#dc2626"
                />
              ))
            )}
          </Panel>

          <Panel title="Firma Bazlı Risk Dağılımı">
            {companyRiskStats.length === 0 ? (
              <EmptyText text="Firma bazlı risk verisi bulunamadı." />
            ) : (
              companyRiskStats.map(([company, count]) => (
                <ProgressCountRow
                  key={company}
                  label={company}
                  value={count}
                  total={Math.max(riskyUsers.length, 1)}
                  color="#b91c1c"
                />
              ))
            )}
          </Panel>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          <Panel title="Riskli Kullanıcılar">
            {riskyUsers.length === 0 ? (
              <EmptyText text="Riskli kullanıcı bulunmuyor." />
            ) : (
              riskyUsers.map((u) => (
                <UserRowCard
                  key={u.assignment_id}
                  user={u}
                  badgeText="Başlamadı"
                  badgeBg="#fee2e2"
                  badgeBorder="#fca5a5"
                  badgeColor="#b91c1c"
                />
              ))
            )}
          </Panel>

          <Panel title="Devam Eden Kullanıcılar">
            {inProgressUsers.length === 0 ? (
              <EmptyText text="Devam eden kullanıcı bulunmuyor." />
            ) : (
              inProgressUsers.map((u) => (
                <UserRowCard
                  key={u.assignment_id}
                  user={u}
                  badgeText="Devam Ediyor"
                  badgeBg="#eff6ff"
                  badgeBorder="#93c5fd"
                  badgeColor="#1d4ed8"
                />
              ))
            )}
          </Panel>

          <Panel title="Tamamlayan Kullanıcılar">
            {completedUsers.length === 0 ? (
              <EmptyText text="Tamamlanan kullanıcı bulunmuyor." />
            ) : (
              completedUsers.map((u) => (
                <UserRowCard
                  key={u.assignment_id}
                  user={u}
                  badgeText="Tamamlandı"
                  badgeBg="#f0fdf4"
                  badgeBorder="#86efac"
                  badgeColor="#166534"
                />
              ))
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}

function HeroMiniCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "18px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.78)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        padding: "20px",
        boxShadow: "0 12px 34px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: "#64748b",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "34px",
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: "10px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#475569", lineHeight: 1.7, fontSize: "14px" }}>
        {sub}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 12px 34px rgba(15,23,42,0.06)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "18px",
          fontSize: "22px",
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ProgressRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "8px",
          fontWeight: 700,
          color: "#334155",
        }}
      >
        <span>{label}</span>
        <span>%{value}</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "12px",
          borderRadius: "999px",
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
}

function ProgressCountRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "8px",
          color: "#334155",
          fontWeight: 700,
        }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div
        style={{
          width: "100%",
          height: "10px",
          borderRadius: "999px",
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
          }}
        />
      </div>
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
        borderRadius: "18px",
        padding: "16px",
        marginBottom: "12px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: "6px",
          fontSize: "16px",
        }}
      >
        {user.full_name || "Kullanıcı"}
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          lineHeight: 1.7,
          marginBottom: "10px",
        }}
      >
        {user.email || "Email yok"}
        <br />
        Eğitim: {user.training_title || "-"}
        <br />
        Firma: {user.company_id || "-"}
      </div>

      <div
        style={{
          display: "inline-flex",
          padding: "6px 10px",
          borderRadius: "999px",
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {badgeText}
      </div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "16px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#64748b",
      }}
    >
      {text}
    </div>
  );
}