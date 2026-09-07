import type { PriorityAction, ScoreInput } from "./executive-dashboard-types";

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((Math.max(0, part) / total) * 100) : null;

export function buildPriorityActions(input: ScoreInput): PriorityAction[] {
  const actions: PriorityAction[] = [];

  const add = (x: PriorityAction) => {
    if (Number.isFinite(x.count) && x.count > 0) actions.push(x);
  };

  /*
   * Riskler iki ayrı yönetim seviyesi olarak gösterilir.
   * Böylece "yüksek" riskler kritik risk sayısına karışmaz.
   */
  add({
    id: "risk-critical",
    severity: "critical",
    title: "Kabul edilemez riskler açık",
    description: "Kabul edilemez seviyedeki riskler için kontrol ve aksiyonlar gecikmeden yönetim tarafından değerlendirilmelidir.",
    count: input.risk?.critical ?? 0,
    href: "/admin/risk",
    source: "Risk",
  });

  add({
    id: "risk-high",
    severity: "high",
    title: "Yüksek riskler açık",
    description: "Yüksek seviyedeki riskler için mevcut kontroller ve aksiyon planlarının yeterliliği gözden geçirilmelidir.",
    count: input.risk?.high ?? 0,
    href: "/admin/risk",
    source: "Risk",
  });

  /*
   * DÖF: termin aşımı kritik önceliktir.
   * Termin aşımı yoksa fakat açık DÖF varsa yönetim ekranında orta öncelikle gösterilir.
   */
  const openDof = input.dof
    ? Math.max(0, input.dof.total - input.dof.closed)
    : 0;

  add({
    id: "dof-overdue",
    severity: "critical",
    title: "DÖF terminleri geçmiş",
    description: "Termin süresi geçen düzeltici/önleyici faaliyetler bulunuyor.",
    count: input.dof?.overdue ?? 0,
    href: "/admin/denetimler?tab=dof&status=open#dof",
    source: "DÖF",
  });

  if ((input.dof?.overdue ?? 0) === 0) {
    add({
      id: "dof-open",
      severity: "medium",
      title: "Açık DÖF kayıtları bulunuyor",
      description: "Henüz kapanmamış düzeltici/önleyici faaliyetlerin ilerlemesi takip edilmelidir.",
      count: openDof,
      href: "/admin/denetimler?tab=dof&status=open#dof",
      source: "DÖF",
    });
  }

  /*
   * ÇBS: SLA aşımı ve kritik öncelik aynı kayıtta kesişebileceği için
   * iki ayrı aksiyon satırıyla mükerrer sayı üretmek yerine tek yönetim aksiyonu gösterilir.
   */
  const cbsActionRequired = input.cbs?.actionRequired ?? 0;
  if (cbsActionRequired > 0) {
    actions.push({
      id: "cbs-action-required",
      severity: (input.cbs?.slaExceeded ?? 0) > 0 ? "critical" : "high",
      title: "ÇBS kayıtlarında yönetim aksiyonu gerekli",
      description: `${input.cbs?.slaExceeded ?? 0} SLA aşımı · ${input.cbs?.critical ?? 0} kritik öncelik`,
      count: cbsActionRequired,
      href: "/admin/cbs",
      source: "ÇBS",
    });
  }

  add({
    id: "incident-open",
    severity: "high",
    title: "Açık olay araştırmaları",
    description: "Kaza/olay araştırması tamamlanmamış kayıtlar bulunuyor.",
    count: input.incident?.openInvestigations ?? 0,
    href: "/admin/accidents",
    source: "Kaza/Olay",
  });

  add({
    id: "training-missing",
    severity: "high",
    title: "Yasal eğitim yükümlülüğü eksik",
    description: "Tehlike sınıfına göre zorunlu eğitim süresini ve geçerlilik şartını karşılamayan çalışanlar bulunuyor.",
    count: input.training?.nonCompliantEmployees ?? 0,
    href: "/admin/trainings",
    source: "Eğitim",
  });

  add({
    id: "health-overdue",
    severity: "high",
    title: "Sağlık gözetimi gecikmiş",
    description: "Süresi geçmiş sağlık gözetimi bulunan çalışanlar var. Hassas sağlık detayı Dashboard üzerinde gösterilmez.",
    count: input.health?.overdue ?? 0,
    href: "/admin/health",
    source: "Sağlık",
  });

  add({
    id: "health-missing",
    severity: "medium",
    title: "Sağlık gözetimi verisi eksik",
    description: "Aktif çalışanlarda geçerli muayene yenileme tarihi bulunmayan kayıtlar var.",
    count: input.health?.missing ?? 0,
    href: "/admin/health",
    source: "Sağlık",
  });

  add({
    id: "periodic-overdue",
    severity: "high",
    title: "Periyodik kontroller gecikmiş",
    description: "Kontrol tarihi geçmiş ekipman kayıtları bulunuyor.",
    count: input.periodic?.overdue ?? 0,
    href: "/admin/documentation/periodic-controls",
    source: "Periyodik Kontrol",
  });

  add({
    id: "environment-overdue",
    severity: "medium",
    title: "Ortam ölçümleri yenilenmeli",
    description: "Yenileme tarihi geçmiş ortam ölçümü kayıtları bulunuyor.",
    count: input.environment?.overdue ?? 0,
    href: "/admin/documentation/periodic-controls",
    source: "Ortam Ölçümleri",
  });

  /*
   * Denetim verisi varsa ve uygunsuz/kısmi sonuç oranı anlamlı düzeydeyse,
   * yönetim aksiyon listesine eklenir. Veri yoksa aksiyon üretilmez.
   */
  if (input.inspection && input.inspection.total > 0) {
    const effectiveCompliant =
      input.inspection.compliant + input.inspection.partial * 0.5;
    const compliance = pct(effectiveCompliant, input.inspection.total);
    const affected = Math.max(
      0,
      input.inspection.total -
        input.inspection.compliant -
        input.inspection.partial
    );

    if (compliance != null && compliance < 70) {
      add({
        id: "inspection-low-compliance",
        severity: "high",
        title: "Denetim uyumu düşük",
        description: `Seçili dönemde denetim uyumu %${compliance}. Uygunsuz bulgular ve aksiyonlar gözden geçirilmelidir.`,
        count: affected > 0 ? affected : input.inspection.total,
        href: "/admin/denetimler",
        source: "Denetim",
      });
    } else if (compliance != null && compliance < 85) {
      add({
        id: "inspection-followup",
        severity: "medium",
        title: "Denetim sonuçlarında iyileştirme gerekli",
        description: `Seçili dönemde denetim uyumu %${compliance}. Kısmi uygunluklar ve açık bulgular takip edilmelidir.`,
        count: affected > 0 ? affected : input.inspection.partial,
        href: "/admin/denetimler",
        source: "Denetim",
      });
    }
  }

  const order = { critical: 0, high: 1, medium: 2 };

  return actions
    .sort(
      (a, b) =>
        order[a.severity] - order[b.severity] ||
        b.count - a.count ||
        a.title.localeCompare(b.title, "tr")
    )
    .slice(0, 8);
}
