"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import styles from "./TrainingAuditCenter.module.css";

type AuditEvent = {
  type: string;
  label: string;
  occurred_at: string | null;
  status: "success" | "info" | "warning";
  detail?: string | null;
};

type AuditRecord = {
  assignment_id: string;
  training_id: string;
  training_title: string;
  training_type: string;

  employee_name: string;
  employee_id: string;
  email: string;
  company_name: string;

  status: string;

  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  watch_seconds: number;
  max_watched_seconds: number;
  click_count: number;
  watch_completed: boolean;

  pre_exam_score: number | null;
  pre_exam_passed: boolean | null;

  final_exam_score: number | null;
  final_exam_passed: boolean | null;

  certificate_no: string | null;
  certificate_issued_at: string | null;
  verification_code: string | null;

  evidence_score: number;

  events: AuditEvent[];
};

type AuditSummary = {
  total: number;
  completed: number;
  watched: number;
  passed: number;
  certificated: number;
  average_evidence_score: number;
};

type TrainingAuditCenterProps = {
  selectedTrainingId: string;
};

function formatDateTime(
  value?: string | null
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(
  value?: string | null
) {
  const status = String(
    value || ""
  ).toLowerCase();

  if (status === "completed") {
    return "Tamamlandı";
  }

  if (status === "in_progress") {
    return "Devam Ediyor";
  }

  if (status === "assigned") {
    return "Atandı";
  }

  return "Başlamadı";
}

function statusClass(
  value?: string | null
) {
  const status = String(
    value || ""
  ).toLowerCase();

  if (status === "completed") {
    return styles.statusCompleted;
  }

  if (status === "in_progress") {
    return styles.statusProgress;
  }

  return styles.statusAssigned;
}

export default function TrainingAuditCenter({
  selectedTrainingId,
}: TrainingAuditCenterProps) {
  const router = useRouter();

  const [records, setRecords] =
    useState<AuditRecord[]>([]);

  const [summary, setSummary] =
    useState<AuditSummary>({
      total: 0,
      completed: 0,
      watched: 0,
      passed: 0,
      certificated: 0,
      average_evidence_score: 0,
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [generatedAt, setGeneratedAt] =
    useState("");

  const loadAudit =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const parameters =
          new URLSearchParams({
            limit: "200",
          });

        if (selectedTrainingId) {
          parameters.set(
            "trainingId",
            selectedTrainingId
          );
        }

        const response = await fetch(
          `/api/admin/training-audit?${parameters.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (response.status === 401) {
          window.location.href =
            "/admin/login";

          return;
        }

        const json = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json?.error ||
              "Eğitim kayıtları alınamadı."
          );
        }

        setRecords(
          Array.isArray(json?.data)
            ? json.data
            : []
        );

        setSummary(
          json?.summary || {
            total: 0,
            completed: 0,
            watched: 0,
            passed: 0,
            certificated: 0,
            average_evidence_score: 0,
          }
        );

        setGeneratedAt(
          String(
            json?.generated_at || ""
          )
        );
      } catch (cause) {
        console.error(cause);

        setRecords([]);

        setError(
          cause instanceof Error
            ? cause.message
            : "Kayıt merkezi yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }, [selectedTrainingId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  /*
   * Ana eğitim ekranında artık bütün
   * çalışanları göstermiyoruz.
   *
   * Yalnızca en güncel 5 kayıt gösterilir.
   */
  const recentRecords =
    useMemo(() => {
      return [...records]
        .sort((a, b) => {
          const dateA =
            new Date(
              a.completed_at ||
                a.started_at ||
                a.created_at ||
                0
            ).getTime();

          const dateB =
            new Date(
              b.completed_at ||
                b.started_at ||
                b.created_at ||
                0
            ).getTime();

          return dateB - dateA;
        })
        .slice(0, 5);
    }, [records]);

  function openAllRecords() {
    const params =
      new URLSearchParams();

    if (selectedTrainingId) {
      params.set(
        "trainingId",
        selectedTrainingId
      );
    }

    const query =
      params.toString();

    router.push(
  `/admin/trainings/audit-records${
    query ? `?${query}` : ""
  }`
);
  }

  return (
    <section className={styles.panel}>
      {/* =====================================================
          BAŞLIK
      ===================================================== */}

      <header className={styles.header}>
        <div>
          <span
            className={styles.eyebrow}
          >
            Evidence & Audit Trail
          </span>

          <h2>
            Eğitim Kayıt ve Kanıt
            Merkezi
          </h2>

          <p>
            Eğitim atama, başlatma,
            içerik izleme, sınav,
            tamamlama ve sertifika
            süreçlerine ait kayıtlar
            merkezi olarak izlenir.
            Kayıtlar çalışan ve eğitim
            bazında denetim kanıtı
            oluşturur.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={loading}
          onClick={() =>
            void loadAudit()
          }
        >
          {loading
            ? "Yenileniyor..."
            : "Kayıtları Yenile"}
        </button>
      </header>

      {/* =====================================================
          KPI
      ===================================================== */}

      <div
        className={styles.summaryGrid}
      >
        {[
          [
            "Toplam Kayıt",
            summary.total,
          ],
          [
            "Tamamlandı",
            summary.completed,
          ],
          [
            "İçerik Tamam",
            summary.watched,
          ],
          [
            "Final Başarılı",
            summary.passed,
          ],
          [
            "Sertifikalı",
            summary.certificated,
          ],
          [
            "Kanıt Skoru",
            `${summary.average_evidence_score}%`,
          ],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>

            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* =====================================================
          BİLGİ / YÖNLENDİRME
      ===================================================== */}

      <div
        className={
          styles.auditOverview
        }
      >
        <div>
          <strong>
            Çalışan Kanıt Kayıtları
          </strong>

          <p>
            Çalışanların tüm eğitim
            hareketlerini, izleme
            durumlarını, sınav
            sonuçlarını, sertifika
            kayıtlarını ve kanıt zaman
            çizelgesini ayrı kayıt
            ekranından inceleyebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.allRecordsButton
          }
          onClick={openAllRecords}
        >
          Tüm Çalışan Kanıt
          Kayıtlarını Görüntüle
        </button>
      </div>

      {/* =====================================================
          SON ÜRETİM
      ===================================================== */}

      <div
        className={
          styles.compactInfoBar
        }
      >
        <div>
          <span>
            Toplam çalışan/eğitim
            kaydı
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <span>
            Ortalama kanıt skoru
          </span>

          <strong>
            {
              summary.average_evidence_score
            }
            %
          </strong>
        </div>

        <div>
          <span>Son üretim</span>

          <strong>
            {formatDateTime(
              generatedAt
            )}
          </strong>
        </div>
      </div>

      {/* =====================================================
          HATA / LOADING
      ===================================================== */}

      {error ? (
        <div
          className={
            styles.errorState
          }
        >
          {error}
        </div>
      ) : loading ? (
        <div
          className={
            styles.emptyState
          }
        >
          Eğitim kayıtları
          yükleniyor...
        </div>
      ) : records.length === 0 ? (
        <div
          className={
            styles.emptyState
          }
        >
          Henüz eğitim kanıt kaydı
          bulunmuyor.
        </div>
      ) : (
        <>
          {/* ===============================================
              SON 5 KAYIT
          =============================================== */}

          <div
            className={
              styles.recentHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Son Hareketler
              </span>

              <h3>
                Son Eğitim Kanıt
                Kayıtları
              </h3>

              <p>
                En son işlem gören
                beş çalışan/eğitim
                kaydı gösteriliyor.
              </p>
            </div>

            <span
              className={
                styles.recordCount
              }
            >
              Son{" "}
              {recentRecords.length}{" "}
              kayıt
            </span>
          </div>

          <div
            className={
              styles.recentTableWrap
            }
          >
            <table
              className={
                styles.recentTable
              }
            >
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Eğitim</th>
                  <th>Firma</th>
                  <th>Durum</th>
                  <th>İçerik</th>
                  <th>Final</th>
                  <th>Sertifika</th>
                  <th>Kanıt</th>
                  <th>Son İşlem</th>
                </tr>
              </thead>

              <tbody>
                {recentRecords.map(
                  (record) => (
                    <tr
                      key={
                        record.assignment_id
                      }
                    >
                      <td>
                        <strong>
                          {
                            record.employee_name
                          }
                        </strong>

                        <small>
                          {record.email ||
                            "E-posta yok"}
                        </small>
                      </td>

                      <td>
                        {
                          record.training_title
                        }
                      </td>

                      <td>
                        {record.company_name ||
                          "Firma bilgisi yok"}
                      </td>

                      <td>
                        <span
                          className={
                            statusClass(
                              record.status
                            )
                          }
                        >
                          {statusLabel(
                            record.status
                          )}
                        </span>
                      </td>

                      <td>
                        {record.watch_completed
                          ? "Tamam"
                          : "Eksik"}
                      </td>

                      <td>
                        {record.final_exam_score ==
                        null
                          ? "-"
                          : record.final_exam_score}
                      </td>

                      <td>
                        {record.certificate_no
                          ? "Var"
                          : "Yok"}
                      </td>

                      <td>
                        <strong
                          className={
                            styles.evidenceValue
                          }
                        >
                          {
                            record.evidence_score
                          }
                          %
                        </strong>
                      </td>

                      <td>
                        {formatDateTime(
                          record.completed_at ||
                            record.started_at ||
                            record.created_at
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div
            className={
              styles.bottomAction
            }
          >
            <button
              type="button"
              className={
                styles.allRecordsButton
              }
              onClick={
                openAllRecords
              }
            >
              Tüm{" "}
              {summary.total} Kaydı
              Aç
            </button>
          </div>
        </>
      )}
    </section>
  );
}
