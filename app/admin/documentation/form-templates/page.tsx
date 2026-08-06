"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, BookOpen, CheckCircle2, FilePlus2, FileText,
  Filter, Loader2, Pencil, Plus, RefreshCw, Search,
  ShieldCheck, Trash2, X
} from "lucide-react";

type Status = "DRAFT" | "PUBLISHED" | "PASSIVE" | "REVISION";
type Category = "ALL" | "EK2" | "EK1" | "HEALTH" | "OHS" |
  "EMPLOYEE" | "TRAINING" | "EMERGENCY" | "PPE" | "OTHER";

type RecordRow = {
  id: string;
  company_id: string | null;
  template_code: string;
  title: string;
  short_title: string | null;
  category: Exclude<Category, "ALL">;
  form_type: string;
  source_module: string;
  target_module: string | null;
  description: string | null;
  legal_basis: string | null;
  version_no: number;
  revision_no: number;
  schema_json: Record<string, unknown> | null;
  sections_json: unknown[] | null;
  fields_json: unknown[] | null;
  status: Status;
  is_system: boolean;
  is_active: boolean;
  is_deleted: boolean;
  updated_at: string;
};

type ApiResponse = {
  success?: boolean;
  records?: RecordRow[];
  record?: RecordRow;
  error?: string;
  detail?: string;
};

type FormState = {
  id: string;
  companyId: string;
  templateCode: string;
  title: string;
  shortTitle: string;
  category: Exclude<Category, "ALL">;
  formType: string;
  targetModule: string;
  description: string;
  legalBasis: string;
  versionNo: number;
  revisionNo: number;
  status: Status;
  schemaJson: string;
  sectionsJson: string;
  fieldsJson: string;
};

const EMPTY: FormState = {
  id: "", companyId: "", templateCode: "", title: "", shortTitle: "",
  category: "OTHER", formType: "STANDARD", targetModule: "",
  description: "", legalBasis: "", versionNo: 1, revisionNo: 0,
  status: "PUBLISHED", schemaJson: "{}", sectionsJson: "[]", fieldsJson: "[]"
};

const clean = (v: unknown) => String(v ?? "").trim();

const categoryLabel = (v: Exclude<Category, "ALL">) => ({
  EK2: "Ek-2", EK1: "Ek-1", HEALTH: "Sağlık Formları",
  OHS: "İSG Formları", EMPLOYEE: "Çalışan Formları",
  TRAINING: "Eğitim Formları", EMERGENCY: "Acil Durum Formları",
  PPE: "KKD Formları", OTHER: "Diğer Formlar"
}[v]);

const statusLabel = (v: Status) => ({
  DRAFT: "Taslak", PUBLISHED: "Yayında", PASSIVE: "Pasif", REVISION: "Revizyonda"
}[v]);

function parseObject(text: string) {
  const parsed = JSON.parse(text || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Şema JSON nesne biçiminde olmalıdır.");
  }
  return parsed;
}

function parseArray(text: string, label: string) {
  const parsed = JSON.parse(text || "[]");
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} JSON dizi biçiminde olmalıdır.`);
  }
  return parsed;
}

export default function FormTemplatesPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("ALL");
  const [status, setStatus] = useState<"ALL" | Status>("ALL");
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/documentation/form-templates", {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const json = await response.json().catch(() => ({})) as ApiResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.detail || json.error || "Form şablonları alınamadı.");
      }
      setRecords(Array.isArray(json.records) ? json.records : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Form şablonları alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return records.filter((r) => {
      const haystack = [
        r.template_code, r.title, r.short_title, r.description,
        r.legal_basis, r.target_module
      ].join(" ").toLocaleLowerCase("tr-TR");
      return (!q || haystack.includes(q)) &&
        (category === "ALL" || r.category === category) &&
        (status === "ALL" || r.status === status);
    });
  }, [records, search, category, status]);

  const totals = useMemo(() => ({
    total: records.length,
    published: records.filter(r => r.status === "PUBLISHED").length,
    draft: records.filter(r => r.status === "DRAFT").length,
    revision: records.filter(r => r.status === "REVISION").length,
    system: records.filter(r => r.is_system).length,
    ek2: records.filter(r => r.category === "EK2").length
  }), [records]);

  const openEdit = (r: RecordRow) => {
    setForm({
      id: r.id,
      companyId: r.company_id || "",
      templateCode: r.template_code,
      title: r.title,
      shortTitle: r.short_title || "",
      category: r.category,
      formType: r.form_type,
      targetModule: r.target_module || "",
      description: r.description || "",
      legalBasis: r.legal_basis || "",
      versionNo: Number(r.version_no || 1),
      revisionNo: Number(r.revision_no || 0),
      status: r.status,
      schemaJson: JSON.stringify(r.schema_json || {}, null, 2),
      sectionsJson: JSON.stringify(r.sections_json || [], null, 2),
      fieldsJson: JSON.stringify(r.fields_json || [], null, 2)
    });
    setError("");
    setMessage("");
    setShowEditor(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.templateCode.trim()) throw new Error("Şablon kodu zorunludur.");
      if (!form.title.trim()) throw new Error("Form başlığı zorunludur.");
      if (!form.shortTitle.trim()) throw new Error("Kısa başlık zorunludur.");

      const payload = {
        id: form.id || undefined,
        companyId: form.companyId || null,
        templateCode: form.templateCode.trim().toUpperCase(),
        title: form.title.trim(),
        shortTitle: form.shortTitle.trim(),
        category: form.category,
        formType: form.formType.trim() || "STANDARD",
        targetModule: form.targetModule.trim() || null,
        description: form.description.trim() || null,
        legalBasis: form.legalBasis.trim() || null,
        versionNo: Math.max(1, Number(form.versionNo || 1)),
        revisionNo: Math.max(0, Number(form.revisionNo || 0)),
        status: form.status,
        schemaJson: parseObject(form.schemaJson),
        sectionsJson: parseArray(form.sectionsJson, "Bölümler"),
        fieldsJson: parseArray(form.fieldsJson, "Alanlar")
      };

      const response = await fetch("/api/admin/documentation/form-templates", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json().catch(() => ({})) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.detail || json.error || "Form şablonu kaydedilemedi.");
      }

      setShowEditor(false);
      setForm(EMPTY);
      setMessage(form.id ? "Form şablonu güncellendi." : "Yeni boş form şablonu oluşturuldu.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Form şablonu kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: RecordRow) => {
    if (r.is_system) {
      setError("Sistem şablonları silinemez. Gerekirse pasif duruma alınmalıdır.");
      return;
    }
    if (!window.confirm(`"${r.short_title || r.title}" şablonu silinsin mi?`)) return;

    try {
      setDeletingId(r.id);
      setError("");
      const response = await fetch(
        `/api/admin/documentation/form-templates?id=${encodeURIComponent(r.id)}`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );
      const json = await response.json().catch(() => ({})) as ApiResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.detail || json.error || "Form şablonu silinemedi.");
      }
      setMessage("Form şablonu arşivden kaldırıldı.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Form şablonu silinemedi.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main style={s.page}>
      <section style={s.hero}>
        <div>
          <div style={s.badge}><BookOpen size={16}/> D-SEC Dokümantasyon</div>
          <h1 style={s.heroTitle}>Formlar ve Şablonlar</h1>
          <p style={s.heroText}>
            Denetim formları dışındaki boş form şablonlarını merkezi olarak yönetin.
            Bu alan doldurulmuş veya uygulanmış form kayıtlarını saklamaz.
          </p>
        </div>

        <button type="button" onClick={() => {
          setForm(EMPTY);
          setError("");
          setMessage("");
          setShowEditor(true);
        }} style={s.heroButton}>
          <Plus size={17}/> Yeni Boş Şablon
        </button>

        <div className="kpiGrid" style={s.kpiGrid}>
          {[
            ["Toplam Şablon", totals.total, <Archive size={17}/>],
            ["Yayında", totals.published, <CheckCircle2 size={17}/>],
            ["Taslak", totals.draft, <FileText size={17}/>],
            ["Revizyonda", totals.revision, <RefreshCw size={17}/>],
            ["Sistem Şablonu", totals.system, <ShieldCheck size={17}/>],
            ["Ek-2 Şablonu", totals.ek2, <FileText size={17}/>]
          ].map(([label, value, icon]) => (
            <div key={String(label)} style={s.kpiCard}>
              <div style={s.kpiLabel}>{icon}{label}</div>
              <div style={s.kpiValue}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {error ? <div style={s.error}><X size={17}/>{error}</div> : null}
      {message ? <div style={s.success}><CheckCircle2 size={17}/>{message}</div> : null}

      <section style={s.filters}>
        <div style={s.searchWrap}>
          <Search size={17} style={s.searchIcon}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Şablon adı, kodu, açıklaması veya mevzuat ara..."
            style={s.input}
          />
        </div>

        <select value={category} onChange={e => setCategory(e.target.value as Category)} style={s.select}>
          <option value="ALL">Tüm Kategoriler</option>
          <option value="EK2">Ek-2</option>
          <option value="EK1">Ek-1</option>
          <option value="HEALTH">Sağlık Formları</option>
          <option value="OHS">İSG Formları</option>
          <option value="EMPLOYEE">Çalışan Formları</option>
          <option value="TRAINING">Eğitim Formları</option>
          <option value="EMERGENCY">Acil Durum Formları</option>
          <option value="PPE">KKD Formları</option>
          <option value="OTHER">Diğer Formlar</option>
        </select>

        <select value={status} onChange={e => setStatus(e.target.value as "ALL" | Status)} style={s.select}>
          <option value="ALL">Tüm Durumlar</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="DRAFT">Taslak</option>
          <option value="REVISION">Revizyonda</option>
          <option value="PASSIVE">Pasif</option>
        </select>

        <button type="button" onClick={() => {
          setSearch(""); setCategory("ALL"); setStatus("ALL");
        }} style={s.secondaryButton}>
          <Filter size={16}/> Temizle
        </button>

        <button type="button" onClick={() => void load()} disabled={loading} style={s.secondaryButton}>
          {loading ? <Loader2 size={16} className="spin"/> : <RefreshCw size={16}/>}
          Yenile
        </button>
      </section>

      <section>
        <div style={s.sectionHeader}>
          <div>
            <h2 style={s.sectionTitle}>Boş Form Şablonları</h2>
            <p style={s.sectionText}>
              Sağlık ve diğer modüllerin kaynak olarak kullandığı boş form şablonları.
            </p>
          </div>
          <span style={s.count}>{filtered.length} kayıt</span>
        </div>

        {loading ? (
          <div style={s.loading}><Loader2 size={30} className="spin"/></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>Form şablonu bulunamadı.</div>
        ) : (
          <div style={s.cards}>
            {filtered.map(r => (
              <article key={r.id} style={s.card}>
                <div style={s.cardTop}>
                  <div style={{minWidth: 0}}>
                    <div style={s.codeRow}>
                      <span style={s.code}>{r.template_code}</span>
                      {r.is_system ? <span style={s.system}>Sistem</span> : null}
                    </div>
                    <h3 style={s.cardTitle}>{r.short_title || r.title}</h3>
                    <p style={s.cardText}>{r.description || "Boş form şablonu"}</p>
                  </div>

                  <span style={{
                    ...s.status,
                    background: r.status === "PUBLISHED" ? "#dcfce7" :
                      r.status === "REVISION" ? "#fef3c7" :
                      r.status === "DRAFT" ? "#f1f5f9" : "#fee2e2",
                    color: r.status === "PUBLISHED" ? "#166534" :
                      r.status === "REVISION" ? "#92400e" :
                      r.status === "DRAFT" ? "#475569" : "#991b1b"
                  }}>
                    {statusLabel(r.status)}
                  </span>
                </div>

                <div style={s.metaGrid}>
                  {[
                    ["Kategori", categoryLabel(r.category)],
                    ["Hedef Modül", r.target_module || "-"],
                    ["Versiyon", `v${r.version_no}`],
                    ["Revizyon", `Rev. ${r.revision_no}`]
                  ].map(([label, value]) => (
                    <div key={label} style={s.meta}>
                      <div style={s.metaLabel}>{label}</div>
                      <div style={s.metaValue}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={s.legal}>
                  <div style={s.metaLabel}>MEVZUAT / DAYANAK</div>
                  <div style={s.legalText}>{r.legal_basis || "Belirtilmedi"}</div>
                </div>

                <div style={s.actions}>
                  <button type="button" onClick={() => openEdit(r)} style={s.editButton}>
                    <Pencil size={14}/> Düzenle
                  </button>

                  {!r.is_system ? (
                    <button
                      type="button"
                      onClick={() => void remove(r)}
                      disabled={deletingId === r.id}
                      style={s.deleteButton}
                    >
                      {deletingId === r.id
                        ? <Loader2 size={15} className="spin"/>
                        : <Trash2 size={15}/>}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showEditor ? (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>
                  {form.id ? "Form Şablonunu Düzenle" : "Yeni Boş Form Şablonu"}
                </h2>
                <p style={s.modalText}>Bu ekran yalnızca boş şablon tanımlarını yönetir.</p>
              </div>
              <button type="button" onClick={() => setShowEditor(false)} disabled={saving} style={s.close}>
                <X size={18}/>
              </button>
            </div>

            <div className="editorGrid" style={s.editorGrid}>
              <Field label="Şablon Kodu" value={form.templateCode}
                disabled={Boolean(form.id)}
                onChange={v => setForm(c => ({...c, templateCode: v.toUpperCase()}))}/>
              <Field label="Kısa Başlık" value={form.shortTitle}
                onChange={v => setForm(c => ({...c, shortTitle: v}))}/>
              <Field label="Tam Başlık" value={form.title} full
                onChange={v => setForm(c => ({...c, title: v}))}/>

              <SelectField label="Kategori" value={form.category}
                options={[
                  ["EK2","Ek-2"],["EK1","Ek-1"],["HEALTH","Sağlık"],
                  ["OHS","İSG"],["EMPLOYEE","Çalışan"],["TRAINING","Eğitim"],
                  ["EMERGENCY","Acil Durum"],["PPE","KKD"],["OTHER","Diğer"]
                ]}
                onChange={v => setForm(c => ({...c, category: v as Exclude<Category,"ALL">}))}/>

              <Field label="Form Tipi" value={form.formType}
                onChange={v => setForm(c => ({...c, formType: v}))}/>
              <Field label="Hedef Modül" value={form.targetModule}
                placeholder="Örn. HEALTH"
                onChange={v => setForm(c => ({...c, targetModule: v.toUpperCase()}))}/>

              <SelectField label="Durum" value={form.status}
                options={[
                  ["PUBLISHED","Yayında"],["DRAFT","Taslak"],
                  ["REVISION","Revizyonda"],["PASSIVE","Pasif"]
                ]}
                onChange={v => setForm(c => ({...c, status: v as Status}))}/>

              <NumberField label="Versiyon" value={form.versionNo} min={1}
                onChange={v => setForm(c => ({...c, versionNo: v}))}/>
              <NumberField label="Revizyon" value={form.revisionNo} min={0}
                onChange={v => setForm(c => ({...c, revisionNo: v}))}/>

              <TextArea label="Açıklama" value={form.description} full
                onChange={v => setForm(c => ({...c, description: v}))}/>
              <TextArea label="Mevzuat / Yasal Dayanak" value={form.legalBasis} full
                onChange={v => setForm(c => ({...c, legalBasis: v}))}/>
              <TextArea label="Şema JSON" value={form.schemaJson} code full
                onChange={v => setForm(c => ({...c, schemaJson: v}))}/>
              <TextArea label="Bölümler JSON" value={form.sectionsJson} code full
                onChange={v => setForm(c => ({...c, sectionsJson: v}))}/>
              <TextArea label="Alanlar JSON" value={form.fieldsJson} code full
                onChange={v => setForm(c => ({...c, fieldsJson: v}))}/>
            </div>

            <div style={s.modalFooter}>
              <button type="button" onClick={() => setShowEditor(false)}
                disabled={saving} style={s.secondaryButton}>Vazgeç</button>
              <button type="button" onClick={() => void save()}
                disabled={saving} style={s.primaryButton}>
                {saving ? <Loader2 size={16} className="spin"/> : <FilePlus2 size={16}/>}
                {form.id ? "Şablonu Güncelle" : "Şablonu Oluştur"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .spin { animation: spin .9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 760px) {
          .editorGrid { grid-template-columns: 1fr !important; }
          .kpiGrid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }
      `}</style>
    </main>
  );
}

function Field({label,value,onChange,placeholder,disabled,full}:{
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; disabled?:boolean; full?:boolean;
}) {
  return <label style={{display:"grid",gap:6,gridColumn:full?"1 / -1":undefined}}>
    <span style={s.fieldLabel}>{label}</span>
    <input value={value} disabled={disabled} placeholder={placeholder}
      onChange={e=>onChange(e.target.value)} style={s.field}/>
  </label>;
}

function SelectField({label,value,options,onChange}:{
  label:string; value:string; options:Array<[string,string]>;
  onChange:(v:string)=>void;
}) {
  return <label style={{display:"grid",gap:6}}>
    <span style={s.fieldLabel}>{label}</span>
    <select value={value} onChange={e=>onChange(e.target.value)} style={s.field}>
      {options.map(([v,t])=><option key={v} value={v}>{t}</option>)}
    </select>
  </label>;
}

function NumberField({label,value,min,onChange}:{
  label:string; value:number; min:number; onChange:(v:number)=>void;
}) {
  return <label style={{display:"grid",gap:6}}>
    <span style={s.fieldLabel}>{label}</span>
    <input type="number" min={min} value={value}
      onChange={e=>onChange(Math.max(min,Number(e.target.value||min)))}
      style={s.field}/>
  </label>;
}

function TextArea({label,value,onChange,full,code}:{
  label:string; value:string; onChange:(v:string)=>void;
  full?:boolean; code?:boolean;
}) {
  return <label style={{display:"grid",gap:6,gridColumn:full?"1 / -1":undefined}}>
    <span style={s.fieldLabel}>{label}</span>
    <textarea value={value} onChange={e=>onChange(e.target.value)}
      style={{
        ...s.textarea,
        minHeight:code?150:90,
        fontFamily:code
          ?"ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
          :"inherit"
      }}/>
  </label>;
}

const s: Record<string, React.CSSProperties> = {
  page:{minHeight:"100vh",width:"100%",maxWidth:"100%",overflowX:"hidden",
    boxSizing:"border-box",background:"linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
    padding:18,display:"grid",gap:18},
  hero:{width:"100%",boxSizing:"border-box",borderRadius:26,
    background:"linear-gradient(135deg,#4c0d1a 0%,#9f1239 50%,#ea580c 100%)",
    color:"#fff",padding:24,boxShadow:"0 24px 60px rgba(76,13,26,.20)"},
  badge:{display:"inline-flex",alignItems:"center",gap:8,borderRadius:999,
    background:"rgba(255,255,255,.14)",padding:"7px 11px",fontSize:12,fontWeight:900},
  heroTitle:{margin:"16px 0 8px",fontSize:"clamp(26px,3vw,40px)",fontWeight:950},
  heroText:{margin:0,maxWidth:900,color:"rgba(255,255,255,.84)",lineHeight:1.6},
  heroButton:{marginTop:16,minHeight:44,borderRadius:13,
    border:"1px solid rgba(255,255,255,.24)",background:"rgba(255,255,255,.14)",
    color:"#fff",padding:"0 15px",display:"inline-flex",alignItems:"center",
    gap:8,fontWeight:900,cursor:"pointer"},
  kpiGrid:{marginTop:22,display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10},
  kpiCard:{borderRadius:16,border:"1px solid rgba(255,255,255,.16)",
    background:"rgba(255,255,255,.10)",padding:14},
  kpiLabel:{display:"flex",alignItems:"center",gap:7,
    color:"rgba(255,255,255,.80)",fontSize:11,fontWeight:850},
  kpiValue:{marginTop:7,fontSize:25,fontWeight:950},
  error:{borderRadius:14,border:"1px solid #fecaca",background:"#fef2f2",
    color:"#b91c1c",padding:13,display:"flex",alignItems:"center",gap:8,fontWeight:800},
  success:{borderRadius:14,border:"1px solid #bbf7d0",background:"#ecfdf5",
    color:"#047857",padding:13,display:"flex",alignItems:"center",gap:8,fontWeight:800},
  filters:{borderRadius:20,border:"1px solid #e5e7eb",background:"#fff",
    padding:15,display:"flex",flexWrap:"wrap",gap:9,alignItems:"center"},
  searchWrap:{position:"relative",flex:"1 1 320px",minWidth:0},
  searchIcon:{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"},
  input:{width:"100%",minWidth:0,height:43,borderRadius:12,border:"1px solid #dbe3ec",
    padding:"0 12px 0 40px",boxSizing:"border-box"},
  select:{minWidth:160,height:43,borderRadius:12,border:"1px solid #dbe3ec",padding:"0 10px"},
  secondaryButton:{minHeight:43,borderRadius:12,border:"1px solid #dbe3ec",
    background:"#fff",color:"#475569",padding:"0 12px",display:"inline-flex",
    alignItems:"center",gap:7,fontWeight:850,cursor:"pointer"},
  primaryButton:{minHeight:43,borderRadius:12,border:0,background:"#6b1020",
    color:"#fff",padding:"0 15px",display:"inline-flex",alignItems:"center",
    gap:7,fontWeight:900,cursor:"pointer"},
  sectionHeader:{display:"flex",flexWrap:"wrap",justifyContent:"space-between",
    alignItems:"center",gap:10},
  sectionTitle:{margin:0,color:"#0f172a",fontSize:24,fontWeight:950},
  sectionText:{margin:"5px 0 0",color:"#64748b",fontSize:13},
  count:{borderRadius:999,background:"#f1f5f9",color:"#475569",
    padding:"7px 11px",fontSize:12,fontWeight:900},
  loading:{minHeight:320,borderRadius:20,border:"1px solid #e5e7eb",
    background:"#fff",display:"grid",placeItems:"center",color:"#64748b"},
  empty:{minHeight:300,borderRadius:20,border:"1px dashed #cbd5e1",
    background:"#fff",display:"grid",placeItems:"center",color:"#94a3b8"},
  cards:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14},
  card:{minWidth:0,borderRadius:20,border:"1px solid #e5e7eb",background:"#fff",
    padding:17,boxShadow:"0 12px 30px rgba(15,23,42,.05)",display:"grid",gap:14},
  cardTop:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12},
  codeRow:{display:"flex",flexWrap:"wrap",gap:7},
  code:{borderRadius:999,background:"#f1f5f9",color:"#475569",
    padding:"4px 8px",fontSize:10,fontWeight:900},
  system:{borderRadius:999,background:"#eff6ff",color:"#1d4ed8",
    padding:"4px 8px",fontSize:10,fontWeight:900},
  cardTitle:{margin:"9px 0 4px",color:"#0f172a",fontSize:18,fontWeight:950},
  cardText:{margin:0,color:"#64748b",fontSize:12,lineHeight:1.55},
  status:{flex:"0 0 auto",borderRadius:999,padding:"5px 9px",fontSize:10,fontWeight:900},
  metaGrid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9},
  meta:{borderRadius:12,background:"#f8fafc",padding:10},
  metaLabel:{color:"#94a3b8",fontSize:9,fontWeight:900},
  metaValue:{marginTop:4,color:"#0f172a",fontSize:12,fontWeight:900},
  legal:{borderRadius:13,border:"1px solid #eef2f7",padding:11},
  legalText:{marginTop:5,color:"#475569",fontSize:12,lineHeight:1.5},
  actions:{display:"flex",justifyContent:"flex-end",gap:7},
  editButton:{minHeight:38,borderRadius:10,border:"1px solid #bfdbfe",
    background:"#eff6ff",color:"#1d4ed8",padding:"0 11px",
    display:"inline-flex",alignItems:"center",gap:6,fontWeight:850,cursor:"pointer"},
  deleteButton:{width:38,height:38,borderRadius:10,border:"1px solid #fecaca",
    background:"#fef2f2",color:"#b91c1c",display:"grid",placeItems:"center",cursor:"pointer"},
  overlay:{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,23,42,.48)",
    display:"grid",placeItems:"center",padding:16},
  modal:{width:"min(960px,100%)",maxHeight:"92vh",overflowY:"auto",
    borderRadius:24,background:"#fff",boxShadow:"0 30px 80px rgba(15,23,42,.28)"},
  modalHeader:{position:"sticky",top:0,zIndex:2,display:"flex",
    justifyContent:"space-between",alignItems:"center",gap:12,padding:18,
    borderBottom:"1px solid #e5e7eb",background:"#fff"},
  modalTitle:{margin:0,color:"#0f172a",fontSize:22,fontWeight:950},
  modalText:{margin:"5px 0 0",color:"#64748b",fontSize:12},
  close:{width:40,height:40,borderRadius:12,border:"1px solid #e5e7eb",
    background:"#fff",display:"grid",placeItems:"center",cursor:"pointer"},
  editorGrid:{padding:18,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14},
  modalFooter:{position:"sticky",bottom:0,display:"flex",justifyContent:"flex-end",
    gap:8,padding:16,borderTop:"1px solid #e5e7eb",background:"#fff"},
  fieldLabel:{color:"#475569",fontSize:11,fontWeight:900},
  field:{width:"100%",minWidth:0,height:43,borderRadius:11,
    border:"1px solid #dbe3ec",padding:"0 11px",boxSizing:"border-box"},
  textarea:{width:"100%",minWidth:0,resize:"vertical",borderRadius:11,
    border:"1px solid #dbe3ec",padding:11,boxSizing:"border-box",lineHeight:1.5}
};