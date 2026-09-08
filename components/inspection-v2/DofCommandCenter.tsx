import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./Inspection.module.css";

export type DofViewItem = {
  id: string;
  answerId?: number | string;
  runRemoteId: number | string;
  title: string;
  note: string;
  firmName: string;
  firmId?: string;
  mode: string;
  status: "OPEN" | "CLOSED";
  critical: boolean;
  responsible?: string;
  dueDate?: string | number | null;
  overdue?: boolean;
  upcoming?: boolean;
  riskLevel?: string;
};

type Props = {
  items: DofViewItem[];
  allCount: number;
  openCount: number;
  closedCount: number;
  overdueCount: number;
  upcomingCount: number;
  closureRate: number;
  activeStatus: string;
  activePriority: string;
  activeDue: string;
  allHref: string;
  openHref: string;
  closedHref: string;
  criticalHref: string;
  overdueHref: string;
  upcomingHref: string;
  closeAction: (formData: FormData) => Promise<void>;
  pagination?: ReactNode;
};

function formatDueDate(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "Termin girilmemiş";

  let date: Date;
  if (typeof value === "number") {
    date = new Date(value < 10_000_000_000 ? value * 1000 : value);
  } else {
    const numeric = Number(value);
    date =
      Number.isFinite(numeric) && String(value).trim() !== ""
        ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
        : new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "Termin girilmemiş";
  return date.toLocaleDateString("tr-TR");
}

function dueDayText(value?: string | number | null, closed?: boolean) {
  if (closed || value === null || value === undefined || value === "") return "";

  let due: Date;
  if (typeof value === "number") {
    due = new Date(value < 10_000_000_000 ? value * 1000 : value);
  } else {
    const numeric = Number(value);
    due =
      Number.isFinite(numeric) && String(value).trim() !== ""
        ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
        : new Date(value);
  }

  if (Number.isNaN(due.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} gün gecikti`;
  if (days === 0) return "Termin bugün";
  return `${days} gün kaldı`;
}

function riskLabel(value?: string) {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return "";
  if (v === "VERY_HIGH" || v === "COK_YUKSEK") return "Çok Yüksek";
  if (v === "INTOLERABLE" || v === "KABUL_EDILEMEZ") return "Kabul Edilemez";
  if (v === "CRITICAL" || v === "KRITIK") return "Kritik";
  if (v === "HIGH" || v === "YUKSEK") return "Yüksek";
  if (v === "MEDIUM" || v === "ORTA") return "Orta";
  if (v === "LOW" || v === "DUSUK") return "Düşük";
  return value || "";
}

function DofCard({
  item,
  closeAction,
}: {
  item: DofViewItem;
  closeAction: Props["closeAction"];
}) {
  const closed = item.status === "CLOSED";
  const dueText = dueDayText(item.dueDate, closed);
  const badgeText = closed
    ? "Kapalı"
    : item.overdue
      ? "Geciken"
      : item.critical
        ? "Kritik"
        : item.upcoming
          ? "Termin Yaklaşıyor"
          : "Açık";

  return (
    <article
      className={`${styles.dofCard} ${
        item.critical || item.overdue ? styles.dofCardCritical : ""
      } ${closed ? styles.dofCardClosed : ""}`}
    >
      <div className={styles.dofCardTop}>
        <strong>{item.title}</strong>
        <span
          className={`${styles.dofBadge} ${
            closed
              ? styles.dofBadgeClosed
              : item.critical || item.overdue
                ? styles.dofBadgeCritical
                : styles.dofBadgeOpen
          }`}
        >
          {badgeText}
        </span>
      </div>

      <div className={styles.dofMeta}>
        <span>{item.firmName}</span>
        <span>
          Run: {item.runRemoteId} • {item.mode}
        </span>
        {item.riskLevel ? <span>Risk: {riskLabel(item.riskLevel)}</span> : null}
        <span>Sorumlu: {item.responsible || "Atanmamış"}</span>
        <span>
          Termin: {formatDueDate(item.dueDate)}
          {dueText ? ` • ${dueText}` : ""}
        </span>
        <span>{item.note}</span>
      </div>

      <div className={styles.dofActions}>
        <Link
          href={`/admin/denetimler/${item.runRemoteId}${
            item.firmId ? `?firmId=${encodeURIComponent(item.firmId)}` : ""
          }`}
          className={`${styles.smallAction} ${styles.smallActionPrimary}`}
        >
          Denetime Git
        </Link>

        {!closed && (
          <form action={closeAction}>
            <input type="hidden" name="answerId" value={item.answerId || ""} />
            <input type="hidden" name="runRemoteId" value={item.runRemoteId} />
            <input type="hidden" name="itemTitle" value={item.title} />
            <input type="hidden" name="firmId" value={item.firmId || ""} />
            <button
              type="submit"
              className={`${styles.smallAction} ${styles.smallActionGood}`}
            >
              DÖF Kapat
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default function DofCommandCenter(props: Props) {
  const critical = props.items.filter(
    (i) => i.critical && i.status === "OPEN"
  );
  const overdue = props.items.filter(
    (i) => i.overdue && i.status === "OPEN"
  );
  const open = props.items.filter(
    (i) => !i.critical && !i.overdue && i.status === "OPEN"
  );
  const closed = props.items.filter((i) => i.status === "CLOSED");

  return (
    <section id="dof" className={styles.dofSection}>
      <div className={styles.moduleHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Corrective Action Center</span>
          <h2>DÖF Command Center</h2>
          <p>
            Açık, geciken, kritik ve yaklaşan terminli faaliyetleri aynı
            kaynaktan yönetin.
          </p>
        </div>
        <div className={styles.moduleCount}>
          <span>Toplam DÖF</span>
          <strong>{props.allCount}</strong>
        </div>
      </div>

      <div className={styles.dofToolbar}>
        <Link
          href={props.allHref}
          className={`${styles.filterPill} ${
            !props.activeStatus &&
            !props.activePriority &&
            !props.activeDue
              ? styles.filterPillActive
              : ""
          }`}
        >
          Tüm DÖF
        </Link>
        <Link
          href={props.openHref}
          className={`${styles.filterPill} ${
            props.activeStatus === "OPEN" &&
            !props.activePriority &&
            !props.activeDue
              ? styles.filterPillActive
              : ""
          }`}
        >
          Açık
        </Link>
        <Link
          href={props.overdueHref}
          className={`${styles.filterPill} ${
            props.activeDue === "OVERDUE" ? styles.filterPillActive : ""
          }`}
        >
          Geciken
        </Link>
        <Link
          href={props.criticalHref}
          className={`${styles.filterPill} ${
            props.activePriority === "CRITICAL" ? styles.filterPillActive : ""
          }`}
        >
          Kritik
        </Link>
        <Link
          href={props.upcomingHref}
          className={`${styles.filterPill} ${
            props.activeDue === "UPCOMING" ? styles.filterPillActive : ""
          }`}
        >
          Yaklaşan Termin
        </Link>
        <Link
          href={props.closedHref}
          className={`${styles.filterPill} ${
            props.activeStatus === "CLOSED" ? styles.filterPillActive : ""
          }`}
        >
          Kapalı
        </Link>
      </div>

      <div className={styles.dofSummaryGrid}>
        <div className={styles.dofSummaryCard}>
          <span>Toplam</span>
          <strong>{props.allCount}</strong>
        </div>
        <div className={styles.dofSummaryCard}>
          <span>Açık</span>
          <strong>{props.openCount}</strong>
        </div>
        <div className={styles.dofSummaryCard}>
          <span>Geciken</span>
          <strong>{props.overdueCount}</strong>
        </div>
        <div className={styles.dofSummaryCard}>
          <span>Yaklaşan</span>
          <strong>{props.upcomingCount}</strong>
        </div>
        <div className={styles.dofSummaryCard}>
          <span>Kapalı</span>
          <strong>{props.closedCount}</strong>
        </div>
        <div className={styles.dofSummaryCard}>
          <span>Kapanma</span>
          <strong>%{props.closureRate}</strong>
        </div>
      </div>

      {props.items.length === 0 ? (
        <div className={styles.emptyState}>
          Seçilen kapsama uygun DÖF kaydı bulunamadı.
        </div>
      ) : (
        <div className={styles.dofBoard}>
          <div className={styles.dofColumn}>
            <div className={styles.dofColumnHeader}>
              <strong>Geciken / Kritik</strong>
              <span>{overdue.length + critical.filter((i) => !i.overdue).length}</span>
            </div>
            <div className={styles.dofCards}>
              {[...overdue, ...critical.filter((i) => !i.overdue)].length ? (
                [...overdue, ...critical.filter((i) => !i.overdue)].map((i) => (
                  <DofCard key={i.id} item={i} closeAction={props.closeAction} />
                ))
              ) : (
                <div className={styles.emptyState}>Kritik veya geciken kayıt yok.</div>
              )}
            </div>
          </div>

          <div className={styles.dofColumn}>
            <div className={styles.dofColumnHeader}>
              <strong>Açık</strong>
              <span>{open.length}</span>
            </div>
            <div className={styles.dofCards}>
              {open.length ? (
                open.map((i) => (
                  <DofCard key={i.id} item={i} closeAction={props.closeAction} />
                ))
              ) : (
                <div className={styles.emptyState}>Açık kayıt yok.</div>
              )}
            </div>
          </div>

          <div className={styles.dofColumn}>
            <div className={styles.dofColumnHeader}>
              <strong>Kapalı</strong>
              <span>{closed.length}</span>
            </div>
            <div className={styles.dofCards}>
              {closed.length ? (
                closed.map((i) => (
                  <DofCard key={i.id} item={i} closeAction={props.closeAction} />
                ))
              ) : (
                <div className={styles.emptyState}>Kapalı kayıt yok.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {props.pagination}
    </section>
  );
}
