import type { PriorityAction, ScoreInput } from "./executive-dashboard-types";

export function buildPriorityActions(input: ScoreInput): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const add = (x: PriorityAction) => { if (x.count > 0) actions.push(x); };

  add({ id:"risk-critical", severity:"critical", title:"Kritik riskler açık",
    description:"Kritik riskler için kontroller ve aksiyonlar gecikmeden gözden geçirilmelidir.",
    count:input.risk?.critical ?? 0, href:"/admin/risk", source:"Risk" });

  add({ id:"dof-overdue", severity:"critical", title:"DÖF terminleri geçmiş",
    description:"Termin süresi geçen düzeltici/önleyici faaliyetler bulunuyor.",
    count:input.dof?.overdue ?? 0, href:"/admin/denetimler?tab=dof&status=open#dof", source:"DÖF" });

  add({ id:"cbs-sla", severity:"critical", title:"ÇBS SLA süresi aşılmış",
    description:"Açık başvurularda SLA süresi geçen kayıtlar bulunuyor.",
    count:input.cbs?.slaExceeded ?? 0, href:"/admin/cbs", source:"ÇBS" });

  add({ id:"incident-open", severity:"high", title:"Açık olay araştırmaları",
    description:"Kaza/olay araştırması tamamlanmamış kayıtlar bulunuyor.",
    count:input.incident?.openInvestigations ?? 0, href:"/admin/accidents", source:"Kaza/Olay" });

  add({ id:"training-missing", severity:"high", title:"Yasal eğitim yükümlülüğü eksik",
    description:"Tehlike sınıfına göre zorunlu eğitim süresini ve geçerlilik şartını karşılamayan çalışanlar bulunuyor.",
    count:input.training?.nonCompliantEmployees ?? 0, href:"/admin/trainings", source:"Eğitim" });

  add({ id:"health-overdue", severity:"high", title:"Sağlık gözetimi gecikmiş",
    description:"Süresi geçmiş sağlık gözetimi bulunan çalışanlar var. Hassas sağlık detayı dashboard üzerinde gösterilmez.",
    count:input.health?.overdue ?? 0, href:"/admin/health", source:"Sağlık" });

  add({ id:"health-missing", severity:"medium", title:"Sağlık gözetimi verisi eksik",
    description:"Aktif çalışanlarda geçerli muayene yenileme tarihi bulunmayan kayıtlar var.",
    count:input.health?.missing ?? 0, href:"/admin/health", source:"Sağlık" });

  add({ id:"periodic-overdue", severity:"high", title:"Periyodik kontroller gecikmiş",
    description:"Kontrol tarihi geçmiş ekipman kayıtları bulunuyor.",
    count:input.periodic?.overdue ?? 0, href:"/admin/documentation/periodic-controls", source:"Periyodik Kontrol" });

  add({ id:"environment-overdue", severity:"medium", title:"Ortam ölçümleri yenilenmeli",
    description:"Yenileme tarihi geçmiş ortam ölçümü kayıtları bulunuyor.",
    count:input.environment?.overdue ?? 0, href:"/admin/documentation/periodic-controls", source:"Ortam Ölçümleri" });

  add({ id:"cbs-critical", severity:"high", title:"Kritik ÇBS başvuruları",
    description:"Önceliği kritik olan açık ÇBS kayıtları bulunuyor.",
    count:input.cbs?.critical ?? 0, href:"/admin/cbs", source:"ÇBS" });

  const order = { critical:0, high:1, medium:2 };
  return actions.sort((a,b) => order[a.severity]-order[b.severity] || b.count-a.count).slice(0,8);
}
