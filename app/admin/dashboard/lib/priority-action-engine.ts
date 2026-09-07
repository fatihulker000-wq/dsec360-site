import type { PriorityAction, ScoreInput } from "./executive-dashboard-types";

export function buildPriorityActions(input: ScoreInput): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const add = (x: PriorityAction) => { if (x.count > 0) actions.push(x); };

  add({ id:"risk-critical", severity:"critical", title:"Kritik riskler açık",
    description:"Kritik riskler için kontrol ve aksiyonların gecikmeden gözden geçirilmesi gerekir.",
    count:input.risk?.critical ?? 0, href:"/admin/risk", source:"Risk" });

  add({ id:"dof-overdue", severity:"critical", title:"DÖF terminleri geçmiş",
    description:"Termin süresi geçen düzeltici/önleyici faaliyetler bulunuyor.",
    count:input.dof?.overdue ?? 0, href:"/admin/denetimler?tab=dof&status=open#dof", source:"DÖF" });

  add({ id:"incident-open", severity:"high", title:"Açık olay araştırmaları",
    description:"Kaza/olay araştırması tamamlanmamış kayıtlar bulunuyor.",
    count:input.incident?.openInvestigations ?? 0, href:"/admin/accidents", source:"Kaza/Olay" });

  const missingTraining = Math.max(0,(input.training?.assigned ?? 0)-(input.training?.completed ?? 0));
  add({ id:"training-missing", severity:"high", title:"Eğitim yükümlülükleri tamamlanmamış",
    description:"Atanmış ancak tamamlanmamış eğitim kayıtları bulunuyor.",
    count:missingTraining, href:"/admin/trainings", source:"Eğitim" });

  add({ id:"health-overdue", severity:"high", title:"Sağlık gözetimi gecikmiş",
    description:"Süresi geçmiş sağlık gözetimi kayıtları bulunuyor. Dashboard hassas sağlık detayı göstermez.",
    count:input.health?.overdue ?? 0, href:"/admin/health", source:"Sağlık" });

  add({ id:"periodic-overdue", severity:"high", title:"Periyodik kontroller gecikmiş",
    description:"Kontrol tarihi geçmiş ekipman kayıtları bulunuyor.",
    count:input.periodic?.overdue ?? 0, href:"/admin/documentation/periodic-controls", source:"Periyodik Kontrol" });

  add({ id:"environment-overdue", severity:"medium", title:"Ortam ölçümleri yenilenmeli",
    description:"Yenileme tarihi geçmiş ortam ölçümü kayıtları bulunuyor.",
    count:input.environment?.overdue ?? 0, href:"/admin/documentation/periodic-controls", source:"Ortam Ölçümleri" });

  add({ id:"cbs-sla", severity:"critical", title:"ÇBS SLA süresi aşılmış",
    description:"Açık başvurularda SLA süresi geçen kayıtlar bulunuyor.",
    count:input.cbs?.slaExceeded ?? 0, href:"/admin/cbs", source:"ÇBS" });

  add({ id:"cbs-critical", severity:"high", title:"Kritik ÇBS başvuruları",
    description:"Önceliği kritik olan ÇBS kayıtları bulunuyor.",
    count:input.cbs?.critical ?? 0, href:"/admin/cbs", source:"ÇBS" });

  const order = { critical:0, high:1, medium:2 };
  return actions.sort((a,b) => order[a.severity]-order[b.severity] || b.count-a.count).slice(0,8);
}
