"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  Save,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";

import type {
  RiskLevel,
  RiskMethod,
} from "../types";
import {
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";
import {
  RISK_LIBRARY,
  RISK_LIBRARY_SECTORS,
  type RiskLibraryItem,
} from "./riskLibrary";
import {
  getRiskControlBundle,
  type ControlSuggestion,
  type DofSuggestion,
} from "./riskControlLibrary";

export type RiskFormState = {
  id?: string;
  firmId: string;
  company: string;
  department: string;
  process: string;
  activity: string;
  hazard: string;
  consequence: string;
  existingControl: string;
  proposedControl: string;
  responsible: string;
  dueDateMillis: number | null;
  completed: boolean;
  probability: number;
  frequency: number;
  severity: number;
  score: number;
  method: RiskMethod;
  level: RiskLevel;
  photoUrl: string | null;
  attachmentUrl: string | null;
};

type TabId =
  | "GENERAL"
  | "ANALYSIS"
  | "CONTROLS"
  | "DOF";

type Props = {
  open: boolean;
  form: RiskFormState;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (
    form: RiskFormState
  ) => void | Promise<void>;
};

type ScoreOption = {
  value: number;
  title: string;
  description: string;
};

const PROBABILITY_OPTIONS: ScoreOption[] = [
  {
    value: 0.2,
    title: "Pratikte imkânsız",
    description:
      "Olayın gerçekleşmesi normal çalışma şartlarında beklenmez; ancak teorik olarak tamamen dışlanamaz.",
  },
  {
    value: 0.5,
    title: "Çok düşük olasılık",
    description:
      "Benzer faaliyetlerde çok seyrek görülür ve ancak olağan dışı koşulların birleşmesiyle ortaya çıkabilir.",
  },
  {
    value: 1,
    title: "Düşük olasılık",
    description:
      "Gerçekleşmesi mümkündür fakat mevcut şartlarda nadir beklenir.",
  },
  {
    value: 3,
    title: "Olası",
    description:
      "Uygun olmayan çalışma şartları devam ederse zaman zaman gerçekleşebilir.",
  },
  {
    value: 6,
    title: "Yüksek olasılık",
    description:
      "Mevcut kontrol tedbirleri yetersizse olayın gerçekleşmesi kuvvetle muhtemeldir.",
  },
  {
    value: 10,
    title: "Çok yüksek olasılık",
    description:
      "Tehlikeli durum sürekli veya belirgin şekilde mevcut olduğundan olayın gerçekleşmesi beklenir.",
  },
];

const FREQUENCY_OPTIONS: ScoreOption[] = [
  {
    value: 0.5,
    title: "Yılda bir veya daha seyrek",
    description:
      "Çalışan tehlikeye çok sınırlı ve istisnai olarak maruz kalır.",
  },
  {
    value: 1,
    title: "Ayda bir",
    description:
      "Faaliyet periyodik olarak yürütülür ve maruziyet aylık düzeydedir.",
  },
  {
    value: 2,
    title: "Haftada bir",
    description:
      "Tehlikeli faaliyet haftalık iş akışının bir parçasıdır.",
  },
  {
    value: 3,
    title: "Günde bir",
    description:
      "Çalışan tehlikeye günlük çalışma sürecinde en az bir kez maruz kalır.",
  },
  {
    value: 6,
    title: "Günde birçok kez / saatte bir",
    description:
      "Tehlike çalışma süresince sık aralıklarla tekrar eder.",
  },
  {
    value: 10,
    title: "Sürekli maruziyet",
    description:
      "Tehlike çalışma boyunca sürekli veya kesintisiz şekilde mevcuttur.",
  },
];

const SEVERITY_OPTIONS: ScoreOption[] = [
  {
    value: 1,
    title: "Ramak kala / önemsiz etki",
    description:
      "Yaralanma oluşmaz veya çok küçük bir etki meydana gelir; iş gücü kaybı beklenmez.",
  },
  {
    value: 3,
    title: "İlk yardım gerektiren yaralanma",
    description:
      "Basit tıbbi müdahale yeterlidir ve kalıcı etki beklenmez.",
  },
  {
    value: 7,
    title: "İş günü kayıplı yaralanma",
    description:
      "Geçici iş göremezlik, tedavi veya belirli süre işten uzak kalma söz konusudur.",
  },
  {
    value: 15,
    title: "Kalıcı yaralanma / ciddi meslek hastalığı",
    description:
      "Uzuv kaybı, kalıcı fonksiyon kaybı veya uzun süreli sağlık etkisi oluşabilir.",
  },
  {
    value: 40,
    title: "Tek ölüm",
    description:
      "Olay bir çalışanın veya üçüncü kişinin ölümüyle sonuçlanabilir.",
  },
  {
    value: 100,
    title: "Birden fazla ölüm / afet boyutu",
    description:
      "Birden fazla kişinin ölümü, geniş çaplı hasar veya işletme sürekliliğini etkileyen sonuçlar oluşabilir.",
  },
];

const MATRIX_PROBABILITY: ScoreOption[] = [
  { value: 1, title: "Çok düşük", description: "Gerçekleşmesi beklenmez." },
  { value: 2, title: "Düşük", description: "Nadiren gerçekleşebilir." },
  { value: 3, title: "Orta", description: "Zaman zaman gerçekleşebilir." },
  { value: 4, title: "Yüksek", description: "Sıklıkla gerçekleşebilir." },
  { value: 5, title: "Çok yüksek", description: "Gerçekleşmesi beklenir." },
];

const MATRIX_SEVERITY: ScoreOption[] = [
  { value: 1, title: "Önemsiz", description: "Yaralanma yok veya çok hafif etki." },
  { value: 2, title: "Hafif", description: "İlk yardım düzeyinde yaralanma." },
  { value: 3, title: "Ciddi", description: "İş günü kaybı veya tıbbi tedavi." },
  { value: 4, title: "Çok ciddi", description: "Kalıcı yaralanma veya tek ölüm." },
  { value: 5, title: "Felaket", description: "Birden fazla ölüm veya büyük kayıp." },
];

function toDateInput(value?: number | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

function toMillis(value: string) {
  if (!value) return null;
  const millis = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(millis) ? null : millis;
}

function recommendation(score: number) {
  if (score >= 400) {
    return {
      days: 0,
      priority: 5,
      text: "Faaliyet derhal durdurulmalı; risk kabul edilebilir seviyeye indirilmeden çalışmaya başlanmamalıdır.",
    };
  }

  if (score >= 200) {
    return {
      days: 7,
      priority: 5,
      text: "Kısa vadeli ve öncelikli iyileştirme planı hazırlanmalı, mühendislik kontrolleri gecikmeden uygulanmalıdır.",
    };
  }

  if (score >= 70) {
    return {
      days: 30,
      priority: 4,
      text: "Planlı düzeltici faaliyet oluşturulmalı ve belirlenen termin içerisinde tamamlanmalıdır.",
    };
  }

  if (score >= 20) {
    return {
      days: 90,
      priority: 3,
      text: "Mevcut kontroller sürdürülmeli, ek iyileştirme tedbirleri planlı şekilde uygulanmalıdır.",
    };
  }

  return {
    days: 180,
    priority: 2,
    text: "Mevcut kontroller korunmalı ve etkinliği periyodik saha kontrolleriyle doğrulanmalıdır.",
  };
}

function appendParagraph(
  current: string,
  text: string
) {
  const normalizedCurrent = current.trim();

  if (!normalizedCurrent) {
    return text.trim();
  }

  if (normalizedCurrent.includes(text.trim())) {
    return current;
  }

  return `${normalizedCurrent}\n\n${text.trim()}`;
}

function SuggestionButton({
  item,
  onAdd,
}: {
  item: ControlSuggestion;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      style={{
        borderRadius: 13,
        border: "1px solid #dbe3ec",
        background: "#ffffff",
        padding: 11,
        textAlign: "left",
        cursor: "pointer",
        display: "grid",
        gap: 5,
      }}
    >
      <strong
        style={{
          color: "#0f172a",
          fontSize: 12,
        }}
      >
        + {item.title}
      </strong>

      <span
        style={{
          color: "#64748b",
          fontSize: 11,
          lineHeight: 1.45,
        }}
      >
        {item.text}
      </span>
    </button>
  );
}

function calculateDialogLevel(
  score: number,
  method: RiskMethod
): RiskLevel {
  if (method === "MATRIX_5X5") {
    if (score <= 6) return "LOW";
    if (score <= 12) return "MEDIUM";
    if (score <= 16) return "HIGH";
    if (score <= 20) return "VERY_HIGH";
    return "INTOLERABLE";
  }

  if (score < 20) return "LOW";
  if (score < 70) return "MEDIUM";
  if (score < 200) return "HIGH";
  if (score < 400) return "VERY_HIGH";
  return "INTOLERABLE";
}

function OptionGrid({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: ScoreOption[];
  value: number;
  onSelect: (value: number) => void;
}) {
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <h4
        style={{
          margin: 0,
          color: "#0f172a",
          fontSize: 14,
          fontWeight: 950,
        }}
      >
        {title}
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 8,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              style={{
                minHeight: 86,
                borderRadius: 14,
                border: selected
                  ? "2px solid #6b1020"
                  : "1px solid #dbe3ec",
                background: selected
                  ? "#fff1f2"
                  : "#ffffff",
                padding: 11,
                textAlign: "left",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "38px 1fr",
                gap: 9,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: selected
                    ? "#6b1020"
                    : "#f1f5f9",
                  color: selected
                    ? "#ffffff"
                    : "#334155",
                  fontWeight: 950,
                }}
              >
                {option.value}
              </span>

              <span>
                <span
                  style={{
                    display: "block",
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {option.title}
                </span>

                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function RiskDialog({
  open,
  form,
  saving,
  error = "",
  onClose,
  onSave,
}: Props) {
  const [tab, setTab] = useState<TabId>("GENERAL");
  const [draft, setDraft] =
    useState<RiskFormState>(form);

  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySector, setLibrarySector] = useState("ALL");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState("");

  const [residualProbability, setResidualProbability] =
    useState(draft.probability);

  const [residualFrequency, setResidualFrequency] =
    useState(draft.frequency);

  const [residualSeverity, setResidualSeverity] =
    useState(draft.severity);

  useEffect(() => {
    if (!open) return;

    setDraft(form);
    setTab("GENERAL");
    setLibrarySearch("");
    setLibrarySector("ALL");
    setSelectedTemplateId("");
    setResidualProbability(form.probability);
    setResidualFrequency(form.frequency);
    setResidualSeverity(form.severity);
  }, [open, form.id]);

  const updateDraft = <
    K extends keyof RiskFormState
  >(
    field: K,
    value: RiskFormState[K]
  ) => {
    setDraft((current) => {
      const next: RiskFormState = {
        ...current,
        [field]: value,
      };

      if (
        field === "probability" ||
        field === "frequency" ||
        field === "severity" ||
        field === "method"
      ) {
        const score =
          next.method === "FINE_KINNEY"
            ? Number(next.probability) *
              Number(next.frequency) *
              Number(next.severity)
            : Number(next.probability) *
              Number(next.severity);

        next.score =
          Math.round(score * 100) / 100;

        next.level = calculateDialogLevel(
          next.score,
          next.method
        );
      }

      return next;
    });
  };

  const advice = useMemo(
    () => recommendation(draft.score),
    [draft.score]
  );

  const residualScore = useMemo(() => {
    if (draft.method === "FINE_KINNEY") {
      return Math.round(
        residualProbability *
          residualFrequency *
          residualSeverity *
          100
      ) / 100;
    }

    return Math.round(
      residualProbability *
        residualSeverity *
        100
    ) / 100;
  }, [
    draft.method,
    residualProbability,
    residualFrequency,
    residualSeverity,
  ]);

  const residualLevel = useMemo(
    () =>
      draft.method === "FINE_KINNEY"
        ? residualScore >= 400
          ? "INTOLERABLE"
          : residualScore >= 200
            ? "VERY_HIGH"
            : residualScore >= 70
              ? "HIGH"
              : residualScore >= 20
                ? "MEDIUM"
                : "LOW"
        : residualScore >= 25
          ? "INTOLERABLE"
          : residualScore >= 20
            ? "VERY_HIGH"
            : residualScore >= 15
              ? "HIGH"
              : residualScore >= 8
                ? "MEDIUM"
                : "LOW",
    [draft.method, residualScore]
  );

  const reductionPercent = useMemo(() => {
    if (draft.score <= 0) return 0;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((draft.score - residualScore) /
            draft.score) *
            100
        )
      )
    );
  }, [draft.score, residualScore]);

  const riskScaleMaximum =
    draft.method === "FINE_KINNEY" ? 400 : 25;

  const riskScalePercent = Math.max(
    0,
    Math.min(
      100,
      (Number(draft.score || 0) /
        riskScaleMaximum) *
        100
    )
  );

  const actionItems = useMemo(() => {
    if (draft.score >= 400) {
      return [
        "Faaliyeti derhal durdur",
        "Yönetimi ve ilgili bölüm sorumlusunu bilgilendir",
        "Acil DÖF kaydı aç",
        "Geçici güvenlik tedbirlerini hemen uygula",
        "Risk kabul edilebilir seviyeye düşmeden çalışmayı başlatma",
      ];
    }

    if (draft.score >= 200) {
      return [
        "Öncelikli DÖF kaydı aç",
        "Mühendislik kontrolü planla",
        "Kısa terminli sorumlu ataması yap",
        "Yönetici takibine al",
        "Uygulama sonrası kalan riski yeniden hesapla",
      ];
    }

    if (draft.score >= 70) {
      return [
        "Planlı DÖF oluştur",
        "Kontrol tedbirlerini terminli hale getir",
        "Saha uygulamasını doğrula",
        "Kalan risk değerlendirmesi yap",
      ];
    }

    if (draft.score >= 20) {
      return [
        "Mevcut kontrolleri sürdür",
        "İlave iyileştirmeleri planla",
        "Periyodik izlemeye al",
      ];
    }

    return [
      "Mevcut kontrolleri koru",
      "Periyodik saha kontrolü yap",
      "Koşullar değişirse yeniden değerlendir",
    ];
  }, [draft.score]);

  const filteredTemplates = useMemo(() => {
    const query = librarySearch
      .trim()
      .toLocaleLowerCase("tr-TR");

    return RISK_LIBRARY.filter((item) => {
      const sectorMatch =
        librarySector === "ALL" ||
        item.sector === librarySector;

      const text = [
        item.title,
        item.sector,
        item.category,
        item.activity,
        item.hazard,
        ...item.keywords,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return sectorMatch && (!query || text.includes(query));
    });
  }, [librarySearch, librarySector]);

  const selectedTemplate = useMemo(
    () =>
      RISK_LIBRARY.find(
        (item) => item.id === selectedTemplateId
      ) || null,
    [selectedTemplateId]
  );

  const controlBundle = useMemo(
    () => getRiskControlBundle(selectedTemplateId),
    [selectedTemplateId]
  );

  const addExistingControl = (
    item: ControlSuggestion
  ) => {
    updateDraft(
      "existingControl",
      appendParagraph(
        draft.existingControl,
        item.text
      )
    );
  };

  const addAdditionalControl = (
    item: ControlSuggestion
  ) => {
    updateDraft(
      "proposedControl",
      appendParagraph(
        draft.proposedControl,
        item.text
      )
    );
  };

  const applyDofSuggestion = (
    item: DofSuggestion
  ) => {
    updateDraft(
      "proposedControl",
      appendParagraph(
        draft.proposedControl,
        item.action
      )
    );

    updateDraft(
      "responsible",
      item.responsibleRole
    );

    const date = new Date();
    date.setDate(
      date.getDate() + item.suggestedDays
    );

    updateDraft(
      "dueDateMillis",
      date.getTime()
    );

    updateDraft("completed", false);
  };

  const applyTemplate = (item: RiskLibraryItem) => {
    setSelectedTemplateId(item.id);

    updateDraft("method", item.method);
    updateDraft("activity", item.activity);
    updateDraft("process", item.process);
    updateDraft("hazard", item.hazard);
    updateDraft("consequence", item.consequence);
    updateDraft("existingControl", item.existingControl);
    updateDraft("proposedControl", item.proposedControl);
    updateDraft("responsible", item.responsibleRole);
    updateDraft("probability", item.probability);
    updateDraft("frequency", item.frequency);
    updateDraft("severity", item.severity);

    const date = new Date();
    date.setDate(date.getDate() + item.suggestedDays);
    updateDraft("dueDateMillis", date.getTime());

    setTab("ANALYSIS");
  };

  if (!open) return null;

  const tabs: Array<{
    id: TabId;
    label: string;
  }> = [
    { id: "GENERAL", label: "Genel Bilgiler" },
    { id: "ANALYSIS", label: "Risk Analizi" },
    { id: "CONTROLS", label: "Kontroller" },
    { id: "DOF", label: "DÖF ve Termin" },
  ];

  const applySuggestedDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + advice.days);
    updateDraft("dueDateMillis", date.getTime());
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        background: "rgba(15,23,42,0.64)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        style={{
          width: "min(1380px, 100%)",
          maxHeight: "95vh",
          overflow: "hidden",
          borderRadius: 24,
          background: "#ffffff",
          boxShadow:
            "0 34px 100px rgba(15,23,42,0.38)",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0, 1fr) auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              {draft.id
                ? "Risk Kaydını Düzenle"
                : "Yeni Risk Değerlendirmesi"}
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Faaliyeti, tehlikeyi, kontrol
              tedbirlerini ve risk puanını
              ayrıntılı olarak değerlendirin.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 0,
              background: "#f1f5f9",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <nav
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                minHeight: 39,
                borderRadius: 11,
                border:
                  tab === item.id
                    ? "1px solid #6b1020"
                    : "1px solid #dbe3ec",
                background:
                  tab === item.id
                    ? "#6b1020"
                    : "#ffffff",
                color:
                  tab === item.id
                    ? "#ffffff"
                    : "#475569",
                padding: "0 13px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div
          className="riskDialogBody"
          style={{
            overflowY: "auto",
            padding: 18,
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 320px",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            {error ? (
              <div
                style={{
                  borderRadius: 13,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  padding: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontWeight: 800,
                }}
              >
                <AlertTriangle size={16} />
                {error}
              </div>
            ) : null}

            {tab === "GENERAL" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <section
                  style={{
                    borderRadius: 17,
                    border: "1px solid #dbe3ec",
                    background: "#f8fafc",
                    padding: 14,
                    display: "grid",
                    gap: 11,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: 15,
                        fontWeight: 950,
                      }}
                    >
                      Hazır Risk Kütüphanesi
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      Profesyonel senaryolardan birini seçtiğinizde faaliyet,
                      tehlike, sonuç, kontroller, puanlar, sorumlu ve önerilen
                      termin otomatik doldurulur. Alanları daha sonra
                      işyerinize göre düzenleyebilirsiniz.
                    </p>
                  </div>

                  <div
                    className="libraryFilterGrid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1fr) minmax(190px, 0.38fr)",
                      gap: 9,
                    }}
                  >
                    <input
                      value={librarySearch}
                      onChange={(event) =>
                        setLibrarySearch(event.target.value)
                      }
                      placeholder="Forklift, elektrik, kaygan zemin, makine..."
                      style={{
                        height: 43,
                        borderRadius: 11,
                        border: "1px solid #dbe3ec",
                        padding: "0 11px",
                      }}
                    />

                    <select
                      value={librarySector}
                      onChange={(event) =>
                        setLibrarySector(event.target.value)
                      }
                      style={{
                        height: 43,
                        borderRadius: 11,
                        border: "1px solid #dbe3ec",
                        padding: "0 11px",
                      }}
                    >
                      <option value="ALL">Tüm sektörler</option>
                      {RISK_LIBRARY_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {filteredTemplates.map((item) => {
                      const selected =
                        selectedTemplateId === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => applyTemplate(item)}
                          style={{
                            borderRadius: 13,
                            border: selected
                              ? "2px solid #6b1020"
                              : "1px solid #dbe3ec",
                            background: selected
                              ? "#fff1f2"
                              : "#ffffff",
                            padding: 12,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <strong
                              style={{
                                color: "#0f172a",
                                fontSize: 13,
                              }}
                            >
                              {item.title}
                            </strong>

                            <span
                              style={{
                                borderRadius: 999,
                                padding: "4px 8px",
                                background: "#f1f5f9",
                                color: "#475569",
                                fontSize: 10,
                                fontWeight: 850,
                              }}
                            >
                              {item.sector} · {item.category}
                            </span>
                          </div>

                          <span
                            style={{
                              color: "#64748b",
                              fontSize: 11,
                              lineHeight: 1.48,
                            }}
                          >
                            {item.hazard}
                          </span>

                          <span
                            style={{
                              color: "#6b1020",
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            Seç ve tüm alanları doldur
                          </span>
                        </button>
                      );
                    })}

                    {filteredTemplates.length === 0 ? (
                      <div
                        style={{
                          borderRadius: 12,
                          border: "1px dashed #cbd5e1",
                          padding: 18,
                          color: "#94a3b8",
                          textAlign: "center",
                          fontSize: 12,
                        }}
                      >
                        Arama ölçütlerine uygun senaryo bulunamadı.
                      </div>
                    ) : null}
                  </div>
                </section>

                <div
                  className="formTwoColumn"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                {[
                  ["Firma", "company", draft.company],
                  [
                    "Departman",
                    "department",
                    draft.department,
                  ],
                  ["Süreç / Lokasyon", "process", draft.process],
                  ["Faaliyet", "activity", draft.activity],
                  ["Risk Sorumlusu", "responsible", draft.responsible],
                ].map(([label, field, value]) => (
                  <label
                    key={String(field)}
                    style={{
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      {label}
                    </span>

                    <input
                      value={String(value)}
                      onChange={(event) =>
                        updateDraft(
                          field as keyof RiskFormState,
                          event.target.value as never
                        )
                      }
                      style={{
                        height: 44,
                        borderRadius: 11,
                        border: "1px solid #dbe3ec",
                        padding: "0 11px",
                      }}
                    />
                  </label>
                ))}
                </div>
              </div>
            ) : null}

            {tab === "ANALYSIS" ? (
              <>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Değerlendirme Yöntemi
                  </span>

                  <select
                    value={draft.method}
                    onChange={(event) =>
                      updateDraft(
                        "method",
                        event.target.value as RiskMethod
                      )
                    }
                    style={{
                      height: 44,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: "0 11px",
                    }}
                  >
                    <option value="FINE_KINNEY">
                      Fine-Kinney
                    </option>
                    <option value="MATRIX_5X5">
                      5×5 Risk Matrisi
                    </option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Tehlikenin Ayrıntılı Açıklaması
                  </span>

                  <textarea
                    value={draft.hazard}
                    onChange={(event) =>
                      updateDraft(
                        "hazard",
                        event.target.value
                      )
                    }
                    placeholder="Tehlikenin kaynağını, ortaya çıkış koşullarını ve kimleri etkileyebileceğini açıklayın."
                    style={{
                      minHeight: 105,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: 11,
                      resize: "vertical",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Olası Sonuçlar
                  </span>

                  <textarea
                    value={draft.consequence}
                    onChange={(event) =>
                      updateDraft(
                        "consequence",
                        event.target.value
                      )
                    }
                    placeholder="Yaralanma, meslek hastalığı, operasyon kaybı, çevresel veya maddi sonuçları açıklayın."
                    style={{
                      minHeight: 105,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: 11,
                      resize: "vertical",
                    }}
                  />
                </label>

                {draft.method === "FINE_KINNEY" ? (
                  <>
                    <OptionGrid
                      title="Olasılık Değeri"
                      options={PROBABILITY_OPTIONS}
                      value={draft.probability}
                      onSelect={(value) =>
                        updateDraft("probability", value)
                      }
                    />

                    <OptionGrid
                      title="Maruziyet Frekansı"
                      options={FREQUENCY_OPTIONS}
                      value={draft.frequency}
                      onSelect={(value) =>
                        updateDraft("frequency", value)
                      }
                    />

                    <OptionGrid
                      title="Şiddet Değeri"
                      options={SEVERITY_OPTIONS}
                      value={draft.severity}
                      onSelect={(value) =>
                        updateDraft("severity", value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <OptionGrid
                      title="Olasılık"
                      options={MATRIX_PROBABILITY}
                      value={draft.probability}
                      onSelect={(value) =>
                        updateDraft("probability", value)
                      }
                    />

                    <OptionGrid
                      title="Şiddet"
                      options={MATRIX_SEVERITY}
                      value={draft.severity}
                      onSelect={(value) =>
                        updateDraft("severity", value)
                      }
                    />
                  </>
                )}
              </>
            ) : null}

            {tab === "CONTROLS" ? (
              <>
                <section
                  style={{
                    borderRadius: 16,
                    border: "1px solid #dbe3ec",
                    background: "#f8fafc",
                    padding: 13,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: 14,
                        fontWeight: 950,
                      }}
                    >
                      Hazır Mevcut Kontrol Tedbirleri
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#64748b",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      Seçilen tedbir mevcut kontrol metnine açıklayıcı paragraf
                      olarak eklenir. İşyerinde gerçekten uygulanmayan tedbiri
                      mevcut kontrol olarak eklemeyin.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(230px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {controlBundle.existing.map(
                      (item) => (
                        <SuggestionButton
                          key={item.id}
                          item={item}
                          onAdd={() =>
                            addExistingControl(item)
                          }
                        />
                      )
                    )}
                  </div>
                </section>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Mevcut Kontrol Tedbirleri
                  </span>

                  <textarea
                    value={draft.existingControl}
                    onChange={(event) =>
                      updateDraft(
                        "existingControl",
                        event.target.value
                      )
                    }
                    placeholder="İşyerinde fiilen uygulanan mühendislik, organizasyon, eğitim, denetim ve KKD tedbirlerini ayrıntılı biçimde açıklayın."
                    style={{
                      minHeight: 180,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: 11,
                      resize: "vertical",
                    }}
                  />
                </label>

                <section
                  style={{
                    borderRadius: 16,
                    border: "1px solid #dbe3ec",
                    background: "#f8fafc",
                    padding: 13,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: 14,
                        fontWeight: 950,
                      }}
                    >
                      Hazır İlave Kontrol Tedbirleri
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#64748b",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      Kontroller riskin kaynağında yok edilmesi, mühendislik
                      çözümü, idari tedbir ve kişisel koruma sıralaması dikkate
                      alınarak hazırlanmıştır.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(230px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {controlBundle.additional.map(
                      (item) => (
                        <SuggestionButton
                          key={item.id}
                          item={item}
                          onAdd={() =>
                            addAdditionalControl(item)
                          }
                        />
                      )
                    )}
                  </div>
                </section>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    İlave / Önerilen Kontrol Tedbirleri
                  </span>

                  <textarea
                    value={draft.proposedControl}
                    onChange={(event) =>
                      updateDraft(
                        "proposedControl",
                        event.target.value
                      )
                    }
                    placeholder="Riskin azaltılması için uygulanacak teknik ve organizasyonel önlemleri, sorumluluk ve doğrulama yöntemiyle birlikte açıklayın."
                    style={{
                      minHeight: 220,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: 11,
                      resize: "vertical",
                    }}
                  />
                </label>
              </>
            ) : null}

            {tab === "DOF" ? (
              <div style={{ display: "grid", gap: 13 }}>
                <section
                  style={{
                    borderRadius: 16,
                    border: "1px solid #dbe3ec",
                    background: "#f8fafc",
                    padding: 13,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontSize: 14,
                        fontWeight: 950,
                      }}
                    >
                      Hazır DÖF Önerileri
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#64748b",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      Seçtiğiniz öneri ilave kontrol metnine eklenir; sorumlu,
                      açık durum ve termin otomatik uygulanır.
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {controlBundle.dof.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          applyDofSuggestion(item)
                        }
                        style={{
                          borderRadius: 13,
                          border: "1px solid #dbe3ec",
                          background: "#ffffff",
                          padding: 12,
                          textAlign: "left",
                          cursor: "pointer",
                          display: "grid",
                          gap: 5,
                        }}
                      >
                        <strong
                          style={{
                            color: "#0f172a",
                            fontSize: 12,
                          }}
                        >
                          + {item.title}
                        </strong>

                        <span
                          style={{
                            color: "#64748b",
                            fontSize: 11,
                            lineHeight: 1.48,
                          }}
                        >
                          {item.action}
                        </span>

                        <span
                          style={{
                            color: "#6b1020",
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          {item.responsibleRole} ·{" "}
                          {item.suggestedDays === 0
                            ? "Bugün"
                            : `${item.suggestedDays} gün`}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <div
                  className="formTwoColumn"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    DÖF Durumu
                  </span>

                  <select
                    value={
                      draft.completed ? "CLOSED" : "OPEN"
                    }
                    onChange={(event) =>
                      updateDraft(
                        "completed",
                        event.target.value === "CLOSED"
                      )
                    }
                    style={{
                      height: 44,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: "0 11px",
                    }}
                  >
                    <option value="OPEN">Açık</option>
                    <option value="CLOSED">Kapalı</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 850,
                    }}
                  >
                    Termin Tarihi
                  </span>

                  <input
                    type="date"
                    value={toDateInput(draft.dueDateMillis)}
                    onChange={(event) =>
                      updateDraft(
                        "dueDateMillis",
                        toMillis(event.target.value)
                      )
                    }
                    style={{
                      height: 44,
                      borderRadius: 11,
                      border: "1px solid #dbe3ec",
                      padding: "0 11px",
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={applySuggestedDueDate}
                  style={{
                    gridColumn: "1 / -1",
                    minHeight: 43,
                    borderRadius: 11,
                    border: "1px solid #fde68a",
                    background: "#fffbeb",
                    color: "#92400e",
                    padding: "0 13px",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  <Clock3 size={16} />
                  Önerilen termini uygula:{" "}
                  {advice.days === 0
                    ? "Bugün"
                    : `${advice.days} gün`}
                </button>
                </div>
              </div>
            ) : null}
          </div>

          <aside
            style={{
              position: "sticky",
              top: 0,
              borderRadius: 18,
              border: `1px solid ${riskColor(
                draft.level
              )}44`,
              background: riskBackground(draft.level),
              padding: 16,
              color: riskColor(draft.level),
              display: "grid",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontWeight: 950,
              }}
            >
              <ShieldAlert size={20} />
              Risk Değerlendirme Sonucu
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 850,
                  opacity: 0.75,
                }}
              >
                RİSK SKORU
              </div>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 48,
                  lineHeight: 1,
                  fontWeight: 950,
                }}
              >
                {draft.score}
              </div>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 17,
                  fontWeight: 950,
                }}
              >
                {riskLabel(draft.level)}
              </div>
            </div>

            <div
              style={{
                borderRadius: 13,
                background: "rgba(255,255,255,0.62)",
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  color: "#334155",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                <span>RİSK ÖLÇEĞİ</span>
                <span>
                  0 — {riskScaleMaximum}+
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  height: 13,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg,#22c55e 0%,#eab308 35%,#f97316 55%,#dc2626 75%,#450a0a 100%)",
                  overflow: "visible",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: `calc(${riskScalePercent}% - 7px)`,
                    top: -4,
                    width: 14,
                    height: 21,
                    borderRadius: 7,
                    background: "#ffffff",
                    border: "2px solid #0f172a",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,0.3)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#64748b",
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                <span>Düşük</span>
                <span>Orta</span>
                <span>Yüksek</span>
                <span>Kritik</span>
              </div>
            </div>

            <div
              style={{
                borderRadius: 13,
                background: "rgba(255,255,255,0.62)",
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  alignItems: "center",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                <Calculator size={15} />
                HESAPLAMA
              </div>

              <div
                style={{
                  marginTop: 7,
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {draft.method === "FINE_KINNEY"
                  ? `${draft.probability} × ${draft.frequency} × ${draft.severity}`
                  : `${draft.probability} × ${draft.severity}`}
                {" = "}
                {draft.score}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                ÖNERİLEN AKSİYON
              </div>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#334155",
                  fontSize: 12,
                  lineHeight: 1.55,
                }}
              >
                {advice.text}
              </p>

              <div
                style={{
                  marginTop: 9,
                  display: "grid",
                  gap: 6,
                }}
              >
                {actionItems.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "16px 1fr",
                      gap: 6,
                      color: "#334155",
                      fontSize: 11,
                      lineHeight: 1.4,
                    }}
                  >
                    <Check
                      size={14}
                      color="#047857"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                ÖNCELİK
              </div>

              <div
                style={{
                  marginTop: 7,
                  display: "flex",
                  gap: 3,
                }}
              >
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill={
                        index < advice.priority
                          ? "currentColor"
                          : "none"
                      }
                    />
                  )
                )}
              </div>
            </div>

            <div
              style={{
                borderRadius: 13,
                background: "rgba(255,255,255,0.62)",
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                İLGİLİ MEVZUAT
              </div>

              {selectedTemplate ? (
                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {selectedTemplate.legislation.map(
                    (item) => (
                      <div
                        key={item}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "16px 1fr",
                          gap: 6,
                          color: "#334155",
                          fontSize: 11,
                          lineHeight: 1.4,
                        }}
                      >
                        <Check
                          size={14}
                          color="#047857"
                        />
                        <span>{item}</span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#64748b",
                    fontSize: 11,
                    lineHeight: 1.45,
                  }}
                >
                  Hazır risk senaryosu seçildiğinde ilgili
                  mevzuat başlıkları burada gösterilir.
                </p>
              )}
            </div>

            <div
              style={{
                borderRadius: 13,
                background: "rgba(255,255,255,0.62)",
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                ÖNERİLEN TERMİN
              </span>

              <strong>
                {advice.days === 0
                  ? "Bugün"
                  : `${advice.days} gün`}
              </strong>
            </div>

            <div
              style={{
                borderRadius: 15,
                border: "1px solid rgba(15,23,42,0.12)",
                background: "rgba(255,255,255,0.72)",
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 950,
                  }}
                >
                  Kalan Risk Hesabı
                </div>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#64748b",
                    fontSize: 10,
                    lineHeight: 1.4,
                  }}
                >
                  Kontroller uygulandıktan sonra beklenen
                  değerleri seçerek kalan riski hesaplayın.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    draft.method === "FINE_KINNEY"
                      ? "repeat(3, minmax(0, 1fr))"
                      : "repeat(2, minmax(0, 1fr))",
                  gap: 7,
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 9,
                      fontWeight: 850,
                    }}
                  >
                    Olasılık
                  </span>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={residualProbability}
                    onChange={(event) =>
                      setResidualProbability(
                        Number(event.target.value)
                      )
                    }
                    style={{
                      width: "100%",
                      height: 34,
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      padding: "0 7px",
                      boxSizing: "border-box",
                    }}
                  />
                </label>

                {draft.method === "FINE_KINNEY" ? (
                  <label
                    style={{
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 9,
                        fontWeight: 850,
                      }}
                    >
                      Frekans
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={residualFrequency}
                      onChange={(event) =>
                        setResidualFrequency(
                          Number(event.target.value)
                        )
                      }
                      style={{
                        width: "100%",
                        height: 34,
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        padding: "0 7px",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                ) : null}

                <label
                  style={{
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 9,
                      fontWeight: 850,
                    }}
                  >
                    Şiddet
                  </span>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={residualSeverity}
                    onChange={(event) =>
                      setResidualSeverity(
                        Number(event.target.value)
                      )
                    }
                    style={{
                      width: "100%",
                      height: 34,
                      borderRadius: 9,
                      border: "1px solid #cbd5e1",
                      padding: "0 7px",
                      boxSizing: "border-box",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  borderRadius: 11,
                  padding: 10,
                  background:
                    riskBackground(residualLevel),
                  color: riskColor(residualLevel),
                  display: "grid",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  KALAN RİSK
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {residualScore} ·{" "}
                  {riskLabel(residualLevel)}
                </div>

                <div
                  style={{
                    color: "#334155",
                    fontSize: 10,
                    lineHeight: 1.4,
                  }}
                >
                  Risk azalımı: %{reductionPercent}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => {
              const currentIndex = tabs.findIndex(
                (item) => item.id === tab
              );

              if (currentIndex > 0) {
                setTab(tabs[currentIndex - 1].id);
              }
            }}
            disabled={
              tabs.findIndex((item) => item.id === tab) ===
              0
            }
            style={{
              minHeight: 42,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              padding: "0 14px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Önceki
          </button>

          <div style={{ display: "flex", gap: 9 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                minHeight: 42,
                borderRadius: 11,
                border: "1px solid #dbe3ec",
                background: "#ffffff",
                padding: "0 14px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              İptal
            </button>

            {tab !== "DOF" ? (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(
                    (item) => item.id === tab
                  );
                  setTab(tabs[currentIndex + 1].id);
                }}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: 0,
                  background: "#334155",
                  color: "#ffffff",
                  padding: "0 15px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Sonraki
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onSave(draft)}
                disabled={saving}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: 0,
                  background: "#6b1020",
                  color: "#ffffff",
                  padding: "0 17px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="riskDialogSpin"
                  />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Kaydediliyor" : "Riski Kaydet"}
              </button>
            )}
          </div>
        </footer>
      </section>

      <style jsx>{`
        .riskDialogSpin {
          animation: risk-dialog-spin 0.9s linear
            infinite;
        }

        @keyframes risk-dialog-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .riskDialogBody {
            grid-template-columns: 1fr !important;
          }

          aside {
            position: static !important;
          }
        }

        @media (max-width: 700px) {
          .formTwoColumn,
          .libraryFilterGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}