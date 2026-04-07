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
  shadowStrong: "0 28px 80px rgba(129, 19px, 38, 0.24)",

  risk: "#a61b2b",
  progress: "#c62828",
  done: "#2e7d32",

  riskSoft: "#fff5f6",
  progressSoft: "#fff1f1",
  doneSoft: "#f4fcf5",

  riskBorder: "#efc7cf",
  progressBorder: "#f2c3c3",
  doneBorder: "#cfe8d1",
};

export default function AdminDashboardPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailPanel, setDetailPanel] = useState<DetailPanelState>({
    open: false,
    title: "",
    subtitle: "",
    users: [],
    tone: "risk",
  });

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

  const progressBars = [
    {
      label: "Tamamlandı",
      value: completionRate,
      color: BRAND.done,
    },
    {
      label: "Devam Ediyor",
      value: inProgressRate,
      color: BRAND.progress,
    },
    {
      label: "Başlamadı",
      value: riskRate,
      color: BRAND.risk,
    },
  ];

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
              boxShadow: "0 28px 80px rgba(129, 19, 38, 0.24)",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
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

            <Panel title="Yönetici Yorumu">
              <div
                style={{
                  borderRadius: "18px",
                  padding: "18px",
                  background:
                    "linear-gradient(180deg, rgba(255,245,246,1) 0%, rgba(255,251,251,1) 100%)",
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.textStrong,
                  lineHeight: 1.8,
                }}
              >
                Sistemde toplam <b>{totals.assigned}</b> eğitim ataması var.
                Bunların <b>%{riskRate}</b> kadarı henüz başlamamış durumda.
                Tamamlanma oranı <b>%{completionRate}</b> seviyesinde. En yoğun
                yönetim ihtiyacı, riskli kullanıcı kümelerinde ve firma bazlı
                yoğunluk alanlarında görünüyor.
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
                    color={BRAND.risk}
                  />
                ))
              )}
            </Panel>

            <Panel title="Firma Bazlı Risk Yoğunluğu">
              {riskyCompanyGroups.length === 0 ? (
                <EmptyText text="Firma bazlı risk verisi bulunamadı." />
              ) : (
                riskyCompanyGroups.slice(0, 6).map((item) => (
                  <ProgressCountRow
                    key={item.key}
                    label={item.title}
                    value={item.count}
                    total={Math.max(riskyUsers.length, 1)}
                    color={BRAND.heroMain}
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
          fontWeight: 800,
          color: BRAND.textBody,
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
          background: "#f4e5e8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
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
          color: BRAND.textBody,
          fontWeight: 800,
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
          background: "#f4e5e8",
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