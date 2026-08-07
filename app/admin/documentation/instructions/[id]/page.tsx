"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Status = "DRAFT" | "PUBLISHED" | "PASSIVE" | "REVISION";

type InstructionSection = {
  id: string;
  title: string;
  content: string;
};

type InstructionRecord = {
  id: string;
  companyId: string | null;
  instructionCode: string;
  title: string;
  shortTitle: string;
  category: string;
  purpose: string;
  scope: string;
  responsibilities: string;
  contentJson: unknown[];
  attachmentsJson: unknown[];
  versionNo: number;
  revisionNo: number;
  revisionReason: string;
  status: Status;
  isSystem: boolean;
  isActive: boolean;
  isDeleted: boolean;
  requiresReadConfirmation: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  record?: InstructionRecord | null;
  error?: string;
  detail?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeSections(value: unknown[]): InstructionSection[] {
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const source = item as Record<string, unknown>;
      return {
        id: clean(source.id) || makeId(),
        title: clean(source.title) || `Bölüm ${index + 1}`,
        content: clean(source.content ?? source.text ?? source.description),
      };
    })
    .filter((item): item is InstructionSection => Boolean(item));
}

function categoryLabel(value: string): string {
  const labels: Record<string, string> = {
    GENERAL: "Genel Talimat",
    OHS: "İSG Talimatı",
    HEALTH: "Sağlık Talimatı",
    PPE: "KKD Talimatı",
    MACHINE: "Makine / Ekipman Talimatı",
    ELECTRICAL: "Elektrik Talimatı",
    CHEMICAL: "Kimyasal Talimat",
    EMERGENCY: "Acil Durum Talimatı",
    WORK_PERMIT: "Çalışma İzni Talimatı",
    OTHER: "Talimat",
  };
  return labels[value] || "Talimat";
}

function statusLabel(value: Status): string {
  return {
    DRAFT: "Taslak",
    PUBLISHED: "Yayında",
    PASSIVE: "Pasif",
    REVISION: "Revizyonda",
  }[value];
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("tr-TR");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlText(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export default function InstructionDesignerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = clean(params?.id);
  const mode = clean(searchParams.get("mode"));
  const previewOnly = mode === "preview" || mode === "download";

  const [record, setRecord] = useState<InstructionRecord | null>(null);
  const [sections, setSections] = useState<InstructionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setError("Talimat kimliği bulunamadı.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/documentation/instructions?id=${encodeURIComponent(id)}`,
        { cache: "no-store", headers: { Accept: "application/json" } }
      );

      const json = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.detail || json.error || "Talimat alınamadı.");
      }
      if (!json.record) throw new Error("Talimat bulunamadı.");

      setRecord(json.record);
      setSections(
        normalizeSections(
          Array.isArray(json.record.contentJson) ? json.record.contentJson : []
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Talimat alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const serializedSections = useMemo(
    () =>
      sections.map((section, index) => ({
        id: section.id,
        type: "SECTION",
        order: index + 1,
        title: section.title,
        content: section.content,
      })),
    [sections]
  );

  const updateRecord = <K extends keyof InstructionRecord>(
    key: K,
    value: InstructionRecord[K]
  ) => {
    setRecord((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveInstruction = async (nextStatus?: Status) => {
    if (!record) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const status = nextStatus ?? record.status;

      const response = await fetch("/api/admin/documentation/instructions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: record.id,
          instructionCode: record.instructionCode,
          title: record.title,
          shortTitle: record.shortTitle,
          category: record.category,
          purpose: record.purpose,
          scope: record.scope,
          responsibilities: record.responsibilities,
          contentJson: serializedSections,
          attachmentsJson: record.attachmentsJson,
          versionNo: record.versionNo,
          revisionNo: record.revisionNo,
          revisionReason: record.revisionReason,
          status,
          requiresReadConfirmation: record.requiresReadConfirmation,
          isActive: status !== "PASSIVE",
        }),
      });

      const json = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !json.success) {
        throw new Error(json.detail || json.error || "Talimat kaydedilemedi.");
      }

      if (json.record) {
        setRecord(json.record);
        setSections(
          normalizeSections(
            Array.isArray(json.record.contentJson) ? json.record.contentJson : []
          )
        );
      }

      setMessage(status === "PUBLISHED" ? "Talimat yayımlandı." : "Talimat kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Talimat kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        id: makeId(),
        title: `${current.length + 1}. YENİ BÖLÜM`,
        content: "",
      },
    ]);
  };

  const updateSection = (sectionId: string, patch: Partial<InstructionSection>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    );
  };

  const removeSection = (sectionId: string) => {
    if (!window.confirm("Bu bölüm silinsin mi?")) return;
    setSections((current) => current.filter((section) => section.id !== sectionId));
  };

  const moveSection = (index: number, direction: "UP" | "DOWN") => {
    setSections((current) => {
      const target = direction === "UP" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const printInstruction = useCallback(() => {
    if (!record) return;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const printDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!printDocument) {
      iframe.remove();
      return;
    }

    const sectionsHtml = sections.length
      ? sections
          .map(
            (section, index) => `
              <section class="instructionSection">
                <h2>${escapeHtml(section.title || `${index + 1}. BÖLÜM`)}</h2>
                <div class="sectionText">${htmlText(section.content || "")}</div>
              </section>
            `
          )
          .join("")
      : `
        <section class="instructionSection">
          <h2>TALİMAT İÇERİĞİ</h2>
          <div class="sectionText emptyLine"></div>
        </section>
      `;

    printDocument.open();
    printDocument.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(record.shortTitle || record.title)}</title>
  <style>
    *{box-sizing:border-box}
    @page{size:A4 portrait;margin:10mm}
    html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif}
    .paper{width:100%;margin:0;padding:0}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    .headerTable{margin-bottom:8px}
    .headerTable td{border:1px solid #111827;padding:6px;font-size:8.5pt;vertical-align:middle}
    .brand{width:24%;font-size:16pt!important;font-weight:900;text-align:center}
    .title{width:48%;text-align:center;font-size:13pt!important;font-weight:900}
    .meta{width:28%;padding:0!important}
    .meta div{display:grid;grid-template-columns:42% 58%;border-bottom:1px solid #111827;padding:4px 5px;font-size:7.5pt}
    .meta div:last-child{border-bottom:0}
    .infoTable{margin-bottom:8px}
    .infoTable th,.infoTable td{border:1px solid #111827;padding:5px 6px;font-size:8pt;vertical-align:top}
    .infoTable th{width:17%;background:#f1f5f9;text-align:left;font-weight:800}
    .instructionSection{margin:0 0 7px;break-inside:avoid;page-break-inside:avoid}
    .instructionSection h2{margin:0;padding:5px 6px;border:1px solid #111827;background:#f1f5f9;font-size:9pt;font-weight:900}
    .sectionText{min-height:20px;border:1px solid #111827;border-top:0;padding:6px 7px;font-size:8.4pt;line-height:1.42}
    .emptyLine{min-height:60px}
    .footer{margin-top:10px;border-top:1px solid #cbd5e1;padding-top:6px;display:flex;justify-content:space-between;gap:12px;color:#64748b;font-size:7pt}
  </style>
</head>
<body>
  <main class="paper">
    <table class="headerTable">
      <tr>
        <td class="brand">D-SEC</td>
        <td class="title">${escapeHtml(record.title)}</td>
        <td class="meta">
          <div><b>Kod</b><span>${escapeHtml(record.instructionCode)}</span></div>
          <div><b>Versiyon</b><span>${record.versionNo}</span></div>
          <div><b>Revizyon</b><span>${record.revisionNo}</span></div>
          <div><b>Yayın</b><span>${escapeHtml(formatDate(record.publishedAt))}</span></div>
        </td>
      </tr>
    </table>

    <table class="infoTable">
      <tr><th>Kategori</th><td>${escapeHtml(categoryLabel(record.category))}</td></tr>
      <tr><th>Amaç</th><td>${htmlText(record.purpose || "-")}</td></tr>
      <tr><th>Kapsam</th><td>${htmlText(record.scope || "-")}</td></tr>
      <tr><th>Sorumluluklar</th><td>${htmlText(record.responsibilities || "-")}</td></tr>
    </table>

    ${sectionsHtml}

    ${record.revisionReason ? `<table class="infoTable"><tr><th>Revizyon Nedeni</th><td>${htmlText(record.revisionReason)}</td></tr></table>` : ""}

    <div class="footer">
      <span>Durum: ${escapeHtml(statusLabel(record.status))}</span>
      <span>${record.requiresReadConfirmation ? "Okundu onayı gerektirir" : "Okundu onayı gerektirmez"}</span>
    </div>
  </main>
</body>
</html>`);
    printDocument.close();

    const runPrint = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        iframe.remove();
        return;
      }
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => iframe.remove(), 800);
    };

    if (printDocument.readyState === "complete") {
      window.setTimeout(runPrint, 180);
    } else {
      iframe.onload = () => window.setTimeout(runPrint, 180);
    }
  }, [record, sections]);

  useEffect(() => {
    if (loading || !record || mode !== "download") return;
    const timer = window.setTimeout(printInstruction, 500);
    return () => window.clearTimeout(timer);
  }, [loading, record, mode, printInstruction]);

  if (loading) {
    return (
      <main style={styles.centerPage}>
        <Loader2 size={34} className="spin" />
        <strong>Talimat hazırlanıyor...</strong>
        <style jsx global>{`.spin{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.errorCard}>
          <X size={28} />
          <h1>Talimat açılamadı</h1>
          <p>{error || "Talimat bulunamadı."}</p>
          <button type="button" onClick={() => router.push("/admin/documentation/instructions")} style={styles.primaryButton}>
            Talimat Merkezine Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div className="noPrint" style={styles.toolbar}>
        <button type="button" onClick={() => router.push("/admin/documentation/instructions")} style={styles.secondaryButton}>
          <ArrowLeft size={17} /> Talimat Merkezi
        </button>

        <div style={styles.toolbarActions}>
          <button type="button" onClick={() => document.getElementById("instruction-paper")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={styles.secondaryButton}>
            <Eye size={17} /> Görüntüle
          </button>

          {!previewOnly ? (
            <>
              <button type="button" disabled={saving} onClick={() => void saveInstruction()} style={styles.secondaryButton}>
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Kaydet
              </button>

              <button type="button" disabled={saving} onClick={() => void saveInstruction("PUBLISHED")} style={styles.publishButton}>
                <ShieldCheck size={17} /> Yayınla
              </button>
            </>
          ) : null}

          <button type="button" onClick={printInstruction} style={styles.downloadButton}>
            <Download size={17} /> PDF
          </button>
        </div>
      </div>

      {!previewOnly ? (
        <section className="noPrint" style={styles.hero}>
          <div>
            <div style={styles.heroBadge}><FileText size={16} /> Talimat Tasarım Merkezi</div>
            <h1 style={styles.heroTitle}>{record.shortTitle || record.title}</h1>
            <p style={styles.heroText}>Talimatın kurumsal içeriğini, revizyon bilgilerini ve yayın durumunu yönetin.</p>
          </div>
          <div style={styles.heroMeta}>
            <span style={styles.heroChip}>{record.instructionCode}</span>
            <span style={styles.heroChip}>v{record.versionNo}</span>
            <span style={styles.heroChip}>Rev. {record.revisionNo}</span>
            <span style={styles.heroChip}>{statusLabel(record.status)}</span>
          </div>
        </section>
      ) : null}

      {error ? <div className="noPrint" style={styles.error}><X size={17} />{error}</div> : null}
      {message ? <div className="noPrint" style={styles.success}><CheckCircle2 size={17} />{message}</div> : null}

      <div className="designerLayout" style={previewOnly ? styles.previewLayout : styles.designerLayout}>
        {!previewOnly ? (
          <aside className="noPrint" style={styles.editorPanel}>
            <div style={styles.panelTitle}>Talimat Bilgileri</div>
            <Field label="Talimat Kodu" value={record.instructionCode} disabled onChange={() => {}} />
            <Field label="Kısa Başlık" value={record.shortTitle} onChange={(value) => updateRecord("shortTitle", value)} />
            <Field label="Tam Başlık" value={record.title} onChange={(value) => updateRecord("title", value)} />

            <SelectField label="Kategori" value={record.category} options={[
              ["GENERAL","Genel"],["OHS","İSG"],["HEALTH","Sağlık"],["PPE","KKD"],
              ["MACHINE","Makine / Ekipman"],["ELECTRICAL","Elektrik"],["CHEMICAL","Kimyasal"],
              ["EMERGENCY","Acil Durum"],["WORK_PERMIT","Çalışma İzni"],["OTHER","Diğer"]
            ]} onChange={(value) => updateRecord("category", value)} />

            <TextArea label="Amaç" value={record.purpose} onChange={(value) => updateRecord("purpose", value)} />
            <TextArea label="Kapsam" value={record.scope} onChange={(value) => updateRecord("scope", value)} />
            <TextArea label="Sorumluluklar" value={record.responsibilities} onChange={(value) => updateRecord("responsibilities", value)} />

            <div style={styles.twoColumn}>
              <NumberField label="Versiyon" value={record.versionNo} min={1} onChange={(value) => updateRecord("versionNo", value)} />
              <NumberField label="Revizyon" value={record.revisionNo} min={0} onChange={(value) => updateRecord("revisionNo", value)} />
            </div>

            <SelectField label="Durum" value={record.status} options={[
              ["DRAFT","Taslak"],["PUBLISHED","Yayında"],["REVISION","Revizyonda"],["PASSIVE","Pasif"]
            ]} onChange={(value) => updateRecord("status", value as Status)} />

            <TextArea label="Revizyon Nedeni" value={record.revisionReason} onChange={(value) => updateRecord("revisionReason", value)} />

            <label style={styles.checkboxBox}>
              <input type="checkbox" checked={record.requiresReadConfirmation} onChange={(event) => updateRecord("requiresReadConfirmation", event.target.checked)} />
              <div><strong>Okundu Onayı</strong><small>Mobil uygulamada çalışandan okuma onayı alınır.</small></div>
            </label>
          </aside>
        ) : null}

        <section style={styles.contentArea}>
          {!previewOnly ? (
            <div className="noPrint" style={styles.sectionToolbar}>
              <div><strong>Talimat İçeriği</strong><p>Bölümleri ekleyin, sıralayın ve düzenleyin.</p></div>
              <button type="button" onClick={addSection} style={styles.addButton}><Plus size={16} /> Bölüm Ekle</button>
            </div>
          ) : null}

          {!previewOnly ? (
            <div className="noPrint" style={styles.sectionEditorList}>
              {sections.length === 0 ? (
                <div style={styles.emptyEditor}>Henüz talimat bölümü yok.<br />“Bölüm Ekle” ile başlayın.</div>
              ) : sections.map((section, index) => (
                <article key={section.id} style={styles.sectionEditor}>
                  <div style={styles.sectionEditorHeader}>
                    <span style={styles.orderBadge}>{index + 1}</span><strong>Bölüm</strong>
                    <div style={styles.sectionActions}>
                      <button type="button" title="Yukarı taşı" disabled={index === 0} onClick={() => moveSection(index, "UP")} style={styles.iconButton}><ArrowUp size={15} /></button>
                      <button type="button" title="Aşağı taşı" disabled={index === sections.length - 1} onClick={() => moveSection(index, "DOWN")} style={styles.iconButton}><ArrowDown size={15} /></button>
                      <button type="button" title="Bölümü sil" onClick={() => removeSection(section.id)} style={styles.deleteIconButton}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <Field label="Bölüm Başlığı" value={section.title} onChange={(value) => updateSection(section.id, { title: value })} />
                  <TextArea label="İçerik" value={section.content} minHeight={150} onChange={(value) => updateSection(section.id, { content: value })} />
                </article>
              ))}
            </div>
          ) : null}

          <div id="instruction-paper" style={styles.paperShell}>
            <article style={styles.paper}>
              <table style={styles.headerTable}>
                <tbody><tr>
                  <td style={styles.brandCell}>D-SEC</td>
                  <td style={styles.titleCell}>{record.title}</td>
                  <td style={styles.metaCell}>
                    <div><b>Kod</b><span>{record.instructionCode}</span></div>
                    <div><b>Versiyon</b><span>{record.versionNo}</span></div>
                    <div><b>Revizyon</b><span>{record.revisionNo}</span></div>
                    <div><b>Yayın</b><span>{formatDate(record.publishedAt)}</span></div>
                  </td>
                </tr></tbody>
              </table>

              <table style={styles.infoTable}><tbody>
                <InfoRow label="Kategori" value={categoryLabel(record.category)} />
                <InfoRow label="Amaç" value={record.purpose || "-"} />
                <InfoRow label="Kapsam" value={record.scope || "-"} />
                <InfoRow label="Sorumluluklar" value={record.responsibilities || "-"} />
              </tbody></table>

              {sections.length ? sections.map((section, index) => (
                <section key={section.id} style={styles.paperSection}>
                  <h2 style={styles.paperSectionTitle}>{section.title || `${index + 1}. BÖLÜM`}</h2>
                  <div style={styles.paperSectionContent}>
                    {section.content ? section.content.split("\n").map((line, lineIndex) => <div key={lineIndex} style={{minHeight: line ? undefined : 10}}>{line}</div>) : <div style={{minHeight:48}} />}
                  </div>
                </section>
              )) : (
                <section style={styles.paperSection}>
                  <h2 style={styles.paperSectionTitle}>TALİMAT İÇERİĞİ</h2>
                  <div style={{...styles.paperSectionContent,minHeight:100}} />
                </section>
              )}

              {record.revisionReason ? <table style={styles.infoTable}><tbody><InfoRow label="Revizyon Nedeni" value={record.revisionReason} /></tbody></table> : null}

              <footer style={styles.paperFooter}>
                <span>Durum: {statusLabel(record.status)}</span>
                <span>{record.requiresReadConfirmation ? "Okundu onayı gerektirir" : "Okundu onayı gerektirmez"}</span>
              </footer>
            </article>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .spin{animation:instruction-spin .9s linear infinite}
        @keyframes instruction-spin{to{transform:rotate(360deg)}}
        @media(max-width:1000px){.designerLayout{grid-template-columns:1fr!important}}
        @media print{.noPrint{display:none!important}}
      `}</style>
    </main>
  );
}

function InfoRow({label,value}:{label:string;value:string}) {
  return <tr><th style={styles.infoTh}>{label}</th><td style={styles.infoTd}>{value}</td></tr>;
}

function Field({label,value,onChange,disabled}:{label:string;value:string;onChange:(value:string)=>void;disabled?:boolean}) {
  return <label style={styles.fieldWrap}><span style={styles.fieldLabel}>{label}</span><input value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value)} style={styles.field}/></label>;
}

function TextArea({label,value,onChange,minHeight=95}:{label:string;value:string;onChange:(value:string)=>void;minHeight?:number}) {
  return <label style={styles.fieldWrap}><span style={styles.fieldLabel}>{label}</span><textarea value={value} onChange={(e)=>onChange(e.target.value)} style={{...styles.textarea,minHeight}}/></label>;
}

function NumberField({label,value,min,onChange}:{label:string;value:number;min:number;onChange:(value:number)=>void}) {
  return <label style={styles.fieldWrap}><span style={styles.fieldLabel}>{label}</span><input type="number" min={min} value={value} onChange={(e)=>onChange(Math.max(min,Number(e.target.value||min)))} style={styles.field}/></label>;
}

function SelectField({label,value,options,onChange}:{label:string;value:string;options:Array<[string,string]>;onChange:(value:string)=>void}) {
  return <label style={styles.fieldWrap}><span style={styles.fieldLabel}>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)} style={styles.field}>{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>;
}

const styles: Record<string, React.CSSProperties> = {
  page:{minHeight:"100vh",padding:18,background:"linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",display:"grid",gap:16},
  centerPage:{minHeight:"100vh",display:"grid",placeItems:"center",gap:12,background:"#f8fafc",color:"#475569"},
  errorCard:{width:"min(520px,92vw)",borderRadius:20,border:"1px solid #fecaca",background:"#fff",padding:24,textAlign:"center",color:"#991b1b"},
  toolbar:{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10},
  toolbarActions:{display:"flex",flexWrap:"wrap",gap:8},
  secondaryButton:{minHeight:42,borderRadius:11,border:"1px solid #dbe3ec",background:"#fff",color:"#475569",padding:"0 13px",display:"inline-flex",alignItems:"center",gap:7,fontWeight:850,cursor:"pointer"},
  primaryButton:{minHeight:42,borderRadius:11,border:0,background:"#6b1020",color:"#fff",padding:"0 14px",display:"inline-flex",alignItems:"center",gap:7,fontWeight:900,cursor:"pointer"},
  publishButton:{minHeight:42,borderRadius:11,border:0,background:"#166534",color:"#fff",padding:"0 14px",display:"inline-flex",alignItems:"center",gap:7,fontWeight:900,cursor:"pointer"},
  downloadButton:{minHeight:42,borderRadius:11,border:"1px solid #fed7aa",background:"#fff7ed",color:"#c2410c",padding:"0 14px",display:"inline-flex",alignItems:"center",gap:7,fontWeight:900,cursor:"pointer"},
  hero:{borderRadius:24,padding:22,color:"#fff",background:"linear-gradient(135deg,#4c0d1a 0%,#9f1239 52%,#ea580c 100%)",display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:18,boxShadow:"0 22px 55px rgba(76,13,26,.18)"},
  heroBadge:{display:"inline-flex",alignItems:"center",gap:8,borderRadius:999,background:"rgba(255,255,255,.14)",padding:"7px 10px",fontSize:12,fontWeight:900},
  heroTitle:{margin:"14px 0 7px",fontSize:"clamp(26px,3vw,38px)",lineHeight:1.08},
  heroText:{margin:0,maxWidth:760,color:"rgba(255,255,255,.84)",lineHeight:1.55},
  heroMeta:{display:"flex",flexWrap:"wrap",gap:7,alignContent:"flex-start"},
  heroChip:{borderRadius:999,background:"rgba(255,255,255,.14)",padding:"7px 10px",fontSize:12,fontWeight:900},
  error:{borderRadius:13,border:"1px solid #fecaca",background:"#fef2f2",color:"#b91c1c",padding:12,display:"flex",alignItems:"center",gap:8,fontWeight:800},
  success:{borderRadius:13,border:"1px solid #bbf7d0",background:"#ecfdf5",color:"#047857",padding:12,display:"flex",alignItems:"center",gap:8,fontWeight:800},
  designerLayout:{display:"grid",gridTemplateColumns:"340px minmax(0,1fr)",gap:16,alignItems:"start"},
  previewLayout:{display:"grid",gridTemplateColumns:"1fr"},
  editorPanel:{borderRadius:18,border:"1px solid #e5e7eb",background:"#fff",padding:15,display:"grid",gap:12,position:"sticky",top:12,maxHeight:"calc(100vh - 30px)",overflowY:"auto"},
  panelTitle:{fontSize:16,fontWeight:950,color:"#0f172a",paddingBottom:8,borderBottom:"1px solid #eef2f7"},
  fieldWrap:{display:"grid",gap:6},fieldLabel:{fontSize:11,fontWeight:900,color:"#475569"},
  field:{width:"100%",minWidth:0,height:42,borderRadius:10,border:"1px solid #dbe3ec",padding:"0 10px",boxSizing:"border-box"},
  textarea:{width:"100%",minWidth:0,resize:"vertical",borderRadius:10,border:"1px solid #dbe3ec",padding:10,boxSizing:"border-box",lineHeight:1.5,fontFamily:"inherit"},
  twoColumn:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9},
  checkboxBox:{borderRadius:11,border:"1px solid #e5e7eb",padding:11,display:"flex",alignItems:"center",gap:9},
  contentArea:{minWidth:0,display:"grid",gap:13},
  sectionToolbar:{borderRadius:16,border:"1px solid #e5e7eb",background:"#fff",padding:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10},
  addButton:{minHeight:39,borderRadius:10,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#1d4ed8",padding:"0 11px",display:"inline-flex",alignItems:"center",gap:6,fontWeight:850,cursor:"pointer"},
  sectionEditorList:{display:"grid",gap:10},emptyEditor:{borderRadius:16,border:"1px dashed #cbd5e1",background:"#fff",padding:25,textAlign:"center",color:"#94a3b8",lineHeight:1.6},
  sectionEditor:{borderRadius:16,border:"1px solid #e5e7eb",background:"#fff",padding:13,display:"grid",gap:10},sectionEditorHeader:{display:"flex",alignItems:"center",gap:8},orderBadge:{width:28,height:28,borderRadius:8,background:"#f1f5f9",display:"grid",placeItems:"center",color:"#475569",fontWeight:900},
  sectionActions:{marginLeft:"auto",display:"flex",gap:5},iconButton:{width:32,height:32,borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",color:"#475569",display:"grid",placeItems:"center",cursor:"pointer"},deleteIconButton:{width:32,height:32,borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",color:"#b91c1c",display:"grid",placeItems:"center",cursor:"pointer"},
  paperShell:{overflowX:"auto",borderRadius:18,border:"1px solid #cbd5e1",background:"#d7dce2",padding:18},
  paper:{width:"210mm",minHeight:"297mm",margin:"0 auto",background:"#fff",color:"#111827",padding:"10mm",boxShadow:"0 18px 48px rgba(15,23,42,.18)",fontFamily:"Arial, Helvetica, sans-serif"},
  headerTable:{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",marginBottom:8},brandCell:{width:"24%",border:"1px solid #111827",padding:6,textAlign:"center",fontSize:22,fontWeight:950},titleCell:{width:"48%",border:"1px solid #111827",padding:6,textAlign:"center",fontSize:16,fontWeight:950},metaCell:{width:"28%",border:"1px solid #111827",padding:6,fontSize:10},
  infoTable:{width:"100%",borderCollapse:"collapse",marginBottom:8},infoTh:{width:"17%",border:"1px solid #111827",background:"#f1f5f9",padding:"5px 6px",textAlign:"left",verticalAlign:"top",fontSize:10},infoTd:{border:"1px solid #111827",padding:"5px 6px",whiteSpace:"pre-wrap",verticalAlign:"top",fontSize:10,lineHeight:1.45},
  paperSection:{marginBottom:7,breakInside:"avoid"},paperSectionTitle:{margin:0,padding:"5px 6px",border:"1px solid #111827",background:"#f1f5f9",fontSize:11,fontWeight:950},paperSectionContent:{minHeight:28,border:"1px solid #111827",borderTop:0,padding:"6px 7px",fontSize:10,lineHeight:1.48},paperFooter:{marginTop:10,borderTop:"1px solid #cbd5e1",paddingTop:6,display:"flex",justifyContent:"space-between",gap:12,color:"#64748b",fontSize:9}
};