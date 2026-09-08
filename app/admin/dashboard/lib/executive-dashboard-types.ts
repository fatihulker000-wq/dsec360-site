export type MetricState =
  | "good"
  | "warning"
  | "critical"
  | "neutral"
  | "no_data";

export type DashboardMetric = {
  key: string;

  label: string;

  value: number | null;

  unit?:
    | "%"
    | "adet"
    | "puan";

  state: MetricState;

  href: string;

  detail?: string;
};

/* =========================================================
   SCORE INPUT
========================================================= */

export type ScoreInput = {
  /* =======================================================
     RISK

     critical:
     Açık DÖF'lü
     Yüksek + Çok Yüksek + Kabul Edilemez
  ======================================================= */

  risk?: {
    total: number;

    /**
     * Açık DÖF'lü:
     * HIGH + VERY_HIGH + INTOLERABLE
     */
    critical: number;

    /**
     * Tüm risklerin seviye dağılımı
     */
    intolerable: number;
    veryHigh: number;
    high: number;
    medium: number;
    low: number;

    /**
     * Sadece DÖF'ü açık kritik seviye kırılımı
     */
    openHigh: number;
    openVeryHigh: number;
    openIntolerable: number;
  };

  /* =======================================================
     INSPECTION

     complianceScore:
     UYGUN / değerlendirilen toplam madde
  ======================================================= */

  inspection?: {
    /**
     * Gerçek değerlendirilen madde sayısı.
     *
     * N/A, boş, değerlendirilemeyen kayıtlar hariç.
     */
    total: number;

    compliant: number;

    partial: number;

    nonCompliant: number;

    /**
     * UYGUN + KISMEN + UYGUNSUZ
     */
    evaluatedTotal: number;

    /**
     * Denetim modülünün gerçek uygunluk skoru.
     */
    complianceScore: number | null;
  };

  /* =======================================================
     LEGAL TRAINING
  ======================================================= */

  training?: {
    totalEmployees: number;

    /**
     * Yasal zorunlu süreyi tamamen karşılayan çalışan.
     */
    compliantEmployees: number;

    nonCompliantEmployees: number;

    requiredMinutes: number;

    hazardClass: string;

    /**
     * Firma eğitim uygunluk skoru.
     *
     * Çalışanların geçerli eğitim dakikaları /
     * gerekli yasal eğitim dakikaları üzerinden hesaplanır.
     */
    complianceScore: number | null;
  };

  /* =======================================================
     DÖF
  ======================================================= */

  dof?: {
    total: number;

    open: number;

    closed: number;

    overdue: number;

    /**
     * Risk değerlendirmesinden gelen DÖF
     */
    riskTotal: number;
    riskOpen: number;
    riskClosed: number;

    /**
     * Denetimden gelen DÖF
     */
    inspectionTotal: number;
    inspectionOpen: number;
    inspectionClosed: number;
  };

  /* =======================================================
     INCIDENT
  ======================================================= */

  incident?: {
    total: number;

    lostTime: number;

    openInvestigations: number;
  };

  /* =======================================================
     HEALTH
  ======================================================= */

  health?: {
    totalEmployees: number;

    valid: number;

    approaching: number;

    overdue: number;

    missing: number;

    ek2Employees: number;
  };

  /* =======================================================
     PERIODIC CONTROL
  ======================================================= */

  periodic?: {
    total: number;

    valid: number;

    approaching: number;

    overdue: number;
  };

  /* =======================================================
     ENVIRONMENT
  ======================================================= */

  environment?: {
    total: number;

    valid: number;

    approaching: number;

    overdue: number;
  };

  /* =======================================================
     CBS
  ======================================================= */

  cbs?: {
    total: number;

    open: number;

    critical: number;

    slaExceeded: number;

    actionRequired?: number;
  };
};

/* =========================================================
   SCORE COMPONENT
========================================================= */

export type ScoreComponent = {
  key: string;

  label: string;

  score: number | null;

  weight: number;

  weightedScore: number | null;

  normalizedContribution:
    | number
    | null;

  available: boolean;
};

/* =========================================================
   HSE PERFORMANCE RESULT
========================================================= */

export type HsePerformanceResult = {
  score: number | null;

  /**
   * Kullanılabilir bileşen ağırlıklarının
   * toplam %100 içindeki kapsamı.
   */
  coverage: number;

  grade:
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "NO_DATA";

  components: ScoreComponent[];

  availableWeight: number;

  availableComponents: number;

  totalComponents: number;

  formula:
    | "AVAILABLE_WEIGHT_NORMALIZED"
    | "AVAILABLE_WEIGHT_NORMALIZED_V2";
};

/* =========================================================
   PRIORITY ACTION
========================================================= */

export type PriorityAction = {
  id: string;

  severity:
    | "critical"
    | "high"
    | "medium";

  title: string;

  description: string;

  count: number;

  href: string;

  source: string;
};