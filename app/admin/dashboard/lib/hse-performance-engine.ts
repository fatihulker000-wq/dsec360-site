import type {
  HsePerformanceResult,
  ScoreComponent,
  ScoreInput,
} from "./executive-dashboard-types";

/* =========================================================
   D-SEC ENTERPRISE
   HSE PERFORMANCE ENGINE

   Amaç:
   - Modüllerin gerçek operasyonel skorlarını kullanmak
   - Veri olmayan modülü 0 kabul etmemek
   - Mevcut modüllerin ağırlıklarını normalize etmek
   - Dashboard ile modül hesaplarını aynılaştırmak
========================================================= */

const clamp = (n: number) =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(n)
    )
  );

function ratio(
  part: number,
  total: number
): number | null {
  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  return clamp(
    (Math.max(0, part) /
      total) *
      100
  );
}

/* =========================================================
   SAFE OPTIONAL NUMBER
========================================================= */

function optionalNumber(
  value: unknown
): number | null {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

/* =========================================================
   RISK SCORE
========================================================= */

function riskScore(
  x: ScoreInput["risk"]
): number | null {
  if (
    !x ||
    x.total <= 0
  ) {
    return null;
  }

  /*
   * API'nin yeni alanları:
   *
   * openHigh
   * openVeryHigh
   * openIntolerable
   *
   * Bunlar yalnız:
   *
   * DÖF'ü AÇIK
   * +
   * Yüksek / Çok Yüksek / Kabul Edilemez
   *
   * risklerdir.
   */

  const risk =
    x as typeof x & {
      openHigh?: number;
      openVeryHigh?: number;
      openIntolerable?: number;
    };

  const hasOpenRiskBreakdown =
    Number.isFinite(
      Number(risk.openHigh)
    ) &&
    Number.isFinite(
      Number(risk.openVeryHigh)
    ) &&
    Number.isFinite(
      Number(
        risk.openIntolerable
      )
    );

  /*
   * Yeni dashboard API'si kullanılıyorsa
   * yönetim skorunun ana baskısını
   * açık kritik risklerden oluşturuyoruz.
   */

  if (
    hasOpenRiskBreakdown
  ) {
    const openHigh =
      Math.max(
        0,
        Number(
          risk.openHigh
        )
      );

    const openVeryHigh =
      Math.max(
        0,
        Number(
          risk.openVeryHigh
        )
      );

    const openIntolerable =
      Math.max(
        0,
        Number(
          risk.openIntolerable
        )
      );

    /*
     * Şiddet katsayıları:
     *
     * Yüksek            = 0.45
     * Çok Yüksek        = 0.75
     * Kabul Edilemez    = 1.00
     *
     * Kapanmış DÖF'ler kritik açık risk
     * cezasına girmez.
     */

    const openCriticalExposure =
      (
        openHigh * 0.45 +
        openVeryHigh * 0.75 +
        openIntolerable * 1.0
      ) /
      x.total;

    /*
     * Orta ve düşük riskler kritik müdahale
     * cezasına girmez.
     *
     * Ancak açık kritik risk yoğunluğu
     * arttıkça skor aşağı iner.
     */

    return clamp(
      (
        1 -
        Math.min(
          1,
          openCriticalExposure
        )
      ) *
        100
    );
  }

  /*
   * GERİYE DÖNÜK UYUMLULUK
   *
   * Eski API alanları gelirse sistem
   * tamamen bozulmasın.
   */

  const exposure =
    (
      x.intolerable *
        1.0 +
      x.veryHigh *
        0.75 +
      x.high *
        0.45 +
      x.medium *
        0.15
    ) /
    x.total;

  return clamp(
    (
      1 -
      Math.min(
        1,
        exposure
      )
    ) *
      100
  );
}

/* =========================================================
   INSPECTION SCORE
========================================================= */

function inspectionScore(
  x: ScoreInput["inspection"]
): number | null {
  if (
    !x ||
    x.total <= 0
  ) {
    return null;
  }

  const inspection =
    x as typeof x & {
      complianceScore?: number | null;
      evaluatedTotal?: number;
    };

  /*
   * ÖNCELİK:
   *
   * Denetim modülünün/API'nin hesapladığı
   * gerçek uygunluk skoru.
   */

  const moduleScore =
    optionalNumber(
      inspection.complianceScore
    );

  if (
    moduleScore != null
  ) {
    return clamp(
      moduleScore
    );
  }

  /*
   * Fallback:
   *
   * UYGUN /
   * (UYGUN + KISMEN + UYGUNSUZ)
   *
   * API eskiyse çalışmaya devam eder.
   */

  const evaluatedTotal =
    Number(
      inspection.evaluatedTotal
    );

  if (
    Number.isFinite(
      evaluatedTotal
    ) &&
    evaluatedTotal > 0
  ) {
    return ratio(
      x.compliant,
      evaluatedTotal
    );
  }

  return ratio(
    x.compliant,
    x.total
  );
}

/* =========================================================
   LEGAL TRAINING SCORE
========================================================= */

function trainingScore(
  x: ScoreInput["training"]
): number | null {
  if (
    !x ||
    x.totalEmployees <= 0
  ) {
    return null;
  }

  const training =
    x as typeof x & {
      complianceScore?: number | null;
    };

  /*
   * ÖNCELİK:
   *
   * Executive API'nin hesapladığı
   * Eğitim Uygunluk Skoru.
   *
   * Örnek:
   *
   * Tehlikeli sınıf = 12 saat
   *
   * Çalışan 6 saat geçerli eğitim
   * tamamlamışsa %50 katkı sağlar.
   *
   * Böylece:
   *
   * 0 tam uyumlu çalışan
   *
   * mutlaka
   *
   * %0 eğitim skoru
   *
   * anlamına gelmez.
   */

  const moduleScore =
    optionalNumber(
      training.complianceScore
    );

  if (
    moduleScore != null
  ) {
    return clamp(
      moduleScore
    );
  }

  /*
   * Eski API fallback.
   */

  return ratio(
    x.compliantEmployees,
    x.totalEmployees
  );
}

/* =========================================================
   DÖF SCORE
========================================================= */

function dofScore(
  x: ScoreInput["dof"]
): number | null {
  if (
    !x ||
    x.total <= 0
  ) {
    return null;
  }

  /*
   * Risk Değerlendirmesi DÖF
   * +
   * Denetim DÖF
   *
   * birlikte gelir.
   */

  const closure =
    ratio(
      x.closed,
      x.total
    ) ?? 0;

  /*
   * Termin aşımı ayrıca ceza üretir.
   *
   * Maksimum ek ceza: 35 puan.
   */

  const overduePenalty =
    Math.min(
      35,
      (
        Math.max(
          0,
          x.overdue
        ) /
        x.total
      ) *
        100
    );

  return clamp(
    closure -
      overduePenalty
  );
}

/* =========================================================
   INCIDENT SCORE
========================================================= */

function incidentScore(
  x: ScoreInput["incident"]
): number | null {
  if (
    !x ||
    x.total <= 0
  ) {
    return null;
  }

  /*
   * Her olay:
   * -8
   *
   * Kayıp günlü olay:
   * ilave -12
   *
   * Açık inceleme:
   * ilave -8
   */

  const penalty =
    Math.min(
      100,
      x.total * 8 +
        x.lostTime * 12 +
        x.openInvestigations *
          8
    );

  return clamp(
    100 -
      penalty
  );
}

/* =========================================================
   HEALTH SCORE
========================================================= */

function healthScore(
  x: ScoreInput["health"]
): number | null {
  if (
    !x ||
    x.totalEmployees <= 0
  ) {
    return null;
  }

  /*
   * Sağlık skoru:
   *
   * Geçerli muayenesi bulunan çalışan /
   * aktif çalışan
   */

  return ratio(
    x.valid,
    x.totalEmployees
  );
}

/* =========================================================
   PERIODIC / ENVIRONMENT COMPLIANCE
========================================================= */

function complianceScore(
  x?: {
    total: number;
    valid: number;
    approaching: number;
    overdue: number;
  }
): number | null {
  if (
    !x ||
    x.total <= 0
  ) {
    return null;
  }

  return ratio(
    x.valid,
    x.total
  );
}

/* =========================================================
   HSE PERFORMANCE
========================================================= */

export function calculateHsePerformance(
  input: ScoreInput
): HsePerformanceResult {
  /*
   * Ağırlık toplamı = %100
   *
   * Risk               22
   * Denetim            16
   * Eğitim             14
   * DÖF                12
   * Kaza/Olay          12
   * Sağlık             10
   * Periyodik           8
   * Ortam               6
   *
   * TOPLAM            100
   */

  const definitions = [
    [
      "risk",
      "Risk Yönetimi",
      22,
      riskScore(
        input.risk
      ),
    ],

    [
      "inspection",
      "Denetim",
      16,
      inspectionScore(
        input.inspection
      ),
    ],

    [
      "training",
      "Yasal Eğitim",
      14,
      trainingScore(
        input.training
      ),
    ],

    [
      "dof",
      "DÖF",
      12,
      dofScore(
        input.dof
      ),
    ],

    [
      "incident",
      "Kaza / Olay",
      12,
      incidentScore(
        input.incident
      ),
    ],

    [
      "health",
      "Sağlık Gözetimi",
      10,
      healthScore(
        input.health
      ),
    ],

    [
      "periodic",
      "Periyodik Kontrol",
      8,
      complianceScore(
        input.periodic
      ),
    ],

    [
      "environment",
      "Ortam Ölçümleri",
      6,
      complianceScore(
        input.environment
      ),
    ],
  ] as const;

  /* =======================================================
     COMPONENTS
  ======================================================= */

  const components: ScoreComponent[] =
    definitions.map(
      ([
        key,
        label,
        weight,
        score,
      ]) => ({
        key,

        label,

        weight,

        score,

        /*
         * Sabit ağırlığa göre teorik katkı.
         *
         * Örn:
         * skor 80
         * ağırlık 20
         * = 16 puan
         */

        weightedScore:
          score == null
            ? null
            : Math.round(
                (
                  (
                    score *
                    weight
                  ) /
                  100
                ) *
                  10
              ) /
              10,

        normalizedContribution:
          null,

        available:
          score != null,
      })
    );

  /* =======================================================
     AVAILABLE COMPONENTS
  ======================================================= */

  const available =
    components.filter(
      (component) =>
        component.available
    );

  const availableWeight =
    available.reduce(
      (
        total,
        component
      ) =>
        total +
        component.weight,
      0
    );

  /*
   * coverage:
   *
   * Mevcut veri ağırlığının
   * toplam %100 içindeki payı.
   */

  const coverage =
    clamp(
      availableWeight
    );

  /* =======================================================
     NORMALIZED HSE SCORE
  ======================================================= */

  /*
   * Veri bulunmayan modül 0 puan değildir.
   *
   * Yalnız hesaplanabilen bileşenlerin
   * ağırlıkları kendi arasında normalize edilir.
   */

  const rawScore =
    availableWeight === 0
      ? null
      : available.reduce(
          (
            total,
            component
          ) =>
            total +
            (
              component.score ??
              0
            ) *
              component.weight,
          0
        ) /
        availableWeight;

  const score =
    rawScore == null
      ? null
      : clamp(
          rawScore
        );

  /* =======================================================
     NORMALIZED CONTRIBUTION
  ======================================================= */

  for (
    const component of
    components
  ) {
    component.normalizedContribution =
      component.available &&
      availableWeight > 0
        ? Math.round(
            (
              (
                (
                  component.score ??
                  0
                ) *
                component.weight
              ) /
              availableWeight
            ) *
              10
          ) /
          10
        : null;
  }

  /* =======================================================
     GRADE
  ======================================================= */

  const grade: HsePerformanceResult["grade"] =
    score == null
      ? "NO_DATA"
      : score >= 90
        ? "A"
        : score >= 80
          ? "B"
          : score >= 70
            ? "C"
            : score >= 60
              ? "D"
              : "E";

  /* =======================================================
     RESULT
  ======================================================= */

  return {
    score,

    coverage,

    grade,

    components,

    availableWeight,

    availableComponents:
      available.length,

    totalComponents:
      components.length,

    formula:
      "AVAILABLE_WEIGHT_NORMALIZED_V2",
  };
}