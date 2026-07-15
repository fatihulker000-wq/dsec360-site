"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWatchSeconds(value?: number | null) {
  const total = Math.max(0, Number(value || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours} sa ${minutes} dk`;
  if (minutes > 0) return `${minutes} dk ${seconds} sn`;

  return `${seconds} sn`;
}

function statusLabel(value?: string | null) {
  const status = String(value || "").toLowerCase();

  if (status === "completed") return "Tamamlandı";
  if (status === "in_progress") return "Devam Ediyor";
  if (status === "assigned") return "Atandı";

  return "Başlamadı";
}

export default function TrainingAuditCenter({
  selectedTrainingId,
}: TrainingAuditCenterProps) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [summary, setSummary] = useState<AuditSummary>({
    total: 0,
    completed: 0,
    watched: 0,
    passed: 0,
    certificated: 0,
    average_evidence_score: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(
    null
  );
  const [generatedAt, setGeneratedAt] = useState("");

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const parameters = new URLSearchParams({
        limit: "200",
      });

      if (selectedTrainingId) {
        parameters.set("trainingId", selectedTrainingId);
      }

      const response = await fetch(
        `/api/admin/training-audit?${parameters.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Eğitim kayıtları alınamadı."
        );
      }

      setRecords(Array.isArray(json?.data) ? json.data : []);
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
      setGeneratedAt(String(json?.generated_at || ""));
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

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return records.filter((record) => {
      const text = [
        record.employee_name,
        record.email,
        record.company_name,
        record.training_title,
        record.assignment_id,
        record.certificate_no,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const searchOk = !query || text.includes(query);
      const statusOk =
        statusFilter === "ALL" ||
        record.status === statusFilter ||
        (statusFilter === "CERTIFICATE" &&
          Boolean(record.certificate_no)) ||
        (statusFilter === "LOW_EVIDENCE" &&
          record.evidence_score < 75);

      return searchOk && statusOk;
    });
  }, [records, search, statusFilter]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Evidence & Audit Trail
          </span>
          <h2>Eğitim Kayıt ve Kanıt Merkezi</h2>
          <p>
            Eğitim atama kayıtlarından başlama, izleme, sınav,
            tamamlama ve sertifika kanıtlarını izleyin.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading}
          onClick={() => void loadAudit()}
        >
          {loading ? "Yenileniyor..." : "Kayıtları Yenile"}
        </button>
      </header>

      <div className={styles.summaryGrid}>
        {[
          ["Toplam Kayıt", summary.total],
          ["Tamamlandı", summary.completed],
          ["İçerik Tamam", summary.watched],
          ["Final Başarılı", summary.passed],
          ["Sertifikalı", summary.certificated],
          ["Kanıt Skoru", `${summary.average_evidence_score}%`],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.notice}>
        Bu ekran mevcut eğitim kayıtlarından üretilen kanıt
        özetidir. Sonraki aşamada append-only olay tablosu ile
        değiştirilemez işlem günlüğüne dönüştürülecektir.
      </div>

      <div className={styles.toolbar}>
        <label>
          <span>Ara</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Çalışan, firma, eğitim, belge no..."
          />
        </label>

        <label>
          <span>Durum</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">Tüm Kayıtlar</option>
            <option value="assigned">Atandı</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="CERTIFICATE">Sertifikalı</option>
            <option value="LOW_EVIDENCE">
              Kanıt Skoru Düşük
            </option>
          </select>
        </label>

        <div className={styles.generatedAt}>
          <span>Son üretim</span>
          <strong>{formatDateTime(generatedAt)}</strong>
        </div>
      </div>

      {error ? (
        <div className={styles.errorState}>{error}</div>
      ) : loading ? (
        <div className={styles.emptyState}>
          Eğitim kayıtları yükleniyor...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className={styles.emptyState}>
          Filtrelere uygun eğitim kaydı bulunamadı.
        </div>
      ) : (
        <div className={styles.list}>
          {filteredRecords.map((record) => {
            const expanded =
              expandedId === record.assignment_id;

            return (
              <article
                key={record.assignment_id}
                className={styles.recordCard}
              >
                <div className={styles.recordHeader}>
                  <div>
                    <span>{record.training_title}</span>
                    <h3>{record.employee_name}</h3>
                    <p>
                      {record.company_name || "Firma bilgisi yok"}
                      {" • "}
                      {record.email || "E-posta yok"}
                    </p>
                  </div>

                  <div className={styles.scoreBox}>
                    <strong>{record.evidence_score}%</strong>
                    <span>Kanıt Skoru</span>
                  </div>
                </div>

                <div className={styles.recordMeta}>
                  <div>
                    <span>Durum</span>
                    <strong>{statusLabel(record.status)}</strong>
                  </div>
                  <div>
                    <span>Atama</span>
                    <strong>
                      {formatDateTime(record.created_at)}
                    </strong>
                  </div>
                  <div>
                    <span>Başlama</span>
                    <strong>
                      {formatDateTime(record.started_at)}
                    </strong>
                  </div>
                  <div>
                    <span>Tamamlama</span>
                    <strong>
                      {formatDateTime(record.completed_at)}
                    </strong>
                  </div>
                  <div>
                    <span>İzleme</span>
                    <strong>
                      {formatWatchSeconds(
                        Math.max(
                          record.watch_seconds,
                          record.max_watched_seconds
                        )
                      )}
                    </strong>
                  </div>
                </div>

                <div className={styles.evidenceBadges}>
                  <span
                    className={
                      record.watch_completed
                        ? styles.badgeSuccess
                        : styles.badgeWarning
                    }
                  >
                    İçerik{" "}
                    {record.watch_completed
                      ? "Tamam"
                      : "Eksik"}
                  </span>
                  <span
                    className={
                      record.final_exam_passed
                        ? styles.badgeSuccess
                        : styles.badgeWarning
                    }
                  >
                    Final{" "}
                    {record.final_exam_score == null
                      ? "-"
                      : record.final_exam_score}
                  </span>
                  <span
                    className={
                      record.certificate_no
                        ? styles.badgeSuccess
                        : styles.badgeNeutral
                    }
                  >
                    {record.certificate_no
                      ? `Belge: ${record.certificate_no}`
                      : "Sertifika Yok"}
                  </span>
                  <span className={styles.badgeNeutral}>
                    Tıklama: {record.click_count}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={() =>
                    setExpandedId(
                      expanded ? null : record.assignment_id
                    )
                  }
                >
                  {expanded
                    ? "Zaman Çizelgesini Kapat"
                    : "Kanıt Zaman Çizelgesini Aç"}
                </button>

                {expanded ? (
                  <div className={styles.timeline}>
                    {record.events.length === 0 ? (
                      <div className={styles.timelineEmpty}>
                        Zaman çizelgesi olayı bulunamadı.
                      </div>
                    ) : (
                      record.events.map((event, index) => (
                        <div
                          key={`${event.type}-${event.occurred_at}-${index}`}
                          className={styles.timelineItem}
                        >
                          <i
                            className={
                              event.status === "success"
                                ? styles.dotSuccess
                                : event.status === "warning"
                                  ? styles.dotWarning
                                  : styles.dotInfo
                            }
                          />
                          <div>
                            <strong>{event.label}</strong>
                            <span>
                              {formatDateTime(event.occurred_at)}
                            </span>
                            {event.detail ? (
                              <em>{event.detail}</em>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
