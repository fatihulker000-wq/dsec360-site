import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./Inspection.module.css";

export type InspectionViewItem = {
  id: number | string;
  firmName: string;
  firmId?: string;
  mode: string;
  modeBg: string;
  modeColor: string;
  template: string;
  inspector: string;
  date: string;
  answerCount: number;
  dofCount: number;
  appRunId?: string | number | null;
  suitableCount?: number;
  partialCount?: number;
  unsuitableCount?: number;
  criticalCount?: number;
  openDofCount?: number;
  overdueDofCount?: number;
};

type Props = {
  items: InspectionViewItem[];
  deleteAction: (formData: FormData) => Promise<void>;
  pagination?: ReactNode;
};

function conformity(item: InspectionViewItem) {
  const suitable = item.suitableCount || 0;
  const partial = item.partialCount || 0;
  const unsuitable = item.unsuitableCount || 0;
  const evaluated = suitable + partial + unsuitable;
  return evaluated > 0 ? Math.round((suitable / evaluated) * 100) : null;
}

function processStatus(item: InspectionViewItem) {
  if (item.answerCount <= 0) return "Taslak";
  if ((item.overdueDofCount || 0) > 0) return "DÖF Gecikmiş";
  if ((item.openDofCount || 0) > 0) return "DÖF Takibinde";
  if (item.dofCount > 0 && (item.openDofCount || 0) === 0) return "Kapandı";
  return "Tamamlandı";
}

export default function InspectionCards({
  items,
  deleteAction,
  pagination,
}: Props) {
  return (
    <section className={styles.inspectionSection}>
      <div className={styles.moduleHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Inspection Records</span>
          <h2>Denetim Kayıtları</h2>
          <p>
            Uygunluk, kritik bulgu ve DÖF sürecini denetim bazında izleyin.
          </p>
        </div>
        <div className={styles.moduleCount}>
          <span>Gösterilen kayıt</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          Seçilen filtreye uygun denetim kaydı yok.
        </div>
      ) : (
        <div className={styles.inspectionGrid}>
          {items.map((item) => {
            const rate = conformity(item);
            const status = processStatus(item);

            return (
              <article key={item.id} className={styles.inspectionCard}>
                <div className={styles.inspectionTop}>
                  <div>
                    <div className={styles.inspectionCompany}>
                      {item.firmName}
                    </div>
                    <div className={styles.inspectionSub}>
                      App Run: {item.appRunId || "-"} • Remote: {item.id}
                    </div>
                  </div>
                  <span
                    className={styles.modeBadge}
                    style={{
                      background: item.modeBg,
                      color: item.modeColor,
                    }}
                  >
                    {item.mode}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))",
                    gap: 8,
                    margin: "14px 0",
                  }}
                >
                  <Metric label="Madde" value={item.answerCount} />
                  <Metric
                    label="Uygunluk"
                    value={rate === null ? "Veri yok" : `%${rate}`}
                  />
                  <Metric
                    label="Uygunsuz"
                    value={item.unsuitableCount || 0}
                  />
                  <Metric
                    label="Kritik"
                    value={item.criticalCount || 0}
                  />
                  <Metric
                    label="Açık DÖF"
                    value={item.openDofCount || 0}
                  />
                  <Metric
                    label="Geciken"
                    value={item.overdueDofCount || 0}
                  />
                </div>

                <div className={styles.inspectionStats}>
                  <div>
                    <span>Süreç</span>
                    <strong>{status}</strong>
                  </div>
                  <div>
                    <span>Toplam DÖF</span>
                    <strong>{item.dofCount}</strong>
                  </div>
                  <div>
                    <span>Kısmen</span>
                    <strong>{item.partialCount || 0}</strong>
                  </div>
                </div>

                <div className={styles.inspectionInfo}>
                  <span>Şablon: {item.template}</span>
                  <span>Denetçi: {item.inspector}</span>
                  <span>Tarih: {item.date}</span>
                </div>

                <div className={styles.inspectionActions}>
                  <Link
                    href={`/admin/denetimler/${item.id}${
                      item.firmId
                        ? `?firmId=${encodeURIComponent(item.firmId)}`
                        : ""
                    }`}
                    className={`${styles.smallAction} ${styles.smallActionPrimary}`}
                  >
                    Detay
                  </Link>

                  <Link
                    href={`/admin/denetimler/${item.id}/print${
                      item.firmId
                        ? `?firmId=${encodeURIComponent(item.firmId)}`
                        : ""
                    }`}
                    target="_blank"
                    className={styles.smallAction}
                  >
                    Rapor
                  </Link>

                  <Link
                    href={`/admin/denetimler/${item.id}/edit${
                      item.firmId
                        ? `?firmId=${encodeURIComponent(item.firmId)}`
                        : ""
                    }`}
                    className={styles.smallAction}
                  >
                    Düzenle
                  </Link>

                  <form action={deleteAction}>
                    <input type="hidden" name="remoteId" value={item.id} />
                    <input
                      type="hidden"
                      name="firmId"
                      value={item.firmId || ""}
                    />
                    <button
                      type="submit"
                      className={`${styles.smallAction} ${styles.dangerButton}`}
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 11px",
        background: "#f8fafc",
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 900,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: ".05em",
        }}
      >
        {label}
      </span>
      <strong
        style={{
          display: "block",
          marginTop: 4,
          fontSize: 16,
          color: "#1f2937",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
