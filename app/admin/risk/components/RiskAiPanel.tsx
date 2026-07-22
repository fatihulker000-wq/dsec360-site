"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  record: RiskRecord;
};

type DoraAnalysis = {
  summary: string;
  rootCauses: string[];
  accidentScenario: string[];
  engineeringControls: string[];
  administrativeControls: string[];
  ppeRecommendations: string[];
  managementDecision: string;
  legislation: string[];
  residualRiskEstimate: string;
};

type QualityItem = {
  label: string;
  completed: boolean;
  weight: number;
};

function normalizeRiskScore(record: RiskRecord) {
  if (record.method === "FINE_KINNEY") {
    return Math.min(
      100,
      (Number(record.score || 0) / 400) * 100
    );
  }

  return Math.min(
    100,
    (Number(record.score || 0) / 25) * 100
  );
}

function calculatePriorityScore(record: RiskRecord) {
  const riskScore = normalizeRiskScore(record);

  const overdueScore =
    !record.completed &&
    Boolean(record.dueDateMillis) &&
    Number(record.dueDateMillis) < Date.now()
      ? 100
      : !record.completed
        ? 55
        : 0;

  const responsibilityScore = record.responsible?.trim()
    ? 100
    : 20;

  const evidenceScore =
    record.photoUrl || record.attachmentUrl
      ? 100
      : 35;

  const criticalityScore =
    record.level === "INTOLERABLE"
      ? 100
      : record.level === "VERY_HIGH"
        ? 90
        : record.level === "HIGH"
          ? 72
          : record.level === "MEDIUM"
            ? 45
            : 20;

  const score = Math.round(
    riskScore * 0.38 +
      overdueScore * 0.22 +
      criticalityScore * 0.22 +
      (100 - responsibilityScore) * 0.08 +
      (100 - evidenceScore) * 0.1
  );

  return Math.max(0, Math.min(100, score));
}

function priorityInfo(score: number) {
  if (score >= 85) {
    return {
      label: "Kritik",
      description:
        "Yönetim müdahalesi ve kısa terminli düzeltici faaliyet gerektirir.",
      background: "#450a0a",
      color: "#ffffff",
    };
  }

  if (score >= 70) {
    return {
      label: "Çok Yüksek",
      description:
        "Öncelikli aksiyon planı oluşturulmalı ve yönetici takibine alınmalıdır.",
      background: "#fef2f2",
      color: "#b91c1c",
    };
  }

  if (score >= 50) {
    return {
      label: "Yüksek",
      description:
        "Planlı DÖF açılmalı ve uygulama etkinliği düzenli izlenmelidir.",
      background: "#fff7ed",
      color: "#c2410c",
    };
  }

  if (score >= 30) {
    return {
      label: "Orta",
      description:
        "Kontroller sürdürülmeli ve belirlenen termin içinde iyileştirme yapılmalıdır.",
      background: "#fffbeb",
      color: "#92400e",
    };
  }

  return {
    label: "Düşük",
    description:
      "Mevcut kontroller korunmalı ve periyodik saha kontrolü yapılmalıdır.",
    background: "#ecfdf5",
    color: "#047857",
  };
}

function calculateRiskQuality(record: RiskRecord) {
  const items: QualityItem[] = [
    {
      label: "Faaliyet açıklaması",
      completed: Boolean(record.activity?.trim()),
      weight: 10,
    },
    {
      label: "Tehlike açıklaması",
      completed: Boolean(record.hazard?.trim()),
      weight: 12,
    },
    {
      label: "Olası sonuç",
      completed: Boolean(record.consequence?.trim()),
      weight: 10,
    },
    {
      label: "Mevcut kontrol",
      completed: Boolean(record.existingControl?.trim()),
      weight: 12,
    },
    {
      label: "İlave kontrol",
      completed: Boolean(record.proposedControl?.trim()),
      weight: 12,
    },
    {
      label: "Sorumlu ataması",
      completed: Boolean(record.responsible?.trim()),
      weight: 10,
    },
    {
      label: "Termin tarihi",
      completed: Boolean(record.dueDateMillis),
      weight: 10,
    },
    {
      label: "Risk puanı",
      completed: Number(record.score || 0) > 0,
      weight: 10,
    },
    {
      label: "Fotoğraf kanıtı",
      completed: Boolean(record.photoUrl),
      weight: 7,
    },
    {
      label: "Belge kanıtı",
      completed: Boolean(record.attachmentUrl),
      weight: 7,
    },
  ];

  const score = items.reduce(
    (sum, item) =>
      sum + (item.completed ? item.weight : 0),
    0
  );

  return {
    score,
    items,
  };
}

function inferScenario(record: RiskRecord) {
  const hazard =
    record.hazard?.trim() || "Tehlikeli durum";

  const consequence =
    record.consequence?.trim() ||
    "Çalışanın yaralanması veya operasyonel kayıp";

  return [
    `${hazard} çalışma sırasında ortaya çıkar veya kontrol dışına çıkar.`,
    "Çalışan tehlike bölgesinde bulunur ve mevcut kontroller olayı tamamen engelleyemez.",
    consequence,
    "Faaliyet durdurulur, ilk müdahale ve olay bildirimi süreçleri başlatılır.",
    "Kök neden analizi yapılır ve ilave kontrol tedbirleri tamamlanmadan benzer faaliyet güvenli kabul edilmez.",
  ];
}

function inferLegislation(record: RiskRecord) {
  const text = [
    record.activity,
    record.hazard,
    record.consequence,
    record.existingControl,
    record.proposedControl,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  const items = new Set<string>([
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği",
  ]);

  if (
    /forklift|makine|ekipman|pres|konveyör|vinç|transpalet/.test(
      text
    )
  ) {
    items.add(
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği"
    );
  }

  if (/yangın|tahliye|acil|patlama/.test(text)) {
    items.add(
      "İşyerlerinde Acil Durumlar Hakkında Yönetmelik"
    );
    items.add(
      "Binaların Yangından Korunması Hakkında Yönetmelik"
    );
  }

  if (/elektrik|pano|kablo|ark/.test(text)) {
    items.add("Elektrik İç Tesisleri Yönetmeliği");
  }

  if (/elle taşıma|kaldırma|ergonomi|bel/.test(text)) {
    items.add("Elle Taşıma İşleri Yönetmeliği");
  }

  if (/kimyasal|solvent|asit|gaz|toz/.test(text)) {
    items.add(
      "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik"
    );
  }

  if (/kkd|baret|eldiven|gözlük|maske/.test(text)) {
    items.add(
      "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik"
    );
  }

  if (/işaret|levha|uyarı|trafik planı/.test(text)) {
    items.add(
      "Sağlık ve Güvenlik İşaretleri Yönetmeliği"
    );
  }

  return Array.from(items);
}

function PanelTitle({
  icon,
  children,
  color,
}: {
  icon: ReactNode;
  children: ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        color,
        fontWeight: 950,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

function RiskPriorityCard({
  record,
}: {
  record: RiskRecord;
}) {
  const score = calculatePriorityScore(record);
  const info = priorityInfo(score);

  const dueStatus = record.completed
    ? "Kapalı"
    : record.dueDateMillis &&
        Number(record.dueDateMillis) < Date.now()
      ? "Gecikmiş"
      : "Açık";

  return (
    <section
      style={{
        borderRadius: 18,
        border: `1px solid ${info.color}33`,
        background: info.background,
        color: info.color,
        padding: 15,
        display: "grid",
        gap: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <PanelTitle
          icon={<Gauge size={19} />}
          color={info.color}
        >
          Yönetim Öncelik Puanı
        </PanelTitle>

        <strong style={{ fontSize: 24 }}>
          {score}/100
        </strong>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 999,
            background: info.color,
          }}
        />
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 950,
          }}
        >
          Öncelik: {info.label}
        </div>

        <p
          style={{
            margin: "5px 0 0",
            color: info.color,
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {info.description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 8,
        }}
      >
        {[
          {
            icon: <ShieldAlert size={14} />,
            label: "Risk seviyesi",
            value: record.level,
          },
          {
            icon: <TimerReset size={14} />,
            label: "DÖF",
            value: dueStatus,
          },
          {
            icon: <Users size={14} />,
            label: "Sorumlu",
            value: record.responsible?.trim()
              ? "Atandı"
              : "Eksik",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 11,
              background: "rgba(255,255,255,.56)",
              padding: 9,
            }}
          >
            {item.icon}

            <div
              style={{
                marginTop: 5,
                fontSize: 9,
                fontWeight: 900,
              }}
            >
              {item.label}
            </div>

            <strong
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 11,
              }}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      {score >= 70 ? (
        <div
          style={{
            borderRadius: 12,
            background: "rgba(255,255,255,.62)",
            padding: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          <AlertTriangle size={16} />
          Yönetici takibi gerektirir.
        </div>
      ) : null}
    </section>
  );
}

function RiskQualityCard({
  record,
}: {
  record: RiskRecord;
}) {
  const result = calculateRiskQuality(record);

  const color =
    result.score >= 85
      ? "#047857"
      : result.score >= 65
        ? "#1d4ed8"
        : result.score >= 45
          ? "#92400e"
          : "#b91c1c";

  const background =
    result.score >= 85
      ? "#ecfdf5"
      : result.score >= 65
        ? "#eff6ff"
        : result.score >= 45
          ? "#fffbeb"
          : "#fef2f2";

  return (
    <section
      style={{
        borderRadius: 18,
        border: `1px solid ${color}33`,
        background,
        padding: 15,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          color,
        }}
      >
        <PanelTitle
          icon={<ShieldCheck size={19} />}
          color={color}
        >
          Risk Kaydı Kalitesi
        </PanelTitle>

        <strong style={{ fontSize: 22 }}>
          %{result.score}
        </strong>
      </div>

      <div
        style={{
          height: 9,
          borderRadius: 999,
          background: "rgba(255,255,255,.62)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${result.score}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 7,
        }}
      >
        {result.items.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 10,
              background: "rgba(255,255,255,.55)",
              padding: 8,
              display: "grid",
              gridTemplateColumns: "15px 1fr",
              gap: 6,
              alignItems: "center",
              color: item.completed
                ? "#047857"
                : "#64748b",
              fontSize: 10,
              fontWeight: 850,
            }}
          >
            {item.completed ? (
              <CheckCircle2 size={14} />
            ) : (
              <Circle size={14} />
            )}

            {item.label}
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 11,
          background: "rgba(255,255,255,.58)",
          padding: 9,
          display: "flex",
          gap: 12,
          alignItems: "center",
          color: "#475569",
          fontSize: 10,
          fontWeight: 850,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <ImageIcon size={13} />
          Fotoğraf:{" "}
          {record.photoUrl ? "Var" : "Eksik"}
        </span>

        <span
          style={{
            display: "inline-flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <Paperclip size={13} />
          Belge:{" "}
          {record.attachmentUrl ? "Var" : "Eksik"}
        </span>
      </div>
    </section>
  );
}

function RiskAccidentScenario({
  record,
  scenario,
}: {
  record: RiskRecord;
  scenario?: string[];
}) {
  const steps =
    scenario && scenario.length > 0
      ? scenario
      : inferScenario(record);

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #fecaca",
        background: "#fef2f2",
        padding: 15,
      }}
    >
      <PanelTitle
        icon={<AlertOctagon size={19} />}
        color="#b91c1c"
      >
        Muhtemel Olay Zinciri
      </PanelTitle>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 8,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={`${index}-${step}`}
            style={{
              display: "grid",
              gridTemplateColumns:
                "25px 17px minmax(0,1fr)",
              gap: 7,
              alignItems: "start",
            }}
          >
            <div
              style={{
                width: 25,
                height: 25,
                borderRadius: 9,
                background: "#b91c1c",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                fontWeight: 950,
              }}
            >
              {index + 1}
            </div>

            <ArrowRight
              size={15}
              color="#b91c1c"
              style={{ marginTop: 5 }}
            />

            <div
              style={{
                color: "#334155",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RiskLegislationPanel({
  record,
  legislation,
}: {
  record: RiskRecord;
  legislation?: string[];
}) {
  const items =
    legislation && legislation.length > 0
      ? legislation
      : inferLegislation(record);

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #ddd6fe",
        background: "#f5f3ff",
        padding: 15,
      }}
    >
      <PanelTitle
        icon={<BookOpenCheck size={19} />}
        color="#6d28d9"
      >
        İlgili Mevzuat
      </PanelTitle>

      <div
        style={{
          marginTop: 11,
          display: "grid",
          gap: 8,
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: "grid",
              gridTemplateColumns: "17px 1fr",
              gap: 7,
              color: "#334155",
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            <CheckCircle2
              size={15}
              color="#6d28d9"
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RiskAiPanel({
  record,
}: Props) {
  const [analysis, setAnalysis] =
    useState<DoraAnalysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/risk-management/ai-analysis",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            record,
          }),
        }
      );

      const json = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.message ||
            json.error ||
            "DORA analizi oluşturulamadı."
        );
      }

      setAnalysis(json.analysis || null);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "DORA analizi oluşturulamadı."
      );
    } finally {
      setLoading(false);
    }
  }, [record]);

  useEffect(() => {
    void loadAnalysis();
  }, [loadAnalysis]);

  const rootCauses = useMemo(
    () => analysis?.rootCauses || [],
    [analysis]
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section
        style={{
          borderRadius: 20,
          background:
            "linear-gradient(135deg,#312e81 0%,#581c87 55%,#6b1020 100%)",
          color: "#ffffff",
          padding: 17,
          display: "grid",
          gap: 13,
          boxShadow:
            "0 18px 42px rgba(76,29,149,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div>
            <PanelTitle
              icon={<BrainCircuit size={20} />}
              color="#ffffff"
            >
              DORA Risk Danışmanı
            </PanelTitle>

            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(255,255,255,.74)",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              Risk kaydını kontrol hiyerarşisi,
              olası olay zinciri ve yönetim önceliği
              açısından değerlendirir.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAnalysis()}
            disabled={loading}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              border:
                "1px solid rgba(255,255,255,.2)",
              background:
                "rgba(255,255,255,.1)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? (
              <Loader2
                size={16}
                className="doraSpin"
              />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>

        {error ? (
          <div
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,.12)",
              padding: 10,
              fontSize: 11,
              fontWeight: 850,
            }}
          >
            {error}
          </div>
        ) : loading ? (
          <div
            style={{
              minHeight: 100,
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,.72)",
              fontSize: 11,
            }}
          >
            DORA risk kaydını analiz ediyor...
          </div>
        ) : analysis ? (
          <>
            <div
              style={{
                borderRadius: 14,
                background: "rgba(255,255,255,.1)",
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  alignItems: "center",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                <Sparkles size={14} />
                YÖNETİCİ ÖZETİ
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {analysis.managementDecision}
              </p>
            </div>

            <div
              style={{
                borderRadius: 14,
                background: "rgba(255,255,255,.1)",
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                RİSK ÖZETİ
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: 11,
                  lineHeight: 1.55,
                }}
              >
                {analysis.summary}
              </p>
            </div>

            {rootCauses.length > 0 ? (
              <div
                style={{
                  borderRadius: 14,
                  background: "rgba(255,255,255,.1)",
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  KÖK NEDENLER
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {rootCauses.map((item) => (
                    <div
                      key={item}
                      style={{
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <div
        className="doraTwoColumn"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 12,
        }}
      >
        <RiskPriorityCard record={record} />
        <RiskQualityCard record={record} />
      </div>

      {analysis ? (
        <>
          <RiskAccidentScenario
            record={record}
            scenario={analysis.accidentScenario}
          />

          <section
            style={{
              borderRadius: 18,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              padding: 15,
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                color: "#1d4ed8",
                fontWeight: 950,
              }}
            >
              Kontrol Hiyerarşisi Önerileri
            </div>

            {[
              {
                title: "Mühendislik Kontrolleri",
                items: analysis.engineeringControls,
              },
              {
                title: "İdari Kontroller",
                items:
                  analysis.administrativeControls,
              },
              {
                title: "KKD Önerileri",
                items:
                  analysis.ppeRecommendations,
              },
            ].map((group) => (
              <div key={group.title}>
                <div
                  style={{
                    color: "#0f172a",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {group.title}
                </div>

                <div
                  style={{
                    marginTop: 7,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {group.items.map((item) => (
                    <div
                      key={item}
                      style={{
                        borderRadius: 10,
                        background: "#ffffff",
                        padding: 9,
                        color: "#475569",
                        fontSize: 10,
                        lineHeight: 1.45,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <RiskLegislationPanel
            record={record}
            legislation={analysis.legislation}
          />

          <section
            style={{
              borderRadius: 18,
              border: "1px solid #a7f3d0",
              background: "#ecfdf5",
              padding: 15,
            }}
          >
            <div
              style={{
                color: "#047857",
                fontWeight: 950,
              }}
            >
              Tahmini Kalan Risk
            </div>

            <p
              style={{
                margin: "7px 0 0",
                color: "#334155",
                fontSize: 11,
                lineHeight: 1.55,
              }}
            >
              {analysis.residualRiskEstimate}
            </p>
          </section>
        </>
      ) : null}

      <style jsx>{`
        .doraSpin {
          animation: dora-spin 0.9s linear infinite;
        }

        @keyframes dora-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .doraTwoColumn {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}