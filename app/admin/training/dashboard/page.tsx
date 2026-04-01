"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------------- TYPES ---------------- */

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

/* ---------------- PAGE ---------------- */

export default function TrainingDashboard() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/training-dashboard");
        const json: DashboardResponse = await res.json();

        setTrainings(json.trainings || []);
        setRiskyUsers(json.risky_users || []);
        setInProgressUsers(json.in_progress_users || []);
        setCompletedUsers(json.completed_users || []);
      } catch {
        setError("Dashboard yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- KPI ---------------- */

  const totals = useMemo(() => {
    let assigned = 0,
      completed = 0,
      notStarted = 0,
      inProgress = 0;

    trainings.forEach((t) => {
      assigned += t.assigned_count;
      completed += t.completed_count;
      notStarted += t.not_started_count;
      inProgress += t.in_progress_count;
    });

    return { assigned, completed, notStarted, inProgress };
  }, [trainings]);

  const percent = (a: number, b: number) =>
    b ? Math.round((a / b) * 100) : 0;

  /* ---------------- EK ANALİZ ---------------- */

  const companyStats = useMemo(() => {
    const map = new Map<string, number>();
    riskyUsers.forEach((u) => {
      const key = u.company_id || "Bilinmiyor";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [riskyUsers]);

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 5);
  }, [trainings]);

  if (loading) return <div style={{ padding: 24 }}>Yükleniyor...</div>;
  if (error) return <div style={{ padding: 24 }}>{error}</div>;

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={header}>
        <div style={badge}>D-SEC Eğitim Dashboard</div>
        <h1 style={title}>Eğitim Performans ve Risk Merkezi</h1>
      </div>

      {/* KPI */}
      <Grid>
        <Card title="Toplam Atama" value={totals.assigned} />
        <Card title="Tamamlanan %" value={percent(totals.completed, totals.assigned) + "%"} />
        <Card title="Başlamayan %" value={percent(totals.notStarted, totals.assigned) + "%"} />
        <Card title="Devam Eden %" value={percent(totals.inProgress, totals.assigned) + "%"} />
      </Grid>

      {/* GENEL BAR */}
      <Section title="📊 Genel Durum">
        <Bar label="Tamamlandı" value={percent(totals.completed, totals.assigned)} color="#16a34a" />
        <Bar label="Devam" value={percent(totals.inProgress, totals.assigned)} color="#2563eb" />
        <Bar label="Başlamadı" value={percent(totals.notStarted, totals.assigned)} color="#dc2626" />
      </Section>

      {/* FİRMA ANALİZ */}
      <Section title="🏢 Firma Bazlı Risk">
        {companyStats.map(([c, v]) => (
          <Bar key={c} label={c} value={v} color="#dc2626" />
        ))}
      </Section>

      {/* TOP RİSK */}
      <Section title="🔥 En Riskli Eğitimler">
        {topRiskTrainings.map((t) => (
          <Bar key={t.id} label={t.title} value={t.not_started_count} color="#b91c1c" />
        ))}
      </Section>

      {/* SENİN ORİJİNAL SECTIONS DEVAM EDİYOR */}

      <Section title="🚨 Riskli Çalışanlar">
        {riskyUsers.map((u) => (
          <UserRowCard key={u.assignment_id} user={u} badgeText="Başlamadı" badgeBg="#fee2e2" badgeBorder="#fca5a5" badgeColor="#b91c1c" />
        ))}
      </Section>

      <Section title="⏳ Devam Eden">
        {inProgressUsers.map((u) => (
          <UserRowCard key={u.assignment_id} user={u} badgeText="Devam" badgeBg="#eff6ff" badgeBorder="#93c5fd" badgeColor="#1d4ed8" />
        ))}
      </Section>

      <Section title="✅ Tamamlanan">
        {completedUsers.map((u) => (
          <UserRowCard key={u.assignment_id} user={u} badgeText="Tamamlandı" badgeBg="#f0fdf4" badgeBorder="#86efac" badgeColor="#166534" />
        ))}
      </Section>

      {/* AI YORUM */}
      <Section title="🧠 Sistem Yorumu">
        <div>
          Çalışanların %{percent(totals.notStarted, totals.assigned)}’i eğitime başlamamış.
          Bu durum kritik İSG riski oluşturur.
        </div>
      </Section>
    </div>
  );
}

/* UI */

const header = {
  background: "linear-gradient(135deg,#0f172a,#1e3a8a)",
  color: "#fff",
  padding: 24,
  borderRadius: 20,
};

const badge = {
  fontSize: 12,
  background: "rgba(255,255,255,0.2)",
  padding: "6px 10px",
  borderRadius: 999,
  display: "inline-block",
};

const title = {
  fontSize: 28,
  fontWeight: 900,
  marginTop: 10,
};

function Grid({ children }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 20 }}>
      {children}
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div style={{ border: "1px solid #e5e7eb", padding: 16, borderRadius: 12 }}>
      <div>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontWeight: 800 }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function Bar({ label, value, color }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div>{label}</div>
      <div style={{ height: 8, background: "#e5e7eb" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color }} />
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
  user: any;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800 }}>{user.full_name}</div>

      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
        {user.email || "Email yok"}
        <br />
        Eğitim: {user.training_title}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: 999,
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          fontSize: 12,
          fontWeight: 700,
          color: badgeColor,
        }}
      >
        {badgeText}
      </div>
    </div>
  );
}