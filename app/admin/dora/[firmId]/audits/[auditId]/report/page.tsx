"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  danger_class?: string | null;
  sector?: string | null;
  nace_code?: string | null;
  authorized_person?: string | null;
  employee_count?: number | null;
};

type Audit = {
  id: string;
  firm_id: string;
  template_id: string;
  audit_no?: string | null;
  title: string;
  audit_date_millis?: number | null;
  auditor_name?: string | null;
  auditor_title?: string | null;
  department?: string | null;
  location?: string | null;
  scope?: string | null;
  note?: string | null;
  status: string;
  total_questions?: number | null;
  answered_questions?: number | null;
  compliant_count?: number | null;
  partial_count?: number | null;
  non_compliant_count?: number | null;
  not_applicable_count?: number | null;
  compliance_percent?: number | null;
  completed_at_millis?: number | null;
  template?: {
    id: string;
    title?: string | null;
    code?: string | null;
    category?: string | null;
    audit_type?: string | null;
    version_no?: number | null;
  } | null;
};

type Question = {
  id: string;
  section_title?: string | null;
  title?: string | null;
  question?: string | null;
  expected_condition?: string | null;
  precaution?: string | null;
  legal_basis?: string | null;
  risk_level?: string | null;
  photo_required?: boolean | null;
  score?: number | null;
  weight?: number | null;
  sort_order?: number | null;
};

type Answer = {
  id: string;
  firm_id: string;
  audit_id: string;
  question_id: string;
  answer_status?: string | null;
  explanation?: string | null;
  action_required?: boolean | null;
  action_text?: string | null;
  score?: number | null;
  answered_by?: string | null;
  answered_at_millis?: number | null;
  note?: string | null;
  question?: Question | Question[] | null;
};

type Finding = {
  id: string;
  audit_id: string;
  answer_id?: string | null;
  question_id?: string | null;
  title: string;
  description?: string | null;
  finding_type?: string | null;
  risk_level?: string | null;
  legal_basis?: string | null;
  recommendation?: string | null;
  status: string;
  detected_by?: string | null;
  detected_at_millis?: number | null;
};

type Capa = {
  id: string;
  audit_id: string;
  finding_id: string;
  title: string;
  description?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  responsible_person?: string | null;
  responsible_department?: string | null;
  priority?: string | null;
  due_date_millis?: number | null;
  status: string;
  effectiveness_result?: string | null;
  closure_note?: string | null;
};

function questionOf(answer: Answer): Question | null {
  if (!answer.question) return null;
  return Array.isArray(answer.question)
    ? answer.question[0] ?? null
    : answer.question;
}

function formatDate(value?: number | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("tr-TR");
}

function labelStatus(value?: string | null): string {
  const key = String(value ?? "").trim().toUpperCase();
  const labels: Record<string, string> = {
    UYGUN: "Uygun",
    KISMEN_UYGUN: "Kısmen Uygun",
    UYGUNSUZ: "Uygunsuz",
    UYGULANAMAZ: "Uygulanamaz",
    ACIK: "Açık",
    TAKIPTE: "Takipte",
    DEVAM_EDIYOR: "Devam Ediyor",
    TAMAMLANDI: "Tamamlandı",
    KAPALI: "Kapalı",
    IPTAL: "İptal",
    KRITIK: "Kritik",
    YUKSEK: "Yüksek",
    ORTA: "Orta",
    DUSUK: "Düşük",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}

export default function DoraAuditReportPage() {
  const params = useParams();
  const router = useRouter();

  const firmId = String(params?.firmId ?? "");
  const auditId = String(params?.auditId ?? "");

  const reportRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState("");

  const [firm, setFirm] = useState<DoraFirm | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [capas, setCapas] = useState<Capa[]>([]);

  const load = useCallback(async () => {
    if (!firmId || !auditId) return;

    try {
      setLoading(true);
      setError("");

      const [
        firmResponse,
        auditResponse,
        answersResponse,
        findingsResponse,
        capasResponse,
      ] = await Promise.all([
        fetch(`/api/dora/firms?id=${encodeURIComponent(firmId)}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/dora/audits?id=${encodeURIComponent(auditId)}&firmId=${encodeURIComponent(firmId)}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/dora/audits/answers?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(auditId)}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/dora/audits/findings?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(auditId)}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/dora/audits/capa?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(auditId)}`,
          { cache: "no-store" }
        ),
      ]);

      const firmJson = await firmResponse.json();
      const auditJson = await auditResponse.json();
      const answersJson = await answersResponse.json();
      const findingsJson = await findingsResponse.json();
      const capasJson = await capasResponse.json();

      if (!firmResponse.ok || firmJson.success === false) {
        throw new Error(firmJson.error || "Firma bilgileri alınamadı.");
      }
      if (!auditResponse.ok || auditJson.success === false) {
        throw new Error(auditJson.error || "Denetim bilgileri alınamadı.");
      }
      if (!answersResponse.ok || answersJson.success === false) {
        throw new Error(answersJson.error || "Denetim sonuçları alınamadı.");
      }
      if (!findingsResponse.ok || findingsJson.success === false) {
        throw new Error(findingsJson.error || "Bulgular alınamadı.");
      }
      if (!capasResponse.ok || capasJson.success === false) {
        throw new Error(capasJson.error || "DÖF kayıtları alınamadı.");
      }

      setFirm(firmJson.firm ?? null);
      setAudit(auditJson.audit ?? null);
      setAnswers(
        Array.isArray(answersJson.answers)
          ? answersJson.answers
          : []
      );
      setFindings(
        Array.isArray(findingsJson.findings)
          ? findingsJson.findings
          : []
      );
      setCapas(
        Array.isArray(capasJson.capas)
          ? capasJson.capas
          : []
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA denetim raporu hazırlanamadı."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId, auditId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedAnswers = useMemo(
    () =>
      [...answers].sort(
        (a, b) =>
          Number(questionOf(a)?.sort_order ?? 0) -
          Number(questionOf(b)?.sort_order ?? 0)
      ),
    [answers]
  );

  const counts = useMemo(() => {
    const result = {
      total: answers.length,
      uygun: 0,
      kismen: 0,
      uygunsuz: 0,
      uygulanamaz: 0,
      answered: 0,
    };

    answers.forEach((answer) => {
      const status = String(answer.answer_status ?? "").toUpperCase();
      if (status) result.answered += 1;
      if (status === "UYGUN") result.uygun += 1;
      if (status === "KISMEN_UYGUN") result.kismen += 1;
      if (status === "UYGUNSUZ") result.uygunsuz += 1;
      if (status === "UYGULANAMAZ") result.uygulanamaz += 1;
    });

    return result;
  }, [answers]);

  const complianceScore = useMemo(() => {
    const applicable =
      counts.uygun +
      counts.kismen +
      counts.uygunsuz;

    if (applicable <= 0) return 0;

    return (
      ((counts.uygun + counts.kismen * 0.5) /
        applicable) *
      100
    );
  }, [counts]);

  const capaStats = useMemo(
    () => ({
      total: capas.length,
      open: capas.filter((item) => item.status === "ACIK").length,
      ongoing: capas.filter((item) => item.status === "DEVAM_EDIYOR").length,
      completed: capas.filter((item) => item.status === "TAMAMLANDI").length,
      closed: capas.filter((item) => item.status === "KAPALI").length,
    }),
    [capas]
  );

  const findingsByAnswer = useMemo(() => {
    const map = new Map<string, Finding[]>();
    findings.forEach((finding) => {
      const key = String(finding.answer_id ?? "");
      if (!key) return;
      map.set(key, [...(map.get(key) ?? []), finding]);
    });
    return map;
  }, [findings]);

  const capaByFinding = useMemo(() => {
    const map = new Map<string, Capa[]>();
    capas.forEach((capa) => {
      map.set(
        capa.finding_id,
        [...(map.get(capa.finding_id) ?? []), capa]
      );
    });
    return map;
  }, [capas]);

  async function downloadPdf() {
    const element = reportRef.current;
    if (!element || !audit) return;

    try {
      setPdfBusy(true);

      const [{ default: jsPDF }, { default: html2canvas }] =
        await Promise.all([
          import("jspdf"),
          import("html2canvas"),
        ]);

      const canvas = await html2canvas(element, {
        scale: 1.35,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: element.scrollWidth,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 7;
      const footer = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2 - footer;
      const imgData = canvas.toDataURL("image/jpeg", 0.93);
      const renderedHeight =
        (canvas.height * contentWidth) / canvas.width;
      const pages = Math.max(
        1,
        Math.ceil(renderedHeight / contentHeight)
      );

      for (let i = 0; i < pages; i += 1) {
        if (i > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin - i * contentHeight,
          contentWidth,
          renderedHeight,
          undefined,
          "FAST"
        );

        pdf.setFontSize(8);
        pdf.setTextColor(90);
        pdf.text(
          `DORA Bağımsız Denetim Raporu • ${audit.audit_no || audit.id}`,
          margin,
          pageHeight - 5
        );
        pdf.text(
          `Sayfa ${i + 1} / ${pages}`,
          pageWidth - margin,
          pageHeight - 5,
          { align: "right" }
        );
      }

      pdf.setProperties({
        title: `${audit.audit_no || "DORA"} - ${audit.title}`,
        subject: "DORA Bağımsız Denetim Raporu",
        author: audit.auditor_name || "DORA",
        creator: "D-SEC360 DORA",
      });

      const safeName = `${audit.audit_no || "DORA"}-${audit.title}`
        .replace(/[^\p{L}\p{N}_-]+/gu, "-")
        .replace(/-+/g, "-");

      pdf.save(`${safeName}-Denetim-Raporu.pdf`);
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "PDF oluşturulamadı."
      );
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) {
    return <main className="state">DORA denetim raporu hazırlanıyor...</main>;
  }

  if (error || !audit) {
    return (
      <main className="state errorState">
        <h2>Rapor hazırlanamadı</h2>
        <p>{error || "Denetim bulunamadı."}</p>
        <button onClick={() => router.back()}>Geri Dön</button>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="toolbar noPdf">
        <button className="ghost" onClick={() => router.back()}>
          ← Denetim Merkezine Dön
        </button>
        <div className="toolbarActions">
          <button className="ghost" onClick={() => window.print()}>
            Yazdır
          </button>
          <button
            className="primary"
            disabled={pdfBusy}
            onClick={() => void downloadPdf()}
          >
            {pdfBusy ? "PDF Hazırlanıyor..." : "PDF İndir"}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="report">
        <section className="cover">
          <div>
            <div className="brand">D-SEC360 • DORA</div>
            <h1>KURUMSAL İŞ SAĞLIĞI VE GÜVENLİĞİ DENETİM RAPORU</h1>
            <p>
              DORA Bağımsız Denetim Merkezi tarafından oluşturulan
              kurumsal saha denetim raporudur.
            </p>
          </div>
          <div className="coverNo">
            <span>Rapor / Denetim No</span>
            <strong>{audit.audit_no || "-"}</strong>
          </div>
        </section>

        <section className="section">
          <h2>1. Firma ve Denetim Bilgileri</h2>
          <div className="infoGrid">
            <Info label="Firma" value={firm?.firm_name || "-"} />
            <Info label="Sektör" value={firm?.sector || "-"} />
            <Info label="NACE Kodu" value={firm?.nace_code || "-"} />
            <Info label="Tehlike Sınıfı" value={firm?.danger_class || "-"} />
            <Info label="Çalışan Sayısı" value={String(firm?.employee_count ?? "-")} />
            <Info label="Firma Yetkilisi" value={firm?.authorized_person || "-"} />
            <Info label="Denetim" value={audit.title} />
            <Info label="Şablon" value={audit.template?.title || "-"} />
            <Info label="Denetim Tarihi" value={formatDate(audit.audit_date_millis)} />
            <Info label="Denetçi" value={audit.auditor_name || "-"} />
            <Info label="Denetçi Ünvanı" value={audit.auditor_title || "-"} />
            <Info label="Bölüm" value={audit.department || "-"} />
            <Info label="Lokasyon" value={audit.location || "-"} />
            <Info label="Kapsam" value={audit.scope || "-"} wide />
            <Info label="Durum" value={labelStatus(audit.status)} />
            <Info label="Tamamlanma" value={formatDate(audit.completed_at_millis)} />
          </div>
        </section>

        <section className="section">
          <h2>2. Denetim Özeti ve Uygunluk Skoru</h2>
          <div className="scoreRow">
            <div className="scoreCard heroScore">
              <span>Uygunluk Skoru</span>
              <strong>%{complianceScore.toFixed(1)}</strong>
            </div>
            <Score label="Toplam Madde" value={counts.total} />
            <Score label="Cevaplanan" value={counts.answered} />
            <Score label="Uygun" value={counts.uygun} />
            <Score label="Kısmen Uygun" value={counts.kismen} />
            <Score label="Uygunsuz" value={counts.uygunsuz} />
            <Score label="Uygulanamaz" value={counts.uygulanamaz} />
          </div>
          <div className="distribution">
            <Bar label="Uygun" value={counts.uygun} total={counts.total} className="ok" />
            <Bar label="Kısmen Uygun" value={counts.kismen} total={counts.total} className="partial" />
            <Bar label="Uygunsuz" value={counts.uygunsuz} total={counts.total} className="bad" />
            <Bar label="Uygulanamaz" value={counts.uygulanamaz} total={counts.total} className="na" />
          </div>
          <p className="method">
            Uygunluk skoru, uygulanabilir maddeler üzerinden Uygun=1,
            Kısmen Uygun=0,5 ve Uygunsuz=0 kabul edilerek hesaplanmıştır.
            Uygulanamaz maddeler skor paydasına dahil edilmemiştir.
          </p>
        </section>

        <section className="section pageBreakBefore">
          <h2>3. Denetim Sonuç Tablosu</h2>
          <p className="sectionIntro">
            Denetimdeki {sortedAnswers.length} maddenin tamamı aşağıda
            sonuç, mevzuat, mevcut durum ve önerilen aksiyonlarıyla gösterilmektedir.
          </p>
          <div className="tableWrap">
            <table className="auditTable">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Bölüm / Başlık</th>
                  <th>Denetim Sorusu</th>
                  <th>Beklenen Durum</th>
                  <th>Sonuç</th>
                  <th>Açıklama</th>
                  <th>Mevzuat</th>
                  <th>Önlem / Aksiyon</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {sortedAnswers.map((answer, index) => {
                  const q = questionOf(answer);
                  return (
                    <tr key={answer.id}>
                      <td>{q?.sort_order ?? index + 1}</td>
                      <td>
                        <strong>{q?.section_title || "-"}</strong>
                        <div>{q?.title || "-"}</div>
                      </td>
                      <td>{q?.question || "-"}</td>
                      <td>{q?.expected_condition || "-"}</td>
                      <td>
                        <span className={`pill pill-${answer.answer_status || "BOS"}`}>
                          {labelStatus(answer.answer_status || "BOŞ")}
                        </span>
                      </td>
                      <td>{answer.explanation || "-"}</td>
                      <td>{q?.legal_basis || "-"}</td>
                      <td>{answer.action_text || q?.precaution || "-"}</td>
                      <td>{labelStatus(q?.risk_level || "-")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section pageBreakBefore">
          <h2>4. Denetim Bulguları</h2>
          <div className="summaryLine">
            Toplam Bulgu: <strong>{findings.length}</strong>
          </div>
          {findings.length === 0 ? (
            <div className="empty">Denetime ait bulgu bulunmamaktadır.</div>
          ) : (
            <table className="detailTable">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Bulgu</th>
                  <th>Risk</th>
                  <th>Mevzuat</th>
                  <th>Öneri</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding, index) => (
                  <tr key={finding.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{finding.title}</strong>
                      <div>{finding.description || "-"}</div>
                    </td>
                    <td>{labelStatus(finding.risk_level)}</td>
                    <td>{finding.legal_basis || "-"}</td>
                    <td>{finding.recommendation || "-"}</td>
                    <td>{labelStatus(finding.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="section">
          <h2>5. DÖF Durumu</h2>
          <div className="scoreRow compact">
            <Score label="Toplam DÖF" value={capaStats.total} />
            <Score label="Açık" value={capaStats.open} />
            <Score label="Devam Eden" value={capaStats.ongoing} />
            <Score label="Tamamlanan" value={capaStats.completed} />
            <Score label="Kapalı" value={capaStats.closed} />
          </div>
          {capas.length === 0 ? (
            <div className="empty">Denetime ait DÖF bulunmamaktadır.</div>
          ) : (
            <table className="detailTable">
              <thead>
                <tr>
                  <th>No</th>
                  <th>DÖF</th>
                  <th>Bulgu</th>
                  <th>Öncelik</th>
                  <th>Düzeltici Faaliyet</th>
                  <th>Sorumlu</th>
                  <th>Termin</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {capas.map((capa, index) => {
                  const linkedFinding =
                    findings.find((f) => f.id === capa.finding_id);
                  return (
                    <tr key={capa.id}>
                      <td>{index + 1}</td>
                      <td><strong>{capa.title}</strong></td>
                      <td>{linkedFinding?.title || "-"}</td>
                      <td>{labelStatus(capa.priority)}</td>
                      <td>{capa.corrective_action || "-"}</td>
                      <td>{capa.responsible_person || "-"}</td>
                      <td>{formatDate(capa.due_date_millis)}</td>
                      <td>{labelStatus(capa.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="section pageBreakBefore">
          <h2>6. Mevzuat ve İyileştirme Önerileri</h2>
          <div className="legalGrid">
            {sortedAnswers
              .filter((answer) => {
                const q = questionOf(answer);
                return (
                  q?.legal_basis ||
                  q?.precaution ||
                  answer.action_text
                );
              })
              .map((answer, index) => {
                const q = questionOf(answer);
                return (
                  <article className="legalItem" key={answer.id}>
                    <div className="legalNo">
                      {q?.sort_order ?? index + 1}
                    </div>
                    <div>
                      <strong>{q?.title || q?.question || "Denetim Maddesi"}</strong>
                      <p><b>Mevzuat:</b> {q?.legal_basis || "-"}</p>
                      <p>
                        <b>Öneri / Önlem:</b>{" "}
                        {answer.action_text || q?.precaution || "-"}
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <section className="section">
          <h2>7. Sonuç ve Onay</h2>
          <p className="conclusion">
            Bu rapor, denetim tarihinde kayıt altına alınan saha gözlemleri,
            denetim cevapları, bulgular ve DORA DÖF kayıtları esas alınarak
            oluşturulmuştur. Tespit edilen uygunsuzlukların belirlenen
            düzeltici/önleyici faaliyetler doğrultusunda takip edilmesi ve
            kapatılan faaliyetlerin etkinliğinin doğrulanması gerekmektedir.
          </p>

          <div className="signatureGrid">
            <Signature
              title="Denetçi"
              name={audit.auditor_name || ""}
              subtitle={audit.auditor_title || ""}
            />
            <Signature
              title="Firma Yetkilisi"
              name={firm?.authorized_person || ""}
              subtitle=""
            />
            <Signature
              title="Onay / İmza"
              name=""
              subtitle=""
            />
          </div>
        </section>

        <footer className="reportFooter">
          D-SEC360 • DORA Bağımsız Denetim Merkezi • Oluşturma Tarihi:
          {" "}
          {new Date().toLocaleDateString("tr-TR")}
        </footer>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; }
        .page { min-height:100vh; background:#f3f4f6; padding:20px; color:#17202a; }
        .toolbar { max-width:1500px; margin:0 auto 14px; display:flex; justify-content:space-between; gap:12px; }
        .toolbarActions { display:flex; gap:10px; }
        button { border:0; border-radius:10px; padding:11px 16px; font-weight:800; cursor:pointer; }
        .primary { background:#7a2633; color:#fff; }
        .ghost { background:#fff; border:1px solid #d7dce2; color:#344054; }
        .state { min-height:60vh; display:grid; place-items:center; font-weight:800; }
        .errorState { align-content:center; gap:10px; }
        .report { max-width:1500px; margin:0 auto; background:#fff; padding:26px; box-shadow:0 8px 30px rgba(16,24,40,.08); }
        .cover { border-top:7px solid #7a2633; border-bottom:1px solid #d7dce2; padding:24px 4px 22px; display:flex; justify-content:space-between; gap:30px; align-items:flex-start; }
        .brand { color:#7a2633; font-weight:900; letter-spacing:.12em; font-size:13px; }
        h1 { font-size:25px; margin:8px 0 6px; }
        .cover p { color:#667085; margin:0; }
        .coverNo { min-width:230px; border:1px solid #d7dce2; border-radius:12px; padding:14px; }
        .coverNo span { display:block; color:#667085; font-size:11px; font-weight:800; text-transform:uppercase; }
        .coverNo strong { display:block; margin-top:5px; font-size:16px; }
        .section { margin-top:24px; }
        .section h2 { margin:0 0 12px; padding-bottom:8px; border-bottom:2px solid #7a2633; font-size:18px; }
        .sectionIntro,.method,.conclusion { color:#475467; line-height:1.55; }
        .infoGrid { display:grid; grid-template-columns:repeat(4,1fr); border:1px solid #e4e7ec; }
        .info { padding:10px 12px; border-right:1px solid #e4e7ec; border-bottom:1px solid #e4e7ec; min-height:62px; }
        .info.wide { grid-column:span 2; }
        .info span { display:block; color:#667085; font-size:10px; font-weight:800; text-transform:uppercase; }
        .info strong { display:block; margin-top:5px; font-size:13px; }
        .scoreRow { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; }
        .scoreRow.compact { grid-template-columns:repeat(5,1fr); margin-bottom:12px; }
        .scoreCard { border:1px solid #e4e7ec; border-radius:10px; padding:12px; background:#fafafa; }
        .scoreCard span { display:block; color:#667085; font-size:10px; font-weight:800; text-transform:uppercase; }
        .scoreCard strong { display:block; font-size:22px; margin-top:4px; }
        .heroScore { background:#7a2633; color:#fff; }
        .heroScore span { color:#f7dfe4; }
        .distribution { margin-top:14px; display:grid; gap:7px; }
        .barRow { display:grid; grid-template-columns:130px 1fr 60px; gap:10px; align-items:center; font-size:12px; font-weight:700; }
        .barTrack { height:10px; background:#eef0f3; border-radius:999px; overflow:hidden; }
        .barFill { height:100%; background:#667085; }
        .barFill.ok { background:#2e7d32; }
        .barFill.partial { background:#b7791f; }
        .barFill.bad { background:#b42318; }
        .barFill.na { background:#667085; }
        .tableWrap { width:100%; overflow:visible; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; }
        th { background:#f0f2f5; color:#344054; font-size:9px; text-transform:uppercase; text-align:left; padding:7px 6px; border:1px solid #dfe3e8; }
        td { font-size:9px; line-height:1.35; vertical-align:top; padding:6px; border:1px solid #e4e7ec; overflow-wrap:anywhere; }
        .auditTable th:nth-child(1) { width:3%; }
        .auditTable th:nth-child(2) { width:11%; }
        .auditTable th:nth-child(3) { width:17%; }
        .auditTable th:nth-child(4) { width:15%; }
        .auditTable th:nth-child(5) { width:8%; }
        .auditTable th:nth-child(6) { width:13%; }
        .auditTable th:nth-child(7) { width:13%; }
        .auditTable th:nth-child(8) { width:15%; }
        .auditTable th:nth-child(9) { width:5%; }
        .detailTable th,.detailTable td { font-size:10px; }
        .pill { display:inline-block; border-radius:999px; padding:3px 6px; font-size:8px; font-weight:900; }
        .pill-UYGUN { background:#e7f6ec; color:#176b37; }
        .pill-KISMEN_UYGUN { background:#fff3d6; color:#8a5a00; }
        .pill-UYGUNSUZ { background:#fde8e7; color:#a11d18; }
        .pill-UYGULANAMAZ { background:#eceff3; color:#475467; }
        .summaryLine { margin-bottom:10px; }
        .empty { padding:18px; border:1px dashed #cfd4dc; background:#fafafa; color:#667085; }
        .legalGrid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .legalItem { display:grid; grid-template-columns:34px 1fr; gap:8px; border:1px solid #e4e7ec; padding:9px; break-inside:avoid; }
        .legalNo { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:#7a2633; color:#fff; font-size:10px; font-weight:900; }
        .legalItem strong { font-size:11px; }
        .legalItem p { margin:4px 0 0; font-size:9px; color:#475467; line-height:1.4; }
        .signatureGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:38px; }
        .signature { min-height:120px; border-top:1px solid #98a2b3; padding-top:8px; text-align:center; }
        .signature strong { display:block; }
        .signature span { display:block; color:#667085; margin-top:4px; }
        .signature .signSpace { height:55px; }
        .reportFooter { margin-top:26px; padding-top:10px; border-top:1px solid #d7dce2; color:#667085; font-size:9px; text-align:center; }
        .pageBreakBefore { break-before:page; page-break-before:always; }

        @media (max-width:900px) {
          .page { padding:8px; }
          .report { padding:12px; }
          .infoGrid { grid-template-columns:1fr 1fr; }
          .scoreRow { grid-template-columns:repeat(2,1fr); }
          .legalGrid { grid-template-columns:1fr; }
          .cover { flex-direction:column; }
        }

        @media print {
          .noPdf { display:none !important; }
          .page { padding:0; background:#fff; }
          .report { box-shadow:none; max-width:none; padding:8mm; }
        }
      `}</style>
    </main>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`info ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Score({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="scoreCard">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percent =
    total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="barRow">
      <span>{label}</span>
      <div className="barTrack">
        <div
          className={`barFill ${className}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function Signature({
  title,
  name,
  subtitle,
}: {
  title: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="signature">
      <strong>{title}</strong>
      <span>{name || "Ad Soyad"}</span>
      <span>{subtitle}</span>
      <div className="signSpace" />
      <span>İmza</span>
    </div>
  );
}