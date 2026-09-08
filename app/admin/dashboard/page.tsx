"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  DatabaseZap,
  Gauge,
  HeartPulse,
  MessageSquareWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  Target,
  Wrench,
} from "lucide-react";

import styles from "./ExecutiveDashboard.module.css";

/* =========================================================
   TYPES
========================================================= */

type Severity = "critical" | "high" | "medium";

type ComponentScore = {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  weightedScore?: number | null;
  normalizedContribution?: number | null;
  available: boolean;
};

type Action = {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  count: number;
  href: string;
  source: string;
};

type Firm = {
  id: string;
  name: string;
  localFirmId: number | null;
  hazardClass?: string;
  isPrimary?: boolean;
};

/* =========================================================
   MODULE TYPES

   Yeni alanlar API güncellemesine hazırdır.
========================================================= */

type RiskModule = {
  total: number;

  /**
   * Legacy / mevcut API değeri.
   * Yeni API geldikten sonra açık risk kırılımından hesaplanacak.
   */
  critical?: number;

  intolerable: number;
  veryHigh: number;
  high: number;
  medium: number;
  low: number;

  /**
   * YENİ:
   * Sadece DÖF'ü açık risk değerlendirmeleri.
   */
  openHigh?: number;
  openVeryHigh?: number;
  openIntolerable?: number;
};

type InspectionModule = {
  /**
   * Toplam değerlendirilen madde.
   */
  total: number;

  compliant: number;
  partial: number;
  nonCompliant: number;

  /**
   * API doğrudan denetim uygunluk skorunu döndürüyorsa
   * bu değer kullanılacak.
   */
  complianceScore?: number | null;

  /**
   * N/A, boş veya değerlendirilmeyen maddeler hariç gerçek payda.
   */
  evaluatedTotal?: number;
};

type DofModule = {
  total: number;
  open: number;
  closed: number;
  overdue: number;

  riskTotal: number;
  riskOpen: number;
  riskClosed: number;

  inspectionTotal: number;
  inspectionOpen: number;
  inspectionClosed: number;

  /**
   * İsteğe bağlı dönem kırılımları.
   */
  riskOverdue?: number;
  inspectionOverdue?: number;
};

type TrainingModule = {
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;

  requiredMinutes: number;
  hazardClass: string;

  /**
   * Eğitim modülündeki gerçek "uygunluk skoru".
   */
  complianceScore?: number | null;
};

type IncidentModule = {
  total: number;
  lostTime: number;
  openInvestigations: number;
};

type HealthModule = {
  totalEmployees: number;
  valid: number;
  approaching: number;
  overdue: number;
  missing: number;
  ek2Employees: number;
};

type PeriodicModule = {
  total: number;
  valid: number;
  approaching: number;
  overdue: number;
};

type EnvironmentModule = {
  total: number;
  valid: number;
  approaching: number;
  overdue: number;
};

type CbsModule = {
  total: number;
  open: number;
  critical: number;
  slaExceeded: number;
  actionRequired?: number;
};

type Modules = {
  risk?: RiskModule | null;
  inspection?: InspectionModule | null;
  dof?: DofModule | null;
  training?: TrainingModule | null;
  incident?: IncidentModule | null;
  health?: HealthModule | null;
  periodic?: PeriodicModule | null;
  environment?: EnvironmentModule | null;
  cbs?: CbsModule | null;
};

type ExecutiveResponse = {
  success: boolean;

  firmId: string;

  firm: {
    id: string;
    name: string;
    localFirmId: number | null;
    hazardClass: string;
  };

  generatedAt: string;

  period: {
    key: string;
    days: number;
  };

  performance: {
    score: number | null;
    coverage: number;
    grade: string;

    components: ComponentScore[];

    availableComponents: number;
    totalComponents: number;

    formula?: string;
  };

  priorityActions: Action[];

  modules: Modules;

  scope?: {
    periodBased: string[];
    snapshot: string[];
  };

  trend?: {
    periodDays: number;

    inspection: {
      current: number;
      previous: number;
      delta: number;
    };

    incident: {
      current: number;
      previous: number;
      delta: number;
    };
  };

  integrity: {
    tenantVerified: boolean;
    strictFirmIsolation?: boolean;
    syntheticTrend: boolean;
    syntheticRiskMatrix: boolean;
    sensitiveHealthData: boolean;
    doraIncluded: boolean;
  };

  error?: string;
};

/* =========================================================
   HELPERS
========================================================= */

const pct = (a: number, b: number) =>
  b > 0 ? Math.round((a / b) * 100) : null;

const display = (
  value: number | null | undefined,
  suffix = ""
) =>
  value == null
    ? "Veri yok"
    : `${value}${suffix}`;

const scoreState = (
  value: number | null,
  good = 85,
  warn = 70
) =>
  value == null
    ? "neutral"
    : value >= good
      ? "good"
      : value >= warn
        ? "warning"
        : "critical";

const safeNumber = (
  value: number | null | undefined
) =>
  typeof value === "number" &&
  Number.isFinite(value)
    ? Math.max(0, value)
    : 0;

const PERIODS = [
  {
    value: "7d",
    label: "Son 7 Gün",
  },
  {
    value: "30d",
    label: "Son 30 Gün",
  },
  {
    value: "90d",
    label: "Son 3 Ay",
  },
  {
    value: "180d",
    label: "Son 6 Ay",
  },
  {
    value: "365d",
    label: "Son 12 Ay",
  },
];

const readJsonResponse = async <T,>(
  response: Response,
  context: string
): Promise<T> => {
  const contentType =
    response.headers.get("content-type") || "";

  const raw = await response.text();

  if (!raw.trim()) {
    throw new Error(
      `${context}: Sunucu boş yanıt döndürdü (HTTP ${response.status}).`
    );
  }

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    const preview = raw
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);

    throw new Error(
      `${context}: JSON yerine geçersiz yanıt alındı (HTTP ${response.status})${
        preview ? ` · ${preview}` : ""
      }.`
    );
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    const preview = raw
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);

    throw new Error(
      `${context}: Sunucudan bozuk JSON yanıtı geldi (HTTP ${response.status})${
        preview ? ` · ${preview}` : ""
      }.`
    );
  }
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboardPage() {
  const [data, setData] =
    useState<ExecutiveResponse | null>(null);

  const [firms, setFirms] =
    useState<Firm[]>([]);

  const [
    activeFirmId,
    setActiveFirmId,
  ] = useState("");

  const [period, setPeriod] =
    useState("30d");

  const [loading, setLoading] =
    useState(true);

  const [switching, setSwitching] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FIRM CONTEXT
  ======================================================= */

  const loadFirmContext =
    useCallback(async () => {
      const response = await fetch(
        "/api/admin/dashboard/firm-context",
        {
          cache: "no-store",
        }
      );

      const json =
        await readJsonResponse<{
          success: boolean;
          firms?: Firm[];
          activeFirmId?: string;
          error?: string;
        }>(
          response,
          "Firma bağlamı"
        );

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            `Firma bağlamı alınamadı (HTTP ${response.status}).`
        );
      }

      const list = Array.isArray(
        json.firms
      )
        ? json.firms
        : [];

      const active = String(
        json.activeFirmId || ""
      );

      setFirms(list);
      setActiveFirmId(active);

      return {
        firms: list,
        activeFirmId: active,
      };
    }, []);

  /* =======================================================
     EXECUTIVE LOAD
  ======================================================= */

  const loadExecutive =
    useCallback(
      async (firm: string) => {
        if (!firm) {
          throw new Error(
            "Aktif firma seçilemedi."
          );
        }

        const response = await fetch(
          `/api/admin/dashboard/executive?period=${encodeURIComponent(
            period
          )}&firmId=${encodeURIComponent(
            firm
          )}`,
          {
            cache: "no-store",
          }
        );

        const json =
          await readJsonResponse<ExecutiveResponse>(
            response,
            "Dashboard API"
          );

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
              `Dashboard verileri alınamadı (HTTP ${response.status}).`
          );
        }

        if (json.firmId !== firm) {
          throw new Error(
            "Firma doğrulama hatası: Dashboard farklı firma UUID'si döndürdü."
          );
        }

        return json;
      },
      [period]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  const loadInitial =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const context =
          await loadFirmContext();

        if (
          !context.activeFirmId
        ) {
          throw new Error(
            "Aktif firma seçilemedi."
          );
        }

        const executive =
          await loadExecutive(
            context.activeFirmId
          );

        setData(executive);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Dashboard yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadFirmContext,
      loadExecutive,
    ]);

  /* =======================================================
     RELOAD
  ======================================================= */

  const load = useCallback(
    async (
      firmOverride?: string
    ) => {
      const firm =
        firmOverride ||
        activeFirmId;

      if (!firm) {
        await loadInitial();
        return;
      }

      setLoading(true);
      setError("");

      try {
        const next =
          await loadExecutive(firm);

        setData(next);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Dashboard yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      activeFirmId,
      loadExecutive,
      loadInitial,
    ]
  );

  /* =======================================================
     PERIOD CHANGE
  ======================================================= */

  useEffect(() => {
    if (activeFirmId) {
      void load(activeFirmId);
    } else {
      void loadInitial();
    }
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  /* =======================================================
     FIRM SWITCH
  ======================================================= */

  const switchFirm =
    async (
      nextFirmId: string
    ) => {
      if (
        !nextFirmId ||
        nextFirmId ===
          activeFirmId
      ) {
        return;
      }

      setSwitching(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/admin/dashboard/firm-context",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                firmId:
                  nextFirmId,
              }),
            }
          );

        const json =
          await readJsonResponse<{
            success: boolean;
            activeFirmId?: string;
            error?: string;
          }>(
            response,
            "Firma değiştirme"
          );

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.error ||
              `Firma değiştirilemedi (HTTP ${response.status}).`
          );
        }

        setActiveFirmId(
          nextFirmId
        );

        await load(
          nextFirmId
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Firma değiştirilemedi."
        );
      } finally {
        setSwitching(false);
      }
    };

  /* =======================================================
     MODULE DATA
  ======================================================= */

  const modules =
    data?.modules;

  /* =======================================================
     CRITICAL RISK

     İSTENEN FORMÜL:

     DÖF'Ü AÇIK:
     YÜKSEK
     + ÇOK YÜKSEK
     + KABUL EDİLEMEZ
  ======================================================= */

  const criticalRiskBreakdown =
    useMemo(() => {
      const risk =
        modules?.risk;

      if (!risk) {
        return {
          high: 0,
          veryHigh: 0,
          intolerable: 0,
          total: null as number | null,
          apiReady: false,
        };
      }

      const hasOpenBreakdown =
        typeof risk.openHigh ===
          "number" &&
        typeof risk.openVeryHigh ===
          "number" &&
        typeof risk.openIntolerable ===
          "number";

      if (
        hasOpenBreakdown
      ) {
        const high =
          safeNumber(
            risk.openHigh
          );

        const veryHigh =
          safeNumber(
            risk.openVeryHigh
          );

        const intolerable =
          safeNumber(
            risk.openIntolerable
          );

        return {
          high,
          veryHigh,
          intolerable,
          total:
            high +
            veryHigh +
            intolerable,
          apiReady: true,
        };
      }

      /**
       * API henüz openHigh vb. dönmüyorsa
       * mevcut critical değeri fallback.
       *
       * Backend güncellemesinden sonra
       * buraya düşülmemeli.
       */
      return {
        high: safeNumber(
          risk.high
        ),
        veryHigh:
          safeNumber(
            risk.veryHigh
          ),
        intolerable:
          safeNumber(
            risk.intolerable
          ),
        total:
          typeof risk.critical ===
          "number"
            ? safeNumber(
                risk.critical
              )
            : null,
        apiReady: false,
      };
    }, [modules?.risk]);

  /* =======================================================
     TRAINING COMPLIANCE

     Öncelik:
     1. Eğitim modülünün gerçek complianceScore değeri
     2. Eski API için çalışan bazlı fallback
  ======================================================= */

  const trainingRate =
    useMemo(() => {
      const training =
        modules?.training;

      if (!training) {
        return null;
      }

      if (
        typeof training.complianceScore ===
          "number" &&
        Number.isFinite(
          training.complianceScore
        )
      ) {
        return Math.round(
          Math.max(
            0,
            Math.min(
              100,
              training.complianceScore
            )
          )
        );
      }

      return pct(
        training.compliantEmployees,
        training.totalEmployees
      );
    }, [modules?.training]);

  /* =======================================================
     INSPECTION COMPLIANCE

     UYGUN MADDE /
     TOPLAM DEĞERLENDİRİLEN MADDE
  ======================================================= */

  const inspectionRate =
    useMemo(() => {
      const inspection =
        modules?.inspection;

      if (!inspection) {
        return null;
      }

      if (
        typeof inspection.complianceScore ===
          "number" &&
        Number.isFinite(
          inspection.complianceScore
        )
      ) {
        return Math.round(
          Math.max(
            0,
            Math.min(
              100,
              inspection.complianceScore
            )
          )
        );
      }

      const evaluated =
        inspection.evaluatedTotal ??
        inspection.total;

      return pct(
        inspection.compliant,
        evaluated
      );
    }, [modules?.inspection]);

  /* =======================================================
     OTHER KPI RATES
  ======================================================= */

  const healthRate =
    modules?.health
      ? pct(
          modules.health.valid,
          modules.health
            .totalEmployees
        )
      : null;

  const periodicRate =
    modules?.periodic
      ? pct(
          modules.periodic.valid,
          modules.periodic.total
        )
      : null;

  const dofRate =
    modules?.dof
      ? pct(
          modules.dof.closed,
          modules.dof.total
        )
      : null;

  /* =======================================================
     CARDS
  ======================================================= */

  const cards =
    useMemo(
      () => [
        /* -------------------------------------------------
           KRİTİK RİSK
        ------------------------------------------------- */

        {
          label:
            "Kritik Risk",

          value:
            criticalRiskBreakdown.total,

          sub:
            modules?.risk
              ? `${criticalRiskBreakdown.high} Yüksek · ${criticalRiskBreakdown.veryHigh} Çok Yüksek · ${criticalRiskBreakdown.intolerable} Kabul Edilemez`
              : "Risk verisi yok",

          icon:
            ShieldAlert,

          href:
            "/admin/risk",

          tone:
            (
              criticalRiskBreakdown.total ??
              0
            ) > 0
              ? "critical"
              : "good",
        },

        /* -------------------------------------------------
           AÇIK DÖF
        ------------------------------------------------- */

        {
          label:
            "Açık DÖF",

          value:
            modules?.dof
              ? modules.dof.open
              : 0,

          sub:
            modules?.dof
              ? `${modules.dof.riskOpen} Risk Değerlendirmesi · ${modules.dof.inspectionOpen} Denetim · ${modules.dof.overdue} termin aşımı`
              : "Açık DÖF bulunmuyor",

          icon:
            Target,

          href:
            "/admin/denetimler?tab=dof&status=open#dof",

          tone:
            (
              modules?.dof
                ?.overdue ?? 0
            ) > 0
              ? "critical"
              : (
                    modules
                      ?.dof
                      ?.open ??
                    0
                  ) > 0
                ? "warning"
                : "good",
        },

        /* -------------------------------------------------
           TRAINING
        ------------------------------------------------- */

        {
          label:
            "Yasal Eğitim Uyumu",

          value:
            trainingRate ==
            null
              ? null
              : `%${trainingRate}`,

          sub:
            modules?.training
              ? `${modules.training.compliantEmployees} uygun · ${modules.training.nonCompliantEmployees} eksik · ${modules.training.totalEmployees} çalışan · ${modules.training.hazardClass}`
              : "Yasal eğitim verisi yok",

          icon:
            BookOpenCheck,

          href:
            "/admin/trainings",

          tone:
            scoreState(
              trainingRate
            ),
        },

        /* -------------------------------------------------
           INSPECTION
        ------------------------------------------------- */

        {
          label:
            "Denetim Uyumu",

          value:
            inspectionRate ==
            null
              ? null
              : `%${inspectionRate}`,

          sub:
            modules?.inspection
              ? `${modules.inspection.compliant} uygun · ${modules.inspection.nonCompliant} uygunsuz · ${
                  modules.inspection
                    .evaluatedTotal ??
                  modules.inspection
                    .total
                } değerlendirilen madde`
              : "Seçili dönemde denetim verisi yok",

          icon:
            ClipboardCheck,

          href:
            "/admin/denetimler",

          tone:
            scoreState(
              inspectionRate
            ),
        },

        /* -------------------------------------------------
           HEALTH
        ------------------------------------------------- */

        {
          label:
            "Sağlık Gözetimi",

          value:
            healthRate ==
            null
              ? null
              : `%${healthRate}`,

          sub:
            modules?.health
              ? `${modules.health.valid} geçerli · ${modules.health.approaching} yaklaşıyor · ${modules.health.overdue} geçmiş · ${modules.health.missing} eksik`
              : "Sağlık verisi yok",

          icon:
            Stethoscope,

          href:
            "/admin/health",

          tone:
            (
              modules?.health
                ?.overdue ??
              0
            ) > 0
              ? "critical"
              : (
                    modules
                      ?.health
                      ?.missing ??
                    0
                  ) > 0
                ? "warning"
                : scoreState(
                    healthRate
                  ),
        },

        /* -------------------------------------------------
           INCIDENT
        ------------------------------------------------- */

        {
          label:
            "Kaza / Olay",

          value:
            modules?.incident
              ?.total ?? 0,

          sub:
            modules?.incident
              ? `${modules.incident.lostTime} kayıp günlü · ${modules.incident.openInvestigations} açık inceleme`
              : "Seçili dönemde kaza/olay yok",

          icon:
            Siren,

          href:
            "/admin/accidents",

          tone:
            (
              modules?.incident
                ?.lostTime ??
              0
            ) > 0
              ? "critical"
              : (
                    modules
                      ?.incident
                      ?.total ??
                    0
                  ) > 0
                ? "warning"
                : "good",
        },

        /* -------------------------------------------------
           PERIODIC
        ------------------------------------------------- */

        {
          label:
            "Periyodik Kontrol",

          value:
            periodicRate ==
            null
              ? null
              : `%${periodicRate}`,

          sub:
            modules?.periodic
              ? `${modules.periodic.valid} geçerli · ${modules.periodic.approaching} yaklaşan · ${modules.periodic.overdue} gecikmiş · ${modules.periodic.total} toplam`
              : "Periyodik kontrol verisi yok",

          icon:
            Wrench,

          href:
            "/admin/documentation/periodic-controls",

          tone:
            (
              modules?.periodic
                ?.overdue ??
              0
            ) > 0
              ? "warning"
              : scoreState(
                  periodicRate
                ),
        },

        /* -------------------------------------------------
           CBS
        ------------------------------------------------- */

        {
          label:
            "ÇBS / SLA",

          value:
            modules?.cbs
              ? modules.cbs
                  .actionRequired ??
                modules.cbs.open
              : 0,

          sub:
            modules?.cbs
              ? `${modules.cbs.slaExceeded} SLA aşımı · ${modules.cbs.critical} kritik · ${modules.cbs.open} açık`
              : "Aksiyon gerektiren ÇBS kaydı yok",

          icon:
            MessageSquareWarning,

          href:
            "/admin/cbs",

          tone:
            (
              modules?.cbs
                ?.slaExceeded ??
              0
            ) > 0
              ? "critical"
              : (
                    modules
                      ?.cbs
                      ?.critical ??
                    0
                  ) > 0
                ? "warning"
                : "neutral",
        },
      ],
      [
        modules,
        criticalRiskBreakdown,
        trainingRate,
        inspectionRate,
        healthRate,
        periodicRate,
      ]
    );

  /* =======================================================
     INITIAL / ERROR STATE
  ======================================================= */

  if (!data) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.topbar
          }
        >
          <div>
            <div
              className={
                styles.eyebrow
              }
            >
              <ShieldCheck
                size={15}
              />
              D-SEC · EXECUTIVE
              HSE COMMAND CENTER
            </div>

            <h1>
              İş Sağlığı ve
              Güvenliği Genel
              Görünümü
            </h1>

            <p>
              Riskleri, yasal
              uyumu ve
              operasyonel
              öncelikleri tek
              yönetim ekranından
              izleyin.
            </p>
          </div>

          <div
            className={
              styles.topActions
            }
          >
            <label
              className={
                styles.selectBox
              }
            >
              <Building2
                size={17}
              />

              <span>
                <small>
                  Aktif firma
                </small>

                <select
                  value={
                    activeFirmId
                  }
                  disabled
                >
                  <option>
                    {firms.find(
                      (x) =>
                        x.id ===
                        activeFirmId
                    )?.name ||
                      "Firma bağlamı yükleniyor…"}
                  </option>
                </select>
              </span>

              <ChevronDown
                size={15}
              />
            </label>

            <label
              className={
                styles.selectBox
              }
            >
              <CalendarDays
                size={17}
              />

              <span>
                <small>
                  Operasyon dönemi
                </small>

                <select
                  value={
                    period
                  }
                  onChange={(
                    e
                  ) =>
                    setPeriod(
                      e.target
                        .value
                    )
                  }
                >
                  {PERIODS.map(
                    (p) => (
                      <option
                        key={
                          p.value
                        }
                        value={
                          p.value
                        }
                      >
                        {
                          p.label
                        }
                      </option>
                    )
                  )}
                </select>
              </span>

              <ChevronDown
                size={15}
              />
            </label>
          </div>
        </section>

        {error ? (
          <div
            className={
              styles.error
            }
          >
            <AlertTriangle />

            <div>
              <strong>
                Dashboard
                yüklenemedi
              </strong>

              <p>
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                void loadInitial()
              }
            >
              <RefreshCw
                size={16}
              />
              Yeniden dene
            </button>
          </div>
        ) : (
          <section
            className={
              styles.loadingShell
            }
          >
            <div
              className={
                styles.loadingBanner
              }
            >
              <div
                className={
                  styles.spinner
                }
              />

              <div>
                <strong>
                  D-SEC Yönetim
                  Merkezi
                  hazırlanıyor
                </strong>

                <span>
                  HSE göstergeleri
                  hazırlanıyor.
                </span>
              </div>
            </div>

            <div
              className={
                styles.skeletonHero
              }
            />

            <div
              className={
                styles.skeletonGrid
              }
            >
              {Array.from({
                length: 8,
              }).map(
                (_, i) => (
                  <div
                    className={
                      styles.skeletonCard
                    }
                    key={i}
                  />
                )
              )}
            </div>
          </section>
        )}
      </main>
    );
  }

  /* =======================================================
     READY DATA
  ======================================================= */

  const score =
    data.performance.score;

  const grade =
    data.performance.grade;

  const actions =
    data.priorityActions || [];

  const currentFirm =
    firms.find(
      (x) =>
        x.id ===
        activeFirmId
    ) || {
      id: data.firm.id,
      name: data.firm.name,
      localFirmId:
        data.firm
          .localFirmId,
    };

  const selectedPeriod =
    PERIODS.find(
      (x) =>
        x.value === period
    )?.label || period;

  return (
    <main
      className={
        styles.page
      }
    >
      {/* ===================================================
          TOP BAR
      ==================================================== */}

      <section
        className={
          styles.topbar
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            <ShieldCheck
              size={15}
            />

            D-SEC · EXECUTIVE
            HSE COMMAND CENTER
          </div>

          <h1>
            İş Sağlığı ve
            Güvenliği Genel
            Görünümü
          </h1>

          <p>
            Riskleri, yasal
            uyumu ve operasyonel
            öncelikleri tek
            yönetim ekranından
            izleyin.
          </p>
        </div>

        <div
          className={
            styles.topActions
          }
        >
          <label
            className={
              styles.selectBox
            }
          >
            <Building2
              size={17}
            />

            <span>
              <small>
                Aktif firma
              </small>

              <select
                value={
                  activeFirmId
                }
                onChange={(
                  e
                ) =>
                  void switchFirm(
                    e.target
                      .value
                  )
                }
                disabled={
                  switching
                }
              >
                {firms.map(
                  (firm) => (
                    <option
                      key={
                        firm.id
                      }
                      value={
                        firm.id
                      }
                    >
                      {
                        firm.name
                      }
                    </option>
                  )
                )}
              </select>
            </span>

            <ChevronDown
              size={15}
            />
          </label>

          <label
            className={
              styles.selectBox
            }
          >
            <CalendarDays
              size={17}
            />

            <span>
              <small>
                Operasyon dönemi
              </small>

              <select
                value={
                  period
                }
                onChange={(
                  e
                ) =>
                  setPeriod(
                    e.target
                      .value
                  )
                }
              >
                {PERIODS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </select>
            </span>

            <ChevronDown
              size={15}
            />
          </label>

          <button
            className={
              styles.refresh
            }
            onClick={() =>
              void load()
            }
            disabled={
              loading ||
              switching
            }
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? styles.spin
                  : ""
              }
            />
            Yenile
          </button>
        </div>
      </section>

      {error && (
        <div
          className={
            styles.inlineError
          }
        >
          <AlertTriangle
            size={16}
          />

          {error}
        </div>
      )}

      {loading && (
        <div
          className={
            styles.refreshingBar
          }
        >
          <RefreshCw
            size={14}
            className={
              styles.spin
            }
          />

          <span>
            Veriler
            güncelleniyor;
            mevcut dashboard
            kullanılmaya devam
            edebilir.
          </span>
        </div>
      )}

      {/* ===================================================
          HERO
      ==================================================== */}

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.scoreBlock
          }
        >
          <div
            className={
              styles.scoreRing
            }
            style={
              {
                "--score":
                  score ?? 0,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>
                {score ?? "—"}
              </strong>

              <span>
                /100
              </span>
            </div>
          </div>

          <div
            className={
              styles.scoreCopy
            }
          >
            <span>
              D-SEC HSE
              PERFORMANCE
              INDEX
            </span>

            <h2>
              {score == null
                ? "Henüz yeterli veri yok"
                : grade ===
                    "A"
                  ? "Güçlü HSE performansı"
                  : grade ===
                      "B"
                    ? "Kontrollü HSE performansı"
                    : grade ===
                        "C"
                      ? "Gelişim gerektiren performans"
                      : "Yönetim müdahalesi gerekli"}
            </h2>

            <p>
              Skor yalnız
              doğrulanabilir
              firma
              verilerinden
              hesaplanır.
              Seçilen dönem
              tüm dönem bazlı
              göstergelerde
              uygulanır.
            </p>

            <div
              className={
                styles.heroFirm
              }
            >
              <Building2
                size={14}
              />

              {
                currentFirm.name
              }

              <span>
                •
              </span>

              <code>
                {data.firmId.slice(
                  0,
                  8
                )}
                …
              </code>

              <span>
                •
              </span>

              <strong>
                {
                  selectedPeriod
                }
              </strong>
            </div>
          </div>
        </div>

        <div
          className={
            styles.heroFacts
          }
        >
          <div>
            <span>
              Veri kapsamı
            </span>

            <strong>
              {
                data
                  .performance
                  .coverage
              }
              %
            </strong>

            <small>
              {
                data
                  .performance
                  .availableComponents
              }
              /
              {
                data
                  .performance
                  .totalComponents
              }{" "}
              skor bileşeni
              hesaplanabiliyor
            </small>
          </div>

          <div>
            <span>
              Kritik öncelik
            </span>

            <strong>
              {
                actions.filter(
                  (x) =>
                    x.severity ===
                    "critical"
                ).length
              }
            </strong>

            <small>
              Yönetimin
              değerlendirmesi
              gereken başlık
            </small>
          </div>

          <div>
            <span>
              Aktif aksiyon
            </span>

            <strong>
              {
                actions.length
              }
            </strong>

            <small>
              Öncelik
              motorunun
              ürettiği aksiyon
              başlığı
            </small>
          </div>
        </div>
      </section>

      {/* ===================================================
          MANAGEMENT KPI
      ==================================================== */}

      <section>
        <div
          className={
            styles.sectionHead
          }
        >
          <div>
            <span>
              YÖNETİM
              GÖSTERGELERİ
            </span>

            <h2>
              HSE
              performansının
              anlık fotoğrafı
            </h2>
          </div>

          <small>
            <DatabaseZap
              size={14}
            />
            Firma UUID
            doğrulandı ·{" "}
            {selectedPeriod}
          </small>
        </div>

        <div
          className={
            styles.kpis
          }
        >
          {cards.map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <Link
                  href={
                    card.href
                  }
                  key={
                    card.label
                  }
                  className={`${styles.kpi} ${
                    styles[
                      card.tone
                    ]
                  }`}
                >
                  <div
                    className={
                      styles.kpiTop
                    }
                  >
                    <span
                      className={
                        styles.icon
                      }
                    >
                      <Icon
                        size={
                          20
                        }
                      />
                    </span>

                    <ArrowRight
                      size={16}
                    />
                  </div>

                  <span>
                    {
                      card.label
                    }
                  </span>

                  <strong>
                    {card.value ??
                      "Veri yok"}
                  </strong>

                  <small>
                    {
                      card.sub
                    }
                  </small>
                </Link>
              );
            }
          )}
        </div>
      </section>

      {/* ===================================================
          ACTION / SCORE COMPONENTS
      ==================================================== */}

      <section
        className={
          styles.grid
        }
      >
        <div
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.panelHead
            }
          >
            <div>
              <span>
                ÖNCELİKLİ
                YÖNETİM
                AKSİYONLARI
              </span>

              <h2>
                Bugün müdahale
                gerektirenler
              </h2>
            </div>

            <Activity
              size={22}
            />
          </div>

          {actions.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              <CheckCircle2 />

              <strong>
                Kritik aksiyon
                görünmüyor
              </strong>

              <span>
                Mevcut
                verilerde
                öncelik
                motorunu
                tetikleyen
                açık konu
                bulunamadı.
              </span>
            </div>
          ) : (
            <div
              className={
                styles.actionList
              }
            >
              {actions.map(
                (
                  action,
                  index
                ) => (
                  <Link
                    href={
                      action.href
                    }
                    className={
                      styles.action
                    }
                    key={
                      action.id
                    }
                  >
                    <div
                      className={`${styles.severity} ${
                        styles[
                          action
                            .severity
                        ]
                      }`}
                    >
                      {index +
                        1}
                    </div>

                    <div>
                      <div
                        className={
                          styles.actionTitle
                        }
                      >
                        <strong>
                          {
                            action.title
                          }
                        </strong>

                        <span>
                          {
                            action.source
                          }
                        </span>
                      </div>

                      <p>
                        {
                          action.description
                        }
                      </p>
                    </div>

                    <b
                      className={
                        styles.count
                      }
                    >
                      {
                        action.count
                      }
                    </b>

                    <ArrowRight
                      size={17}
                    />
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        <div
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.panelHead
            }
          >
            <div>
              <span>
                SKOR
                BİLEŞENLERİ
              </span>

              <h2>
                Performansı ne
                belirliyor?
              </h2>
            </div>

            <Gauge
              size={22}
            />
          </div>

          <div
            className={
              styles.formulaNote
            }
          >
            HSE skoru, veri
            bulunan
            bileşenlerin
            ağırlıkları kendi
            içinde normalize
            edilerek hesaplanır.
            Veri olmayan modül
            sıfır puan sayılmaz.
          </div>

          <div
            className={
              styles.components
            }
          >
            {data.performance.components.map(
              (
                component
              ) => (
                <div
                  key={
                    component.key
                  }
                  className={
                    styles.component
                  }
                >
                  <div>
                    <span>
                      {
                        component.label
                      }
                    </span>

                    <b>
                      {component.score ==
                      null
                        ? "Veri yok"
                        : `${component.score}/100`}
                    </b>
                  </div>

                  <div
                    className={
                      styles.track
                    }
                  >
                    <i
                      style={{
                        width: `${component.score ?? 0}%`,
                      }}
                    />
                  </div>

                  <small>
                    {component.available
                      ? `Ağırlık %${component.weight} · toplam HSE skoruna +${(
                          component.normalizedContribution ??
                          0
                        ).toLocaleString(
                          "tr-TR"
                        )} puan katkı`
                      : `Ağırlık %${component.weight} · veri bekleniyor · skorda sıfır sayılmadı`}
                  </small>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          BOTTOM
      ==================================================== */}

      <section
        className={
          styles.bottomGrid
        }
      >
        <div
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.panelHead
            }
          >
            <div>
              <span>
                UYUM MERKEZİ
              </span>

              <h2>
                Yasal ve
                operasyonel
                takip
              </h2>
            </div>

            <Clock3
              size={22}
            />
          </div>

          <div
            className={
              styles.compliance
            }
          >
            <Compliance
              icon={
                BookOpenCheck
              }
              label="Yasal Eğitim"
              value={
                trainingRate
              }
              detail={
                modules?.training
                  ? `${modules.training.compliantEmployees} uygun · ${modules.training.nonCompliantEmployees} eksik · ${modules.training.totalEmployees} çalışan`
                  : "Veri yok"
              }
              href="/admin/trainings"
            />

            <Compliance
              icon={
                ClipboardCheck
              }
              label="Denetim"
              value={
                inspectionRate
              }
              detail={
                modules?.inspection
                  ? `${modules.inspection.compliant} uygun · ${modules.inspection.nonCompliant} uygunsuz`
                  : "Veri yok"
              }
              href="/admin/denetimler"
            />

            <Compliance
              icon={
                HeartPulse
              }
              label="Sağlık"
              value={
                healthRate
              }
              detail={
                modules?.health
                  ? `${modules.health.valid} geçerli · ${modules.health.overdue} geçmiş · ${modules.health.missing} eksik`
                  : "Veri yok"
              }
              href="/admin/health"
            />

            <Compliance
              icon={Wrench}
              label="Periyodik Kontrol"
              value={
                periodicRate
              }
              detail={
                modules?.periodic
                  ? `${modules.periodic.overdue} gecikmiş · ${modules.periodic.approaching} yaklaşan`
                  : "Veri yok"
              }
              href="/admin/documentation/periodic-controls"
            />

            <Compliance
              icon={Target}
              label="DÖF Kapanma"
              value={
                dofRate
              }
              detail={
                modules?.dof
                  ? `${modules.dof.riskOpen} risk · ${modules.dof.inspectionOpen} denetim açık`
                  : "Veri yok"
              }
              href="/admin/denetimler?tab=dof&status=open#dof"
            />
          </div>
        </div>

        <div
          className={`${styles.panel} ${styles.integrity}`}
        >
          <div
            className={
              styles.panelHead
            }
          >
            <div>
              <span>
                VERİ GÜVENİ
              </span>

              <h2>
                Dashboard
                bütünlük
                kontrolü
              </h2>
            </div>

            <ShieldCheck
              size={22}
            />
          </div>

          <Integrity
            ok={
              data.integrity
                .tenantVerified
            }
            text="Aktif firma UUID'si sunucu tarafında doğrulandı"
          />

          <Integrity
            ok={
              data.integrity
                .strictFirmIsolation !==
              false
            }
            text="Firma sorgularında global / firma adı fallback kullanılmıyor"
          />

          <Integrity
            ok={
              !data.integrity
                .syntheticTrend
            }
            text="Sahte trend üretilmiyor"
          />

          <Integrity
            ok={
              !data.integrity
                .syntheticRiskMatrix
            }
            text="Yapay risk matrisi kullanılmıyor"
          />

          <Integrity
            ok={
              !data.integrity
                .sensitiveHealthData
            }
            text="Hassas sağlık verisi gösterilmiyor"
          />

          <Integrity
            ok={
              !data.integrity
                .doraIncluded
            }
            text="DORA bu kapsamın dışında"
          />

          <div
            className={
              styles.generated
            }
          >
            <BarChart3
              size={16}
            />

            Son üretim:{" "}
            {new Date(
              data.generatedAt
            ).toLocaleString(
              "tr-TR"
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   COMPLIANCE ROW
========================================================= */

function Compliance({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: any;
  label: string;
  value: number | null;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={
        styles.complianceRow
      }
    >
      <span
        className={
          styles.icon
        }
      >
        <Icon size={18} />
      </span>

      <div>
        <b>{label}</b>

        <small>
          {detail}
        </small>
      </div>

      <div
        className={
          styles.miniTrack
        }
      >
        <i
          style={{
            width: `${value ?? 0}%`,
          }}
        />
      </div>

      <strong>
        {display(
          value,
          "%"
        )}
      </strong>

      <ArrowRight
        size={15}
      />
    </Link>
  );
}

/* =========================================================
   INTEGRITY ROW
========================================================= */

function Integrity({
  ok,
  text,
}: {
  ok: boolean;
  text: string;
}) {
  return (
    <div
      className={
        styles.integrityRow
      }
    >
      {ok ? (
        <CheckCircle2
          size={18}
        />
      ) : (
        <AlertTriangle
          size={18}
        />
      )}

      <span>
        {text}
      </span>
    </div>
  );
}