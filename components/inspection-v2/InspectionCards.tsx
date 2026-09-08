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
  location?: string;
  responsible?: string;
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
  photoEvidenceCount?: number;
  scoringAverage?: number | null;
  scoringCount?: number;
  score100Count?: number;
  score75Count?: number;
  score50Count?: number;
  score25Count?: number;
  score0Count?: number;
  elmeriCorrect?: number;
  elmeriWrong?: number;
  elmeriOutOfScope?: number;
  elmeriRate?: number | null;
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

function normalizedMode(item: InspectionViewItem) {
  return String(item.mode || "").toLocaleUpperCase("tr-TR");
}

function modeMetrics(item: InspectionViewItem) {
  const mode = normalizedMode(item);
  const rate = conformity(item);

  if (mode.includes("FOTO")) {
    return [
      { label: "Madde", value: item.answerCount },
      { label: "Tam Uygunluk", value: rate === null ? "Veri yok" : `%${rate}` },
      { label: "Uygun", value: item.suitableCount || 0 },
      { label: "Kısmen", value: item.partialCount || 0 },
      { label: "Uygunsuz", value: item.unsuitableCount || 0 },
      { label: "Fotoğraf Kanıtı", value: item.photoEvidenceCount || 0 },
      { label: "Kritik", value: item.criticalCount || 0 },
      { label: "Açık DÖF", value: item.openDofCount || 0 },
      { label: "Geciken", value: item.overdueDofCount || 0 },
    ];
  }

  if (mode.includes("PUAN")) {
    return [
      { label: "Madde", value: item.answerCount },
      {
        label: "Ortalama Puan",
        value:
          item.scoringAverage == null ? "Veri yok" : `${item.scoringAverage}/100`,
      },
      { label: "Puanlanan", value: item.scoringCount || 0 },
      { label: "100 Puan", value: item.score100Count || 0 },
      { label: "75 Puan", value: item.score75Count || 0 },
      { label: "50 Puan", value: item.score50Count || 0 },
      { label: "25 Puan", value: item.score25Count || 0 },
      { label: "0 Puan", value: item.score0Count || 0 },
      { label: "Kritik", value: item.criticalCount || 0 },
      { label: "Açık DÖF", value: item.openDofCount || 0 },
      { label: "Geciken", value: item.overdueDofCount || 0 },
    ];
  }

  if (mode.includes("ELMERI")) {
    return [
      { label: "Madde", value: item.answerCount },
      {
        label: "ELMERI Endeksi",
        value: item.elmeriRate == null ? "Veri yok" : `%${item.elmeriRate}`,
      },
      { label: "Doğru", value: item.elmeriCorrect || 0 },
      { label: "Hatalı", value: item.elmeriWrong || 0 },
      { label: "Kapsam Dışı", value: item.elmeriOutOfScope || 0 },
      { label: "Kritik", value: item.criticalCount || 0 },
      { label: "Açık DÖF", value: item.openDofCount || 0 },
      { label: "Geciken", value: item.overdueDofCount || 0 },
    ];
  }

  return [
    { label: "Madde", value: item.answerCount },
    { label: "Tam Uygunluk", value: rate === null ? "Veri yok" : `%${rate}` },
    { label: "Uygun", value: item.suitableCount || 0 },
    { label: "Kısmen", value: item.partialCount || 0 },
    { label: "Uygunsuz", value: item.unsuitableCount || 0 },
    { label: "Kritik", value: item.criticalCount || 0 },
    { label: "Açık DÖF", value: item.openDofCount || 0 },
    { label: "Geciken", value: item.overdueDofCount || 0 },
  ];
}

function resultSummary(item: InspectionViewItem) {
  const mode = normalizedMode(item);

  if (mode.includes("FOTO")) {
    return `${item.photoEvidenceCount || 0} fotoğraf kanıtı · ${item.partialCount || 0} kısmen · ${item.unsuitableCount || 0} uygunsuz`;
  }

  if (mode.includes("PUAN")) {
    return `${item.scoringCount || 0} puanlanmış madde · ${item.score100Count || 0} tam puan · ${(item.score25Count || 0) + (item.score0Count || 0)} düşük puan`;
  }

  if (mode.includes("ELMERI")) {
    return `${item.elmeriCorrect || 0} doğru · ${item.elmeriWrong || 0} hatalı · ${item.elmeriOutOfScope || 0} kapsam dışı`;
  }

  return `${item.suitableCount || 0} uygun · ${item.partialCount || 0} kısmen · ${item.unsuitableCount || 0} uygunsuz`;
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
            Dört denetim metodolojisinin sonucu, uygunluk/puan/ELMERI kırılımı
            ve DÖF süreciyle birlikte denetim bazında izlenir.
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
            const status = processStatus(item);
            const metrics = modeMetrics(item);

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
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.45,
                  }}
                >
                  {resultSummary(item)}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
                    gap: 8,
                    margin: "12px 0 14px",
                  }}
                >
                  {metrics.map((metric) => (
                    <Metric
                      key={`${item.id}-${metric.label}`}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
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
                    <span>Açık DÖF</span>
                    <strong>{item.openDofCount || 0}</strong>
                  </div>
                </div>

                <div className={styles.inspectionInfo}>
                  <span>Şablon: {item.template}</span>
                  <span>Denetçi: {item.inspector}</span>
                  <span>Lokasyon / Bölüm: {item.location || "-"}</span>
                  <span>Sorumlu: {item.responsible || "-"}</span>
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
