"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  MapPin,
  Printer,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type AnswerRow = {
  itemId?: string;
  itemTitle?: string;
  question?: string;
  result?: string;
  currentCondition?: string;
  explanation?: string;
  requiredAction?: string;
  legalReference?: string;
  riskLevel?: string;
};

type Report = {
  id: string;
  form_title: string;
  display_form_title?: string;
  display_form_code?: string;
  inspection_name?: string;
  inspector_name: string;
  inspection_date?: string | null;
  completed_at?: string | null;
  compliance_rate: number | null;
  total_item_count: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  not_applicable_count?: number;
  critical_count: number;
  generated_pdf_url?: string | null;
  signed_pdf_url?: string | null;
  result_json?: {
    answers?: AnswerRow[];
    auditMode?: string;
    reportNo?: string;
    location?: string;
    responsible?: string;
    generalNote?: string;
  } | null;
  form?: {
    code?: string;
    category?: string;
    version_no?: number;
  } | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanFormName(value: unknown): string {
  return clean(value)
    .replace(/WEB[\s_-]*STANDARD/gi, "")
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      ""
    )
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayTitle(report: Report): string {
  return (
    clean(report.display_form_title) ||
    cleanFormName(report.inspection_name) ||
    cleanFormName(report.form_title) ||
    "Denetim Formu"
  );
}


function resultLabel(value: string): string {
  const key = value.toUpperCase();
  if (key.includes("UYGUNSUZ")) return "Uygunsuz";
  if (key.includes("KISMEN")) return "Kısmen Uygun";
  if (key === "UYGUN") return "Uygun";
  if (key.includes("KAPSAM") || key === "N/A") return "Kapsam Dışı";
  if (key.startsWith("SCORE:")) return `Puan ${key.replace("SCORE:", "")}`;
  return value || "-";
}

function modeLabel(value: string): string {
  const key = value.toUpperCase();
  if (key.includes("PUAN") || key.includes("SCOR")) return "Puanlamalı";
  if (key.includes("FOTO") || key.includes("PHOTO")) return "Fotoğraflı";
  if (key.includes("ELMERI")) return "ELMERI";
  return "Klasik";
}

export default function InspectionReportDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/documentation/inspection-reports?id=${encodeURIComponent(params.id)}`,
          { credentials: "include", cache: "no-store" }
        );
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.detail || json.error || "Rapor alınamadı.");
        setReport(Array.isArray(json.reports) ? json.reports[0] || null : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rapor alınamadı.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    if (
      !report ||
      searchParams.get("print") !== "1"
    ) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const prepareAndPrint = async () => {
      document.title = `${displayTitle(report)} - D-SEC Denetim Raporu`;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await Promise.all(
        Array.from(document.images).map(
          (image) =>
            image.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  image.addEventListener("load", () => resolve(), { once: true });
                  image.addEventListener("error", () => resolve(), { once: true });
                })
        )
      );

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );

      if (!cancelled) {
        timer = window.setTimeout(
          () => window.print(),
          900
        );
      }
    };

    void prepareAndPrint();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [report, searchParams]);

  const answers = useMemo(
    () => (Array.isArray(report?.result_json?.answers) ? report!.result_json!.answers! : []),
    [report]
  );

  if (loading) return <main className="statePage">Rapor hazırlanıyor...</main>;
  if (error || !report) return <main className="statePage error">{error || "Rapor bulunamadı."}</main>;

  const dateRaw = report.completed_at || report.inspection_date;
  const date = dateRaw
    ? new Date(dateRaw).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
  const rate = report.compliance_rate == null ? null : Number(report.compliance_rate);

  return (
    <main className="reportPage">
      <div className="screenActions noPrint">
        <button onClick={() => window.close()}><ArrowLeft size={17}/> Geri</button>
        <button className="printBtn" onClick={() => window.print()}><Printer size={17}/> PDF Raporu Oluştur</button>
        {report.signed_pdf_url ? (
          <a href={report.signed_pdf_url} target="_blank" rel="noreferrer"><Download size={17}/> İmzalı Belge</a>
        ) : null}
      </div>

      <article className="document">
        <header className="hero">
          <div className="brandLine"><ShieldCheck size={28}/><span>D-SEC DENETİM YÖNETİMİ</span></div>
          <h1>İş Sağlığı ve Güvenliği<br/>Denetim Sonuç Raporu</h1>
          <p>{displayTitle(report)}</p>
          <div className="heroTags">
            <span>{modeLabel(clean(report.result_json?.auditMode))}</span>
            <span>{report.form?.code || report.display_form_code || "Arşiv Kaydı"}</span>
            <span>v{report.form?.version_no || 1}</span>
            <span>{date}</span>
          </div>
        </header>

        <section className="identityGrid">
          <Info icon={<UserRound/>} label="Denetçi" value={report.inspector_name || "Belirtilmedi"}/>
          <Info icon={<MapPin/>} label="Lokasyon" value={clean(report.result_json?.location) || "Belirtilmedi"}/>
          <Info icon={<CalendarDays/>} label="Tamamlanma" value={date}/>
          <Info icon={<ClipboardCheck/>} label="Toplam Madde" value={String(report.total_item_count)}/>
        </section>

        <section className="scoreSection">
          <div className="scoreMain">
            <Gauge size={34}/>
            <div><small>Genel Uyum Skoru</small><strong>{rate == null ? "-" : `%${rate.toFixed(1)}`}</strong></div>
          </div>
          <div className="scoreTrack"><i style={{width:`${Math.max(0,Math.min(100,rate||0))}%`}}/></div>
        </section>

        <section className="kpiGrid">
          <Kpi className="ok" icon={<CheckCircle2/>} label="Uygun" value={report.compliant_count}/>
          <Kpi className="partial" icon={<FileText/>} label="Kısmen Uygun" value={report.partial_count}/>
          <Kpi className="bad" icon={<XCircle/>} label="Uygunsuz" value={report.non_compliant_count}/>
          <Kpi className="neutral" icon={<ShieldCheck/>} label="Kapsam Dışı" value={report.not_applicable_count || 0}/>
        </section>

        <section className="sectionBlock">
          <div className="sectionHead"><h2>Denetim Bulguları</h2><span>{answers.length} kayıt</span></div>
          {answers.length ? (
            <div className="tableWrap">
              <table>
                <thead><tr><th>No</th><th>Denetim Maddesi</th><th>Sonuç</th><th>Mevcut Durum / Açıklama</th><th>Önerilen Önlem</th><th>Mevzuat</th></tr></thead>
                <tbody>
                  {answers.map((answer,index)=>(
                    <tr key={`${answer.itemId || index}`}>
                      <td>{index+1}</td>
                      <td><b>{answer.itemTitle || answer.question || "-"}</b></td>
                      <td><span className={`resultChip ${clean(answer.result).toLowerCase()}`}>{resultLabel(clean(answer.result))}</span></td>
                      <td>{answer.currentCondition || answer.explanation || "-"}</td>
                      <td>{answer.requiredAction || "-"}</td>
                      <td>{answer.legalReference || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="emptyFindings">Madde ayrıntısı bulunamadı.</div>}
        </section>

        <section className="notes">
          <h2>Genel Değerlendirme</h2>
          <p>{clean(report.result_json?.generalNote) || "Denetim sonuçlarının ilgili sorumlularca değerlendirilmesi ve uygunsuzluklar için takip planı oluşturulması önerilir."}</p>
        </section>

        <footer>
          <div><b>D-SEC</b><span>Dijital Sağlık • Emniyet • Çevre</span></div>
          <span>Rapor ID: {report.id}</span>
        </footer>
      </article>

      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0;background:#eef1f5;color:#172033;font-family:Arial,Helvetica,sans-serif}.reportPage{padding:28px}.screenActions{max-width:1180px;margin:0 auto 16px;display:flex;justify-content:flex-end;gap:9px}.screenActions button,.screenActions a{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 14px;border-radius:11px;border:1px solid #d0d5dd;background:#fff;color:#344054;font-weight:800;text-decoration:none;cursor:pointer}.screenActions .printBtn{background:#8f1d22;color:#fff;border-color:#8f1d22}.document{max-width:1180px;margin:auto;background:#fff;border-radius:26px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.12)}.hero{padding:40px 46px;color:#fff;background:linear-gradient(120deg,#651117,#a92228 58%,#e08118);position:relative}.brandLine{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:900;letter-spacing:1px}.hero h1{font-size:42px;line-height:1.04;margin:22px 0 12px;letter-spacing:-1.4px}.hero p{font-size:17px;opacity:.9}.heroTags{display:flex;flex-wrap:wrap;gap:8px;margin-top:25px}.heroTags span{padding:8px 12px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.12);font-size:11px;font-weight:850}.identityGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:24px 34px}.info{display:grid;grid-template-columns:35px 1fr;gap:8px;padding:15px;border:1px solid #e8ebf0;border-radius:15px;background:#fbfcfe}.info svg{color:#961f24}.info small{display:block;color:#7b8798;font-size:10px;font-weight:850;text-transform:uppercase}.info b{display:block;margin-top:4px}.scoreSection{margin:0 34px;padding:19px;border-radius:17px;background:#f6f7f9;border:1px solid #e7e9ee}.scoreMain{display:flex;align-items:center;gap:12px}.scoreMain svg{color:#971e23}.scoreMain div{display:flex;align-items:baseline;justify-content:space-between;width:100%}.scoreMain small{font-weight:850;color:#667085}.scoreMain strong{font-size:31px}.scoreTrack{height:10px;margin-top:13px;border-radius:999px;background:#dfe3e8;overflow:hidden}.scoreTrack i{display:block;height:100%;background:linear-gradient(90deg,#9a1f24,#e48619);border-radius:inherit}.kpiGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 34px 28px}.kpi{padding:16px;border-radius:15px;display:flex;align-items:center;gap:12px}.kpi svg{width:25px;height:25px}.kpi small{display:block;font-weight:850}.kpi strong{font-size:25px}.kpi.ok{background:#eaf8ef;color:#16753b}.kpi.partial{background:#fff6df;color:#9a6500}.kpi.bad{background:#ffeded;color:#b42318}.kpi.neutral{background:#edf1f5;color:#475467}.sectionBlock{padding:6px 34px 28px}.sectionHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.sectionHead h2,.notes h2{margin:0;font-size:21px}.sectionHead span{padding:6px 10px;border-radius:999px;background:#f1f3f6;font-size:11px;font-weight:850}.tableWrap{overflow:auto;border:1px solid #e5e8ed;border-radius:15px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f4f5f7;color:#475467;text-align:left;padding:12px}td{padding:12px;border-top:1px solid #edf0f3;vertical-align:top;line-height:1.45}tbody tr:nth-child(even){background:#fcfcfd}.resultChip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef1f5;font-weight:850;white-space:nowrap}.resultChip.uygun{background:#e8f7ee;color:#16723a}.resultChip.kismen{background:#fff4d8;color:#966200}.resultChip.uygunsuz{background:#ffe7e7;color:#b42318}.notes{margin:0 34px 30px;padding:20px;border:1px solid #e5e8ed;border-radius:16px;background:#fafbfc}.notes p{line-height:1.7;color:#475467}footer{display:flex;justify-content:space-between;align-items:flex-end;padding:22px 34px;border-top:1px solid #eaecf0;color:#667085;font-size:11px}footer div{display:flex;flex-direction:column}footer b{font-size:17px;color:#8f1d22}.emptyFindings{padding:35px;border:1px dashed #d0d5dd;border-radius:14px;text-align:center;color:#667085}.statePage{padding:80px;text-align:center;font-size:20px}.statePage.error{color:#b42318}
        @media(max-width:800px){.reportPage{padding:0}.document{border-radius:0}.identityGrid,.kpiGrid{grid-template-columns:repeat(2,1fr);padding-left:16px;padding-right:16px}.hero{padding:28px 20px}.hero h1{font-size:31px}.scoreSection,.notes{margin-left:16px;margin-right:16px}.sectionBlock{padding-left:16px;padding-right:16px}.screenActions{padding:10px;margin:0;flex-wrap:wrap}}
        @page{size:A4 portrait;margin:10mm}@media print{html,body{width:210mm!important;min-height:297mm!important;background:#fff!important}body{margin:0!important}.reportPage{width:100%!important;padding:0!important;background:#fff!important}.document{display:block!important;width:100%!important;max-width:none!important;min-height:277mm!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}.noPrint{display:none!important}.hero,.kpi,.scoreTrack i,.resultChip{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.hero{padding:24px 28px!important}.hero h1{font-size:29px!important}.identityGrid{padding:14px 20px!important;gap:8px!important}.scoreSection{margin:0 20px!important}.kpiGrid{padding:12px 20px 18px!important;gap:8px!important}.sectionBlock{padding:4px 20px 18px!important;break-inside:auto!important}.notes{margin:0 20px 18px!important}table{font-size:8px!important;table-layout:fixed!important}th,td{padding:6px!important;word-break:break-word!important}thead{display:table-header-group!important}tr{break-inside:avoid!important;page-break-inside:avoid!important}footer{padding:16px 20px!important}.statePage{display:none!important}}
      `}</style>
    </main>
  );
}

function Info({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="info">{icon}<div><small>{label}</small><b>{value}</b></div></div>}
function Kpi({className,icon,label,value}:{className:string;icon:React.ReactNode;label:string;value:number}){return <div className={`kpi ${className}`}>{icon}<div><small>{label}</small><strong>{value}</strong></div></div>}