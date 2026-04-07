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
      color: "#2e7d32",
    },
    {
      label: "Devam Ediyor",
      value: inProgressRate,
      color: "#1565c0",
    },
    {
      label: "Başlamadı",
      value: riskRate,
      color: "#8b1e2d",
    },
  ];

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#fff8f8",
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #f1d5d8",
              borderRadius: "28px",
              padding: "28px",
              boxShadow: "0 18px 48px rgba(87, 14, 26, 0.08)",
            }}
          >
            <h1 style={{ marginTop: 0, color: "#5f0f1f" }}>Yükleniyor...</h1>
            <p style={{ color: "#7b5560" }}>Admin dashboard hazırlanıyor.</p>
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
          background: "#fff8f8",
          padding: "36px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ef9aa5",
              borderRadius: "28px",
              padding: "28px",
              color: "#8b1e2d",
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
    <>
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #fff5f6 0%, #fffafb 26%, #ffffff 100%)",
          padding: "32px 20px 48px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1450px", margin: "0 auto" }}>
          <div
            style={{
              borderRadius: "34px",
              padding: "32px",
              background:
                "linear-gradient(135deg, #3f0b17 0%, #7f1734 48%, #b91c3c 100%)",
              color: "#ffffff",
              boxShadow: "0 26px 70px rgba(91, 19, 38, 0.26)",
              marginBottom: "24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: "-80px",
                top: "-80px",
                width: "260px",
                height: "260px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "140px",
                bottom: "-90px",
                width: "220px",
                height: "220px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                D-SEC • Admin Eğitim Merkezi
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "50px",
                  lineHeight: 1.03,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  maxWidth: "820px",
                }}
              >
                Eğitim Performans
                <br />
                Risk ve Yönetim Paneli
              </h1>

              <p
                style={{
                  marginTop: "16px",
                  marginBottom: "24px",
                  maxWidth: "900px",
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.8,
                  fontSize: "17px",
                }}
              >
                Eğitim atamaları, başlama oranları, riskli kullanıcı kümeleri,
                firma bazlı yoğunluklar ve eğitim bazlı dağılımlar tek ekranda
                kurumsal görünümle izlenir.
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
              accent="#7f1734"
            />
            <KpiCard
              title="Tamamlanan"
              value={totals.completed}
              sub="Final başarıyla kapanan eğitimler"
              accent="#2e7d32"
            />
            <KpiCard
              title="Devam Eden"
              value={totals.inProgress}
              sub="Aktif süreci devam eden kullanıcılar"
              accent="#1565c0"
            />
            <KpiCard
              title="Başlamayan"
              value={totals.notStarted}
              sub="Öncelikli takip edilmesi gereken riskli grup"
              accent="#8b1e2d"
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
                  background: "#fff7f8",
                  border: "1px solid #f0d7dc",
                  color: "#4f2831",
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
                    color="#8b1e2d"
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
                    color="#b4233c"
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
                      color: "#64748b",
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
                      color: "#64748b",
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
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.82)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "32px", fontWeight: 900 }}>{value}</div>
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
        background: "#ffffff",
        border: "1px solid #eed9de",
        borderRadius: "22px",
        padding: "20px",
        boxShadow: "0 12px 34px rgba(91, 19, 38, 0.06)",
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
          height: "4px",
          background: accent,
        }}
      />
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: "#7a5c63",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "34px",
          fontWeight: 900,
          color: "#3f0b17",
          marginBottom: "10px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#6f5560", lineHeight: 1.7, fontSize: "14px" }}>
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
        border: "1px solid #eed9de",
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 12px 34px rgba(91, 19, 38, 0.06)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "18px",
          fontSize: "22px",
          fontWeight: 900,
          color: "#3f0b17",
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
          color: "#5e3d45",
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
          background: "#f2e6e9",
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
          color: "#5e3d45",
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
          background: "#f2e6e9",
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
                bg: "#fff7f8",
                border: "#f1c8d0",
                badgeBg: "#fee2e2",
                badgeColor: "#8b1e2d",
              }
            : tone === "progress"
            ? {
                bg: "#f5f9ff",
                border: "#cfe0fb",
                badgeBg: "#e8f1ff",
                badgeColor: "#1565c0",
              }
            : {
                bg: "#f4fcf5",
                border: "#cfe8d1",
                badgeBg: "#e4f6e6",
                badgeColor: "#2e7d32",
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
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 900,
                color: "#3f0b17",
                marginBottom: "6px",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: "#6c525b",
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
          topBg: "linear-gradient(135deg, #4b0e1c 0%, #8b1e2d 100%)",
          chipBg: "#fee2e2",
          chipColor: "#8b1e2d",
          rowBorder: "#f1d0d6",
        }
      : panel.tone === "progress"
      ? {
          topBg: "linear-gradient(135deg, #0b3b78 0%, #1565c0 100%)",
          chipBg: "#e8f1ff",
          chipColor: "#1565c0",
          rowBorder: "#d3e2fa",
        }
      : {
          topBg: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
          chipBg: "#e4f6e6",
          chipColor: "#2e7d32",
          rowBorder: "#d3e8d5",
        };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,17,17,0.45)",
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
          background: "#ffffff",
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
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#fff",
                borderRadius: "12px",
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
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
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    color: "#3f0b17",
                    marginBottom: "6px",
                    fontSize: "16px",
                  }}
                >
                  {user.full_name || "Kullanıcı"}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#6f5560",
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
        background: "#fff7f8",
        border: "1px solid #f0d7dc",
        color: "#7a5c63",
      }}
    >
      {text}
    </div>
  );
}
