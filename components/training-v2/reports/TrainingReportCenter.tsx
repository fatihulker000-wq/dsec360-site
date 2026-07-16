"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./TrainingReportCenter.module.css";

export type ReportTrainingItem = {
  id: string;
  title: string;
  type: string;
  assigned_count: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  video_count: number;
  pre_exam_count: number;
  final_exam_count: number;
  duration_minutes: number | null;
};

type AuditRecord = {
  assignment_id: string;
  training_id: string;
  training_title: string;
  employee_name: string;
  company_name: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  evidence_score: number;
  final_exam_score: number | null;
  final_exam_passed: boolean | null;
  certificate_no: string | null;
};

type CertificateRecord = {
  id: string;
  training_id: string;
  certificate_no: string;
  status: string;
  issued_at: string;
  valid_until: string | null;
  training_title: string;
  employee_name: string;
  company_name: string | null;
  revision_no: number;
};

type Props = {
  trainings: ReportTrainingItem[];
  totalEmployees: number;
  selectedCompanyName: string;
};

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("tr-TR");
}

function inDateRange(
  value: string | null | undefined,
  from: string,
  to: string
) {
  if (!value) return !from && !to;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;

  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    if (time < fromTime) return false;
  }

  if (to) {
    const toTime = new Date(`${to}T23:59:59`).getTime();
    if (time > toTime) return false;
  }

  return true;
}

export default function TrainingReportCenter({
  trainings,
  totalEmployees,
  selectedCompanyName,
}: Props) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [certificates, setCertificates] = useState<
    CertificateRecord[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trainingId, setTrainingId] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [auditResponse, certificateResponse] =
        await Promise.all([
          fetch("/api/admin/training-audit?limit=500", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/admin/training-certificates-v2", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

      const auditJson = await auditResponse
        .json()
        .catch(() => ({}));
      const certificateJson = await certificateResponse
        .json()
        .catch(() => ({}));

      if (!auditResponse.ok) {
        throw new Error(
          auditJson?.error || "Audit kayıtları alınamadı."
        );
      }

      if (!certificateResponse.ok) {
        throw new Error(
          certificateJson?.error ||
            "Sertifika kayıtları alınamadı."
        );
      }

      setAudits(
        Array.isArray(auditJson?.data) ? auditJson.data : []
      );
      setCertificates(
        Array.isArray(certificateJson?.data)
          ? certificateJson.data
          : []
      );
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Rapor verileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAudits = useMemo(
    () =>
      audits.filter(
        (row) =>
          (trainingId === "ALL" ||
            row.training_id === trainingId) &&
          inDateRange(
            row.completed_at || row.created_at,
            fromDate,
            toDate
          )
      ),
    [audits, fromDate, toDate, trainingId]
  );

  const filteredCertificates = useMemo(
    () =>
      certificates.filter(
        (row) =>
          (trainingId === "ALL" ||
            row.training_id === trainingId) &&
          inDateRange(row.issued_at, fromDate, toDate)
      ),
    [certificates, fromDate, toDate, trainingId]
  );

  const filteredTrainings = useMemo(
    () =>
      trainingId === "ALL"
        ? trainings
        : trainings.filter((row) => row.id === trainingId),
    [trainingId, trainings]
  );

  const metrics = useMemo(() => {
    const assigned = filteredTrainings.reduce(
      (sum, row) => sum + row.assigned_count,
      0
    );
    const completed = filteredTrainings.reduce(
      (sum, row) => sum + row.completed_count,
      0
    );
    const inProgress = filteredTrainings.reduce(
      (sum, row) => sum + row.in_progress_count,
      0
    );
    const notStarted = filteredTrainings.reduce(
      (sum, row) => sum + row.not_started_count,
      0
    );

    const examRows = filteredAudits.filter(
      (row) => row.final_exam_score != null
    );
    const averageScore =
      examRows.length > 0
        ? Math.round(
            examRows.reduce(
              (sum, row) =>
                sum + Number(row.final_exam_score || 0),
              0
            ) / examRows.length
          )
        : 0;

    const averageEvidence =
      filteredAudits.length > 0
        ? Math.round(
            filteredAudits.reduce(
              (sum, row) => sum + row.evidence_score,
              0
            ) / filteredAudits.length
          )
        : 0;

    return {
      assigned,
      completed,
      inProgress,
      notStarted,
      completionRate: percent(completed, assigned),
      averageScore,
      averageEvidence,
      certificateCount: filteredCertificates.length,
      certificateRate: percent(
        filteredCertificates.filter(
          (row) => row.status !== "REVOKED"
        ).length,
        completed
      ),
    };
  }, [
    filteredAudits,
    filteredCertificates,
    filteredTrainings,
  ]);

  const trainingRows = useMemo(
    () =>
      filteredTrainings
        .map((row) => ({
          ...row,
          completionRate: percent(
            row.completed_count,
            row.assigned_count
          ),
        }))
        .sort(
          (first, second) =>
            second.completionRate - first.completionRate
        ),
    [filteredTrainings]
  );

  const exportExcel = async () => {
    const XLSX = await import("xlsx");

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        Firma: selectedCompanyName,
        "Toplam Çalışan": totalEmployees,
        "Toplam Eğitim": filteredTrainings.length,
        "Toplam Atama": metrics.assigned,
        Tamamlanan: metrics.completed,
        "Devam Eden": metrics.inProgress,
        Başlamayan: metrics.notStarted,
        "Tamamlama Oranı": `%${metrics.completionRate}`,
        "Ortalama Final": metrics.averageScore,
        "Kanıt Skoru": `%${metrics.averageEvidence}`,
        "Sertifika Sayısı": metrics.certificateCount,
      },
    ]);

    const trainingSheet = XLSX.utils.json_to_sheet(
      trainingRows.map((row) => ({
        Eğitim: row.title,
        Tür: row.type,
        Süre: row.duration_minutes || 0,
        Atanan: row.assigned_count,
        Tamamlanan: row.completed_count,
        "Devam Eden": row.in_progress_count,
        Başlamayan: row.not_started_count,
        "Tamamlama Oranı": `%${row.completionRate}`,
        Video: row.video_count,
        "Ön Sınav": row.pre_exam_count,
        Final: row.final_exam_count,
      }))
    );

    const auditSheet = XLSX.utils.json_to_sheet(
      filteredAudits.map((row) => ({
        Çalışan: row.employee_name,
        Eğitim: row.training_title,
        Firma: row.company_name,
        Durum: row.status,
        "Tamamlanma Tarihi": formatDate(row.completed_at),
        "Final Puanı": row.final_exam_score ?? "",
        "Kanıt Skoru": row.evidence_score,
        "Sertifika No": row.certificate_no || "",
      }))
    );

    const certificateSheet = XLSX.utils.json_to_sheet(
      filteredCertificates.map((row) => ({
        "Belge No": row.certificate_no,
        Çalışan: row.employee_name,
        Eğitim: row.training_title,
        Firma: row.company_name || "",
        Durum: row.status,
        "Düzenlenme Tarihi": formatDate(row.issued_at),
        "Geçerlilik Tarihi": formatDate(row.valid_until),
        Revizyon: row.revision_no,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Yönetici Özeti"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      trainingSheet,
      "Eğitim Performansı"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      auditSheet,
      "Kanıt Kayıtları"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      certificateSheet,
      "Sertifikalar"
    );

    XLSX.writeFile(
      workbook,
      `DSEC_Egitim_Raporu_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  return (
    <section className={styles.report} id="training-report-center">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Executive Report Center
          </span>
          <h2>Kurumsal Eğitim Rapor Merkezi</h2>
          <p>
            Eğitim, sınav, sertifika ve kanıt performansını
            denetime hazır tek raporda birleştirin.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Yenileniyor..." : "Yenile"}
          </button>
          <button
            type="button"
            onClick={() => void exportExcel()}
          >
            Excel İndir
          </button>
          <button
            type="button"
            onClick={() => window.print()}
          >
            PDF / Yazdır
          </button>
        </div>
      </header>

      <div className={styles.filters}>
        <label>
          <span>Eğitim</span>
          <select
            value={trainingId}
            onChange={(event) =>
              setTrainingId(event.target.value)
            }
          >
            <option value="ALL">Tüm Eğitimler</option>
            {trainings.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Başlangıç</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
          />
        </label>

        <label>
          <span>Bitiş</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(event.target.value)
            }
          />
        </label>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.kpiGrid}>
        {[
          ["Toplam Çalışan", totalEmployees],
          ["Toplam Eğitim", filteredTrainings.length],
          ["Toplam Atama", metrics.assigned],
          ["Tamamlanan", metrics.completed],
          ["Tamamlama", `%${metrics.completionRate}`],
          ["Ortalama Final", metrics.averageScore],
          ["Kanıt Skoru", `%${metrics.averageEvidence}`],
          ["Sertifika", metrics.certificateCount],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Durum Dağılımı</span>
              <h3>Atama Performansı</h3>
            </div>
          </div>

          {[
            ["Tamamlandı", metrics.completed, "#16a34a"],
            ["Devam Ediyor", metrics.inProgress, "#2563eb"],
            ["Başlamadı", metrics.notStarted, "#d97706"],
          ].map(([label, value, color]) => {
            const numeric = Number(value);
            const ratio = percent(numeric, metrics.assigned);

            return (
              <div
                className={styles.progressRow}
                key={String(label)}
              >
                <div>
                  <span>{label}</span>
                  <strong>
                    {numeric} • %{ratio}
                  </strong>
                </div>
                <div className={styles.track}>
                  <i
                    style={{
                      width: `${ratio}%`,
                      background: String(color),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Yönetici Yorumu</span>
              <h3>DORA Rapor Özeti</h3>
            </div>
          </div>

          <div className={styles.doraText}>
            <strong>
              Genel tamamlama oranı %{metrics.completionRate}.
            </strong>
            <p>
              {metrics.notStarted > 0
                ? `${metrics.notStarted} atama henüz başlamamış durumda.`
                : "Başlamayan atama görünmüyor."}{" "}
              Ortalama kanıt skoru %{metrics.averageEvidence},
              ortalama final puanı {metrics.averageScore}. Aktif
              sertifika oranı yaklaşık %{metrics.certificateRate}.
            </p>
          </div>
        </article>
      </div>

      <article className={styles.tablePanel}>
        <div className={styles.panelHeader}>
          <div>
            <span>Eğitim Portföyü</span>
            <h3>Eğitim Bazlı Performans</h3>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Eğitim</th>
                <th>Tür</th>
                <th>Atanan</th>
                <th>Tamamlanan</th>
                <th>Devam</th>
                <th>Başlamadı</th>
                <th>Oran</th>
                <th>İçerik</th>
              </tr>
            </thead>
            <tbody>
              {trainingRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.type}</td>
                  <td>{row.assigned_count}</td>
                  <td>{row.completed_count}</td>
                  <td>{row.in_progress_count}</td>
                  <td>{row.not_started_count}</td>
                  <td>%{row.completionRate}</td>
                  <td>
                    V:{row.video_count} / Ö:{row.pre_exam_count} /
                    F:{row.final_exam_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <footer className={styles.footer}>
        <strong>D-SEC Eğitim Yönetim Raporu</strong>
        <span>
          Firma: {selectedCompanyName} • Üretim:{" "}
          {new Date().toLocaleString("tr-TR")}
        </span>
      </footer>
    </section>
  );
}
