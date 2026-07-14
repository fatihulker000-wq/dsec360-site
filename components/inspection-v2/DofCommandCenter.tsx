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
  mode: string;
  status: "OPEN" | "CLOSED";
  critical: boolean;
};

type Props = {
  items: DofViewItem[];
  allCount: number;
  openCount: number;
  closedCount: number;
  closureRate: number;
  activeStatus: string;
  activePriority: string;
  allHref: string;
  openHref: string;
  closedHref: string;
  criticalHref: string;
  closeAction: (formData: FormData) => Promise<void>;
  pagination?: ReactNode;
};

function DofCard({ item, closeAction }: { item: DofViewItem; closeAction: Props["closeAction"] }) {
  const closed = item.status === "CLOSED";
  return (
    <article className={`${styles.dofCard} ${item.critical ? styles.dofCardCritical : ""} ${closed ? styles.dofCardClosed : ""}`}>
      <div className={styles.dofCardTop}>
        <strong>{item.title}</strong>
        <span className={`${styles.dofBadge} ${closed ? styles.dofBadgeClosed : item.critical ? styles.dofBadgeCritical : styles.dofBadgeOpen}`}>
          {closed ? "Kapalı" : item.critical ? "Kritik" : "Açık"}
        </span>
      </div>
      <div className={styles.dofMeta}>
        <span>{item.firmName}</span><span>Run: {item.runRemoteId} • {item.mode}</span><span>{item.note}</span>
      </div>
      <div className={styles.dofActions}>
        <Link href={`/admin/denetimler/${item.runRemoteId}`} className={`${styles.smallAction} ${styles.smallActionPrimary}`}>Denetime Git</Link>
        {!closed && (
          <form action={closeAction}>
            <input type="hidden" name="answerId" value={item.answerId || ""} />
            <input type="hidden" name="runRemoteId" value={item.runRemoteId} />
            <input type="hidden" name="itemTitle" value={item.title} />
            <button type="submit" className={`${styles.smallAction} ${styles.smallActionGood}`}>DÖF Kapat</button>
          </form>
        )}
      </div>
    </article>
  );
}

export default function DofCommandCenter(props: Props) {
  const critical = props.items.filter((i) => i.critical && i.status === "OPEN");
  const open = props.items.filter((i) => !i.critical && i.status === "OPEN");
  const closed = props.items.filter((i) => i.status === "CLOSED");

  return (
    <section id="dof" className={styles.dofSection}>
      <div className={styles.moduleHeader}>
        <div><span className={styles.sectionEyebrow}>Corrective Action Center</span><h2>DÖF Command Center</h2><p>Kritik, açık ve kapalı faaliyetleri tek görünümde yönetin.</p></div>
        <div className={styles.moduleCount}><span>Toplam DÖF</span><strong>{props.allCount}</strong></div>
      </div>

      <div className={styles.dofToolbar}>
        <Link href={props.allHref} className={`${styles.filterPill} ${!props.activeStatus && !props.activePriority ? styles.filterPillActive : ""}`}>Tüm DÖF</Link>
        <Link href={props.openHref} className={`${styles.filterPill} ${props.activeStatus === "OPEN" && !props.activePriority ? styles.filterPillActive : ""}`}>Açık</Link>
        <Link href={props.closedHref} className={`${styles.filterPill} ${props.activeStatus === "CLOSED" ? styles.filterPillActive : ""}`}>Kapalı</Link>
        <Link href={props.criticalHref} className={`${styles.filterPill} ${props.activePriority === "CRITICAL" ? styles.filterPillActive : ""}`}>Kritik</Link>
      </div>

      <div className={styles.dofSummaryGrid}>
        <div className={styles.dofSummaryCard}><span>Toplam</span><strong>{props.allCount}</strong></div>
        <div className={styles.dofSummaryCard}><span>Açık</span><strong>{props.openCount}</strong></div>
        <div className={styles.dofSummaryCard}><span>Kapalı</span><strong>{props.closedCount}</strong></div>
        <div className={styles.dofSummaryCard}><span>Kapanma</span><strong>%{props.closureRate}</strong></div>
      </div>

      {props.items.length === 0 ? <div className={styles.emptyState}>Seçilen kapsama uygun DÖF kaydı bulunamadı.</div> :
        <div className={styles.dofBoard}>
          <div className={styles.dofColumn}><div className={styles.dofColumnHeader}><strong>Kritik</strong><span>{critical.length}</span></div><div className={styles.dofCards}>{critical.length ? critical.map((i) => <DofCard key={i.id} item={i} closeAction={props.closeAction} />) : <div className={styles.emptyState}>Kritik kayıt yok.</div>}</div></div>
          <div className={styles.dofColumn}><div className={styles.dofColumnHeader}><strong>Açık</strong><span>{open.length}</span></div><div className={styles.dofCards}>{open.length ? open.map((i) => <DofCard key={i.id} item={i} closeAction={props.closeAction} />) : <div className={styles.emptyState}>Açık kayıt yok.</div>}</div></div>
          <div className={styles.dofColumn}><div className={styles.dofColumnHeader}><strong>Kapalı</strong><span>{closed.length}</span></div><div className={styles.dofCards}>{closed.length ? closed.map((i) => <DofCard key={i.id} item={i} closeAction={props.closeAction} />) : <div className={styles.emptyState}>Kapalı kayıt yok.</div>}</div></div>
        </div>}
      {props.pagination}
    </section>
  );
}
