import type {
  PriorityAction,
  ScoreInput,
} from "./executive-dashboard-types";

/* =========================================================
   D-SEC ENTERPRISE
   PRIORITY ACTION ENGINE V2

   Temel prensip:
   - Sadece gerçekten aksiyon gerektiren durumları üretir
   - Riskte açık DÖF kırılımını kullanır
   - Denetimde gerçek uygunluk skorunu kullanır
   - Eğitimde mevzuat uyumsuz çalışanları esas alır
   - Aynı konuyu gereksiz şekilde iki kez üretmez
========================================================= */

const pct = (
  part: number,
  total: number
) =>
  total > 0
    ? Math.round(
        (
          Math.max(
            0,
            part
          ) /
          total
        ) *
          100
      )
    : null;

const safeNumber = (
  value: unknown
) => {
  const n =
    Number(value);

  return Number.isFinite(
    n
  )
    ? Math.max(
        0,
        n
      )
    : 0;
};

const safeScore = (
  value: unknown
): number | null => {
  const n =
    Number(value);

  if (
    !Number.isFinite(
      n
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(n)
    )
  );
};

export function buildPriorityActions(
  input: ScoreInput
): PriorityAction[] {
  const actions:
    PriorityAction[] = [];

  const add = (
    action: PriorityAction
  ) => {
    if (
      Number.isFinite(
        action.count
      ) &&
      action.count >
        0
    ) {
      actions.push(
        action
      );
    }
  };

  /* =======================================================
     RISK

     KURAL:
     Sadece DÖF'ü açık olan:
     - Yüksek
     - Çok Yüksek
     - Kabul Edilemez
  ======================================================= */

  if (input.risk) {
    const openHigh =
      safeNumber(
        input.risk
          .openHigh
      );

    const openVeryHigh =
      safeNumber(
        input.risk
          .openVeryHigh
      );

    const openIntolerable =
      safeNumber(
        input.risk
          .openIntolerable
      );

    const criticalTotal =
      openHigh +
      openVeryHigh +
      openIntolerable;

    if (
      criticalTotal > 0
    ) {
      add({
        id:
          "risk-open-critical",

        severity:
          "critical",

        title:
          "Kritik risklerde açık DÖF bulunuyor",

        description:
          `${openHigh} yüksek · ${openVeryHigh} çok yüksek · ${openIntolerable} kabul edilemez riskin DÖF'ü açık.`,

        count:
          criticalTotal,

        href:
          "/admin/risk",

        source:
          "Risk",
      });
    }
  }

  /* =======================================================
     DÖF

     Risk Değerlendirmesi + Denetim
  ======================================================= */

  if (input.dof) {
    const riskOpen =
      safeNumber(
        input.dof
          .riskOpen
      );

    const inspectionOpen =
      safeNumber(
        input.dof
          .inspectionOpen
      );

    const openDof =
      riskOpen +
      inspectionOpen;

    const overdue =
      safeNumber(
        input.dof
          .overdue
      );

    if (
      overdue > 0
    ) {
      add({
        id:
          "dof-overdue",

        severity:
          "critical",

        title:
          "DÖF terminleri geçmiş",

        description:
          `${overdue} açık DÖF terminini aşmış durumda. Açık dağılım: ${riskOpen} risk değerlendirmesi · ${inspectionOpen} denetim.`,

        count:
          overdue,

        href:
          "/admin/denetimler?tab=dof&status=open#dof",

        source:
          "DÖF",
      });
    }

    /*
     * Termin aşımı varsa ikinci bir "Açık DÖF" kartı üretip
     * aynı konuyu çoğaltmıyoruz.
     */

    if (
      overdue === 0 &&
      openDof > 0
    ) {
      add({
        id:
          "dof-open",

        severity:
          "medium",

        title:
          "Açık DÖF kayıtları bulunuyor",

        description:
          `${riskOpen} risk değerlendirmesi · ${inspectionOpen} denetim kaynaklı DÖF halen açık.`,

        count:
          openDof,

        href:
          "/admin/denetimler?tab=dof&status=open#dof",

        source:
          "DÖF",
      });
    }
  }

  /* =======================================================
     CBS
  ======================================================= */

  const cbsActionRequired =
    safeNumber(
      input.cbs
        ?.actionRequired
    );

  if (
    cbsActionRequired >
    0
  ) {
    const slaExceeded =
      safeNumber(
        input.cbs
          ?.slaExceeded
      );

    const critical =
      safeNumber(
        input.cbs
          ?.critical
      );

    actions.push({
      id:
        "cbs-action-required",

      severity:
        slaExceeded >
        0
          ? "critical"
          : "high",

      title:
        "ÇBS kayıtlarında yönetim aksiyonu gerekli",

      description:
        `${slaExceeded} SLA aşımı · ${critical} kritik öncelik`,

      count:
        cbsActionRequired,

      href:
        "/admin/cbs",

      source:
        "ÇBS",
    });
  }

  /* =======================================================
     INCIDENT
  ======================================================= */

  add({
    id:
      "incident-open",

    severity:
      "high",

    title:
      "Açık olay araştırmaları",

    description:
      "Kaza/olay araştırması tamamlanmamış kayıtlar bulunuyor.",

    count:
      safeNumber(
        input.incident
          ?.openInvestigations
      ),

    href:
      "/admin/accidents",

    source:
      "Kaza/Olay",
  });

  /* =======================================================
     TRAINING
  ======================================================= */

  if (
    input.training
  ) {
    const nonCompliant =
      safeNumber(
        input.training
          .nonCompliantEmployees
      );

    const complianceScore =
      safeScore(
        input.training
          .complianceScore
      );

    if (
      nonCompliant > 0
    ) {
      add({
        id:
          "training-missing",

        severity:
          complianceScore !=
            null &&
          complianceScore <
            50
            ? "high"
            : "medium",

        title:
          "Yasal eğitim yükümlülüğü eksik",

        description:
          complianceScore !=
          null
            ? `${nonCompliant} çalışan zorunlu eğitim süresi/geçerlilik şartını tam karşılamıyor · Eğitim uygunluk skoru %${complianceScore}.`
            : `${nonCompliant} çalışan tehlike sınıfına göre zorunlu eğitim süresi veya geçerlilik şartını karşılamıyor.`,

        count:
          nonCompliant,

        href:
          "/admin/trainings",

        source:
          "Eğitim",
      });
    }
  }

  /* =======================================================
     HEALTH
  ======================================================= */

  add({
    id:
      "health-overdue",

    severity:
      "high",

    title:
      "Sağlık gözetimi gecikmiş",

    description:
      "Süresi geçmiş sağlık gözetimi bulunan çalışanlar var. Hassas sağlık detayı Dashboard üzerinde gösterilmez.",

    count:
      safeNumber(
        input.health
          ?.overdue
      ),

    href:
      "/admin/health",

    source:
      "Sağlık",
  });

  add({
    id:
      "health-missing",

    severity:
      "medium",

    title:
      "Sağlık gözetimi verisi eksik",

    description:
      "Aktif çalışanlarda geçerli muayene yenileme tarihi bulunmayan kayıtlar var.",

    count:
      safeNumber(
        input.health
          ?.missing
      ),

    href:
      "/admin/health",

    source:
      "Sağlık",
  });

  /* =======================================================
     PERIODIC CONTROL
  ======================================================= */

  add({
    id:
      "periodic-overdue",

    severity:
      "high",

    title:
      "Periyodik kontroller gecikmiş",

    description:
      "Kontrol tarihi geçmiş ekipman kayıtları bulunuyor.",

    count:
      safeNumber(
        input.periodic
          ?.overdue
      ),

    href:
      "/admin/documentation/periodic-controls",

    source:
      "Periyodik Kontrol",
  });

  add({
    id:
      "periodic-approaching",

    severity:
      "medium",

    title:
      "Periyodik kontrol süresi yaklaşıyor",

    description:
      "Önümüzdeki 30 gün içinde yenilenmesi gereken periyodik kontrol kayıtları bulunuyor.",

    count:
      safeNumber(
        input.periodic
          ?.approaching
      ),

    href:
      "/admin/documentation/periodic-controls",

    source:
      "Periyodik Kontrol",
  });

  /* =======================================================
     ENVIRONMENT
  ======================================================= */

  add({
    id:
      "environment-overdue",

    severity:
      "medium",

    title:
      "Ortam ölçümleri yenilenmeli",

    description:
      "Yenileme tarihi geçmiş ortam ölçümü kayıtları bulunuyor.",

    count:
      safeNumber(
        input.environment
          ?.overdue
      ),

    href:
      "/admin/documentation/periodic-controls",

    source:
      "Ortam Ölçümleri",
  });

  add({
    id:
      "environment-approaching",

    severity:
      "medium",

    title:
      "Ortam ölçümü yenileme tarihi yaklaşıyor",

    description:
      "Önümüzdeki 30 gün içinde yenilenmesi gereken ortam ölçümü kayıtları bulunuyor.",

    count:
      safeNumber(
        input.environment
          ?.approaching
      ),

    href:
      "/admin/documentation/periodic-controls",

    source:
      "Ortam Ölçümleri",
  });

  /* =======================================================
     INSPECTION

     KURAL:
     UYGUN /
     DEĞERLENDİRİLEN TOPLAM MADDE
  ======================================================= */

  if (
    input.inspection &&
    input.inspection.total >
      0
  ) {
    const moduleScore =
      safeScore(
        input.inspection
          .complianceScore
      );

    const evaluatedTotal =
      input.inspection
        .evaluatedTotal >
      0
        ? input.inspection
            .evaluatedTotal
        : input.inspection
            .total;

    const compliance =
      moduleScore ??
      pct(
        input.inspection
          .compliant,
        evaluatedTotal
      );

    const affected =
      safeNumber(
        input.inspection
          .partial
      ) +
      safeNumber(
        input.inspection
          .nonCompliant
      );

    if (
      compliance !=
        null &&
      compliance < 70
    ) {
      add({
        id:
          "inspection-low-compliance",

        severity:
          "high",

        title:
          "Denetim uyumu düşük",

        description:
          `Seçili dönemde denetim uygunluk skoru %${compliance}. ${input.inspection.compliant} uygun · ${input.inspection.partial} kısmi uygun · ${input.inspection.nonCompliant} uygunsuz madde.`,

        count:
          affected > 0
            ? affected
            : evaluatedTotal,

        href:
          "/admin/denetimler",

        source:
          "Denetim",
      });
    } else if (
      compliance !=
        null &&
      compliance < 85
    ) {
      add({
        id:
          "inspection-followup",

        severity:
          "medium",

        title:
          "Denetim sonuçlarında iyileştirme gerekli",

        description:
          `Seçili dönemde denetim uygunluk skoru %${compliance}. ${input.inspection.partial} kısmi uygun · ${input.inspection.nonCompliant} uygunsuz madde takip edilmelidir.`,

        count:
          affected,

        href:
          "/admin/denetimler",

        source:
          "Denetim",
      });
    }
  }

  /* =======================================================
     SORT
  ======================================================= */

  const order = {
    critical: 0,
    high: 1,
    medium: 2,
  } as const;

  return actions
    .sort(
      (a, b) =>
        order[
          a.severity
        ] -
          order[
            b.severity
          ] ||
        b.count -
          a.count ||
        a.title.localeCompare(
          b.title,
          "tr"
        )
    )
    .slice(0, 8);
}