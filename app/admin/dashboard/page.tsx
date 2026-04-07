"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

type GroupItem = {
  key: string;
  title: string;
  count: number;
  users: RiskUser[];
};

type DetailPanelState = {
  open: boolean;
  title: string;
  subtitle: string;
  users: RiskUser[];
  tone: "risk" | "progress" | "done";
};

const BRAND = {
  pageTop: "#fff4f5",
  pageMid: "#fff8f8",
  pageBottom: "#ffffff",

  heroDark: "#5a0f1f",
  heroMid: "#8f172c",
  heroMain: "#c62828",
  heroSoft: "#f14b4b",

  textStrong: "#3b0a15",
  textBody: "#6f4a53",
  textMuted: "#8b6770",

  white: "#ffffff",
  border: "#f0d6da",
  borderStrong: "#e8bcc4",

  shadow: "0 18px 50px rgba(129, 19, 38, 0.10)",
  shadowStrong: "0 28px 80px rgba(129, 19, 38, 0.24)",

  risk: "#a61b2b",
  progress: "#c62828",
  done: "#2e7d32",

  riskSoft: "#fff5f6",
  progressSoft: "#fff1f1",
  doneSoft: "#f4fcf5",

  riskBorder: "#efc7cf",
  progressBorder: "#f2c3c3",
  doneBorder: "#cfe8d1",

  panelTopSoft: "#fff7f8",
  gold: "#c98a2e",
  goldSoft: "#fff5df",
};

export default function AdminDashboardPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiComment, setAiComment] = useState("");

  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({
    
    open: false,
    title: "",
    subtitle: "",
    users: [],
    tone: "risk",
  });

  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedChartItem, setSelectedChartItem] = useState<string | null>(null);
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

    useEffect(() => {
  const text =
    riskRate > 60
      ? "Risk çok yüksek. Eğitimler başlamıyor. Acil aksiyon gerekli."
      : riskRate > 30
      ? "Risk orta seviyede. Takip artırılmalı."
      : "Genel durum iyi. Süreç sağlıklı ilerliyor.";

  setAiComment(text);
}, [riskRate]);


  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const groupByTraining = (users: RiskUser[]): GroupItem[] => {
    const map = new Map<string, GroupItem>();

    users.forEach((user) => {
      const key = user.training_id || "no-training";
      const title = user.training_title || "Eğitim";

      const current = map.get(key) || {
        key,
        title,
        count: 0,
        users: [],
      };

      current.count += 1;
      current.users.push(user);
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  };

  const groupByCompany = (users: RiskUser[]): GroupItem[] => {
    const map = new Map<string, GroupItem>();

    users.forEach((user) => {
      const key = (user.company_id || "Firma Yok").trim() || "Firma Yok";
      const title = key;

      const current = map.get(key) || {
        key,
        title,
        count: 0,
        users: [],
      };

      current.count += 1;
      current.users.push(user);
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  };

  const riskyTrainingGroups = useMemo(
    () => groupByTraining(riskyUsers).slice(0, 8),
    [riskyUsers]
  );

  const riskyCompanyGroups = useMemo(
    () => groupByCompany(riskyUsers).slice(0, 8),
    [riskyUsers]
  );

  const progressTrainingGroups = useMemo(
    () => groupByTraining(inProgressUsers).slice(0, 8),
    [inProgressUsers]
  );

  const progressCompanyGroups = useMemo(
    () => groupByCompany(inProgressUsers).slice(0, 8),
    [inProgressUsers]
  );

  const doneTrainingGroups = useMemo(
    () => groupByTraining(completedUsers).slice(0, 8),
    [completedUsers]
  );

  const doneCompanyGroups = useMemo(
    () => groupByCompany(completedUsers).slice(0, 8),
    [completedUsers]
  );

// 🔥 FIRMA LİSTESİ
const companies = useMemo(() => {
  const set = new Set<string>();

  riskyUsers.forEach((u) => u.company_id && set.add(u.company_id));
  inProgressUsers.forEach((u) => u.company_id && set.add(u.company_id));
  completedUsers.forEach((u) => u.company_id && set.add(u.company_id));

  return Array.from(set);
}, [riskyUsers, inProgressUsers, completedUsers]);

// 🔥 FİLTRE
const filteredUsers = useMemo(() => {
  if (selectedCompany === "all") return riskyUsers;

  return riskyUsers.filter(
    (u) => u.company_id === selectedCompany
  );
}, [selectedCompany, riskyUsers]);

// 🔥 CHART DATA
const chartData = useMemo(() => {
  const map = new Map<string, number>();

  filteredUsers.forEach((u) => {
    const key = u.training_title || "Eğitim";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}, [filteredUsers]);

  const openDetail = (
    title: string,
    subtitle: string,
    users: RiskUser[],
    tone: "risk" | "progress" | "done"
  ) => {
    setDetailPanel({
      open: true,
      title,
      subtitle,
      users,
      tone,
    });
  };

  const closeDetail = () => {
    setDetailPanel({
      open: false,
      title: "",
      subtitle: "",
      users: [],
      tone: "risk",
    });
  };

  const exportPDF = async () => {
  const element = document.body;

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const pageHeight = 295;
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

  const progressBars = [
    {
      label: "Tamamlandı",
      value: completionRate,
      color: BRAND.done,
      soft: BRAND.doneSoft,
      description: "Final başarıyla kapanan eğitim oranı",
    },
    {
      label: "Devam Ediyor",
      value: inProgressRate,
      color: BRAND.progress,
      soft: BRAND.progressSoft,
      description: "Aktif izleme ve devam eden süreçler",
    },
    {
      label: "Başlamadı",
      value: riskRate,
      color: BRAND.risk,
      soft: BRAND.riskSoft,
      description: "Öncelikli takip gerektiren riskli oran",
    },
  ];

  const executiveTone =
    riskRate >= 60 ? "critical" : riskRate >= 30 ? "watch" : "good";

  const executiveLabel =
    executiveTone === "critical"
      ? "Kritik İzleme"
      : executiveTone === "watch"
      ? "Yakın Takip"
      : "Kontrollü Düzey";

  const executiveText =
    executiveTone === "critical"
      ? "Başlamayan eğitim oranı yüksek. Önceliklendirilmiş takip, firma bazlı aksiyon ve kullanıcı hatırlatma akışı önerilir."
      : executiveTone === "watch"
      ? "Risk dengeli ama dikkat gerektiriyor. Takip listeleri ve firma bazlı dağılım yakından izlenmeli."
      : "Genel görünüm kontrollü. Tamamlama akışı korunurken düşük riskli alanlarda optimizasyon yapılabilir.";

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${BRAND.pageTop} 0%, ${BRAND.pageMid} 45%, ${BRAND.pageBottom} 100%)`,
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              background: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              borderRadius: "30px",
              padding: "30px",
              boxShadow: BRAND.shadow,
            }}
          >
            <h1
              style={{
                marginTop: 0,
                marginBottom: "10px",
                color: BRAND.textStrong,
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              Yükleniyor...
            </h1>
            <p style={{ color: BRAND.textBody, marginBottom: 0 }}>
              Admin dashboard hazırlanıyor.
            </p>
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
          background: `linear-gradient(180deg, ${BRAND.pageTop} 0%, ${BRAND.pageMid} 45%, ${BRAND.pageBottom} 100%)`,
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              background: BRAND.white,
              border: `1px solid ${BRAND.borderStrong}`,
              borderRadius: "30px",
              padding: "30px",
              color: BRAND.risk,
              boxShadow: BRAND.shadow,
            }}
          >
            <h1
              style={{
                marginTop: 0,
                marginBottom: "10px",
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              Hata
            </h1>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${BRAND.pageTop} 0%, ${BRAND.pageMid} 32%, ${BRAND.pageBottom} 100%)`,
          padding: "32px 20px 48px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              borderRadius: "36px",
              padding: "34px",
              background: `linear-gradient(135deg, ${BRAND.heroDark} 0%, ${BRAND.heroMid} 42%, ${BRAND.heroMain} 76%, ${BRAND.heroSoft} 100%)`,
              color: BRAND.white,
              boxShadow: BRAND.shadowStrong,
              marginBottom: "24px",
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top right, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 38%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "-90px",
                top: "-90px",
                width: "280px",
                height: "280px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.10)",
                filter: "blur(2px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "52%",
                bottom: "-110px",
                width: "260px",
                height: "260px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.07)",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  fontSize: "12px",
                  fontWeight: 800,
                  marginBottom: "16px",
                  letterSpacing: "0.2px",
                }}
              >
                D-SEC • Admin Eğitim Merkezi
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "52px",
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: "-1.2px",
                  maxWidth: "880px",
                  textShadow: "0 6px 24px rgba(0,0,0,0.12)",
                }}
              >
                Eğitim Performans
                <br />
                Risk ve Yönetim Paneli
              </h1>

              <p
                style={{
                  marginTop: "16px",
                  marginBottom: "26px",
                  maxWidth: "920px",
                  color: "rgba(255,255,255,0.94)",
                  lineHeight: 1.8,
                  fontSize: "17px",
                }}
              >
                Eğitim atamaları, başlama oranları, riskli kullanıcı kümeleri,
                firma bazlı yoğunluklar ve eğitim bazlı dağılımlar tek ekranda
                D-SEC kurumsal kırmızı görünümüyle izlenir.
              </p>

{/* 🔥 PDF BUTTON */}
<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
  <button
    onClick={exportPDF}
    style={{
      padding: "12px 18px",
      borderRadius: 12,
      background: "#c62828",
      color: "#fff",
      fontWeight: 800,
      border: "none",
      cursor: "pointer",
    }}
  >
    📄 PDF İndir
  </button>
</div>


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
              accent={BRAND.heroMid}
            />
            <KpiCard
              title="Tamamlanan"
              value={totals.completed}
              sub="Final başarıyla kapanan eğitimler"
              accent={BRAND.done}
            />
            <KpiCard
              title="Devam Eden"
              value={totals.inProgress}
              sub="Aktif süreci devam eden kullanıcılar"
              accent={BRAND.progress}
            />
            <KpiCard
              title="Başlamayan"
              value={totals.notStarted}
              sub="Öncelikli takip edilmesi gereken riskli grup"
              accent={BRAND.risk}
            />
          </div>

        <div style={{ marginTop: 20 }}>

  {/* 🔥 FIRMA FİLTRE */}
  <div style={{ marginBottom: 16 }}>
    <select
      value={selectedCompany}
      onChange={(e) => setSelectedCompany(e.target.value)}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        fontWeight: 700,
      }}
    >
      <option value="all">Tüm Firmalar</option>
      {companies.map((c) => (
        <option key={c} value={c}>
          {c || "Firma Yok"}
        </option>
      ))}
    </select>
  </div>

  {/* 🔥 GERÇEK GRAFİK */}
  <div
    style={{
      width: "100%",
      height: 320,
      background: "#fff",
      borderRadius: 20,
      padding: 16,
      border: "1px solid #f0d6da",
      boxShadow: BRAND.shadow,
    }}
  >
    <ResponsiveContainer width="100%" height="100%">
    <BarChart
  data={chartData}
  onClick={(e: any) => {
    if (e && e.activeLabel) {
      setSelectedChartItem(e.activeLabel);
    }
  }}
>
        <XAxis dataKey="name" />
        <Tooltip />
        <Bar dataKey="value" fill="#c62828" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

{/* 🔥 BURAYA EKLE (AI YORUM) */}
<div
  style={{
    marginTop: 20,
    padding: 16,
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #eee",
  }}
>
  <div style={{ fontWeight: 900, marginBottom: 6 }}>
    🤖 AI Yönetici Yorumu
  </div>

  <div style={{ fontSize: 14, color: "#444" }}>
    {aiComment}
  </div>
</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <PremiumPanel
              eyebrow="OPERASYON GÖRÜNÜMÜ"
              title="Genel Eğitim Durumu"
              subtitle="Tamamlama, devam ve başlangıç riski tek bakışta izlenir."
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <ExecutiveMiniMetric
                  title="Tamamlandı"
                  value={`${completionRate}%`}
                  tone="done"
                />
                <ExecutiveMiniMetric
                  title="Devam"
                  value={`${inProgressRate}%`}
                  tone="progress"
                />
                <ExecutiveMiniMetric
                  title="Risk"
                  value={`${riskRate}%`}
                  tone="risk"
                />
              </div>

              {progressBars.map((item) => (
                <PremiumProgressRow
                  key={item.label}
                  label={item.label}
                  description={item.description}
                  value={item.value}
                  color={item.color}
                  soft={item.soft}
                />
              ))}
            </PremiumPanel>

            <PremiumPanel
              eyebrow="YÖNETİM ÖZETİ"
              title="Yönetici Yorumu"
              subtitle="Durumu yorumlayan ve aksiyon önceliğini öne çıkaran özet alan."
            >
              <ExecutiveCommentCard
                label={executiveLabel}
                text={executiveText}
                assigned={totals.assigned}
                riskRate={riskRate}
                completionRate={completionRate}
                inProgressRate={inProgressRate}
              />
            </PremiumPanel>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <PremiumPanel
              eyebrow="RİSK ODAĞI"
              title="En Riskli Eğitimler"
              subtitle="Başlamayan kullanıcı sayısına göre en kritik eğitim başlıkları."
            >
              {topRiskTrainings.length === 0 ? (
                <EmptyText text="Risk verisi bulunamadı." />
              ) : (
                <PremiumRiskList
                  items={topRiskTrainings.map((t) => ({
                    id: t.id,
                    label: t.title,
                    value: Number(t.not_started_count || 0),
                    total: Math.max(Number(t.assigned_count || 0), 1),
                    color: BRAND.risk,
                    tone: "risk" as const,
                  }))}
                />
              )}
            </PremiumPanel>

            <PremiumPanel
              eyebrow="FİRMA ANALİZİ"
              title="Firma Bazlı Risk Yoğunluğu"
              subtitle="Riskli kullanıcıların firma bazlı yoğunluk dağılımı."
            >
              {riskyCompanyGroups.length === 0 ? (
                <EmptyText text="Firma bazlı risk verisi bulunamadı." />
              ) : (
                <PremiumRiskList
                  items={riskyCompanyGroups.slice(0, 6).map((item) => ({
                    id: item.key,
                    label: item.title,
                    value: item.count,
                    total: Math.max(riskyUsers.length, 1),
                    color: BRAND.heroMain,
                    tone: "progress" as const,
                  }))}
                />
              )}
            </PremiumPanel>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <Panel title="Riskli Kullanıcılar • Eğitim Bazlı">
              {riskyTrainingGroups.length === 0 ? (
                <EmptyText text="Riskli eğitim grubu bulunmuyor." />
              ) : (
                <SummaryGroupGrid
                  items={riskyTrainingGroups}
                  tone="risk"
                  onOpen={(item) =>
                    openDetail(
                      item.title,
                      "Riskli kullanıcılar • Eğitim bazlı detay",
                      item.users,
                      "risk"
                    )
                  }
                />
              )}
            </Panel>

            <Panel title="Riskli Kullanıcılar • Firma Bazlı">
              {riskyCompanyGroups.length === 0 ? (
                <EmptyText text="Riskli firma grubu bulunmuyor." />
              ) : (
                <SummaryGroupGrid
                  items={riskyCompanyGroups}
                  tone="risk"
                  onOpen={(item) =>
                    openDetail(
                      item.title,
                      "Riskli kullanıcılar • Firma bazlı detay",
                      item.users,
                      "risk"
                    )
                  }
                />
              )}
            </Panel>

            <Panel title="Devam Eden • Eğitim / Firma">
              {progressTrainingGroups.length === 0 &&
              progressCompanyGroups.length === 0 ? (
                <EmptyText text="Devam eden kullanıcı grubu bulunmuyor." />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: BRAND.textMuted,
                      marginBottom: "10px",
                    }}
                  >
                    Eğitim Bazlı
                  </div>
                  <SummaryGroupGrid
                    items={progressTrainingGroups.slice(0, 4)}
                    tone="progress"
                    onOpen={(item) =>
                      openDetail(
                        item.title,
                        "Devam eden kullanıcılar • Eğitim bazlı detay",
                        item.users,
                        "progress"
                      )
                    }
                  />

                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: BRAND.textMuted,
                      marginTop: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    Firma Bazlı
                  </div>
                  <SummaryGroupGrid
                    items={progressCompanyGroups.slice(0, 4)}
                    tone="progress"
                    onOpen={(item) =>
                      openDetail(
                        item.title,
                        "Devam eden kullanıcılar • Firma bazlı detay",
                        item.users,
                        "progress"
                      )
                    }
                  />
                </>
              )}
            </Panel>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
            }}
          >
            <Panel title="Tamamlayanlar • Eğitim Bazlı">
              {doneTrainingGroups.length === 0 ? (
                <EmptyText text="Tamamlanan eğitim grubu bulunmuyor." />
              ) : (
                <SummaryGroupGrid
                  items={doneTrainingGroups}
                  tone="done"
                  onOpen={(item) =>
                    openDetail(
                      item.title,
                      "Tamamlayan kullanıcılar • Eğitim bazlı detay",
                      item.users,
                      "done"
                    )
                  }
                />
              )}
            </Panel>

            <Panel title="Tamamlayanlar • Firma Bazlı">
              {doneCompanyGroups.length === 0 ? (
                <EmptyText text="Tamamlayan firma grubu bulunmuyor." />
              ) : (
                <SummaryGroupGrid
                  items={doneCompanyGroups}
                  tone="done"
                  onOpen={(item) =>
                    openDetail(
                      item.title,
                      "Tamamlayan kullanıcılar • Firma bazlı detay",
                      item.users,
                      "done"
                    )
                  }
                />
              )}
            </Panel>
          </div>
        </div>
      </main>

      {detailPanel.open ? (
        <DetailDrawer panel={detailPanel} onClose={closeDetail} />
      ) : null}

      {selectedChartItem && (
  <div
    style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      background: "#fff",
      padding: 16,
      borderRadius: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      zIndex: 9999,
      minWidth: 260,
    }}
  >
    <div style={{ fontWeight: 900, marginBottom: 8 }}>
      {selectedChartItem}
    </div>

    <div style={{ fontSize: 13, marginBottom: 10 }}>
      Bu eğitime ait kullanıcı listesi
    </div>

    <button
      onClick={() => setSelectedChartItem(null)}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: "#c62828",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      Kapat
    </button>
  </div>
)}
    </>
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
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: "rgba(255,255,255,0.84)",
          marginBottom: "8px",
          letterSpacing: "0.2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "34px",
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        borderRadius: "24px",
        padding: "22px",
        boxShadow: BRAND.shadow,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "5px",
          background: accent,
        }}
      />
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: BRAND.textMuted,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "36px",
          fontWeight: 900,
          color: BRAND.textStrong,
          marginBottom: "10px",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div style={{ color: BRAND.textBody, lineHeight: 1.7, fontSize: "14px" }}>
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
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        borderRadius: "26px",
        padding: "22px",
        boxShadow: BRAND.shadow,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "18px",
          fontSize: "22px",
          fontWeight: 900,
          color: BRAND.textStrong,
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function PremiumPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        position: "relative",
        background: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        borderRadius: "28px",
        padding: "22px",
        boxShadow: BRAND.shadow,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,250,250,1) 0%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,1) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-50px",
          top: "-50px",
          width: "180px",
          height: "180px",
          borderRadius: "999px",
          background: "rgba(198, 40, 40, 0.05)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "7px 12px",
            borderRadius: "999px",
            background: BRAND.goldSoft,
            border: `1px solid ${BRAND.border}`,
            color: BRAND.heroMid,
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.4px",
            marginBottom: "12px",
          }}
        >
          {eyebrow}
        </div>

        <h2
          style={{
            marginTop: 0,
            marginBottom: "8px",
            fontSize: "28px",
            fontWeight: 900,
            color: BRAND.textStrong,
            letterSpacing: "-0.6px",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: "18px",
            color: BRAND.textBody,
            lineHeight: 1.7,
            fontSize: "14px",
          }}
        >
          {subtitle}
        </p>

        {children}
      </div>
    </section>
  );
}

function ExecutiveMiniMetric({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "risk" | "progress" | "done";
}) {
  const toneMap =
    tone === "risk"
      ? {
          bg: BRAND.riskSoft,
          border: BRAND.riskBorder,
          color: BRAND.risk,
        }
      : tone === "progress"
      ? {
          bg: BRAND.progressSoft,
          border: BRAND.progressBorder,
          color: BRAND.progress,
        }
      : {
          bg: BRAND.doneSoft,
          border: BRAND.doneBorder,
          color: BRAND.done,
        };

  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "16px",
        background: toneMap.bg,
        border: `1px solid ${toneMap.border}`,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: BRAND.textMuted,
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "28px",
          lineHeight: 1.05,
          fontWeight: 900,
          color: toneMap.color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PremiumProgressRow({
  label,
  description,
  value,
  color,
  soft,
}: {
  label: string;
  description: string;
  value: number;
  color: string;
  soft: string;
}) {
  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "16px",
        marginBottom: "14px",
        background: soft,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            fontSize: "17px",
            fontWeight: 900,
            color: BRAND.textStrong,
          }}
        >
          {label}
        </div>
        <div
          style={{
            minWidth: "74px",
            textAlign: "right",
            fontSize: "24px",
            fontWeight: 900,
            color,
          }}
        >
          %{value}
        </div>
      </div>

      <div
        style={{
          fontSize: "13px",
          color: BRAND.textBody,
          lineHeight: 1.6,
          marginBottom: "10px",
        }}
      >
        {description}
      </div>

      <div
        style={{
          width: "100%",
          height: "14px",
          borderRadius: "999px",
          background: "#f2e7e9",
          overflow: "hidden",
          boxShadow: "inset 0 2px 6px rgba(91, 19, 38, 0.06)",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
            borderRadius: "999px",
            boxShadow: `0 8px 18px ${hexToRgba(color, 0.28)}`,
          }}
        />
      </div>
    </div>
  );
}

function ExecutiveCommentCard({
  label,
  text,
  assigned,
  riskRate,
  completionRate,
  inProgressRate,
}: {
  label: string;
  text: string;
  assigned: number;
  riskRate: number;
  completionRate: number;
  inProgressRate: number;
}) {
  return (
    <div
      style={{
        borderRadius: "22px",
        border: `1px solid ${BRAND.border}`,
        overflow: "hidden",
        background: BRAND.white,
        boxShadow: "0 14px 30px rgba(91, 19, 38, 0.05)",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          background: `linear-gradient(135deg, ${BRAND.heroDark} 0%, ${BRAND.heroMain} 100%)`,
          color: BRAND.white,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "6px 10px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.16)",
            fontSize: "11px",
            fontWeight: 900,
            marginBottom: "10px",
            letterSpacing: "0.3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "24px",
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          Yönetim İçin Hızlı Değerlendirme
        </div>
      </div>

      <div
        style={{
          padding: "18px",
          background:
            "linear-gradient(180deg, rgba(255,250,250,1) 0%, rgba(255,255,255,1) 100%)",
        }}
      >
        <p
          style={{
            marginTop: 0,
            marginBottom: "16px",
            color: BRAND.textStrong,
            lineHeight: 1.8,
            fontSize: "15px",
          }}
        >
          {text}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <CommentMetric title="Toplam Atama" value={assigned} />
          <CommentMetric title="Riskli Oran" value={`%${riskRate}`} />
          <CommentMetric title="Tamamlama" value={`%${completionRate}`} />
          <CommentMetric title="Devam Eden" value={`%${inProgressRate}`} />
        </div>

        <div
          style={{
            borderRadius: "16px",
            padding: "14px",
            background: BRAND.goldSoft,
            border: `1px solid ${hexToRgba(BRAND.gold, 0.24)}`,
            color: BRAND.textStrong,
            lineHeight: 1.7,
            fontSize: "13px",
          }}
        >
          <b>Öneri:</b> Önceliklendirme sırası; başlatılmamış eğitimler →
          firma bazlı yoğun kümeler → devam eden kullanıcıların kapanış takibi.
        </div>
      </div>
    </div>
  );
}

function CommentMetric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        borderRadius: "14px",
        padding: "12px",
        background: BRAND.panelTopSoft,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: BRAND.textMuted,
          marginBottom: "5px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 900,
          color: BRAND.textStrong,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PremiumRiskList({
  items,
}: {
  items: Array<{
    id: string;
    label: string;
    value: number;
    total: number;
    color: string;
    tone: "risk" | "progress";
  }>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "12px",
      }}
    >
      {items.map((item, index) => {
        const percent =
          item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;

        return (
          <div
            key={item.id}
            style={{
              borderRadius: "20px",
              padding: "16px",
              background: index === 0 ? BRAND.panelTopSoft : BRAND.white,
              border: `1px solid ${
                item.tone === "risk" ? BRAND.riskBorder : BRAND.progressBorder
              }`,
              boxShadow:
                index === 0 ? "0 12px 24px rgba(91, 19, 38, 0.06)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: BRAND.textStrong,
                  lineHeight: 1.35,
                  maxWidth: "78%",
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  minWidth: "52px",
                  height: "36px",
                  padding: "0 10px",
                  borderRadius: "999px",
                  background: hexToRgba(item.color, 0.12),
                  color: item.color,
                  fontSize: "16px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.value}
              </div>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: BRAND.textBody,
                lineHeight: 1.6,
                marginBottom: "10px",
              }}
            >
              Toplam içindeki pay: %{percent}
            </div>

            <div
              style={{
                width: "100%",
                height: "12px",
                borderRadius: "999px",
                background: "#f4e5e8",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, percent))}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}dd 100%)`,
                  borderRadius: "999px",
                  boxShadow: `0 10px 20px ${hexToRgba(item.color, 0.24)}`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryGroupGrid({
  items,
  tone,
  onOpen,
}: {
  items: GroupItem[];
  tone: "risk" | "progress" | "done";
  onOpen: (item: GroupItem) => void;
}) {
  if (items.length === 0) {
    return <EmptyText text="Veri bulunamadı." />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "12px",
      }}
    >
      {items.map((item) => {
        const styles =
          tone === "risk"
            ? {
                bg: BRAND.riskSoft,
                border: BRAND.riskBorder,
                badgeBg: "#fee2e2",
                badgeColor: BRAND.risk,
              }
            : tone === "progress"
            ? {
                bg: BRAND.progressSoft,
                border: BRAND.progressBorder,
                badgeBg: "#ffe3e3",
                badgeColor: BRAND.progress,
              }
            : {
                bg: BRAND.doneSoft,
                border: BRAND.doneBorder,
                badgeBg: "#e4f6e6",
                badgeColor: BRAND.done,
              };

        return (
          <button
            key={item.key}
            onClick={() => onOpen(item)}
            style={{
              textAlign: "left",
              width: "100%",
              border: `1px solid ${styles.border}`,
              background: styles.bg,
              borderRadius: "18px",
              padding: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 900,
                color: BRAND.textStrong,
                marginBottom: "6px",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: BRAND.textBody,
                fontSize: "13px",
                lineHeight: 1.6,
                marginBottom: "10px",
              }}
            >
              Kullanıcı sayısı: {item.count}
              <br />
              Detay için tıklayın
            </div>

            <span
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: "999px",
                background: styles.badgeBg,
                color: styles.badgeColor,
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {item.count} kişi
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DetailDrawer({
  panel,
  onClose,
}: {
  panel: DetailPanelState;
  onClose: () => void;
}) {
  const toneStyles =
    panel.tone === "risk"
      ? {
          topBg: `linear-gradient(135deg, ${BRAND.heroDark} 0%, ${BRAND.risk} 100%)`,
          chipBg: "#fee2e2",
          chipColor: BRAND.risk,
          rowBorder: BRAND.riskBorder,
        }
      : panel.tone === "progress"
      ? {
          topBg: `linear-gradient(135deg, ${BRAND.heroMid} 0%, ${BRAND.progress} 100%)`,
          chipBg: "#ffe3e3",
          chipColor: BRAND.progress,
          rowBorder: BRAND.progressBorder,
        }
      : {
          topBg: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
          chipBg: "#e4f6e6",
          chipColor: BRAND.done,
          rowBorder: BRAND.doneBorder,
        };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(23, 10, 12, 0.48)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "100%",
          height: "100%",
          background: BRAND.white,
          boxShadow: "-16px 0 40px rgba(0,0,0,0.18)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "24px",
            color: "#fff",
            background: toneStyles.topBg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  opacity: 0.9,
                  marginBottom: "10px",
                  letterSpacing: "0.2px",
                }}
              >
                DETAY PANELİ
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  lineHeight: 1.1,
                  fontWeight: 900,
                }}
              >
                {panel.title}
              </h2>
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {panel.subtitle}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.24)",
                color: "#fff",
                borderRadius: "12px",
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Kapat
            </button>
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "7px 12px",
              borderRadius: "999px",
              background: toneStyles.chipBg,
              color: toneStyles.chipColor,
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "14px",
            }}
          >
            Toplam {panel.users.length} kullanıcı
          </div>

          {panel.users.length === 0 ? (
            <EmptyText text="Detay bulunamadı." />
          ) : (
            panel.users.map((user) => (
              <div
                key={user.assignment_id}
                style={{
                  border: `1px solid ${toneStyles.rowBorder}`,
                  borderRadius: "18px",
                  padding: "16px",
                  marginBottom: "12px",
                  background: BRAND.white,
                  boxShadow: "0 6px 16px rgba(91, 19, 38, 0.04)",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    color: BRAND.textStrong,
                    marginBottom: "6px",
                    fontSize: "16px",
                  }}
                >
                  {user.full_name || "Kullanıcı"}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: BRAND.textBody,
                    lineHeight: 1.8,
                  }}
                >
                  Email: {user.email || "-"}
                  <br />
                  Eğitim: {user.training_title || "-"}
                  <br />
                  Firma: {user.company_id || "-"}
                </div>
              </div>
            ))
          )}
        </div>
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
        background: BRAND.riskSoft,
        border: `1px solid ${BRAND.border}`,
        color: BRAND.textMuted,
      }}
    >
      {text}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}