import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;
type ExecutorKind = "EMERGENCY_SUPPORT_TEAM" | "EMPLOYEE_REPRESENTATIVE" | "TRAINING_ASSIGNMENT" | "ISG_BOARD_MEMBER" | "RISK_DOF_ACTION" | "DOCUMENT_DRAFT" | "HEALTH_AGENDA" | "PERIODIC_AGENDA" | "ENVIRONMENT_AGENDA" | "SUBCONTRACTOR_FOLLOWUP" | "SURVEY_ACTION" | "CBS_FOLLOWUP" | "";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function text(v: unknown) { return String(v ?? "").trim(); }
function norm(v: unknown) {
  return text(v).toLocaleUpperCase("tr-TR")
    .replaceAll("İ","I").replaceAll("Ş","S").replaceAll("Ğ","G")
    .replaceAll("Ü","U").replaceAll("Ö","O").replaceAll("Ç","C")
    .replace(/[^A-Z0-9]+/g,"_");
}
function hay(row:AnyRow){
  return norm([row.source_gap_id,row.source_domain,row.title,row.description,row.recommendation,JSON.stringify(row.requested_payload||{})].join(" "));
}
function employeeName(e: AnyRow) { return text(e.full_name || e.name || e.employee_name); }
function employeeDepartment(e: AnyRow) { return text(e.department || e.department_name || e.unit || e.job_title) || "-"; }
function employeePhone(e: AnyRow) { return text(e.phone || e.mobile_phone || e.mobile || e.telephone) || "-"; }

function executorKindFor(row:AnyRow):ExecutorKind {
  const h=hay(row);
  const gapId=text(row.source_gap_id);
  if(gapId==="fullscan-health-overdue") return "HEALTH_AGENDA";
  if(gapId==="fullscan-periodic-overdue") return "PERIODIC_AGENDA";
  if(gapId==="fullscan-env-overdue") return "ENVIRONMENT_AGENDA";
  if(gapId==="fullscan-subcontractor") return "SUBCONTRACTOR_FOLLOWUP";
  if(gapId==="fullscan-survey") return "SURVEY_ACTION";
  if(gapId==="fullscan-cbs") return "CBS_FOLLOWUP";
  if(["fullscan-doc-policy","fullscan-doc-training-plan","fullscan-doc-risk-team","fullscan-emergency-plan"].includes(gapId)) return "DOCUMENT_DRAFT";
  if(gapId==="fullscan-high-risk" || h.includes("YUKSEK_KRITIK_RISK_YOGUNLUGU")) return "RISK_DOF_ACTION";
  if(text(row.source_gap_id)==="isg-board" || h.includes("ISG_KURULU_YAPISI")) return "ISG_BOARD_MEMBER";
  if(h.includes("CALISAN_TEMSILCI") || text(row.source_gap_id)==="employee-representatives") return "EMPLOYEE_REPRESENTATIVE";
  if(!h.includes("YILLIK_EGITIM_PLANI") && !h.includes("DOKUMAN") && (h.includes("EGITIM_TAMAMLAMA") || h.includes("TAMAMLANMAMIS_EGITIM") || h.includes("EGITIM_ATAMA") || h.includes("ATANMAMIS_EGITIM"))) return "TRAINING_ASSIGNMENT";
  if(
    h.includes("KORUMA") || h.includes("SONDUR") || h.includes("YANGINLA_MUCADELE") ||
    h.includes("KURTAR") || h.includes("ARAMA_KURTARMA") ||
    h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") || h.includes("FIRST_AID")
  ) return "EMERGENCY_SUPPORT_TEAM";
  return "";
}

function teamTypeFrom(row: AnyRow) {
  const h=hay(row);
  if (h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") || h.includes("FIRST_AID")) return "ILK_YARDIM";
  if (h.includes("SONDUR") || h.includes("YANGINLA_MUCADELE")) return "YANGINLA_MUCADELE";
  if (h.includes("KURTAR") || h.includes("ARAMA_KURTARMA")) return "ARAMA_KURTARMA_TAHLIYE";
  if (h.includes("KORUMA")) return "KORUMA";
  return "";
}
function teamLabel(v:string){
  return v==="YANGINLA_MUCADELE"?"Yangınla Mücadele":
    v==="ARAMA_KURTARMA_TAHLIYE"?"Arama-Kurtarma-Tahliye":
    v==="ILK_YARDIM"?"İlk Yardım":
    v==="KORUMA"?"Koruma":v;
}
function missingCountFrom(row:AnyRow){
  const raw=row?.requested_payload?.missing ?? row?.requested_payload?.required;
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?Math.floor(n):null;
}

function correctedSourceUrl(row:AnyRow){
  const h=hay(row);
  if(h.includes("CALISAN_TEMSILCI") || text(row.source_gap_id)==="employee-representatives")
    return "/admin/documentation/employee-representatives";
  if(h.includes("ISG_KURUL")) return "/admin/documentation/board";
  if(text(row.source_gap_id)==="fullscan-high-risk" || h.includes("YUKSEK_KRITIK_RISK")) return "/admin/risk";
  if(text(row.source_gap_id)==="fullscan-health-overdue") return "/admin/health";
  if(["fullscan-periodic-overdue","fullscan-env-overdue"].includes(text(row.source_gap_id))) return "/admin/documentation/periodic-controls";
  if(text(row.source_gap_id)==="fullscan-subcontractor") return "/admin/subcontractors";
  if(text(row.source_gap_id)==="fullscan-survey") return "/admin/documentation/employee-surveys";
  if(text(row.source_gap_id)==="fullscan-cbs") return "/admin/cbs";
  if(h.includes("POLITIKA") || h.includes("DOKUMAN")) return "/admin/documentation";
  if(
    h.includes("ACIL_DURUM") || h.includes("KORUMA") || h.includes("SONDUR") ||
    h.includes("YANGINLA_MUCADELE") || h.includes("KURTAR") ||
    h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") ||
    h.includes("TATBIKAT") || h.includes("ACIL_DURUM_PLANI")
  ) return "";
  const current=text(row.source_url || row?.requested_payload?.sourceUrl);
  if(!current || current==="/admin/dora") return "/admin/dora";
  // Known obsolete/non-existent DORA source paths are collapsed to their real module roots.
  if(current.startsWith("/admin/documentation/employee-representatives")) return "/admin/documentation/employee-representatives";
  if(current.startsWith("/admin/documentation/emergency")) return "";
  return current;
}

async function authorize(supabase:any, requested:any) {
  const resolved = await resolveReportScope(supabase, text(requested) || null);
  if (!resolved.ok) return { error: NextResponse.json({ok:false,error:resolved.error},{status:resolved.status||403}) };
  const companyId = resolved.scope.selectedCompanyId;
  if (!companyId || companyId === "ALL")
    return { error: NextResponse.json({ok:false,error:"DORA Faz 2 için tek bir firma seçilmelidir."},{status:400}) };
  return { companyId };
}

async function companyInfo(supabase:any, companyId:string) {
  const {data,error}=await supabase.from("companies").select("id,name,local_firm_id,calisan_sayisi,nace_kodu,tehlike_sinifi,sektor,address,isg_uzmani,isyeri_hekimi,dsp").eq("id",companyId).maybeSingle();
  if(error) throw error;
  return {localFirmId:data?.local_firm_id ?? null,name:text(data?.name)||"Firma",employeeCount:Number(data?.calisan_sayisi||0),naceCode:text(data?.nace_kodu),dangerClass:text(data?.tehlike_sinifi),sector:text(data?.sektor),address:text(data?.address),isgSpecialist:text(data?.isg_uzmani),workplaceDoctor:text(data?.isyeri_hekimi),dsp:text(data?.dsp)};
}

async function activeEmployees(supabase:any, companyId:string){
  const {data,error}=await supabase.from("employees").select("*").eq("firm_id",companyId).eq("active",true).order("full_name");
  if(error) throw error;
  return data||[];
}

async function emergencyCandidates(supabase:any, companyId:string, current:AnyRow) {
  const teamType=teamTypeFrom(current);
  if(!teamType) return {teamType:"", candidates:[] as AnyRow[]};

  const employees=await activeEmployees(supabase,companyId);
  const {data:members,error}=await supabase.from("emergency_support_teams")
    .select("employee_id,full_name,team_type,is_active,is_deleted")
    .eq("company_id",companyId).eq("is_active",true).eq("is_deleted",false);
  if(error) throw error;

  const usedIds=new Set((members||[]).map((m:any)=>text(m.employee_id)).filter(Boolean));
  const usedNames=new Set((members||[]).map((m:any)=>norm(m.full_name)).filter(Boolean));

  return {
    teamType,
    candidates:employees
      .filter((e:any)=>!usedIds.has(text(e.id))&&!usedNames.has(norm(employeeName(e))))
      .map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"}))
      .filter((e:any)=>e.full_name)
      .slice(0,250)
  };
}

async function representativeCandidates(supabase:any, companyId:string) {
  const employees=await activeEmployees(supabase,companyId);
  const {data:reps,error}=await supabase.from("employee_representatives")
    .select("employee_id,employee_name,status,is_deleted")
    .eq("firm_id",companyId).eq("status","ACTIVE").eq("is_deleted",false);
  if(error) throw error;

  const usedIds=new Set((reps||[]).map((r:any)=>text(r.employee_id)).filter(Boolean));
  const usedNames=new Set((reps||[]).map((r:any)=>norm(r.employee_name)).filter(Boolean));

  return employees
    .filter((e:any)=>!usedIds.has(text(e.id))&&!usedNames.has(norm(employeeName(e))))
    .map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"}))
    .filter((e:any)=>e.full_name)
    .slice(0,250);
}


function parseBoardMissingRoles(row:AnyRow){
  const evidence=Array.isArray(row?.requested_payload?.evidence)?row.requested_payload.evidence:[];
  const n=norm([...evidence,text(row.description),text(row.recommendation)].join(" "));
  const expected=[
    {key:"BASKAN",label:"Başkan"},
    {key:"ISG_UZMANI",label:"İSG Uzmanı"},
    {key:"ISYERI_HEKIMI",label:"İşyeri Hekimi"},
    {key:"CALISAN_TEMSILCISI",label:"Çalışan Temsilcisi"}
  ];
  const found=expected.filter(x=>n.includes(x.key));
  return found.length?found:expected;
}

async function boardCandidates(supabase:any,companyId:string){
  const employees=await activeEmployees(supabase,companyId);
  const {data,error}=await supabase.from("documentation_board_members").select("employee_id,full_name,is_active,is_deleted").eq("firm_id",companyId).eq("is_active",true).eq("is_deleted",false);
  if(error)throw error;
  const usedIds=new Set((data||[]).map((x:any)=>text(x.employee_id)).filter(Boolean));
  return employees.filter((e:any)=>!usedIds.has(text(e.id))).map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"})).filter((e:any)=>e.full_name).slice(0,250);
}

async function trainingOptions(supabase:any){
  const {data,error}=await supabase.from("trainings").select("id,title,description,type,duration_minutes,catalog_visible").eq("catalog_visible",true).order("created_at",{ascending:true});
  if(error)throw error;
  return (data||[]).map((t:any)=>({id:text(t.id),title:text(t.title)||"Eğitim",type:text(t.type)||"EĞİTİM",duration_minutes:Number(t.duration_minutes||0),description:text(t.description)}));
}

async function trainingCandidates(supabase:any,companyId:string){
  const employees=await activeEmployees(supabase,companyId);
  return employees.map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"})).filter((e:any)=>e.full_name).slice(0,500);
}


function riskLevelFrom(row:AnyRow, kind:"MATRIX"|"FINE"){
  if(kind==="FINE") return text(row.level)||"";
  const score=Number(row.score||0);
  if(score>=20)return "KABUL_EDILEMEZ";
  if(score>=15)return "COK_YUKSEK";
  if(score>=8)return "YUKSEK";
  if(score>=4)return "ORTA";
  return "DUSUK";
}
function highRiskSignal(row:AnyRow,kind:"MATRIX"|"FINE"){
  const n=norm(riskLevelFrom(row,kind));
  return ["HIGH","CRITICAL","INTOLERABLE","YUKSEK","COK_YUKSEK","KABUL_EDILEMEZ"].some(x=>n.includes(x));
}
async function riskDofOptions(supabase:any,companyId:string){
  const [m,f]=await Promise.all([
    supabase.from("risk_items").select("id,title,hazard,consequence,score,department,location,responsible,dof_status,dof_action,dof_responsible,dof_due_date_millis,is_deleted").eq("company_id",companyId).eq("is_deleted",false).order("score",{ascending:false}),
    supabase.from("fine_kinney_risks").select("id,title,hazard,consequence,score,level,action,department,location,responsible,dof_status,dof_action,dof_responsible,dof_due_date_millis,is_deleted").eq("company_id",companyId).eq("is_deleted",false).order("score",{ascending:false})
  ]);
  if(m.error)throw m.error;
  if(f.error)throw f.error;
  const matrix=(m.data||[]).filter((x:any)=>highRiskSignal(x,"MATRIX")).map((x:any)=>({
    key:`MATRIX:${x.id}`,id:text(x.id),kind:"MATRIX",title:text(x.title)||text(x.hazard)||"5×5 Risk",
    hazard:text(x.hazard),score:Number(x.score||0),level:riskLevelFrom(x,"MATRIX"),
    department:text(x.department)||"-",location:text(x.location)||"-",
    currentDofStatus:text(x.dof_status)||"YOK",currentAction:text(x.dof_action)
  }));
  const fine=(f.data||[]).filter((x:any)=>highRiskSignal(x,"FINE")).map((x:any)=>({
    key:`FINE:${x.id}`,id:text(x.id),kind:"FINE",title:text(x.title)||text(x.hazard)||"Fine Kinney Risk",
    hazard:text(x.hazard),score:Number(x.score||0),level:riskLevelFrom(x,"FINE"),
    department:text(x.department)||"-",location:text(x.location)||"-",
    currentDofStatus:text(x.dof_status)||"YOK",currentAction:text(x.dof_action)||text(x.action)
  }));
  return [...matrix,...fine].sort((a,b)=>b.score-a.score).slice(0,250);
}


type DocumentDraft={documentType:string;category:string;title:string;content:string;documentNoPrefix:string;tags:string[]};

function documentDraftFor(row:AnyRow, info:AnyRow):DocumentDraft|null{
  const id=text(row.source_gap_id);
  const company=text(info.name)||"İşletme";
  const context=[
    `İşletme: ${company}`,
    info.sector?`Sektör: ${info.sector}`:"",
    info.dangerClass?`Tehlike sınıfı: ${info.dangerClass}`:"",
    info.naceCode?`NACE: ${info.naceCode}`:"",
    info.employeeCount?`Çalışan sayısı: ${info.employeeCount}`:"",
  ].filter(Boolean).join("\n");

  if(id==="fullscan-doc-policy") return {
    documentType:"ISG_POLITIKASI",category:"ISG_POLITIKASI",title:`${company} - İSG Politikası`,documentNoPrefix:"DSEC-ISG-POL",
    tags:["İSG Politikası","DORA","Taslak"],
    content:`İŞ SAĞLIĞI VE GÜVENLİĞİ POLİTİKASI\n\n${context}\n\n1. AMAÇ VE KAPSAM\nBu taslak, işletmenin iş sağlığı ve güvenliği yaklaşımını yönetim taahhüdü, çalışan katılımı, risklerin önlenmesi ve sürekli iyileştirme başlıkları altında yapılandırmak amacıyla DORA tarafından hazırlanmıştır.\n\n2. YÖNETİM TAAHHÜDÜ\nİş sağlığı ve güvenliği hedeflerinin işletme süreçlerine dahil edilmesi, uygun kaynakların sağlanması ve performansın düzenli izlenmesi esastır.\n\n3. RİSKLERİN ÖNLENMESİ\nTehlikelerin kaynağında kontrolü, risk değerlendirmelerinin güncelliği ve düzeltici/önleyici faaliyetlerin izlenmesi önceliklidir.\n\n4. ÇALIŞAN KATILIMI\nÇalışan görüşleri, temsil mekanizmaları, bildirimler ve geri bildirim kanalları karar süreçlerinde dikkate alınır.\n\n5. EĞİTİM VE FARKINDALIK\nGöreve ve riske uygun eğitimlerin planlanması, tamamlanması ve etkinliğinin izlenmesi sağlanır.\n\n6. SÜREKLİ İYİLEŞTİRME\nDenetim, olay, risk, sağlık gözetimi ve performans verileri yönetim gözden geçirmelerinde kullanılır.\n\nDORA NOTU: Bu metin kullanıcı onaylı TASLAKTIR. Yayınlanmadan önce işveren/işveren vekili ve yetkili İSG profesyonellerince işletmeye özel şartlar ve yürürlükteki mevzuat açısından doğrulanmalıdır.`
  };
  if(id==="fullscan-doc-training-plan") return {
    documentType:"YILLIK_EGITIM_PLANI",category:"EGITIM",title:`${company} - Yıllık İSG Eğitim Planı`,documentNoPrefix:"DSEC-EGT-PLN",
    tags:["Yıllık Eğitim Planı","İSG Eğitim","DORA","Taslak"],
    content:`YILLIK İSG EĞİTİM PLANI - TASLAK\n\n${context}\n\n1. AMAÇ\nÇalışanların görev, tehlike sınıfı ve maruziyetlerine uygun İSG eğitimlerinin yıllık plan içinde izlenmesini sağlamak.\n\n2. PLANLAMA GİRDİLERİ\n- Risk değerlendirmesi bulguları\n- Kaza / olay / ramak kala kayıtları\n- Denetim ve DÖF sonuçları\n- Çalışan görevleri ve özel riskler\n- Önceki eğitim tamamlama kayıtları\n\n3. EĞİTİM GRUPLARI\n- Genel İSG konuları\n- Sağlık konuları\n- Teknik konular\n- İşe / göreve özgü konular\n\n4. UYGULAMA\nHer eğitim için hedef grup, yöntem, planlanan dönem, eğitici/sorumlu, süre ve ölçme-değerlendirme yöntemi ayrıca tanımlanmalıdır.\n\n5. İZLEME\nAtanan, başlanan, tamamlanan ve başarısız/eksik eğitimler aylık olarak izlenmeli; yüksek riskli görevlerdeki eksikler önceliklendirilmelidir.\n\nDORA NOTU: Bu metin plan iskeletidir; zorunlu süre, periyot ve konu dağılımı işletmenin tehlike sınıfı ve çalışan profiline göre yetkili kullanıcı tarafından doğrulanmalıdır.`
  };
  if(id==="fullscan-doc-risk-team") return {
    documentType:"RISK_DEGERLENDIRME_EKIBI",category:"RISK",title:`${company} - Risk Değerlendirme Ekibi Görevlendirme Taslağı`,documentNoPrefix:"DSEC-RSK-EKP",
    tags:["Risk Değerlendirme Ekibi","Görevlendirme","DORA","Taslak"],
    content:`RİSK DEĞERLENDİRME EKİBİ GÖREVLENDİRME TASLAĞI\n\n${context}\n\n1. AMAÇ\nİşyerindeki risk değerlendirme çalışmalarının disiplinler arası katılımla yürütülmesi için ekip yapısını tanımlamak.\n\n2. EKİP YAPISI\nEkip üyeleri yetkili kullanıcı tarafından işletme organizasyonu ve mevzuat gereklilikleri dikkate alınarak ayrıca belirlenmelidir.\n\nÖnerilen kayıt alanları:\n- İşveren / işveren vekili\n- İş güvenliği uzmanı\n- İşyeri hekimi\n- Çalışan temsilcisi\n- Destek elemanları\n- İşyerindeki birim ve süreçleri temsil eden çalışanlar\n\n3. GÖREVLER\nTehlikeleri belirlemek, mevcut kontrolleri değerlendirmek, risk seviyelerini analiz etmek, gerekli ilave önlemleri belirlemek ve uygulama sonuçlarını izlemek.\n\n4. ÇALIŞMA ESASLARI\nSaha verileri, kaza/olay kayıtları, sağlık gözetimi, denetim bulguları, çalışan geri bildirimleri ve değişiklik yönetimi girdileri dikkate alınmalıdır.\n\nDORA NOTU: Bu belge yalnızca kullanıcı onaylı TASLAKTIR; ekip üyeleri ve hukuki yeterlilikler ayrıca doğrulanmadan yayımlanmamalıdır.`
  };
  if(id==="fullscan-emergency-plan") return {
    documentType:"ACIL_DURUM_EYLEM_PLANI",category:"ACIL_DURUM",title:`${company} - Acil Durum Eylem Planı Taslağı`,documentNoPrefix:"DSEC-AD-PLN",
    tags:["Acil Durum Planı","DORA","Taslak"],
    content:`ACİL DURUM EYLEM PLANI - TASLAK\n\n${context}\n${info.address?`Adres: ${info.address}\n`:""}\n1. AMAÇ VE KAPSAM\nİşyerinde meydana gelebilecek acil durumlarda çalışanların, ziyaretçilerin ve iş sürekliliğinin korunmasına yönelik organizasyon çerçevesini tanımlar.\n\n2. SENARYOLAR\nYangın, tahliye, doğal afet, kimyasal/tehlikeli madde olayı, elektrik kaynaklı olaylar ve işyerine özgü diğer senaryolar saha risklerine göre ayrıca doğrulanmalıdır.\n\n3. ORGANİZASYON\nSöndürme, arama-kurtarma-tahliye, koruma ve ilk yardım organizasyonu mevcut çalışan/sertifika kayıtlarıyla doğrulanmalıdır.\n\n4. TAHLİYE VE TOPLANMA\nKaçış yolları, acil çıkışlar, toplanma alanı, sayım yöntemi ve engelli/özel destek gerektiren kişiler için prosedür işletmeye özel olarak tamamlanmalıdır.\n\n5. HABERLEŞME\nAcil çağrı zinciri, sorumlular, dış kurum iletişim bilgileri ve vardiya bazlı haberleşme yöntemi tanımlanmalıdır.\n\n6. TATBİKAT VE GÖZDEN GEÇİRME\nTatbikat sonuçları, eksiklikler ve düzeltici faaliyetler planın revizyon girdisi olarak kullanılmalıdır.\n\nDORA NOTU: Bu içerik saha keşfi, bina/yerleşim bilgileri, acil durum senaryoları ve yetkili kişilerin doğrulaması olmadan nihai plan değildir. DORA yalnızca düzenlenebilir taslak üretmiştir.`
  };
  return null;
}


function isoDateOnly(v:any){
  if(v===null||v===undefined||v==="")return "";
  const n=Number(v);
  const d=Number.isFinite(n)&&n>1000000000 ? new Date(n>1000000000000?n:n*1000) : new Date(String(v));
  if(!Number.isFinite(d.getTime()))return "";
  return d.toISOString().slice(0,10);
}
async function agendaFollowupItems(supabase:any,companyId:string,kind:"HEALTH_AGENDA"|"PERIODIC_AGENDA"|"ENVIRONMENT_AGENDA"){
  if(kind==="HEALTH_AGENDA"){
    const {data:employees,error:empError}=await supabase.from("employees")
      .select("id,full_name,name,surname,job_title,department,active")
      .eq("firm_id",companyId);
    if(empError)throw empError;
    const active=(employees||[]).filter((x:any)=>x.active!==false);
    const ids=active.map((x:any)=>x.id).filter(Boolean);
    if(!ids.length)return [];
    const {data,error}=await supabase.from("health_examinations")
      .select("id,employee_id,exam_date,next_exam_date,is_deleted")
      .eq("company_id",companyId).eq("is_deleted",false).in("employee_id",ids).not("next_exam_date","is",null)
      .order("next_exam_date",{ascending:true});
    if(error)throw error;
    const byEmp=new Map<string,AnyRow>(active.map((x:any)=>[text(x.id),x as AnyRow]));
    const today=Date.now();
    const seen=new Set<string>();
    return (data||[]).filter((x:any)=>{
      const emp=text(x.employee_id);
      if(!emp||seen.has(emp))return false;
      const t=new Date(String(x.next_exam_date)).getTime();
      if(!Number.isFinite(t)||t>=today)return false;
      seen.add(emp);return true;
    }).map((x:any)=>{
      const e=byEmp.get(text(x.employee_id));
      return {
        key:`HEALTH:${x.id}`,id:text(x.id),kind:"HEALTH",employeeId:text(x.employee_id),
        title:`Sağlık Takibi • ${text(e?.full_name)||`${text(e?.name)} ${text(e?.surname)}`.trim()||"Çalışan"}`,
        detail:"Periyodik muayene yenileme tarihi geçmiş görünüyor. Tıbbi içerik Ajandaya taşınmaz.",
        dueDate:isoDateOnly(x.next_exam_date),location:"",assignedTo:text(e?.full_name)||`${text(e?.name)} ${text(e?.surname)}`.trim(),
        sourceUrl:`/admin/health/employees/${encodeURIComponent(text(x.employee_id))}?tab=Muayeneler`
      };
    }).slice(0,250);
  }
  if(kind==="PERIODIC_AGENDA"){
    const {data,error}=await supabase.from("periodic_control_equipments")
      .select("id,equipment_name,equipment_type,serial_no,location,next_due_millis,status,deleted")
      .eq("firm_id",companyId).eq("deleted",false).not("next_due_millis","is",null).order("next_due_millis",{ascending:true});
    if(error)throw error;
    const now=Date.now();
    return (data||[]).filter((x:any)=>Number(x.next_due_millis)<now).map((x:any)=>({
      key:`PERIODIC:${x.id}`,id:text(x.id),kind:"PERIODIC",
      title:`Periyodik Kontrol • ${text(x.equipment_name)||text(x.equipment_type)||"Ekipman"}`,
      detail:[text(x.equipment_type),text(x.serial_no)?`Seri: ${text(x.serial_no)}`:"",text(x.status)].filter(Boolean).join(" • "),
      dueDate:isoDateOnly(x.next_due_millis),location:text(x.location),assignedTo:"",
      sourceUrl:"/admin/documentation/periodic-controls"
    })).slice(0,250);
  }
  const {data,error}=await supabase.from("environment_measurements")
    .select("id,measurement_type,area_name,next_due_millis,measured_by,report_no,result_summary,status,deleted")
    .eq("firm_id",companyId).eq("deleted",false).not("next_due_millis","is",null).order("next_due_millis",{ascending:true});
  if(error)throw error;
  const now=Date.now();
  return (data||[]).filter((x:any)=>Number(x.next_due_millis)<now).map((x:any)=>({
    key:`ENV:${x.id}`,id:text(x.id),kind:"ENVIRONMENT",
    title:`Ortam Ölçümü Yenileme • ${text(x.measurement_type)||"Ölçüm"}`,
    detail:[text(x.result_summary),text(x.report_no)?`Rapor: ${text(x.report_no)}`:"",text(x.status)].filter(Boolean).join(" • "),
    dueDate:isoDateOnly(x.next_due_millis),location:text(x.area_name),assignedTo:text(x.measured_by),
    sourceUrl:"/admin/documentation/periodic-controls"
  })).slice(0,250);
}


function isExpiredMillis(v:any){
  const n=Number(v);
  return Number.isFinite(n)&&n>0&&n<Date.now();
}
function isClosedLike(v:any){
  const s=norm(v);
  return ["CLOSED","CLOSE","KAPALI","TAMAMLANDI","COMPLETED","ARCHIVED","IPTAL","CANCELLED"].includes(s);
}
async function subcontractorIssueOptions(supabase:any,companyId:string){
  const [companiesRes,employeesRes,docsRes,permitsRes]=await Promise.all([
    supabase.from("subcontractor_companies").select("*").eq("firm_id",companyId),
    supabase.from("subcontractor_employees").select("*").eq("firm_id",companyId),
    supabase.from("subcontractor_employee_documents").select("*").eq("firm_id",companyId),
    supabase.from("subcontractor_work_permits").select("*").eq("firm_id",companyId)
  ]);
  const firstError=companiesRes.error||employeesRes.error||docsRes.error||permitsRes.error;
  if(firstError)throw firstError;
  const companies=companiesRes.data||[], employees=employeesRes.data||[], docs=docsRes.data||[], permits=permitsRes.data||[];
  const compMap=new Map<string,AnyRow>(companies.map((x:any)=>[text(x.id),x as AnyRow]));
  const empMap=new Map<string,AnyRow>(employees.map((x:any)=>[text(x.id),x as AnyRow]));
  const items:any[]=[];
  for(const e of employees as AnyRow[]){
    if(e.is_deleted===true)continue;
    const company=compMap.get(text(e.company_id));
    const reasons:string[]=[];
    if(e.entry_permission===false)reasons.push("Sistem giriş uygunluğu: izin yok");
    const es=norm(e.employee_status);
    if(["GIRIS_ENGELLI","YASAKLI","BLOCKED","SUSPENDED"].includes(es))reasons.push(`Çalışan durumu: ${text(e.employee_status)}`);
    const checks:[string,string][]=[
      ["sgk_entry_ok","SGK giriş uygunluğu işareti eksik"],
      ["isg_training_ok","İSG eğitim uygunluğu işareti eksik"],
      ["health_report_ok","Sağlık raporu uygunluğu işareti eksik"],
      ["myk_certificate_ok","MYK uygunluğu işareti eksik"],
      ["kkd_delivery_ok","KKD teslim uygunluğu işareti eksik"],
      ["site_orientation_ok","Saha oryantasyonu uygunluğu işareti eksik"],
      ["work_at_height_ok","Yüksekte çalışma uygunluğu işareti eksik"],
    ];
    checks.forEach(([k,label])=>{if(e[k]===false)reasons.push(label)});
    if(reasons.length)items.push({
      key:`SUBEMP:${text(e.id)}`,kind:"EMPLOYEE",sourceId:text(e.id),companyId:text(e.company_id),
      title:`${text(e.full_name)||"Taşeron çalışan"} • ${text(company?.name)||text(company?.title)||"Taşeron firma"}`,
      detail:reasons.join(" • "),severity:e.entry_permission===false||["GIRIS_ENGELLI","YASAKLI","BLOCKED"].includes(es)?"HIGH":"MEDIUM",
      sourceUrl:"/admin/subcontractors"
    });
  }
  for(const d of docs as AnyRow[]){
    if(d.is_deleted===true||d.is_required===false)continue;
    const st=norm(d.status);
    const expired=isExpiredMillis(d.valid_until_millis)||["EXPIRED","SURESI_DOLMUS","SÜRESİ_DOLMUŞ"].includes(st);
    const missing=["MISSING","EKSIK","EKSİK","NOT_UPLOADED","YOK"].includes(st)||!text(d.file_url);
    if(!expired&&!missing)continue;
    const e=empMap.get(text(d.employee_id)); const company=compMap.get(text(d.company_id));
    items.push({
      key:`SUBDOC:${text(d.id)}`,kind:"DOCUMENT",sourceId:text(d.id),employeeId:text(d.employee_id),companyId:text(d.company_id),
      title:`${text(d.doc_title)||text(d.doc_key)||"Zorunlu evrak"} • ${text(e?.full_name)||"Taşeron çalışan"}`,
      detail:`${expired?"Süresi geçmiş":"Eksik / yüklenmemiş"} • ${text(company?.name)||text(company?.title)||"Taşeron firma"}`,
      severity:expired?"HIGH":"MEDIUM",sourceUrl:"/admin/subcontractors"
    });
  }
  for(const wp of permits as AnyRow[]){
    if(wp.is_deleted===true)continue;
    if(!isExpiredMillis(wp.end_millis)&&!isExpiredMillis(wp.endMillis))continue;
    if(isClosedLike(wp.status))continue;
    const e=empMap.get(text(wp.employee_id)); const company=compMap.get(text(wp.company_id));
    items.push({
      key:`SUBPERMIT:${text(wp.id)}`,kind:"PERMIT",sourceId:text(wp.id),employeeId:text(wp.employee_id),companyId:text(wp.company_id),
      title:`İş izni süresi geçmiş • ${text(wp.work_title)||text(wp.permit_type)||"İş izni"}`,
      detail:`${text(e?.full_name)||"Taşeron çalışan"} • ${text(company?.name)||text(company?.title)||"Taşeron firma"} • Alan: ${text(wp.work_area)||"-"}`,
      severity:"HIGH",sourceUrl:"/admin/subcontractors"
    });
  }
  return items.slice(0,300);
}
async function surveyFindingOptions(supabase:any,companyId:string){
  const [fRes,sRes,aRes]=await Promise.all([
    supabase.from("employee_survey_findings")
      .select("id,survey_id,question_id,severity,title,description,segment,negative_rate,response_count,status")
      .eq("firm_id",companyId).neq("status","CLOSED").order("negative_rate",{ascending:false}),
    supabase.from("employee_surveys").select("id,title,is_anonymous,minimum_anonymous_group_size").eq("firm_id",companyId),
    supabase.from("employee_survey_actions").select("id,finding_id,survey_id,status").eq("firm_id",companyId)
  ]);
  if(fRes.error)throw fRes.error;if(sRes.error)throw sRes.error;if(aRes.error)throw aRes.error;
  const surveys=new Map<string,AnyRow>((sRes.data||[]).map((x:any)=>[text(x.id),x as AnyRow]));
  const activeFindingIds=new Set((aRes.data||[]).filter((x:any)=>!isClosedLike(x.status)).map((x:any)=>text(x.finding_id)).filter(Boolean));
  return (fRes.data||[]).filter((x:any)=>!activeFindingIds.has(text(x.id))).map((x:any)=>{
    const s=surveys.get(text(x.survey_id));
    const anonymous=Boolean(s?.is_anonymous);
    const threshold=Math.max(5,Number(s?.minimum_anonymous_group_size||5));
    const count=Number(x.response_count||0);
    return {
      key:`SURVEY:${text(x.id)}`,id:text(x.id),surveyId:text(x.survey_id),
      title:text(x.title)||"Anket bulgusu",surveyTitle:text(s?.title)||"Anket",
      description:text(x.description),severity:text(x.severity)||"MEDIUM",
      negativeRate:Number(x.negative_rate||0),responseCount:count,
      privacyLocked:anonymous&&count<threshold,
      detail:anonymous&&count<threshold
        ? `Anonim gizlilik eşiği sağlanmadı (${count}/${threshold}). Kişi/segment ayrıntısı gösterilmez.`
        : `${count} yanıt • Olumsuz oran %${Number(x.negative_rate||0).toFixed(1)}`,
      sourceUrl:"/admin/documentation/employee-surveys"
    };
  }).slice(0,250);
}
async function cbsFollowupOptions(supabase:any,companyId:string){
  const {data,error}=await supabase.from("cbs_forms")
    .select("id,reference_no,message,category,category_code,priority,status,sla_due_at,assigned_to,resolution_note,created_at,updated_at")
    .eq("firm_id",companyId).order("created_at",{ascending:false});
  if(error)throw error;
  const now=Date.now();
  return (data||[]).filter((x:any)=>!isClosedLike(x.status)).map((x:any)=>{
    const sla=text(x.sla_due_at); const slaMs=sla?new Date(sla).getTime():NaN; const overdue=Number.isFinite(slaMs)&&slaMs<now;
    const pr=norm(x.priority);
    return {
      key:`CBS:${text(x.id)}`,id:text(x.id),
      title:`${text(x.reference_no)||"ÇBS kaydı"} • ${text(x.category)||text(x.category_code)||"Bildirim"}`,
      detail:[overdue?"SLA aşılmış":sla?"SLA aktif":"SLA tarihi yok",`Öncelik: ${text(x.priority)||"normal"}`,text(x.message).slice(0,220)].filter(Boolean).join(" • "),
      priority:text(x.priority)||"normal",status:text(x.status),slaDueAt:sla,overdue,
      sourceUrl:"/admin/cbs"
    };
  }).sort((a:any,b:any)=>Number(b.overdue)-Number(a.overdue)||(norm(b.priority)==="CRITICAL"?1:0)-(norm(a.priority)==="CRITICAL"?1:0)).slice(0,250);
}

async function buildExecutor(supabase:any,companyId:string,row:AnyRow){
  const kind=executorKindFor(row);
  const missingCount=missingCountFrom(row);
  if(kind==="EMERGENCY_SUPPORT_TEAM"){
    const c=await emergencyCandidates(supabase,companyId,row);
    if(!c.teamType)return {supported:false,kind:"",label:"Sadece öneri",candidates:[],requiredSelectionCount:0,requiresQualificationConfirmation:false};
    return {
      supported:true,kind,label:`${teamLabel(c.teamType)} ekibine çalışan ata`,
      teamType:c.teamType,candidates:c.candidates,
      requiredSelectionCount:missingCount||1,
      requiresQualificationConfirmation:c.teamType==="ILK_YARDIM",
      qualificationText:c.teamType==="ILK_YARDIM"?"Seçilen çalışanların geçerli ilkyardımcı sertifikası bulunduğunu kullanıcı doğrulamalıdır.":""
    };
  }
  if(kind==="EMPLOYEE_REPRESENTATIVE"){
    return {supported:true,kind,label:"Çalışan temsilcisi ata",candidates:await representativeCandidates(supabase,companyId),requiredSelectionCount:missingCount||1,requiresQualificationConfirmation:true,qualificationText:"Çalışan temsilcisinin belirlenme/atama usulünün işyeri kayıtları açısından uygun olduğunu kullanıcı doğrulamalıdır."};
  }
  if(kind==="ISG_BOARD_MEMBER"){
    const roles=parseBoardMissingRoles(row);
    return {supported:true,kind,label:"İSG Kurulu eksik rollerini tamamla",candidates:await boardCandidates(supabase,companyId),requiredSelectionCount:roles.length,boardRoles:roles,requiresQualificationConfirmation:true,qualificationText:"İşyerinde 50+ çalışan kriterine ek olarak işin 6 aydan fazla sürekli sürdüğü ve seçilen kurul rollerinin uygun olduğu kullanıcı tarafından doğrulanmalıdır."};
  }
  if(kind==="TRAINING_ASSIGNMENT"){
    return {supported:true,kind,label:"Çalışanlara eğitim ata",candidates:await trainingCandidates(supabase,companyId),trainings:await trainingOptions(supabase),requiredSelectionCount:0,allowAnySelectionCount:true,requiresTrainingSelection:true,requiresQualificationConfirmation:false};
  }
  if(kind==="RISK_DOF_ACTION"){
    return {
      supported:true,kind,label:"Riskler için kullanıcı onaylı DÖF / aksiyon aç",
      candidates:await trainingCandidates(supabase,companyId),
      riskItems:await riskDofOptions(supabase,companyId),
      requiredSelectionCount:1,
      requiresRiskSelection:true,
      requiresActionText:true,
      requiresDueDate:true,
      requiresQualificationConfirmation:false
    };
  }
  if(kind==="SUBCONTRACTOR_FOLLOWUP"){
    return {supported:true,kind,label:"Taşeron uygunsuzluklarını takip planına bağla",
      candidates:await trainingCandidates(supabase,companyId),issueItems:await subcontractorIssueOptions(supabase,companyId),
      requiredSelectionCount:1,requiresIssueSelection:true,requiresFollowupDate:true,requiresActionText:true,requiresQualificationConfirmation:false};
  }
  if(kind==="SURVEY_ACTION"){
    return {supported:true,kind,label:"Anket bulgularından gerçek aksiyon oluştur",
      candidates:await trainingCandidates(supabase,companyId),surveyFindings:await surveyFindingOptions(supabase,companyId),
      requiredSelectionCount:1,requiresSurveyFindingSelection:true,requiresDueDate:true,requiresActionText:true,requiresQualificationConfirmation:false};
  }
  if(kind==="CBS_FOLLOWUP"){
    return {supported:true,kind,label:"ÇBS kayıtlarını sorumluya ata ve takibe al",
      candidates:await trainingCandidates(supabase,companyId),cbsItems:await cbsFollowupOptions(supabase,companyId),
      requiredSelectionCount:1,requiresCbsSelection:true,requiresFollowupDate:true,requiresActionText:true,requiresQualificationConfirmation:false};
  }
  if(kind==="HEALTH_AGENDA" || kind==="PERIODIC_AGENDA" || kind==="ENVIRONMENT_AGENDA"){
    const items=await agendaFollowupItems(supabase,companyId,kind);
    return {
      supported:true,kind,
      label:kind==="HEALTH_AGENDA"?"Sağlık takiplerini Ajandaya planla":kind==="PERIODIC_AGENDA"?"Periyodik kontrol takiplerini Ajandaya planla":"Ortam ölçümü takiplerini Ajandaya planla",
      candidates:kind==="HEALTH_AGENDA"?[]:await trainingCandidates(supabase,companyId),
      agendaItems:items,requiredSelectionCount:kind==="HEALTH_AGENDA"?0:1,
      requiresAgendaItemSelection:true,requiresFollowupDate:true,
      requiresQualificationConfirmation:false
    };
  }
  if(kind==="DOCUMENT_DRAFT"){
    const info=await companyInfo(supabase,companyId);
    const draft=documentDraftFor(row,info);
    if(!draft)return {supported:false,kind:"",label:"Sadece öneri",candidates:[],requiredSelectionCount:0,requiresQualificationConfirmation:false};
    return {
      supported:true,kind,label:"Doküman taslağı oluştur ve Dokümantasyon'a kaydet",
      candidates:[],requiredSelectionCount:0,allowAnySelectionCount:false,
      requiresDocumentDraft:true,documentDraft:draft,requiresQualificationConfirmation:false
    };
  }
  return {supported:false,kind:"",label:"Sadece öneri",candidates:[],requiredSelectionCount:0,requiresQualificationConfirmation:false};
}
async function executionRecords(supabase:any,companyId:string,row:AnyRow){
  if(row?.status!=="COMPLETED") return [];
  const result=row?.execution_result||{};
  const ids=Array.isArray(result.employeeIds)?result.employeeIds.map((x:any)=>text(x)).filter(Boolean):[];
  if(result.executor==="SURVEY_ACTION"){
    const actionIds=Array.isArray(result.actionIds)?result.actionIds.map((x:any)=>text(x)).filter(Boolean):[];
    if(!actionIds.length)return [];
    const {data,error}=await supabase.from("employee_survey_actions")
      .select("id,finding_id,survey_id,title,description,owner_user_id,due_date,priority,status,created_at,updated_at")
      .eq("firm_id",companyId).in("id",actionIds);
    if(error)return []; return data||[];
  }
  if(result.executor==="CBS_FOLLOWUP"){
    const ids2=Array.isArray(result.cbsIds)?result.cbsIds.map((x:any)=>text(x)).filter(Boolean):[];
    if(!ids2.length)return [];
    const {data,error}=await supabase.from("cbs_forms")
      .select("id,reference_no,category,priority,status,sla_due_at,assigned_to,resolution_note,updated_at")
      .eq("firm_id",companyId).in("id",ids2);
    if(error)return []; return data||[];
  }
  if(result.executor==="SUBCONTRACTOR_FOLLOWUP"){
    const keys=Array.isArray(result.agendaSyncKeys)?result.agendaSyncKeys.map((x:any)=>text(x)).filter(Boolean):[];
    if(!keys.length)return [];
    const {data,error}=await supabase.from("ajanda_tasks")
      .select("id,sync_key,title,note,status,priority,type,category,due_at,assigned_employee_remote_id,assigned_to,module_ref,module_remote_id,source,created_at")
      .eq("web_firm_id",companyId).in("sync_key",keys).eq("is_deleted",false);
    if(error)return []; return data||[];
  }
  if(["HEALTH_AGENDA","PERIODIC_AGENDA","ENVIRONMENT_AGENDA"].includes(text(result.executor))){
    const keys=Array.isArray(result.agendaSyncKeys)?result.agendaSyncKeys.map((x:any)=>text(x)).filter(Boolean):[];
    if(!keys.length)return [];
    const {data,error}=await supabase.from("ajanda_tasks")
      .select("id,sync_key,title,note,status,priority,type,category,due_at,assigned_employee_remote_id,assigned_to,module_ref,module_remote_id,source,is_archived,is_deleted,created_at")
      .eq("web_firm_id",companyId).in("sync_key",keys).eq("is_deleted",false);
    if(error)return [];
    return data||[];
  }
  if(result.executor==="DOCUMENT_DRAFT"){
    const syncKey=text(result.documentSyncKey);
    if(!syncKey)return [];
    const {data,error}=await supabase.from("documentation_records")
      .select("id,sync_key,category,title,description,document_no,revision_no,prepared_by,approved_by,department,status,tags,notes,source,version,sync_status,created_at_millis,updated_at_millis")
      .eq("firm_id",companyId).eq("sync_key",syncKey).eq("is_deleted",false);
    if(error)return [];
    return data||[];
  }
  if(!ids.length) return [];

  if(result.executor==="EMERGENCY_SUPPORT_TEAM"){
    const q=supabase.from("emergency_support_teams").select("id,employee_id,full_name,team_type,team_role,duty,department,phone,certificate_info,signature_status,is_active,source,created_at")
      .eq("company_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    const {data,error}=await q;
    if(error) return [];
    return data||[];
  }

  if(result.executor==="EMPLOYEE_REPRESENTATIVE"){
    const {data,error}=await supabase.from("employee_representatives").select("id,employee_id,employee_name,department,job_title,representative_type,determination_method,is_head_representative,selection_date,duty_start_date,duty_end_date,status,source,created_at").eq("firm_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    if(error) return []; return data||[];
  }
  if(result.executor==="ISG_BOARD_MEMBER"){
    const {data,error}=await supabase.from("documentation_board_members").select("id,employee_id,full_name,title,department,board_role,is_active,source,created_at").eq("firm_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    if(error)return []; return data||[];
  }
  if(result.executor==="TRAINING_ASSIGNMENT"){
    const {data:users,error:userError}=await supabase.from("users").select("id,employee_id,full_name,email").in("employee_id",ids);
    if(userError)return []; const userIds=(users||[]).map((u:any)=>u.id); if(!userIds.length)return [];
    const {data:assignments,error:aError}=await supabase.from("training_assignments").select("id,user_id,training_id,status,created_at,completed_at").in("user_id",userIds).eq("training_id",result.trainingId);
    if(aError)return [];
    const userMap = new Map<string, AnyRow>(
      (users || []).map((u:any) => [text(u.id), u as AnyRow])
    );
    return (assignments || []).map((a:any) => {
      const linkedUser = userMap.get(text(a.user_id));
      return {
        ...a,
        employee_id: linkedUser?.employee_id ?? null,
        full_name: linkedUser?.full_name ?? null,
        email: linkedUser?.email ?? null,
        training_title: result.trainingTitle,
      };
    });
  }
  if(result.executor==="RISK_DOF_ACTION"){
    const refs=Array.isArray(result.riskRefs)?result.riskRefs:[];
    const matrixIds=refs.filter((x:any)=>x.kind==="MATRIX").map((x:any)=>x.id);
    const fineIds=refs.filter((x:any)=>x.kind==="FINE").map((x:any)=>x.id);
    const rows:any[]=[];
    if(matrixIds.length){
      const {data,error}=await supabase.from("risk_items").select("id,title,hazard,score,dof_status,dof_action,dof_responsible,dof_due_date_millis,updated_at").eq("company_id",companyId).in("id",matrixIds);
      if(!error)rows.push(...(data||[]).map((x:any)=>({...x,risk_type:"5x5"})));
    }
    if(fineIds.length){
      const {data,error}=await supabase.from("fine_kinney_risks").select("id,title,hazard,score,level,dof_status,dof_action,dof_responsible,dof_due_date_millis,updated_at").eq("company_id",companyId).in("id",fineIds);
      if(!error)rows.push(...(data||[]).map((x:any)=>({...x,risk_type:"FINE_KINNEY"})));
    }
    return rows;
  }
  return [];
}


export async function GET(req:NextRequest) {
  try {
    const supabase=getSupabase();
    const auth=await authorize(supabase,req.nextUrl.searchParams.get("companyId"));
    if(auth.error) return auth.error;
    const companyId=auth.companyId!;

    const {data,error}=await supabase.from("dora_action_queue").select("*")
      .eq("company_id",companyId).order("created_at",{ascending:false});
    if(error) throw error;

    const ids=(data||[]).map((x:any)=>text(x.id)).filter(Boolean);
    const auditMap=new Map<string,AnyRow[]>();
    if(ids.length){
      const auditRes=await supabase.from("dora_action_audit_logs")
        .select("id,action_id,event,from_status,to_status,actor_label,detail,created_at")
        .eq("company_id",companyId).in("action_id",ids).order("created_at",{ascending:false});
      if(!auditRes.error){
        for(const log of auditRes.data||[]){
          const key=text(log.action_id); const list=auditMap.get(key)||[];
          if(list.length<25)list.push(log); auditMap.set(key,list);
        }
      }
    }
    const enriched=[];
    for(const row of data||[]) {
      enriched.push({
        ...row,
        source_url:correctedSourceUrl(row),
        executor:await buildExecutor(supabase,companyId,row),
        target_records:await executionRecords(supabase,companyId,row),
        audit_logs:auditMap.get(text(row.id))||[]
      });
    }
    return NextResponse.json({ok:true,items:enriched});
  } catch(e:any) {
    return NextResponse.json({ok:false,error:e?.message||"DORA işlem kuyruğu okunamadı."},{status:500});
  }
}

export async function POST(req:NextRequest) {
  let failureSupabase:any=null;
  let failureCompanyId="";
  let failureActionId="";
  let failureCommand="";
  try {
    const body=await req.json();
    const supabase=getSupabase();
    failureSupabase=supabase;
    const auth=await authorize(supabase,body?.companyId);
    if(auth.error) return auth.error;
    const companyId=auth.companyId!;
    failureCompanyId=companyId;
    const command=norm(body?.command);
    failureCommand=command;

    if(command==="PREPARE") {
      const gaps=Array.isArray(body?.gaps)?body.gaps:[];
      if(!gaps.length) return NextResponse.json({ok:false,error:"İşleme hazırlanacak eksiklik bulunamadı."},{status:400});
      const normalized=gaps.slice(0,200).map((g:any)=>({
        company_id:companyId,
        source_gap_id:text(g.id)||crypto.randomUUID(),
        source_domain:text(g.domain)||"DORA",
        title:text(g.title)||"DORA bulgusu",
        description:text(g.summary),
        recommendation:text(g.recommendation),
        source_url:correctedSourceUrl({...g,source_url:g.sourceUrl}),
        severity:text(g.severity)||"MEDIUM",
        status:"WAITING_APPROVAL",
        requested_payload:g,
      }));

      // Tarama tekrarlandığında ONAYLANDI / TAMAMLANDI / ATLANDI kayıtlarını geriye döndürme.
      // Sadece kuyrukta henüz bulunmayan yeni DORA bulgularını ekle.
      const gapIds=normalized.map((x:any)=>x.source_gap_id).filter(Boolean);
      const {data:existing,error:existingError}=gapIds.length
        ? await supabase.from("dora_action_queue")
            .select("source_gap_id,status")
            .eq("company_id",companyId)
            .in("source_gap_id",gapIds)
        : {data:[],error:null};
      if(existingError)throw existingError;

      const existingIds=new Set((existing||[]).map((x:any)=>text(x.source_gap_id)));
      const rows=normalized.filter((x:any)=>!existingIds.has(x.source_gap_id));

      let inserted:any[]=[];
      if(rows.length){
        const ins=await supabase.from("dora_action_queue").insert(rows).select("*");
        if(ins.error)throw ins.error;
        inserted=ins.data||[];
      }

      return NextResponse.json({
        ok:true,command,
        items:inserted,
        inserted:inserted.length,
        alreadyQueued:normalized.length-inserted.length
      });
    }

    const id=text(body?.id);
    failureActionId=id;
    if(!id) return NextResponse.json({ok:false,error:"İşlem kimliği eksik."},{status:400});
    const {data:current,error:readError}=await supabase.from("dora_action_queue").select("*")
      .eq("id",id).eq("company_id",companyId).maybeSingle();
    if(readError) throw readError;
    if(!current) return NextResponse.json({ok:false,error:"DORA işlemi bulunamadı."},{status:404});

    if(command==="RETRY") {
      if(current.status!=="FAILED")
        return NextResponse.json({ok:false,error:"Yalnızca hata durumundaki işlem tekrar denenebilir."},{status:409});
      const retryCount=Math.max(0,Number(current.retry_count||0))+1;
      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"APPROVED",retry_count:retryCount,last_error:null,execution_note:"Kullanıcı işlemi tekrar denemek üzere yeniden onaylı duruma aldı."})
        .eq("id",id).eq("company_id",companyId).eq("status","FAILED").select("*").maybeSingle();
      if(error)throw error;
      if(!data)return NextResponse.json({ok:false,error:"İşlem durumu değişti; sayfayı yenileyin."},{status:409});
      return NextResponse.json({ok:true,command,item:data});
    }

    if(command==="APPROVE") {
      if(current.status!=="WAITING_APPROVAL")
        return NextResponse.json({ok:false,error:"Yalnızca onay bekleyen işlem onaylanabilir."},{status:409});

      const executor=await buildExecutor(supabase,companyId,current);
      const selectedIds=Array.isArray(body?.selectedEmployeeIds)?body.selectedEmployeeIds.map((x:any)=>text(x)).filter(Boolean):[];
      const qualificationConfirmed=body?.qualificationConfirmed===true;
      const selectedTrainingId=text(body?.selectedTrainingId);
      const roleAssignments=body?.roleAssignments&&typeof body.roleAssignments==="object"?body.roleAssignments:{};
      const selectedRiskKeys=Array.isArray(body?.selectedRiskKeys)?body.selectedRiskKeys.map((x:any)=>text(x)).filter(Boolean):[];
      const actionText=text(body?.actionText);
      const dueDate=text(body?.dueDate);
      const documentTitle=text(body?.documentTitle);
      const documentContent=text(body?.documentContent);
      const selectedAgendaKeys=Array.isArray(body?.selectedAgendaKeys)?body.selectedAgendaKeys.map((x:any)=>text(x)).filter(Boolean):[];
      const followupDate=text(body?.followupDate);
      const selectedIssueKeys=Array.isArray(body?.selectedIssueKeys)?body.selectedIssueKeys.map((x:any)=>text(x)).filter(Boolean):[];
      const selectedSurveyFindingKeys=Array.isArray(body?.selectedSurveyFindingKeys)?body.selectedSurveyFindingKeys.map((x:any)=>text(x)).filter(Boolean):[];
      const selectedCbsKeys=Array.isArray(body?.selectedCbsKeys)?body.selectedCbsKeys.map((x:any)=>text(x)).filter(Boolean):[];

      let approvalPayload=current.requested_payload||{};
      if(executor.supported){
        if(executor.allowAnySelectionCount){
          if(selectedIds.length<1)return NextResponse.json({ok:false,error:"En az bir çalışan seçilmelidir."},{status:400});
        }else if(selectedIds.length!==executor.requiredSelectionCount){
          return NextResponse.json({ok:false,error:`Bu işlem için ${executor.requiredSelectionCount} çalışan seçilmelidir.`},{status:400});
        }
        const allowed=new Set(executor.candidates.map((x:any)=>text(x.id)));
        if(selectedIds.some((x:string)=>!allowed.has(x)))
          return NextResponse.json({ok:false,error:"Seçilen çalışanlardan biri artık uygun aday listesinde değil."},{status:409});
        if(executor.requiresQualificationConfirmation&&!qualificationConfirmed)
          return NextResponse.json({ok:false,error:"Bu işlem için kullanıcı doğrulaması işaretlenmelidir."},{status:400});
        if(executor.requiresTrainingSelection){
          if(!selectedTrainingId)return NextResponse.json({ok:false,error:"Atanacak eğitim seçilmelidir."},{status:400});
          if(!(executor.trainings||[]).some((t:any)=>text(t.id)===selectedTrainingId))return NextResponse.json({ok:false,error:"Seçilen eğitim artık aktif katalogda bulunmuyor."},{status:409});
        }
        if(executor.kind==="ISG_BOARD_MEMBER"){
          const validRoles=new Set((executor.boardRoles||[]).map((x:any)=>text(x.key)));
          const chosen=[] as string[];
          for(const employeeId of selectedIds){
            const role=text(roleAssignments[employeeId]);
            if(!role||!validRoles.has(role))return NextResponse.json({ok:false,error:"Her seçilen çalışan için eksik kurul rollerinden biri seçilmelidir."},{status:400});
            chosen.push(role);
          }
          if(new Set(chosen).size!==chosen.length)return NextResponse.json({ok:false,error:"Aynı kurul rolü birden fazla çalışana atanamaz."},{status:400});
        }
        if(executor.kind==="RISK_DOF_ACTION"){
          if(selectedRiskKeys.length<1)return NextResponse.json({ok:false,error:"En az bir yüksek/kritik risk seçilmelidir."},{status:400});
          const allowedRisks=new Set((executor.riskItems||[]).map((x:any)=>text(x.key)));
          if(selectedRiskKeys.some((x:string)=>!allowedRisks.has(x)))return NextResponse.json({ok:false,error:"Seçilen risklerden biri artık yüksek/kritik risk listesinde değil."},{status:409});
          if(!actionText)return NextResponse.json({ok:false,error:"DÖF / aksiyon açıklaması zorunludur."},{status:400});
          if(!dueDate)return NextResponse.json({ok:false,error:"DÖF termin tarihi zorunludur."},{status:400});
          const dueMs=new Date(`${dueDate}T23:59:59`).getTime();
          if(!Number.isFinite(dueMs))return NextResponse.json({ok:false,error:"Termin tarihi geçersiz."},{status:400});
        }
        if(executor.kind==="DOCUMENT_DRAFT"){
          if(!documentTitle)return NextResponse.json({ok:false,error:"Doküman başlığı zorunludur."},{status:400});
          if(documentContent.length<80)return NextResponse.json({ok:false,error:"Doküman taslağı çok kısa. İçeriği kontrol edin."},{status:400});
        }
        if(executor.kind==="SUBCONTRACTOR_FOLLOWUP"){
          if(selectedIssueKeys.length<1)return NextResponse.json({ok:false,error:"Takibe alınacak en az bir taşeron uygunsuzluğu seçilmelidir."},{status:400});
          const allowed=new Set((executor.issueItems||[]).map((x:any)=>text(x.key)));
          if(selectedIssueKeys.some((x:string)=>!allowed.has(x)))return NextResponse.json({ok:false,error:"Seçilen taşeron bulgularından biri artık aktif değil."},{status:409});
          if(!followupDate)return NextResponse.json({ok:false,error:"Takip tarihi zorunludur."},{status:400});
          if(!actionText)return NextResponse.json({ok:false,error:"Takip aksiyonu açıklaması zorunludur."},{status:400});
        }
        if(executor.kind==="SURVEY_ACTION"){
          if(selectedSurveyFindingKeys.length<1)return NextResponse.json({ok:false,error:"Aksiyona dönüştürülecek en az bir anket bulgusu seçilmelidir."},{status:400});
          const allowed=new Set((executor.surveyFindings||[]).map((x:any)=>text(x.key)));
          if(selectedSurveyFindingKeys.some((x:string)=>!allowed.has(x)))return NextResponse.json({ok:false,error:"Seçilen anket bulgularından biri artık aksiyon listesinde değil."},{status:409});
          if(!dueDate)return NextResponse.json({ok:false,error:"Anket aksiyonu termin tarihi zorunludur."},{status:400});
          if(!actionText)return NextResponse.json({ok:false,error:"Anket aksiyonu açıklaması zorunludur."},{status:400});
        }
        if(executor.kind==="CBS_FOLLOWUP"){
          if(selectedCbsKeys.length<1)return NextResponse.json({ok:false,error:"Takibe alınacak en az bir ÇBS kaydı seçilmelidir."},{status:400});
          const allowed=new Set((executor.cbsItems||[]).map((x:any)=>text(x.key)));
          if(selectedCbsKeys.some((x:string)=>!allowed.has(x)))return NextResponse.json({ok:false,error:"Seçilen ÇBS kayıtlarından biri artık açık değil."},{status:409});
          if(!followupDate)return NextResponse.json({ok:false,error:"ÇBS takip tarihi zorunludur."},{status:400});
          if(!actionText)return NextResponse.json({ok:false,error:"ÇBS takip notu zorunludur."},{status:400});
        }
        if(["HEALTH_AGENDA","PERIODIC_AGENDA","ENVIRONMENT_AGENDA"].includes(executor.kind)){
          if(selectedAgendaKeys.length<1)return NextResponse.json({ok:false,error:"Ajandaya aktarılacak en az bir kayıt seçilmelidir."},{status:400});
          const allowed=new Set((executor.agendaItems||[]).map((x:any)=>text(x.key)));
          if(selectedAgendaKeys.some((x:string)=>!allowed.has(x)))return NextResponse.json({ok:false,error:"Seçilen takip kayıtlarından biri artık geçerli değil."},{status:409});
          if(!followupDate)return NextResponse.json({ok:false,error:"Takip tarihi zorunludur."},{status:400});
          const followMs=new Date(`${followupDate}T09:00:00`).getTime();
          if(!Number.isFinite(followMs))return NextResponse.json({ok:false,error:"Takip tarihi geçersiz."},{status:400});
          if(executor.kind!=="HEALTH_AGENDA"&&selectedIds.length!==1)return NextResponse.json({ok:false,error:"Bu takip işlemi için bir sorumlu çalışan seçilmelidir."},{status:400});
        }
        approvalPayload={...approvalPayload,dora_execution:{
          executor:executor.kind,teamType:executor.teamType||null,selectedEmployeeIds:selectedIds,
          selectedTrainingId:selectedTrainingId||null,roleAssignments,qualificationConfirmed,
          selectedRiskKeys,actionText,dueDate,
          documentTitle,documentContent,documentType:executor.documentDraft?.documentType||null,
          documentCategory:executor.documentDraft?.category||null,documentNoPrefix:executor.documentDraft?.documentNoPrefix||null,
          documentTags:executor.documentDraft?.tags||[],
          selectedAgendaKeys,followupDate,selectedIssueKeys,selectedSurveyFindingKeys,selectedCbsKeys,
          approvedAt:new Date().toISOString()
        }};
      }

      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"APPROVED",approved_at:new Date().toISOString(),requested_payload:approvalPayload,source_url:correctedSourceUrl(current),last_error:null})
        .eq("id",id).eq("company_id",companyId).eq("status","WAITING_APPROVAL").select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    if(command==="START") {
      if(current.status!=="APPROVED")
        return NextResponse.json({ok:false,error:"Kullanıcı onayı olmadan DORA işlemi başlatamaz."},{status:409});

      const exec=current.requested_payload?.dora_execution;
      if(!exec?.executor){
        const {data,error}=await supabase.from("dora_action_queue")
          .update({status:"STARTED",started_at:new Date().toISOString(),last_attempt_at:new Date().toISOString(),last_error:null,
            execution_note:"Kullanıcı Başla komutunu verdi. Bu bulgu için gerçek modül yürütücüsü henüz bağlı değil.",
            source_url:correctedSourceUrl(current)})
          .eq("id",id).eq("company_id",companyId).eq("status","APPROVED").select("*").single();
        if(error) throw error;
        return NextResponse.json({ok:true,command,item:data,moduleWritePerformed:false});
      }

      const selectedIds=(exec.selectedEmployeeIds||[]).map((x:any)=>text(x)).filter(Boolean);
      const employeeRequired=[
        "EMERGENCY_SUPPORT_TEAM","EMPLOYEE_REPRESENTATIVE","TRAINING_ASSIGNMENT","ISG_BOARD_MEMBER",
        "RISK_DOF_ACTION","SUBCONTRACTOR_FOLLOWUP","SURVEY_ACTION","CBS_FOLLOWUP",
        "PERIODIC_AGENDA","ENVIRONMENT_AGENDA"
      ].includes(text(exec.executor));
      if(employeeRequired&&!selectedIds.length)
        return NextResponse.json({ok:false,error:"Onaylı çalışan / sorumlu seçimi bulunamadı."},{status:409});

      let employees:AnyRow[]=[];
      if(selectedIds.length){
        const empRes=await supabase.from("employees").select("*")
          .eq("firm_id",companyId).in("id",selectedIds).eq("active",true);
        if(empRes.error) throw empRes.error;
        employees=empRes.data||[];
        if(employees.length!==selectedIds.length)
          return NextResponse.json({ok:false,error:"Onaylanan çalışanlardan biri artık aktif firma çalışanı değil."},{status:409});
      }

      const info=await companyInfo(supabase,companyId);
      const now=Date.now();
      const iso=new Date().toISOString();

      // Eşzamanlı iki BAŞLA isteğinin aynı işlemi iki kez yürütmesini engeller.
      const lock=await supabase.from("dora_action_queue").update({
        status:"STARTED",started_at:iso,last_attempt_at:iso,last_error:null
      }).eq("id",id).eq("company_id",companyId).eq("status","APPROVED").select("id,status").maybeSingle();
      if(lock.error)throw lock.error;
      if(!lock.data)return NextResponse.json({ok:false,error:"İşlem zaten başlatılmış veya durumu değişmiş. Sayfayı yenileyin."},{status:409});

      if(exec.executor==="EMERGENCY_SUPPORT_TEAM"){
        const teamType=text(exec.teamType);
        if(!teamType)return NextResponse.json({ok:false,error:"Acil durum ekip türü eksik."},{status:409});
        if(teamType==="ILK_YARDIM"&&exec.qualificationConfirmed!==true)
          return NextResponse.json({ok:false,error:"İlkyardımcı sertifika doğrulaması olmadan işlem yapılamaz."},{status:409});

        const rows=(employees||[]).map((e:any)=>({
          sync_key:`dora:${companyId}:emergency:${teamType}:${e.id}`,
          company_id:companyId,
          local_firm_id:info.localFirmId,
          employee_id:e.id,
          team_type:teamType,
          team_role:"EKIP_UYESI",
          full_name:employeeName(e),
          duty:"Acil durum destek elemanı",
          department:employeeDepartment(e),
          phone:employeePhone(e),
          certificate_info:teamType==="ILK_YARDIM"?"İlkyardımcı sertifikası kullanıcı tarafından doğrulandı":"DORA kullanıcı onaylı görevlendirme",
          assigned_date_millis:now,
          signature_status:"IMZA_BEKLIYOR",
          is_active:true,
          version:1,
          source:"WEB",
          sync_status:"SYNCED",
          sync_error:null,
          is_deleted:false,
          updated_at:iso,
          last_synced_at:iso,
        }));

        const keys=rows.map((r:any)=>r.sync_key);
        const {data:existing,error:existingError}=await supabase.from("emergency_support_teams").select("sync_key").in("sync_key",keys);
        if(existingError) throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const insertRows=rows.filter((r:any)=>!existingKeys.has(r.sync_key));
        let inserted:any[]=[];
        if(insertRows.length){
          const res=await supabase.from("emergency_support_teams").insert(insertRows).select("*");
          if(res.error)throw res.error;
          inserted=res.data||[];
        }

        const result={
          executor:"EMERGENCY_SUPPORT_TEAM",teamType,
          requested:selectedIds.length,inserted:inserted.length,
          alreadyExisting:rows.length-insertRows.length,
          employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))
        };
        const {data:done,error}=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${teamLabel(teamType)} ekibine ${inserted.length} çalışan kaydetti.`,
          execution_result:result,source_url:null
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(error)throw error;
        return NextResponse.json({ok:true,command,item:done,moduleWritePerformed:true,result});
      }

      if(exec.executor==="EMPLOYEE_REPRESENTATIVE"){
        if(exec.qualificationConfirmed!==true)
          return NextResponse.json({ok:false,error:"Çalışan temsilcisi belirleme usulü kullanıcı tarafından doğrulanmalıdır."},{status:409});

        const rows=(employees||[]).map((e:any)=>({
          sync_key:`dora:${companyId}:employee-representative:${e.id}`,
          firm_id:companyId,
          local_firm_id:info.localFirmId,
          web_firm_id:companyId,
          employee_id:e.id,
          employee_name:employeeName(e),
          department:employeeDepartment(e),
          job_title:text(e.job_title)||null,
          representative_type:"PRIMARY",
          determination_method:"APPOINTMENT",
          is_head_representative:false,
          selection_date:iso.slice(0,10),
          duty_start_date:iso.slice(0,10),
          status:"ACTIVE",
          note:"DORA Faz 2 kullanıcı onaylı atama. İşyerindeki belirleme/atama usulü kullanıcı tarafından doğrulandı.",
          source:"WEB",
          version:1,
          sync_status:"SYNCED",
          sync_error:null,
          last_synced_at_millis:now,
          is_deleted:false,
          updated_at_millis:now,
        }));

        const keys=rows.map((r:any)=>r.sync_key);
        const {data:existing,error:existingError}=await supabase.from("employee_representatives").select("sync_key").in("sync_key",keys);
        if(existingError)throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const insertRows=rows.filter((r:any)=>!existingKeys.has(r.sync_key));
        let inserted:any[]=[];
        if(insertRows.length){
          const res=await supabase.from("employee_representatives").insert(insertRows).select("*");
          if(res.error)throw res.error;
          inserted=res.data||[];
        }

        const result={
          executor:"EMPLOYEE_REPRESENTATIVE",requested:selectedIds.length,inserted:inserted.length,
          alreadyExisting:rows.length-insertRows.length,
          employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))
        };
        const {data:done,error}=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${inserted.length} çalışanı asıl çalışan temsilcisi olarak kaydetti.`,
          execution_result:result,source_url:"/admin/documentation/employee-representatives"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(error)throw error;
        return NextResponse.json({ok:true,command,item:done,moduleWritePerformed:true,result});
      }

      if(exec.executor==="ISG_BOARD_MEMBER"){
        if(exec.qualificationConfirmed!==true)return NextResponse.json({ok:false,error:"İSG Kurulu uygunluk doğrulaması olmadan işlem yapılamaz."},{status:409});
        const roleAssignments=exec.roleAssignments||{}; const info=await companyInfo(supabase,companyId); const nowMs=Date.now(); const nowIso=new Date().toISOString(); const endMs=nowMs+(2*365*24*60*60*1000);
        const rows=(employees||[]).map((e:any)=>{const role=text(roleAssignments[text(e.id)]); return {firm_id:companyId,local_firm_id:info.localFirmId,employee_id:e.id,remote_id:crypto.randomUUID(),web_firm_id:companyId,sync_key:`dora:${companyId}:board:${role}:${e.id}`,member_type:"EMPLOYEE",full_name:employeeName(e),organization_name:info.name,title:text(e.job_title)||role,department:employeeDepartment(e),board_role:role,email:text(e.email)||null,phone:employeePhone(e)==="-"?null:employeePhone(e),notes:"DORA Faz 2 kullanıcı onaylı İSG Kurulu görevlendirmesi.",has_voting_right:true,is_active:true,source:"WEB",version:1,sync_status:"SYNCED",sync_error:null,last_synced_at_millis:nowMs,is_deleted:false,created_at_millis:nowMs,updated_at_millis:nowMs,start_date_millis:nowMs,end_date_millis:endMs};});
        const keys=rows.map((x:any)=>x.sync_key); const ex=await supabase.from("documentation_board_members").select("sync_key").in("sync_key",keys); if(ex.error)throw ex.error; const existingKeys=new Set((ex.data||[]).map((x:any)=>text(x.sync_key))); const insertRows=rows.filter((x:any)=>!existingKeys.has(x.sync_key)); let inserted:any[]=[]; if(insertRows.length){const ins=await supabase.from("documentation_board_members").insert(insertRows).select("*"); if(ins.error)throw ins.error; inserted=ins.data||[];}
        const result={executor:"ISG_BOARD_MEMBER",requested:selectedIds.length,inserted:inserted.length,alreadyExisting:rows.length-insertRows.length,employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e)),roleAssignments};
        const done=await supabase.from("dora_action_queue").update({status:"COMPLETED",started_at:nowIso,completed_at:nowIso,execution_note:`DORA İSG Kurulu için ${inserted.length} kullanıcı onaylı üye/rol kaydı oluşturdu.`,execution_result:result,source_url:"/admin/documentation/board"}).eq("id",id).eq("company_id",companyId).select("*").single(); if(done.error)throw done.error; return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:true,result});
      }

      if(exec.executor==="SUBCONTRACTOR_FOLLOWUP"){
        const selectedKeys=Array.isArray(exec.selectedIssueKeys)?exec.selectedIssueKeys.map((x:any)=>text(x)).filter(Boolean):[];
        const followupDate=text(exec.followupDate); const action=text(exec.actionText);
        const allItems=await subcontractorIssueOptions(supabase,companyId);
        const selectedItems=allItems.filter((x:any)=>selectedKeys.includes(text(x.key)));
        if(!selectedItems.length)return NextResponse.json({ok:false,error:"Seçilen taşeron uygunsuzlukları artık bulunamadı."},{status:409});
        const responsible=(employees||[])[0];
        if(!responsible)return NextResponse.json({ok:false,error:"Onaylı sorumlu çalışan bulunamadı."},{status:409});
        const responsibleName=employeeName(responsible);
        const info=await companyInfo(supabase,companyId);
        if(!info.localFirmId)return NextResponse.json({ok:false,error:"Ajanda için şirket local_firm_id bilgisi bulunamadı."},{status:409});
        const followIso=new Date(`${followupDate}T09:00:00`).toISOString();
        const rows=selectedItems.map((item:any)=>({
          sync_key:`dora:${companyId}:subcontractor:${item.key}`,firm_id:Number(info.localFirmId),web_firm_id:companyId,
          title:`Taşeron Takibi • ${item.title}`,note:`${action}\n\nDORA tespiti: ${item.detail}`,
          status:0,priority:item.severity==="HIGH"?2:1,progress:0,type:"TASK",category:"SUBCONTRACTOR",
          due_at:followIso,end_at:null,completed_at:null,location:null,meeting_link:null,
          assigned_employee_local_id:null,assigned_employee_remote_id:text(responsible.id),assigned_to:responsibleName,
          assigned_by:"DORA AI İSG Asistanı",created_by_user_id:null,participants_csv:null,is_all_day:true,
          module_ref:"SUBCONTRACTOR_FOLLOWUP",module_ref_id:null,module_remote_id:item.sourceId,
          parent_task_id:null,parent_remote_id:null,remind_minutes_csv:"1440,180",remind_at:null,
          repeat_type:null,repeat_until:null,source:"WEB",is_archived:false,is_deleted:false,deleted_at:null,
          app_created_at:Date.now(),app_updated_at:Date.now()
        }));
        const keys=rows.map((x:any)=>x.sync_key);
        const {data:existing,error:existingError}=await supabase.from("ajanda_tasks").select("sync_key")
          .eq("web_firm_id",companyId).in("sync_key",keys).eq("is_deleted",false);
        if(existingError)throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const inserts=rows.filter((x:any)=>!existingKeys.has(x.sync_key));
        let inserted:any[]=[];
        if(inserts.length){const ins=await supabase.from("ajanda_tasks").insert(inserts).select("*");if(ins.error)throw ins.error;inserted=ins.data||[];}
        const result={executor:"SUBCONTRACTOR_FOLLOWUP",requested:selectedItems.length,inserted:inserted.length,
          alreadyExisting:rows.length-inserts.length,agendaSyncKeys:keys,employeeIds:[text(responsible.id)],
          employeeNames:[responsibleName],followupDate};
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${selectedItems.length} taşeron uygunsuzluğunu kullanıcı onayıyla takip planına bağladı. Kaynak taşeron kayıtları değiştirilmedi.`,
          execution_result:result,source_url:"/admin/subcontractors"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:inserted.length>0,result});
      }

      if(exec.executor==="SURVEY_ACTION"){
        const selectedKeys=Array.isArray(exec.selectedSurveyFindingKeys)?exec.selectedSurveyFindingKeys.map((x:any)=>text(x)).filter(Boolean):[];
        const action=text(exec.actionText); const dueDate=text(exec.dueDate);
        const all=await surveyFindingOptions(supabase,companyId);
        const selectedFindings=all.filter((x:any)=>selectedKeys.includes(text(x.key)));
        if(!selectedFindings.length)return NextResponse.json({ok:false,error:"Seçilen açık anket bulguları artık bulunamadı."},{status:409});
        const responsible=(employees||[])[0];
        if(!responsible)return NextResponse.json({ok:false,error:"Onaylı sorumlu çalışan bulunamadı."},{status:409});
        const responsibleName=employeeName(responsible);
        const {data:userRows,error:userError}=await supabase.from("users").select("id,employee_id")
          .eq("company_id",companyId).eq("employee_id",text(responsible.id)).limit(1);
        if(userError)throw userError;
        const ownerUserId=(userRows||[])[0]?.id||null;
        const payloads=selectedFindings.map((f:any)=>({
          firm_id:companyId,survey_id:f.surveyId,finding_id:f.id,
          title:`DORA Aksiyonu • ${f.title}`,description:`${action}\n\nKaynak bulgu: ${f.description||f.title}`,
          owner_user_id:ownerUserId,due_date:new Date(`${dueDate}T23:59:59`).toISOString(),
          priority:["CRITICAL","HIGH"].includes(norm(f.severity))?"HIGH":"MEDIUM",status:"OPEN",created_by:null
        }));
        const findingIds=selectedFindings.map((x:any)=>x.id);
        const {data:existing,error:existingError}=await supabase.from("employee_survey_actions")
          .select("id,finding_id").eq("firm_id",companyId).in("finding_id",findingIds);
        if(existingError)throw existingError;
        const existingFindingIds=new Set((existing||[]).map((x:any)=>text(x.finding_id)));
        const inserts=payloads.filter((x:any)=>!existingFindingIds.has(text(x.finding_id)));
        let inserted:any[]=[];
        if(inserts.length){
          const ins=await supabase.from("employee_survey_actions").insert(inserts)
            .select("id,finding_id,survey_id,title,description,owner_user_id,due_date,priority,status,created_at");
          if(ins.error)throw ins.error; inserted=ins.data||[];
        }
        const actionIds=[...(existing||[]).map((x:any)=>text(x.id)),...inserted.map((x:any)=>text(x.id))].filter(Boolean);
        const result={executor:"SURVEY_ACTION",requested:selectedFindings.length,inserted:inserted.length,
          alreadyExisting:payloads.length-inserts.length,actionIds,employeeIds:[text(responsible.id)],
          employeeNames:[responsibleName],ownerUserId,dueDate};
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${selectedFindings.length} açık anket bulgusunu kullanıcı onayıyla aksiyona dönüştürdü. Bulgular otomatik kapatılmadı.`,
          execution_result:result,source_url:"/admin/documentation/employee-surveys"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:inserted.length>0,result});
      }

      if(exec.executor==="CBS_FOLLOWUP"){
        const selectedKeys=Array.isArray(exec.selectedCbsKeys)?exec.selectedCbsKeys.map((x:any)=>text(x)).filter(Boolean):[];
        const action=text(exec.actionText); const followupDate=text(exec.followupDate);
        const all=await cbsFollowupOptions(supabase,companyId);
        const selectedItems=all.filter((x:any)=>selectedKeys.includes(text(x.key)));
        if(!selectedItems.length)return NextResponse.json({ok:false,error:"Seçilen açık ÇBS kayıtları artık bulunamadı."},{status:409});
        const responsible=(employees||[])[0];
        if(!responsible)return NextResponse.json({ok:false,error:"Onaylı sorumlu çalışan bulunamadı."},{status:409});
        const responsibleName=employeeName(responsible); const nowIso=new Date().toISOString();
        const cbsIds=selectedItems.map((x:any)=>x.id);
        const {data:currentRows,error:currentError}=await supabase.from("cbs_forms")
          .select("id,status,resolution_note").eq("firm_id",companyId).in("id",cbsIds);
        if(currentError)throw currentError;
        const openRows=(currentRows||[]).filter((x:any)=>!isClosedLike(x.status));
        const updated:any[]=[];
        for(const row of openRows){
          const note=[text(row.resolution_note),`DORA takip notu: ${action}`].filter(Boolean).join("\n");
          const upd=await supabase.from("cbs_forms").update({
            status:"processing",assigned_to:responsibleName,resolution_note:note,updated_at:nowIso
          }).eq("id",row.id).eq("firm_id",companyId).select("id,reference_no,category,priority,status,sla_due_at,assigned_to,resolution_note,updated_at").single();
          if(upd.error)throw upd.error; if(upd.data)updated.push(upd.data);
        }
        const info=await companyInfo(supabase,companyId);
        const followIso=new Date(`${followupDate}T09:00:00`).toISOString();
        const agendaRows=selectedItems.map((item:any)=>({
          sync_key:`dora:${companyId}:cbs:${item.id}`,firm_id:Number(info.localFirmId),web_firm_id:companyId,
          title:`ÇBS Takibi • ${item.title}`,note:`${action}\n${item.detail}`,status:0,priority:item.overdue?2:1,progress:0,
          type:"TASK",category:"CBS",due_at:followIso,end_at:null,completed_at:null,location:null,meeting_link:null,
          assigned_employee_local_id:null,assigned_employee_remote_id:text(responsible.id),assigned_to:responsibleName,
          assigned_by:"DORA AI İSG Asistanı",created_by_user_id:null,participants_csv:null,is_all_day:true,
          module_ref:"CBS_FOLLOWUP",module_ref_id:null,module_remote_id:item.id,parent_task_id:null,parent_remote_id:null,
          remind_minutes_csv:"1440,180",remind_at:null,repeat_type:null,repeat_until:null,source:"WEB",
          is_archived:false,is_deleted:false,deleted_at:null,app_created_at:Date.now(),app_updated_at:Date.now()
        }));
        let agendaKeys:string[]=[];
        if(info.localFirmId&&agendaRows.length){
          agendaKeys=agendaRows.map((x:any)=>x.sync_key);
          const ex=await supabase.from("ajanda_tasks").select("sync_key").eq("web_firm_id",companyId).in("sync_key",agendaKeys).eq("is_deleted",false);
          if(ex.error)throw ex.error;
          const exKeys=new Set((ex.data||[]).map((x:any)=>text(x.sync_key)));
          const inserts=agendaRows.filter((x:any)=>!exKeys.has(x.sync_key));
          if(inserts.length){const ins=await supabase.from("ajanda_tasks").insert(inserts);if(ins.error)throw ins.error;}
        }
        const result={executor:"CBS_FOLLOWUP",requested:selectedItems.length,updated:updated.length,cbsIds,
          agendaSyncKeys:agendaKeys,employeeIds:[text(responsible.id)],employeeNames:[responsibleName],followupDate};
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${updated.length} ÇBS kaydını kullanıcı onayıyla "processing" durumuna aldı, sorumlu atadı ve takip planına bağladı. Hiçbir kayıt otomatik kapatılmadı.`,
          execution_result:result,source_url:"/admin/cbs"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:updated.length>0,result});
      }

      if(["HEALTH_AGENDA","PERIODIC_AGENDA","ENVIRONMENT_AGENDA"].includes(text(exec.executor))){
        const kind=text(exec.executor) as "HEALTH_AGENDA"|"PERIODIC_AGENDA"|"ENVIRONMENT_AGENDA";
        const selectedKeys=Array.isArray(exec.selectedAgendaKeys)?exec.selectedAgendaKeys.map((x:any)=>text(x)).filter(Boolean):[];
        const followupDate=text(exec.followupDate);
        const followIso=new Date(`${followupDate}T09:00:00`).toISOString();
        const allItems=await agendaFollowupItems(supabase,companyId,kind);
        const selectedItems=allItems.filter((x:any)=>selectedKeys.includes(text(x.key)));
        if(!selectedItems.length)return NextResponse.json({ok:false,error:"Seçilen takip kayıtları artık bulunamadı."},{status:409});

        const info=await companyInfo(supabase,companyId);
        if(!info.localFirmId)return NextResponse.json({ok:false,error:"Ajanda için şirket local_firm_id bilgisi bulunamadı."},{status:409});

        const responsible=kind==="HEALTH_AGENDA"?null:(employees||[])[0];
        const responsibleName=responsible?employeeName(responsible):"";
        const rows=selectedItems.map((item:any)=>{
          const syncKey=`dora:${companyId}:agenda:${kind}:${item.id}`;
          const assignedEmployeeId=kind==="HEALTH_AGENDA"?text(item.employeeId):text(responsible?.id);
          const assignedTo=kind==="HEALTH_AGENDA"?text(item.assignedTo):responsibleName;
          return {
            sync_key:syncKey,firm_id:Number(info.localFirmId),web_firm_id:companyId,
            title:item.title,
            note:kind==="HEALTH_AGENDA"
              ?"DORA kullanıcı onaylı sağlık takip hatırlatması. Tıbbi içerik Ajandaya aktarılmamıştır."
              :`DORA kullanıcı onaylı takip kaydı. Kaynak son tarih: ${item.dueDate||"-"}. ${text(item.detail)}`.trim(),
            status:0,priority:2,progress:0,type:"REMINDER",
            category:kind==="HEALTH_AGENDA"?"HEALTH":kind==="PERIODIC_AGENDA"?"PERIODIC_CONTROL":"ENVIRONMENT_MEASUREMENT",
            due_at:followIso,end_at:null,completed_at:null,location:text(item.location)||null,meeting_link:null,
            assigned_employee_local_id:null,assigned_employee_remote_id:assignedEmployeeId||null,
            assigned_to:assignedTo||null,assigned_by:"DORA AI İSG Asistanı",created_by_user_id:null,
            participants_csv:null,is_all_day:true,
            module_ref:kind==="HEALTH_AGENDA"?"HEALTH_RENEWAL":kind==="PERIODIC_AGENDA"?"PERIODIC_CONTROL":"ENVIRONMENT_MEASUREMENT",
            module_ref_id:null,module_remote_id:item.id,parent_task_id:null,parent_remote_id:null,
            remind_minutes_csv:"1440,180",remind_at:null,repeat_type:null,repeat_until:null,
            source:"WEB",is_archived:false,is_deleted:false,deleted_at:null,
            app_created_at:Date.now(),app_updated_at:Date.now()
          };
        });

        const keys=rows.map((x:any)=>x.sync_key);
        const {data:existing,error:existingError}=await supabase.from("ajanda_tasks")
          .select("sync_key").eq("web_firm_id",companyId).in("sync_key",keys).eq("is_deleted",false);
        if(existingError)throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const inserts=rows.filter((x:any)=>!existingKeys.has(x.sync_key));
        let inserted:any[]=[];
        if(inserts.length){
          const ins=await supabase.from("ajanda_tasks").insert(inserts).select("*");
          if(ins.error)throw ins.error;
          inserted=ins.data||[];
        }
        const result={
          executor:kind,requested:selectedItems.length,inserted:inserted.length,
          alreadyExisting:rows.length-inserts.length,agendaSyncKeys:keys,
          employeeIds:responsible?[text(responsible.id)]:[],employeeNames:responsible?[responsibleName]:[],
          followupDate
        };
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${selectedItems.length} takip kaydını kullanıcı onayıyla Ajandaya planladı. Yeni kayıt: ${inserted.length}, mevcut: ${rows.length-inserts.length}.`,
          execution_result:result,source_url:"/admin/agenda"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:inserted.length>0,result});
      }

      if(exec.executor==="DOCUMENT_DRAFT"){
        const info=await companyInfo(supabase,companyId);
        const title=text(exec.documentTitle);
        const content=text(exec.documentContent);
        const documentType=text(exec.documentType);
        const category=text(exec.documentCategory)||"DOKUMAN";
        const prefix=text(exec.documentNoPrefix)||"DSEC-DOC";
        const tags=Array.isArray(exec.documentTags)?exec.documentTags.map((x:any)=>text(x)).filter(Boolean):["DORA","Taslak"];
        if(!title||content.length<80||!documentType)
          return NextResponse.json({ok:false,error:"Onaylı doküman taslağı bilgisi eksik."},{status:409});

        const syncKey=`dora:${companyId}:doc:${documentType}`;
        const {data:existing,error:existingError}=await supabase.from("documentation_records")
          .select("id,sync_key,title,status")
          .eq("firm_id",companyId).eq("sync_key",syncKey).eq("is_deleted",false).maybeSingle();
        if(existingError)throw existingError;

        let record:any=existing||null;
        let inserted=0;
        if(!record){
          const nowMs=Date.now();
          const docNo=`${prefix}-${new Date().getFullYear()}-${String(nowMs).slice(-6)}`;
          const ins=await supabase.from("documentation_records").insert({
            id:crypto.randomUUID(),sync_key:syncKey,firm_id:companyId,local_firm_id:info.localFirmId,
            category,title,description:content,document_no:docNo,revision_no:"R0",
            prepared_by:"DORA AI İSG Asistanı",approved_by:null,department:"İSG",
            published_at_millis:null,revision_date_millis:nowMs,status:"DRAFT",tags,
            notes:"DORA Faz 2 kullanıcı onayıyla oluşturulmuş TASLAK. Nihai yayın/onay işlemi Dokümantasyon modülünde yetkili kullanıcı tarafından yapılmalıdır.",
            read_approval_required:false,qr_enabled:false,source:"WEB",version:1,sync_status:"SYNCED",
            is_deleted:false,created_at_millis:nowMs,updated_at_millis:nowMs
          }).select("*").single();
          if(ins.error)throw ins.error;
          record=ins.data; inserted=1;
        }

        const result={
          executor:"DOCUMENT_DRAFT",inserted,alreadyExisting:inserted?0:1,
          documentId:text(record?.id),documentSyncKey:syncKey,documentType,
          documentTitle:text(record?.title)||title,status:text(record?.status)||"DRAFT",employeeIds:[],employeeNames:[]
        };
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:inserted?`DORA "${title}" dokümanını kullanıcı onayıyla TASLAK olarak Dokümantasyon'a kaydetti.`:`Aynı DORA doküman taslağı zaten Dokümantasyon'da mevcut; mükerrer kayıt oluşturulmadı.`,
          execution_result:result,source_url:"/admin/documentation"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:inserted===1,result});
      }

      if(exec.executor==="RISK_DOF_ACTION"){
        const riskKeys=Array.isArray(exec.selectedRiskKeys)?exec.selectedRiskKeys.map((x:any)=>text(x)).filter(Boolean):[];
        const action=text(exec.actionText);
        const dueDate=text(exec.dueDate);
        const dueMs=new Date(`${dueDate}T23:59:59`).getTime();
        if(!riskKeys.length||!action||!Number.isFinite(dueMs))
          return NextResponse.json({ok:false,error:"Onaylı risk, aksiyon veya termin bilgisi eksik."},{status:409});

        const responsible=(employees||[])[0];
        if(!responsible)return NextResponse.json({ok:false,error:"Onaylı sorumlu çalışan bulunamadı."},{status:409});
        const responsibleName=employeeName(responsible);
        const matrixIds=riskKeys.filter((x:string)=>x.startsWith("MATRIX:")).map((x:string)=>x.slice(7));
        const fineIds=riskKeys.filter((x:string)=>x.startsWith("FINE:")).map((x:string)=>x.slice(5));
        const note=`DORA Faz 2 kullanıcı onaylı risk aksiyonu. Sorumlu çalışan ID: ${text(responsible.id)}.`;
        let updatedMatrix:any[]=[]; let updatedFine:any[]=[];

        if(matrixIds.length){
          const upd=await supabase.from("risk_items").update({
            dof_status:"OPEN",dof_action:action,dof_responsible:responsibleName,
            dof_due_date_millis:dueMs,dof_closed_at_millis:null,dof_note:note,
            source:"WEB",sync_status:"SYNCED",sync_error:null,last_synced_at:iso,updated_at:iso
          }).eq("company_id",companyId).eq("is_deleted",false).in("id",matrixIds)
            .select("id,title,hazard,score,dof_status,dof_action,dof_responsible,dof_due_date_millis");
          if(upd.error)throw upd.error;
          updatedMatrix=upd.data||[];
        }
        if(fineIds.length){
          const upd=await supabase.from("fine_kinney_risks").update({
            dof_status:"OPEN",dof_action:action,dof_responsible:responsibleName,
            dof_due_date_millis:dueMs,dof_closed_at_millis:null,dof_note:note,
            source:"WEB",sync_status:"SYNCED",sync_error:null,last_synced_at:iso,updated_at:iso
          }).eq("company_id",companyId).eq("is_deleted",false).in("id",fineIds)
            .select("id,title,hazard,score,level,dof_status,dof_action,dof_responsible,dof_due_date_millis");
          if(upd.error)throw upd.error;
          updatedFine=upd.data||[];
        }

        const riskRefs=[
          ...updatedMatrix.map((x:any)=>({kind:"MATRIX",id:text(x.id),title:text(x.title)||text(x.hazard)})),
          ...updatedFine.map((x:any)=>({kind:"FINE",id:text(x.id),title:text(x.title)||text(x.hazard)}))
        ];
        const result={
          executor:"RISK_DOF_ACTION",requested:riskKeys.length,updated:riskRefs.length,
          riskRefs,actionText:action,dueDate,responsibleEmployeeId:text(responsible.id),
          responsibleName,employeeIds:[text(responsible.id)],employeeNames:[responsibleName]
        };
        const done=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${riskRefs.length} yüksek/kritik risk için kullanıcı onaylı DÖF/aksiyon açtı. Sorumlu: ${responsibleName}. Termin: ${dueDate}.`,
          execution_result:result,source_url:"/admin/risk"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(done.error)throw done.error;
        return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:true,result});
      }

      if(exec.executor==="TRAINING_ASSIGNMENT"){
        const trainingId=text(exec.selectedTrainingId); if(!trainingId)return NextResponse.json({ok:false,error:"Onaylı eğitim seçimi bulunamadı."},{status:409});
        const cookie=req.headers.get("cookie")||""; const commonHeaders:Record<string,string>={"content-type":"application/json"}; if(cookie)commonHeaders.cookie=cookie;
        const linkRes=await fetch(`${req.nextUrl.origin}/api/admin/training-users/link-employees`,{method:"POST",headers:commonHeaders,body:JSON.stringify({employeeIds:selectedIds,companyId})}); const linkJson=await linkRes.json().catch(()=>({})); if(!linkRes.ok)throw new Error(linkJson?.error||"Çalışanlar eğitim kullanıcısına bağlanamadı.");
        const assignRes=await fetch(`${req.nextUrl.origin}/api/training/assign`,{method:"POST",headers:commonHeaders,body:JSON.stringify({employeeIds:selectedIds,trainingId,companyId})}); const assignJson=await assignRes.json().catch(()=>({})); if(!assignRes.ok)throw new Error(assignJson?.error||"Eğitim ataması başarısız.");
        const nowIso=new Date().toISOString(); const result={executor:"TRAINING_ASSIGNMENT",trainingId,trainingTitle:text(assignJson?.trainingTitle)||"Eğitim",requested:selectedIds.length,inserted:Number(assignJson?.insertedCount||0),skipped:Number(assignJson?.skippedCount||0),emailed:Number(assignJson?.emailedCount||0),employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))};
        const done=await supabase.from("dora_action_queue").update({status:"COMPLETED",started_at:nowIso,completed_at:nowIso,execution_note:`DORA "${result.trainingTitle}" eğitimini kullanıcı onayıyla ${selectedIds.length} çalışana işledi. Yeni atama: ${result.inserted}, zaten atanmış: ${result.skipped}.`,execution_result:result,source_url:"/admin/trainings"}).eq("id",id).eq("company_id",companyId).select("*").single(); if(done.error)throw done.error; return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:true,result});
      }

      return NextResponse.json({ok:false,error:"Bu işlem türü için yürütücü bulunamadı."},{status:400});
    }

    if(command==="SKIP") {
      if(!["WAITING_APPROVAL","APPROVED","FAILED"].includes(text(current.status)))
        return NextResponse.json({ok:false,error:"Bu işlem artık atlanamaz."},{status:409});
      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"SKIPPED",skipped_at:new Date().toISOString(),source_url:correctedSourceUrl(current)})
        .eq("id",id).eq("company_id",companyId).in("status",["WAITING_APPROVAL","APPROVED","FAILED"]).select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    return NextResponse.json({ok:false,error:"Geçersiz DORA komutu."},{status:400});
  } catch(e:any) {
    const message=e?.message||"DORA Faz 2 işlemi başarısız.";
    if(failureSupabase&&failureCompanyId&&failureActionId&&failureCommand==="START"){
      try{
        const cur=await failureSupabase.from("dora_action_queue").select("status")
          .eq("id",failureActionId).eq("company_id",failureCompanyId).maybeSingle();
        if(cur.data&&["STARTED","APPROVED"].includes(text(cur.data.status))){
          await failureSupabase.from("dora_action_queue").update({
            status:"FAILED",last_error:message,last_attempt_at:new Date().toISOString(),
            execution_note:`DORA yürütme hatası: ${message}`
          }).eq("id",failureActionId).eq("company_id",failureCompanyId).in("status",["STARTED","APPROVED"]);
        }
      }catch{}
    }
    return NextResponse.json({ok:false,error:message},{status:500});
  }
}
