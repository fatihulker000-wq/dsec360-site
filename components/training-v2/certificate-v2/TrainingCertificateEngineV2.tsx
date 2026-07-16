"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./TrainingCertificateEngineV2.module.css";

type CertificateRow = {
  id: string;
  assignment_id: string;
  training_id: string;
  certificate_no: string;
  verification_code: string;
  status: string;
  issued_at: string;
  valid_until: string | null;
  revision_no: number;
  training_title: string;
  employee_name: string;
  company_name: string | null;
  final_score: number | null;
  document_hash: string;
  revoked_reason: string | null;
  qr_data_url: string;
};

type Summary = {
  total: number;
  issued: number;
  revoked: number;
  renewed: number;
  expired: number;
};

type Props = {
  selectedTrainingId: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Süresiz";

  return new Date(value).toLocaleDateString("tr-TR");
}

export default function TrainingCertificateEngineV2({
  selectedTrainingId,
}: Props) {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    issued: 0,
    revoked: 0,
    renewed: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [actionId, setActionId] = useState<string | null>(
    null
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedTrainingId) {
        params.set("trainingId", selectedTrainingId);
      }

      const response = await fetch(
        `/api/admin/training-certificates-v2?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Sertifikalar alınamadı."
        );
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
      setSummary(
        json?.summary || {
          total: 0,
          issued: 0,
          revoked: 0,
          renewed: 0,
          expired: 0,
        }
      );
    } catch (cause) {
      console.error(cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Sertifikalar alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTrainingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return rows.filter((row) => {
      const text = [
        row.employee_name,
        row.training_title,
        row.company_name,
        row.certificate_no,
        row.verification_code,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return (
        (!query || text.includes(query)) &&
        (status === "ALL" || row.status === status)
      );
    });
  }, [rows, search, status]);

  const revoke = async (row: CertificateRow) => {
    const reason = window.prompt(
      "Sertifika iptal nedenini yazın:"
    );

    if (!reason?.trim()) return;

    try {
      setActionId(row.id);
      setError("");

      const response = await fetch(
        "/api/admin/training-certificates-v2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            certificateId: row.id,
            action: "REVOKE",
            reason,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Sertifika iptal edilemedi."
        );
      }

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sertifika iptal edilemedi."
      );
    } finally {
      setActionId(null);
    }
  };

  const renew = async (row: CertificateRow) => {
    const validUntil = window.prompt(
      "Yeni geçerlilik bitiş tarihi (YYYY-MM-DD). Süresiz için boş bırakın:",
      row.valid_until || ""
    );

    if (validUntil === null) return;

    try {
      setActionId(row.id);
      setError("");

      const response = await fetch(
        "/api/admin/training-certificates-v2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            certificateId: row.id,
            action: "RENEW",
            validUntil,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Sertifika yenilenemedi."
        );
      }

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sertifika yenilenemedi."
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Certificate Lifecycle
          </span>
          <h2>Premium Sertifika Motoru V2</h2>
          <p>
            QR doğrulama, seri numarası, revizyon, iptal ve
            yenileme yaşam döngüsünü yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Yenileniyor..." : "Yenile"}
        </button>
      </header>

      <div className={styles.summary}>
        {[
          ["Toplam", summary.total],
          ["Aktif", summary.issued],
          ["İptal", summary.revoked],
          ["Yenilenmiş", summary.renewed],
          ["Süresi Dolmuş", summary.expired],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Çalışan, eğitim, belge no..."
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">Tüm Durumlar</option>
          <option value="ISSUED">Aktif</option>
          <option value="REVOKED">İptal</option>
          <option value="RENEWED">Yenilenmiş</option>
        </select>
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      {loading ? (
        <div className={styles.empty}>
          Sertifikalar yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          Sertifika V2 kaydı bulunamadı. Sertifika üretimi API
          üzerinden tamamlanmış atama kaydıyla başlatılır.
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((row) => (
            <article key={row.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <span>{row.status}</span>
                  <h3>{row.employee_name}</h3>
                  <p>{row.training_title}</p>
                </div>

                <img
                  src={row.qr_data_url}
                  alt="Sertifika QR"
                />
              </div>

              <div className={styles.meta}>
                <div>
                  <span>Belge No</span>
                  <strong>{row.certificate_no}</strong>
                </div>
                <div>
                  <span>Geçerlilik</span>
                  <strong>
                    {formatDate(row.valid_until)}
                  </strong>
                </div>
                <div>
                  <span>Revizyon</span>
                  <strong>{row.revision_no}</strong>
                </div>
                <div>
                  <span>Final</span>
                  <strong>
                    {row.final_score ?? "-"}
                  </strong>
                </div>
              </div>

              <div className={styles.hash}>
                <span>SHA-256 Belge Hash</span>
                <code>{row.document_hash}</code>
              </div>

              {row.revoked_reason ? (
                <div className={styles.revoked}>
                  İptal nedeni: {row.revoked_reason}
                </div>
              ) : null}

              <div className={styles.actions}>
                <a
                  href={`/certificate/verify/${row.verification_code}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Doğrula
                </a>

                {row.status !== "REVOKED" ? (
                  <>
                    <button
                      type="button"
                      disabled={actionId === row.id}
                      onClick={() => void renew(row)}
                    >
                      Yenile
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={actionId === row.id}
                      onClick={() => void revoke(row)}
                    >
                      İptal Et
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
