import { createClient } from "@supabase/supabase-js";
import {
  Archive,
  FileCheck2,
  FileText,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RiskDocument = {
  id: string;
  firm_id: string;
  assessment_remote_id: string;
  document_title: string;
  risk_method: string;
  assessment_date: string | null;
  prepared_by: string | null;
  revision_no: number;
  total_item_count: number;
  critical_count: number;
  open_dof_count: number;
  generated_pdf_url: string | null;
  signed_pdf_url: string | null;
  report_status: string;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function methodLabel(
  value: string
): string {
  const key =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (key.includes("KINNEY")) {
    return "Fine-Kinney";
  }

  if (
    key.includes("5X5") ||
    key.includes("MATRIX")
  ) {
    return "5×5 Matris";
  }

  return value || "-";
}

function dateText(
  value: string | null
): string {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? "-"
    : new Intl.DateTimeFormat(
        "tr-TR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      ).format(date);
}

export default async function RiskDocumentsPage() {
  const { data, error } =
    await getSupabase()
      .from("risk_document_archive")
      .select("*")
      .order("assessment_date", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const records =
    (data ?? []) as RiskDocument[];

  const fineKinney =
    records.filter((record) =>
      record.risk_method
        .toUpperCase()
        .includes("KINNEY")
    ).length;

  const matrix =
    records.filter((record) => {
      const method =
        record.risk_method
          .toUpperCase();

      return (
        method.includes("5X5") ||
        method.includes("MATRIX")
      );
    }).length;

  const pdfReady =
    records.filter(
      (record) =>
        Boolean(
          record.generated_pdf_url
        )
    ).length;

  const kpis = [
    {
      label: "Toplam Arşiv",
      value: records.length,
      icon: Archive,
    },
    {
      label: "Fine-Kinney",
      value: fineKinney,
      icon: ShieldAlert,
    },
    {
      label: "5×5 Matris",
      value: matrix,
      icon: FileText,
    },
    {
      label: "PDF Hazır",
      value: pdfReady,
      icon: FileCheck2,
    },
  ];

  return (
    <main className="riskArchivePage">
      <section className="riskArchiveHero">
        <small>
          D-SEC DOKÜMANTASYON
        </small>

        <h1>
          Risk Dokümanları
        </h1>

        <p>
          Tamamlanan Fine-Kinney ve 5×5
          risk değerlendirmelerini
          kurumsal doküman arşivinde
          görüntüleyin.
        </p>
      </section>

      <section className="riskArchiveKpis">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="riskKpi"
            >
              <span>
                <Icon size={21} />
              </span>

              <div>
                <small>
                  {item.label}
                </small>
                <strong>
                  {item.value}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="riskArchiveTableCard">
        <header>
          <div>
            <h2>
              Risk Değerlendirmesi Arşivi
            </h2>
            <p>
              Risk Modülü’nde tamamlanan
              değerlendirmelerin salt okunur
              doküman kayıtları.
            </p>
          </div>

          <b>
            {records.length} kayıt
          </b>
        </header>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Doküman Adı</th>
                <th>Yöntem</th>
                <th>Tarih</th>
                <th>Revizyon</th>
                <th>Madde</th>
                <th>Kritik</th>
                <th>Açık DÖF</th>
                <th>Belge</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="emptyCell"
                  >
                    Henüz arşiv kaydı
                    bulunmuyor.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>
                        {record.document_title}
                      </strong>
                      <small>
                        {record.prepared_by ||
                          "Hazırlayan belirtilmedi"}
                      </small>
                    </td>

                    <td>
                      <span className="methodChip">
                        {methodLabel(
                          record.risk_method
                        )}
                      </span>
                    </td>

                    <td>
                      {dateText(
                        record.assessment_date
                      )}
                    </td>

                    <td>
                      Rev.{" "}
                      {record.revision_no}
                    </td>

                    <td>
                      {record.total_item_count}
                    </td>

                    <td>
                      <strong className="critical">
                        {record.critical_count}
                      </strong>
                    </td>

                    <td>
                      {record.open_dof_count}
                    </td>

                    <td>
                      <span
                        className={
                          record.signed_pdf_url
                            ? "status signed"
                            : record.generated_pdf_url
                              ? "status pdf"
                              : "status pending"
                        }
                      >
                        {record.signed_pdf_url
                          ? "İmzalı"
                          : record.generated_pdf_url
                            ? "PDF Hazır"
                            : "Bekliyor"}
                      </span>
                    </td>

                    <td>
                      <a
                        href={`/admin/documentation/risk-documents/${record.id}`}
                      >
                        Aç
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .riskArchivePage{
          display:grid;
          gap:18px;
          color:#172033;
        }

        .riskArchiveHero{
          padding:30px 32px;
          border-radius:26px;
          color:#fff;
          background:
            radial-gradient(
              circle at 100% 0,
              rgba(255,170,40,.28),
              transparent 34%
            ),
            linear-gradient(
              120deg,
              #5d1117,
              #981d25 58%,
              #d36f13
            );
          box-shadow:
            0 18px 45px
            rgba(91,17,23,.2);
        }

        .riskArchiveHero small{
          font-size:11px;
          font-weight:900;
          letter-spacing:1px;
        }

        .riskArchiveHero h1{
          margin:13px 0 8px;
          font-size:38px;
          line-height:1;
        }

        .riskArchiveHero p{
          max-width:760px;
          margin:0;
          opacity:.88;
          font-size:15px;
          line-height:1.55;
        }

        .riskArchiveKpis{
          display:grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap:12px;
        }

        .riskKpi{
          display:flex;
          align-items:center;
          gap:13px;
          padding:18px;
          border:1px solid #e5e7eb;
          border-radius:18px;
          background:#fff;
          box-shadow:
            0 8px 24px
            rgba(15,23,42,.06);
        }

        .riskKpi>span{
          width:46px;
          height:46px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          border-radius:14px;
          color:#8f1d22;
          background:#fff0f0;
        }

        .riskKpi small{
          display:block;
          color:#7a8494;
          font-size:10px;
          font-weight:850;
          text-transform:uppercase;
        }

        .riskKpi strong{
          display:block;
          margin-top:3px;
          font-size:27px;
        }

        .riskArchiveTableCard{
          overflow:hidden;
          border:1px solid #e4e7ec;
          border-radius:20px;
          background:#fff;
          box-shadow:
            0 12px 36px
            rgba(15,23,42,.07);
        }

        .riskArchiveTableCard>header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          padding:20px 22px;
          border-bottom:1px solid #eaecf0;
          background:
            linear-gradient(
              180deg,
              #fff,
              #fbfcfe
            );
        }

        .riskArchiveTableCard h2{
          margin:0 0 5px;
          font-size:19px;
        }

        .riskArchiveTableCard p{
          margin:0;
          color:#7a8494;
          font-size:12px;
        }

        .riskArchiveTableCard header b{
          padding:8px 11px;
          border-radius:999px;
          color:#8f1d22;
          background:#fff0f0;
          font-size:11px;
        }

        .tableWrap{
          overflow-x:auto;
        }

        table{
          width:100%;
          border-collapse:collapse;
          font-size:12px;
        }

        th{
          padding:12px 14px;
          color:#667085;
          background:#f7f8fa;
          text-align:left;
          font-size:9px;
          font-weight:900;
          letter-spacing:.45px;
          text-transform:uppercase;
          white-space:nowrap;
        }

        td{
          padding:14px;
          border-top:1px solid #eef0f3;
          vertical-align:middle;
        }

        tbody tr:hover td{
          background:#fbfcfe;
        }

        td:first-child strong,
        td:first-child small{
          display:block;
        }

        td:first-child small{
          margin-top:4px;
          color:#8a94a5;
          font-size:10px;
        }

        .methodChip,
        .status{
          display:inline-flex;
          padding:6px 9px;
          border-radius:999px;
          font-size:9px;
          font-weight:850;
          white-space:nowrap;
        }

        .methodChip{
          color:#7a1d22;
          background:#fff0f0;
        }

        .status.signed{
          color:#16753b;
          background:#eaf8ef;
        }

        .status.pdf{
          color:#2357b7;
          background:#edf3ff;
        }

        .status.pending{
          color:#a15b06;
          background:#fff6df;
        }

        .critical{
          color:#b42318;
        }

        td a{
          display:inline-flex;
          padding:7px 11px;
          border:1px solid #8f1d22;
          border-radius:9px;
          color:#8f1d22;
          font-weight:850;
          text-decoration:none;
        }

        .emptyCell{
          padding:36px;
          color:#7a8494;
          text-align:center;
        }

        @media(max-width:900px){
          .riskArchiveKpis{
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width:600px){
          .riskArchiveHero{
            padding:23px;
          }

          .riskArchiveHero h1{
            font-size:30px;
          }

          .riskArchiveKpis{
            grid-template-columns:1fr;
          }
        }
      `}</style>
    </main>
  );
}