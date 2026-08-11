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

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

export default function DoraAuditReportPage() {
  const params = useParams();
  const router = useRouter();

  const firmId = String(params?.firmId ?? "");
  const auditId = String(params?.auditId ?? "");

  const reportRef =
    useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [pdfBusy, setPdfBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [firm, setFirm] =
    useState<DoraFirm | null>(null);

  const [audit, setAudit] =
    useState<Audit | null>(null);

  const [answers, setAnswers] =
    useState<Answer[]>([]);

  const [findings, setFindings] =
    useState<Finding[]>([]);

  const [capas, setCapas] =
    useState<Capa[]>([]);

  const load =
    useCallback(async () => {
      if (!firmId || !auditId) {
        return;
      }

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
          fetch(
            `/api/dora/firms?id=${encodeURIComponent(
              firmId
            )}`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/dora/audits?id=${encodeURIComponent(
              auditId
            )}&firmId=${encodeURIComponent(
              firmId
            )}`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/dora/audits/answers?firmId=${encodeURIComponent(
              firmId
            )}&auditId=${encodeURIComponent(
              auditId
            )}`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/dora/audits/findings?firmId=${encodeURIComponent(
              firmId
            )}&auditId=${encodeURIComponent(
              auditId
            )}`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/dora/audits/capa?firmId=${encodeURIComponent(
              firmId
            )}&auditId=${encodeURIComponent(
              auditId
            )}`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

        const firmJson =
          await firmResponse.json();

        const auditJson =
          await auditResponse.json();

        const answersJson =
          await answersResponse.json();

        const findingsJson =
          await findingsResponse.json();

        const capasJson =
          await capasResponse.json();

        if (
          !firmResponse.ok ||
          firmJson.success === false
        ) {
          throw new Error(
            firmJson.error ||
              "Firma bilgileri alınamadı."
          );
        }

        if (
          !auditResponse.ok ||
          auditJson.success === false
        ) {
          throw new Error(
            auditJson.error ||
              "Denetim bilgileri alınamadı."
          );
        }

        if (
          !answersResponse.ok ||
          answersJson.success === false
        ) {
          throw new Error(
            answersJson.error ||
              "Denetim sonuçları alınamadı."
          );
        }

        if (
          !findingsResponse.ok ||
          findingsJson.success === false
        ) {
          throw new Error(
            findingsJson.error ||
              "Bulgular alınamadı."
          );
        }

        if (
          !capasResponse.ok ||
          capasJson.success === false
        ) {
          throw new Error(
            capasJson.error ||
              "DÖF kayıtları alınamadı."
          );
        }

        setFirm(
          firmJson.firm ??
            null
        );

        setAudit(
          auditJson.audit ??
            null
        );

        setAnswers(
          Array.isArray(
            answersJson.answers
          )
            ? answersJson.answers
            : []
        );

        setFindings(
          Array.isArray(
            findingsJson.findings
          )
            ? findingsJson.findings
            : []
        );

        setCapas(
          Array.isArray(
            capasJson.capas
          )
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
    }, [
      firmId,
      auditId,
    ]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedAnswers =
    useMemo(
      () =>
        [...answers].sort(
          (
            a,
            b
          ) =>
            Number(
              questionOf(
                a
              )
                ?.sort_order ??
                0
            ) -
            Number(
              questionOf(
                b
              )
                ?.sort_order ??
                0
            )
        ),
      [answers]
    );

  const counts =
    useMemo(() => {
      const result = {
        total:
          answers.length,
        uygun:
          0,
        kismen:
          0,
        uygunsuz:
          0,
        uygulanamaz:
          0,
        answered:
          0,
      };

      answers.forEach(
        (answer) => {
          const status =
            String(
              answer.answer_status ??
                ""
            ).toUpperCase();

          if (status) {
            result.answered +=
              1;
          }

          if (
            status ===
            "UYGUN"
          ) {
            result.uygun +=
              1;
          }

          if (
            status ===
            "KISMEN_UYGUN"
          ) {
            result.kismen +=
              1;
          }

          if (
            status ===
            "UYGUNSUZ"
          ) {
            result.uygunsuz +=
              1;
          }

          if (
            status ===
            "UYGULANAMAZ"
          ) {
            result.uygulanamaz +=
              1;
          }
        }
      );

      return result;
    }, [answers]);

  const complianceScore =
    useMemo(() => {
      const applicable =
        counts.uygun +
        counts.kismen +
        counts.uygunsuz;

      if (
        applicable <=
        0
      ) {
        return 0;
      }

      return (
        ((counts.uygun +
          counts.kismen *
            0.5) /
          applicable) *
        100
      );
    }, [counts]);

  const capaStats =
    useMemo(
      () => ({
        total:
          capas.length,

        open:
          capas.filter(
            (item) =>
              item.status ===
              "ACIK"
          ).length,

        ongoing:
          capas.filter(
            (item) =>
              item.status ===
              "DEVAM_EDIYOR"
          ).length,

        completed:
          capas.filter(
            (item) =>
              item.status ===
              "TAMAMLANDI"
          ).length,

        closed:
          capas.filter(
            (item) =>
              item.status ===
              "KAPALI"
          ).length,
      }),
      [capas]
    );

  const resultPages =
    useMemo(
      () =>
        chunk(
          sortedAnswers,
          14
        ),
      [sortedAnswers]
    );

  const findingPages =
    useMemo(
      () =>
        chunk(
          findings,
          14
        ),
      [findings]
    );

  const capaPages =
    useMemo(
      () =>
        chunk(
          capas,
          13
        ),
      [capas]
    );

  /*
   * Ayrı mevzuat/öneri bölümünde yalnızca
   * aksiyon gerektiren Kısmen Uygun ve Uygunsuz
   * maddeleri tekrar gösteriyoruz.
   *
   * 126 maddenin mevzuatı zaten ana sonuç tablosunda var.
   * Böylece rapor gereksiz yere 49+ sayfaya uzamıyor.
   */
  const improvementAnswers =
    useMemo(
      () =>
        sortedAnswers.filter(
          (answer) => {
            const status =
              String(
                answer.answer_status ??
                  ""
              ).toUpperCase();

            return (
              status ===
                "UYGUNSUZ" ||
              status ===
                "KISMEN_UYGUN"
            );
          }
        ),
      [sortedAnswers]
    );

  const improvementPages =
    useMemo(
      () =>
        chunk(
          improvementAnswers,
          18
        ),
      [improvementAnswers]
    );

  async function downloadPdf() {
    const container =
      reportRef.current;

    if (
      !container ||
      !audit
    ) {
      return;
    }

    try {
      setPdfBusy(true);

      const [
        {
          default:
            jsPDF,
        },
        {
          default:
            html2canvas,
        },
      ] =
        await Promise.all([
          import(
            "jspdf"
          ),

          import(
            "html2canvas"
          ),
        ]);

      const sheets =
        Array.from(
          container.querySelectorAll<HTMLElement>(
            ".pdfSheet"
          )
        );

      if (
        sheets.length ===
        0
      ) {
        throw new Error(
          "PDF sayfaları bulunamadı."
        );
      }

      const pdf =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      for (
        let pageIndex =
          0;
        pageIndex <
        sheets.length;
        pageIndex +=
          1
      ) {
        const sheet =
          sheets[
            pageIndex
          ];

        const canvas =
          await html2canvas(
            sheet,
            {
              scale:
                1.45,

              backgroundColor:
                "#ffffff",

              useCORS:
                true,

              allowTaint:
                false,

              logging:
                false,

              width:
                sheet.scrollWidth,

              height:
                sheet.scrollHeight,

              windowWidth:
                sheet.scrollWidth,

              windowHeight:
                sheet.scrollHeight,
            }
          );

        if (
          pageIndex >
          0
        ) {
          pdf.addPage();
        }

        const imgData =
          canvas.toDataURL(
            "image/jpeg",
            0.94
          );

        /*
         * Her HTML .pdfSheet tam bir A4 yatay sayfa olarak
         * oluşturulduğu için burada ekran görüntüsü kesme yok.
         * Başlık ve satırlar sayfa ortasında bölünmez.
         */
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          pageWidth,
          pageHeight,
          undefined,
          "FAST"
        );

        /*
         * jsPDF'in standart fontu Türkçe karakterlerde
         * bozulma üretebildiği için altbilgide sadece
         * ASCII metin kullanıyoruz.
         */
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          7
        );

        pdf.setTextColor(
          110
        );

        pdf.text(
          `DORA Denetim Raporu - ${audit.audit_no || audit.id}`,
          6,
          pageHeight -
            3
        );

        pdf.text(
          `Sayfa ${
            pageIndex +
            1
          } / ${
            sheets.length
          }`,
          pageWidth -
            6,
          pageHeight -
            3,
          {
            align:
              "right",
          }
        );
      }

      pdf.setProperties({
        title:
          `${
            audit.audit_no ||
            "DORA"
          } - ${
            audit.title
          }`,

        subject:
          "DORA Denetim Raporu",

        author:
          audit.auditor_name ||
          "DORA",

        creator:
          "D-SEC360 DORA",
      });

      const safeName =
        `${
          audit.audit_no ||
          "DORA"
        }-${
          audit.title
        }`
          .replace(
            /[^\p{L}\p{N}_-]+/gu,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          );

      pdf.save(
        `${safeName}-Denetim-Raporu.pdf`
      );
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
    return (
      <main className="state">
        DORA denetim raporu hazırlanıyor...
      </main>
    );
  }

  if (
    error ||
    !audit
  ) {
    return (
      <main className="state errorState">
        <h2>
          Rapor hazırlanamadı
        </h2>

        <p>
          {error ||
            "Denetim bulunamadı."}
        </p>

        <button
          onClick={() =>
            router.back()
          }
        >
          Geri Dön
        </button>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="toolbar noPdf">
        <button
          className="ghost"
          onClick={() =>
            router.back()
          }
        >
          ← Denetim Merkezine Dön
        </button>

        <div className="toolbarActions">
          <button
            className="ghost"
            onClick={() =>
              window.print()
            }
          >
            Yazdır
          </button>

          <button
            className="primary"
            disabled={
              pdfBusy
            }
            onClick={() =>
              void downloadPdf()
            }
          >
            {pdfBusy
              ? "PDF Hazırlanıyor..."
              : "PDF İndir"}
          </button>
        </div>
      </div>

      <div
        ref={
          reportRef
        }
        className="reportPages"
      >
        {/* ====================================================
            SAYFA 1 - Kapak + Firma / Denetim Bilgileri
        ==================================================== */}
        <PdfSheet
          pageTitle="Kurumsal Denetim Raporu"
          auditNo={
            audit.audit_no
          }
        >
          <section className="cover">
            <div className="coverText">
              <div className="brand">
                D-SEC360 • DORA
              </div>

              <h1>
                KURUMSAL İŞ SAĞLIĞI VE GÜVENLİĞİ
                <br />
                DENETİM RAPORU
              </h1>

              <p>
                DORA Bağımsız Denetim Merkezi tarafından oluşturulan
                kurumsal saha denetim raporudur.
              </p>
            </div>

            <div className="coverNo">
              <span>
                RAPOR / DENETİM NO
              </span>

              <strong>
                {audit.audit_no ||
                  "-"}
              </strong>
            </div>
          </section>

          <ReportSection
            title="1. Firma ve Denetim Bilgileri"
          >
            <div className="infoGrid">
              <Info
                label="Firma"
                value={
                  firm?.firm_name ||
                  "-"
                }
              />

              <Info
                label="Sektör"
                value={
                  firm?.sector ||
                  "-"
                }
              />

              <Info
                label="NACE Kodu"
                value={
                  firm?.nace_code ||
                  "-"
                }
              />

              <Info
                label="Tehlike Sınıfı"
                value={
                  firm?.danger_class ||
                  "-"
                }
              />

              <Info
                label="Çalışan Sayısı"
                value={String(
                  firm?.employee_count ??
                    "-"
                )}
              />

              <Info
                label="Firma Yetkilisi"
                value={
                  firm?.authorized_person ||
                  "-"
                }
              />

              <Info
                label="Denetim"
                value={
                  audit.title
                }
              />

              <Info
                label="Şablon"
                value={
                  audit.template
                    ?.title ||
                  "-"
                }
              />

              <Info
                label="Denetim Tarihi"
                value={formatDate(
                  audit.audit_date_millis
                )}
              />

              <Info
                label="Denetçi"
                value={
                  audit.auditor_name ||
                  "-"
                }
              />

              <Info
                label="Denetçi Ünvanı"
                value={
                  audit.auditor_title ||
                  "-"
                }
              />

              <Info
                label="Bölüm"
                value={
                  audit.department ||
                  "-"
                }
              />

              <Info
                label="Lokasyon"
                value={
                  audit.location ||
                  "-"
                }
              />

              <Info
                label="Kapsam"
                value={
                  audit.scope ||
                  "-"
                }
                wide
              />

              <Info
                label="Durum"
                value={labelStatus(
                  audit.status
                )}
              />

              <Info
                label="Tamamlanma"
                value={formatDate(
                  audit.completed_at_millis
                )}
              />
            </div>
          </ReportSection>

          <div className="compactSummary">
            <div className="compactScore">
              <span>UYGUNLUK</span>
              <strong>%{complianceScore.toFixed(1)}</strong>
            </div>

            <div className="compactMetrics">
              <Metric label="Toplam Madde" value={counts.total} />
              <Metric label="Uygun" value={counts.uygun} />
              <Metric label="Kısmen Uygun" value={counts.kismen} />
              <Metric label="Uygunsuz" value={counts.uygunsuz} />
              <Metric label="Uygulanamaz" value={counts.uygulanamaz} />
            </div>
          </div>

        </PdfSheet>

        {/* ====================================================
            DENETİM SONUÇLARI
        ==================================================== */}
        {/* ====================================================
            DENETİM SONUÇLARI - yoğunlaştırılmış sayfalama
        ==================================================== */}

        {resultPages.map(
          (
            pageAnswers,
            pageIndex
          ) => (
            <PdfSheet
              key={`result-${pageIndex}`}
              pageTitle="Denetim Sonuç Tablosu"
              auditNo={
                audit.audit_no
              }
            >
              <ReportSection
                title={`3. Denetim Sonuç Tablosu${
                  resultPages.length >
                  1
                    ? ` (${pageIndex + 1}/${resultPages.length})`
                    : ""
                }`}
              >
                {pageIndex ===
                  0 && (
                  <p className="sectionIntro">
                    Denetimdeki{" "}
                    <strong>
                      {
                        sortedAnswers.length
                      }
                    </strong>{" "}
                    maddenin tamamı aşağıda sonuç, mevzuat,
                    mevcut durum ve önerilen aksiyonlarıyla
                    gösterilmektedir.
                  </p>
                )}

                <table className="auditTable">
                  <thead>
                    <tr>
                      <th className="cNo">
                        No
                      </th>

                      <th className="cTitle">
                        Bölüm / Başlık
                      </th>

                      <th className="cQuestion">
                        Denetim Sorusu
                      </th>

                      <th className="cExpected">
                        Beklenen Durum
                      </th>

                      <th className="cResult">
                        Sonuç
                      </th>

                      <th className="cExplain">
                        Açıklama
                      </th>

                      <th className="cLegal">
                        Mevzuat
                      </th>

                      <th className="cAction">
                        Önlem / Aksiyon
                      </th>

                      <th className="cRisk">
                        Risk
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageAnswers.map(
                      (
                        answer,
                        localIndex
                      ) => {
                        const q =
                          questionOf(
                            answer
                          );

                        return (
                          <tr
                            key={
                              answer.id
                            }
                          >
                            <td>
                              {q?.sort_order ??
                                pageIndex *
                                  14 +
                                  localIndex +
                                  1}
                            </td>

                            <td>
                              <strong>
                                {q?.section_title ||
                                  "-"}
                              </strong>

                              <div className="subText">
                                {q?.title ||
                                  "-"}
                              </div>
                            </td>

                            <td>
                              {q?.question ||
                                "-"}
                            </td>

                            <td>
                              {q?.expected_condition ||
                                "-"}
                            </td>

                            <td className="center">
                              <span
                                className={`pill pill-${
                                  answer.answer_status ||
                                  "BOS"
                                }`}
                              >
                                {labelStatus(
                                  answer.answer_status ||
                                    "BOŞ"
                                )}
                              </span>
                            </td>

                            <td>
                              {answer.explanation ||
                                "-"}
                            </td>

                            <td>
                              {q?.legal_basis ||
                                "-"}
                            </td>

                            <td>
                              {answer.action_text ||
                                q?.precaution ||
                                "-"}
                            </td>

                            <td className="center">
                              {labelStatus(
                                q?.risk_level ||
                                  "-"
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </ReportSection>
            </PdfSheet>
          )
        )}

        {/* ====================================================
            BULGULAR
        ==================================================== */}
        {findingPages.length ===
        0 ? (
          <PdfSheet
            pageTitle="Denetim Bulguları"
            auditNo={
              audit.audit_no
            }
          >
            <ReportSection
              title="4. Denetim Bulguları"
            >
              <div className="empty">
                Denetime ait bulgu bulunmamaktadır.
              </div>
            </ReportSection>
          </PdfSheet>
        ) : (
          findingPages.map(
            (
              pageFindings,
              pageIndex
            ) => (
              <PdfSheet
                key={`finding-${pageIndex}`}
                pageTitle="Denetim Bulguları"
                auditNo={
                  audit.audit_no
                }
              >
                <ReportSection
                  title={`4. Denetim Bulguları${
                    findingPages.length >
                    1
                      ? ` (${pageIndex + 1}/${findingPages.length})`
                      : ""
                  }`}
                >
                  {pageIndex ===
                    0 && (
                    <div className="sectionSummary">
                      Toplam Bulgu:
                      <strong>
                        {
                          findings.length
                        }
                      </strong>
                    </div>
                  )}

                  <table className="detailTable findingsTable">
                    <thead>
                      <tr>
                        <th>
                          No
                        </th>

                        <th>
                          Bulgu
                        </th>

                        <th>
                          Risk
                        </th>

                        <th>
                          Mevzuat
                        </th>

                        <th>
                          Öneri
                        </th>

                        <th>
                          Durum
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageFindings.map(
                        (
                          finding,
                          localIndex
                        ) => (
                          <tr
                            key={
                              finding.id
                            }
                          >
                            <td>
                              {pageIndex *
                                14 +
                                localIndex +
                                1}
                            </td>

                            <td>
                              <strong>
                                {
                                  finding.title
                                }
                              </strong>

                              <div className="subText">
                                {finding.description ||
                                  "-"}
                              </div>
                            </td>

                            <td>
                              {labelStatus(
                                finding.risk_level
                              )}
                            </td>

                            <td>
                              {finding.legal_basis ||
                                "-"}
                            </td>

                            <td>
                              {finding.recommendation ||
                                "-"}
                            </td>

                            <td>
                              {labelStatus(
                                finding.status
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </ReportSection>
              </PdfSheet>
            )
          )
        )}

        {/* ====================================================
            DÖF
        ==================================================== */}
        {capaPages.length ===
        0 ? (
          <PdfSheet
            pageTitle="DÖF Durumu"
            auditNo={
              audit.audit_no
            }
          >
            <ReportSection
              title="5. DÖF Durumu"
            >
              <div className="empty">
                Denetime ait DÖF bulunmamaktadır.
              </div>
            </ReportSection>
          </PdfSheet>
        ) : (
          capaPages.map(
            (
              pageCapas,
              pageIndex
            ) => (
              <PdfSheet
                key={`capa-${pageIndex}`}
                pageTitle="DÖF Durumu"
                auditNo={
                  audit.audit_no
                }
              >
                <ReportSection
                  title={`5. DÖF Durumu${
                    capaPages.length >
                    1
                      ? ` (${pageIndex + 1}/${capaPages.length})`
                      : ""
                  }`}
                >
                  {pageIndex ===
                    0 && (
                    <div className="capaMetrics">
                      <Metric
                        label="Toplam DÖF"
                        value={
                          capaStats.total
                        }
                      />

                      <Metric
                        label="Açık"
                        value={
                          capaStats.open
                        }
                      />

                      <Metric
                        label="Devam Eden"
                        value={
                          capaStats.ongoing
                        }
                      />

                      <Metric
                        label="Tamamlanan"
                        value={
                          capaStats.completed
                        }
                      />

                      <Metric
                        label="Kapalı"
                        value={
                          capaStats.closed
                        }
                      />
                    </div>
                  )}

                  <table className="detailTable capaTable">
                    <thead>
                      <tr>
                        <th>
                          No
                        </th>

                        <th>
                          DÖF
                        </th>

                        <th>
                          Bulgu
                        </th>

                        <th>
                          Öncelik
                        </th>

                        <th>
                          Düzeltici Faaliyet
                        </th>

                        <th>
                          Sorumlu
                        </th>

                        <th>
                          Termin
                        </th>

                        <th>
                          Durum
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageCapas.map(
                        (
                          capa,
                          localIndex
                        ) => {
                          const linkedFinding =
                            findings.find(
                              (
                                finding
                              ) =>
                                finding.id ===
                                capa.finding_id
                            );

                          return (
                            <tr
                              key={
                                capa.id
                              }
                            >
                              <td>
                                {pageIndex *
                                  13 +
                                  localIndex +
                                  1}
                              </td>

                              <td>
                                <strong>
                                  {
                                    capa.title
                                  }
                                </strong>
                              </td>

                              <td>
                                {linkedFinding?.title ||
                                  "-"}
                              </td>

                              <td>
                                {labelStatus(
                                  capa.priority
                                )}
                              </td>

                              <td>
                                {capa.corrective_action ||
                                  "-"}
                              </td>

                              <td>
                                {capa.responsible_person ||
                                  "-"}
                              </td>

                              <td>
                                {formatDate(
                                  capa.due_date_millis
                                )}
                              </td>

                              <td>
                                {labelStatus(
                                  capa.status
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </ReportSection>
              </PdfSheet>
            )
          )
        )}

        {/* ====================================================
            MEVZUAT + İYİLEŞTİRME
        ==================================================== */}
        {improvementPages.length ===
        0 ? (
          <PdfSheet
            pageTitle="Mevzuat ve İyileştirme"
            auditNo={
              audit.audit_no
            }
          >
            <ReportSection
              title="6. Mevzuat ve İyileştirme Önerileri"
            >
              <div className="empty">
                Aksiyon gerektiren Kısmen Uygun veya Uygunsuz
                madde bulunmamaktadır.
              </div>
            </ReportSection>
          </PdfSheet>
        ) : (
          improvementPages.map(
            (
              pageItems,
              pageIndex
            ) => (
              <PdfSheet
                key={`improvement-${pageIndex}`}
                pageTitle="Mevzuat ve İyileştirme"
                auditNo={
                  audit.audit_no
                }
              >
                <ReportSection
                  title={`6. Mevzuat ve İyileştirme Önerileri${
                    improvementPages.length >
                    1
                      ? ` (${pageIndex + 1}/${improvementPages.length})`
                      : ""
                  }`}
                >
                  {pageIndex ===
                    0 && (
                    <p className="sectionIntro">
                      Bu bölüm, raporun tekrarını azaltmak amacıyla
                      yalnızca <strong>Kısmen Uygun</strong> ve{" "}
                      <strong>Uygunsuz</strong> maddelerin mevzuat ve
                      iyileştirme önerilerini içerir. Tüm 126 maddenin
                      mevzuatı 3. bölümde ayrıca yer almaktadır.
                    </p>
                  )}

                  <div className="legalGrid">
                    {pageItems.map(
                      (
                        answer
                      ) => {
                        const q =
                          questionOf(
                            answer
                          );

                        return (
                          <article
                            className="legalItem"
                            key={
                              answer.id
                            }
                          >
                            <div className="legalNo">
                              {q?.sort_order ||
                                "-"}
                            </div>

                            <div className="legalBody">
                              <div className="legalTitleRow">
                                <strong>
                                  {q?.title ||
                                    q?.question ||
                                    "Denetim Maddesi"}
                                </strong>

                                <span
                                  className={`pill pill-${
                                    answer.answer_status ||
                                    "BOS"
                                  }`}
                                >
                                  {labelStatus(
                                    answer.answer_status
                                  )}
                                </span>
                              </div>

                              <p>
                                <b>
                                  Mevzuat:
                                </b>{" "}
                                {q?.legal_basis ||
                                  "-"}
                              </p>

                              <p>
                                <b>
                                  Öneri / Önlem:
                                </b>{" "}
                                {answer.action_text ||
                                  q?.precaution ||
                                  "-"}
                              </p>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </ReportSection>
              </PdfSheet>
            )
          )
        )}

        {/* ====================================================
            SONUÇ + İMZA
        ==================================================== */}
        <PdfSheet
          pageTitle="Sonuç ve Onay"
          auditNo={
            audit.audit_no
          }
        >
          <ReportSection
            title="7. Sonuç ve Onay"
          >
            <div className="conclusionBox">
              <p>
                Bu rapor, denetim tarihinde kayıt altına alınan
                saha gözlemleri, denetim cevapları, bulgular ve
                DORA DÖF kayıtları esas alınarak oluşturulmuştur.
              </p>

              <p>
                Tespit edilen uygunsuzlukların belirlenen
                düzeltici/önleyici faaliyetler doğrultusunda
                takip edilmesi ve kapatılan faaliyetlerin
                etkinliğinin doğrulanması gerekmektedir.
              </p>

              <div className="finalMetrics">
                <div>
                  <span>
                    Uygunluk
                  </span>

                  <strong>
                    %
                    {complianceScore.toFixed(
                      1
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Bulgu
                  </span>

                  <strong>
                    {
                      findings.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    DÖF
                  </span>

                  <strong>
                    {
                      capas.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Kapalı DÖF
                  </span>

                  <strong>
                    {
                      capaStats.closed
                    }
                  </strong>
                </div>
              </div>
            </div>

            <div className="signatureGrid">
              <Signature
                title="Denetçi"
                name={
                  audit.auditor_name ||
                  ""
                }
                subtitle={
                  audit.auditor_title ||
                  ""
                }
              />

              <Signature
                title="Firma Yetkilisi"
                name={
                  firm?.authorized_person ||
                  ""
                }
                subtitle=""
              />

              <Signature
                title="Onay"
                name=""
                subtitle=""
              />
            </div>
          </ReportSection>
        </PdfSheet>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #eef0f3;
          padding: 20px;
          color: #17202a;
        }

        .toolbar {
          max-width: 1180px;
          margin: 0 auto 14px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .toolbarActions {
          display: flex;
          gap: 10px;
        }

        button {
          border: 0;
          border-radius: 10px;
          padding: 11px 16px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .primary {
          background: #7a2633;
          color: #fff;
        }

        .ghost {
          background: #fff;
          border: 1px solid #d7dce2;
          color: #344054;
        }

        .state {
          min-height: 60vh;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .errorState {
          align-content: center;
          gap: 10px;
        }

        .reportPages {
          display: grid;
          gap: 20px;
          justify-content: center;
        }

        :global(.pdfSheet) {
          width: 1120px;
          height: 792px;
          background: #fff;
          padding: 26px 30px 36px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(16, 24, 40, 0.08);
          font-family: Arial, "Helvetica Neue", sans-serif;
          color: #1f2937;
        }

        :global(.pdfSheetHeader) {
          height: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 4px solid #7a2633;
          padding-bottom: 5px;
          margin-bottom: 12px;
          font-size: 10px;
          color: #667085;
        }

        :global(.pdfSheetHeader strong) {
          color: #7a2633;
          letter-spacing: 0.08em;
        }

        :global(.pdfSheetFooter) {
          position: absolute;
          left: 30px;
          right: 30px;
          bottom: 12px;
          border-top: 1px solid #e4e7ec;
          padding-top: 7px;
          display: flex;
          justify-content: space-between;
          color: #98a2b3;
          font-size: 8px;
        }

        .cover {
          min-height: 132px;
          border-bottom: 1px solid #d7dce2;
          padding: 12px 0 14px;
          display: flex;
          justify-content: space-between;
          gap: 30px;
          align-items: flex-start;
        }

        .coverText {
          max-width: 700px;
        }

        .brand {
          color: #7a2633;
          font-weight: 900;
          letter-spacing: 0.12em;
          font-size: 12px;
        }

        h1 {
          font-size: 24px;
          line-height: 1.12;
          margin: 8px 0 7px;
          color: #1f2937;
        }

        .cover p {
          color: #667085;
          margin: 0;
          font-size: 12px;
          line-height: 1.55;
        }

        .coverNo {
          width: 245px;
          border: 1px solid #d7dce2;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }

        .coverNo span {
          display: block;
          color: #667085;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .coverNo strong {
          display: block;
          margin-top: 8px;
          font-size: 16px;
          word-break: break-word;
        }

        :global(.reportSection) {
          margin-top: 11px;
        }

        :global(.reportSectionTitle) {
          margin: 0 0 8px;
          padding-bottom: 5px;
          border-bottom: 2px solid #7a2633;
          font-size: 16px;
          line-height: 1.25;
          color: #2b3038;
        }

        .sectionIntro {
          color: #667085;
          line-height: 1.4;
          font-size: 10px;
          margin: -2px 0 10px;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid #e4e7ec;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }

        :global(.infoCell) {
          padding: 10px 12px;
          border-right: 1px solid #e4e7ec;
          border-bottom: 1px solid #e4e7ec;
          min-height: 62px;
        }

        :global(.infoCell:nth-child(4n)) {
          border-right: 0;
        }

        :global(.infoCell.wide) {
          grid-column: span 2;
        }

        :global(.infoCell span) {
          display: block;
          color: #667085;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        :global(.infoCell strong) {
          display: block;
          color: #1f2937;
          font-size: 11px;
          line-height: 1.25;
          word-break: break-word;
        }


        .compactSummary {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 8px;
          border-top: 1px solid #e4e7ec;
          padding-top: 10px;
        }

        .compactScore {
          background: #7a2633;
          color: #fff;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 74px;
        }

        .compactScore span {
          color: #f6dbe0;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .compactScore strong {
          font-size: 26px;
          margin-top: 4px;
        }

        .compactMetrics {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 7px;
        }

        .summaryHero {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
        }

        .heroScore {
          background: #7a2633;
          color: #fff;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 125px;
        }

        .heroScore span {
          color: #f6dbe0;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .heroScore strong {
          font-size: 36px;
          margin-top: 8px;
        }

        .summaryMetrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }

        :global(.metricCard) {
          border: 1px solid #e4e7ec;
          border-radius: 10px;
          background: #fafafa;
          padding: 9px 10px;
          min-height: 50px;
        }

        :global(.metricCard span) {
          display: block;
          color: #667085;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        :global(.metricCard strong) {
          display: block;
          font-size: 18px;
          margin-top: 3px;
          color: #1f2937;
        }

        .distributionCard {
          margin-top: 14px;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 14px 16px;
        }

        .distributionCard h3 {
          font-size: 12px;
          margin: 0 0 10px;
        }

        :global(.barRow) {
          display: grid;
          grid-template-columns: 120px 1fr 50px;
          gap: 9px;
          align-items: center;
          font-size: 9px;
          font-weight: 800;
          margin-top: 7px;
        }

        :global(.barTrack) {
          height: 9px;
          background: #eef0f3;
          border-radius: 999px;
          overflow: hidden;
        }

        :global(.barFill) {
          height: 100%;
          background: #667085;
        }

        :global(.barFill.ok) {
          background: #2e7d32;
        }

        :global(.barFill.partial) {
          background: #b7791f;
        }

        :global(.barFill.bad) {
          background: #b42318;
        }

        :global(.barFill.na) {
          background: #667085;
        }

        .methodBox {
          margin-top: 14px;
          background: #f8f9fb;
          border-left: 4px solid #7a2633;
          padding: 12px 14px;
          font-size: 9px;
          line-height: 1.45;
          color: #475467;
        }

        .methodBox strong {
          color: #1f2937;
        }

        .methodBox p {
          margin: 5px 0 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        th {
          background: #f1f3f6;
          color: #475467;
          font-size: 6.6px;
          line-height: 1.12;
          text-transform: uppercase;
          text-align: left;
          padding: 3px 3px;
          border: 1px solid #dfe3e8;
          overflow-wrap: anywhere;
        }

        td {
          font-size: 6.6px;
          line-height: 1.18;
          vertical-align: top;
          padding: 3px;
          border: 1px solid #e4e7ec;
          overflow-wrap: anywhere;
        }

        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .auditTable .cNo {
          width: 3%;
        }

        .auditTable .cTitle {
          width: 11%;
        }

        .auditTable .cQuestion {
          width: 16%;
        }

        .auditTable .cExpected {
          width: 15%;
        }

        .auditTable .cResult {
          width: 8%;
        }

        .auditTable .cExplain {
          width: 13%;
        }

        .auditTable .cLegal {
          width: 13%;
        }

        .auditTable .cAction {
          width: 16%;
        }

        .auditTable .cRisk {
          width: 5%;
        }

        .center {
          text-align: center;
        }

        .subText {
          color: #667085;
          margin-top: 3px;
        }

        :global(.pill) {
          display: inline-block;
          border-radius: 999px;
          padding: 3px 6px;
          font-size: 6.5px;
          line-height: 1.1;
          font-weight: 900;
          white-space: nowrap;
        }

        :global(.pill-UYGUN) {
          background: #e7f6ec;
          color: #176b37;
        }

        :global(.pill-KISMEN_UYGUN) {
          background: #fff3d6;
          color: #8a5a00;
        }

        :global(.pill-UYGUNSUZ) {
          background: #fde8e7;
          color: #a11d18;
        }

        :global(.pill-UYGULANAMAZ) {
          background: #eceff3;
          color: #475467;
        }

        .sectionSummary {
          display: flex;
          gap: 6px;
          align-items: baseline;
          font-size: 10px;
          margin-bottom: 10px;
          color: #667085;
        }

        .sectionSummary strong {
          font-size: 18px;
          color: #1f2937;
        }

        .detailTable th,
        .detailTable td {
          font-size: 7px;
          line-height: 1.2;
        }

        .findingsTable th:nth-child(1) {
          width: 5%;
        }

        .findingsTable th:nth-child(2) {
          width: 34%;
        }

        .findingsTable th:nth-child(3) {
          width: 9%;
        }

        .findingsTable th:nth-child(4) {
          width: 18%;
        }

        .findingsTable th:nth-child(5) {
          width: 24%;
        }

        .findingsTable th:nth-child(6) {
          width: 10%;
        }

        .capaMetrics {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }

        .capaTable th:nth-child(1) {
          width: 4%;
        }

        .capaTable th:nth-child(2) {
          width: 17%;
        }

        .capaTable th:nth-child(3) {
          width: 15%;
        }

        .capaTable th:nth-child(4) {
          width: 8%;
        }

        .capaTable th:nth-child(5) {
          width: 26%;
        }

        .capaTable th:nth-child(6) {
          width: 12%;
        }

        .capaTable th:nth-child(7) {
          width: 9%;
        }

        .capaTable th:nth-child(8) {
          width: 9%;
        }

        .empty {
          padding: 22px;
          border: 1px dashed #cfd4dc;
          background: #fafafa;
          color: #667085;
          border-radius: 10px;
          font-size: 10px;
        }

        .legalGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .legalItem {
          display: grid;
          grid-template-columns: 30px 1fr;
          gap: 8px;
          border: 1px solid #e4e7ec;
          border-radius: 6px;
          padding: 6px;
          min-height: 58px;
          background: #fff;
        }

        .legalNo {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #7a2633;
          color: #fff;
          font-size: 8px;
          font-weight: 900;
        }

        .legalBody {
          min-width: 0;
        }

        .legalTitleRow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 7px;
        }

        .legalTitleRow strong {
          font-size: 9px;
          line-height: 1.25;
        }

        .legalItem p {
          margin: 3px 0 0;
          font-size: 7px;
          color: #475467;
          line-height: 1.35;
        }

        .conclusionBox {
          background: #fafafa;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 20px;
          font-size: 11px;
          line-height: 1.6;
          color: #475467;
        }

        .conclusionBox p {
          margin: 0 0 9px;
        }

        .finalMetrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
          margin-top: 18px;
        }

        .finalMetrics > div {
          background: #fff;
          border: 1px solid #e4e7ec;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .finalMetrics span {
          display: block;
          font-size: 8px;
          font-weight: 900;
          color: #667085;
          text-transform: uppercase;
        }

        .finalMetrics strong {
          display: block;
          margin-top: 4px;
          font-size: 20px;
          color: #1f2937;
        }

        .signatureGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 36px;
          margin-top: 70px;
        }

        :global(.signatureBox) {
          border-top: 1px solid #98a2b3;
          padding-top: 10px;
          text-align: center;
          min-height: 125px;
        }

        :global(.signatureBox strong) {
          display: block;
          font-size: 11px;
          color: #1f2937;
        }

        :global(.signatureBox span) {
          display: block;
          color: #667085;
          margin-top: 4px;
          font-size: 9px;
        }

        :global(.signSpace) {
          height: 58px;
        }

        @media print {
          .noPdf {
            display: none !important;
          }

          .page {
            padding: 0;
            background: #fff;
          }

          .reportPages {
            gap: 0;
          }

          :global(.pdfSheet) {
            box-shadow: none;
            page-break-after: always;
            break-after: page;
          }
        }

        @media (max-width: 1180px) {
          .page {
            overflow-x: auto;
          }

          .toolbar {
            min-width: 1120px;
          }
        }
      `}</style>
    </main>
  );
}

function PdfSheet({
  children,
  pageTitle,
  auditNo,
}: {
  children:
    React.ReactNode;

  pageTitle:
    string;

  auditNo?:
    string | null;
}) {
  return (
    <section className="pdfSheet">
      <header className="pdfSheetHeader">
        <strong>
          D-SEC360 • DORA
        </strong>

        <span>
          {pageTitle}
        </span>
      </header>

      {children}

      <footer className="pdfSheetFooter">
        <span>
          DORA Bağımsız Denetim Merkezi
        </span>

        <span>
          {auditNo ||
            "DORA Denetim Raporu"}
        </span>
      </footer>
    </section>
  );
}

function ReportSection({
  title,
  children,
}: {
  title:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section className="reportSection">
      <h2 className="reportSectionTitle">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label:
    string;

  value:
    string;

  wide?:
    boolean;
}) {
  return (
    <div
      className={`infoCell ${
        wide
          ? "wide"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="metricCard">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  className,
}: {
  label:
    string;

  value:
    number;

  total:
    number;

  className:
    string;
}) {
  const percent =
    total > 0
      ? Math.min(
          100,
          (value /
            total) *
            100
        )
      : 0;

  return (
    <div className="barRow">
      <span>
        {label}
      </span>

      <div className="barTrack">
        <div
          className={`barFill ${className}`}
          style={{
            width:
              `${percent}%`,
          }}
        />
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Signature({
  title,
  name,
  subtitle,
}: {
  title:
    string;

  name:
    string;

  subtitle:
    string;
}) {
  return (
    <div className="signatureBox">
      <strong>
        {title}
      </strong>

      <span>
        {name ||
          "Ad Soyad"}
      </span>

      {subtitle && (
        <span>
          {subtitle}
        </span>
      )}

      <div className="signSpace" />

      <span>
        İmza
      </span>
    </div>
  );
}