import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./Inspection.module.css";

export type InspectionViewItem = {
  id: number | string;
  firmName: string;
  mode: string;
  modeBg: string;
  modeColor: string;
  template: string;
  inspector: string;
  date: string;
  answerCount: number;
  dofCount: number;
  appRunId?: string | number | null;
};

type Props = {
  items: InspectionViewItem[];
  deleteAction: (formData: FormData) => Promise<void>;
  pagination?: ReactNode;
};

export default function InspectionCards({ items, deleteAction, pagination }: Props) {
  return (
    <section className={styles.inspectionSection}>
      <div className={styles.moduleHeader}>
        <div><span className={styles.sectionEyebrow}>Inspection Records</span><h2>Denetim Kayıtları</h2><p>Firma, tür, denetçi, bulgu ve DÖF bilgileriyle premium kayıt görünümü.</p></div>
        <div className={styles.moduleCount}><span>Aktif kayıt</span><strong>{items.length}</strong></div>
      </div>

      {items.length === 0 ? <div className={styles.emptyState}>Seçilen filtreye uygun denetim kaydı yok.</div> :
        <div className={styles.inspectionGrid}>
          {items.map((item) => (
            <article key={item.id} className={styles.inspectionCard}>
              <div className={styles.inspectionTop}>
                <div><div className={styles.inspectionCompany}>{item.firmName}</div><div className={styles.inspectionSub}>App Run: {item.appRunId || "-"} • Remote: {item.id}</div></div>
                <span className={styles.modeBadge} style={{ background:item.modeBg, color:item.modeColor }}>{item.mode}</span>
              </div>

              <div className={styles.inspectionStats}>
                <div><span>Madde</span><strong>{item.answerCount}</strong></div>
                <div><span>DÖF</span><strong>{item.dofCount}</strong></div>
                <div><span>Durum</span><strong>{item.answerCount > 0 ? "Aktif" : "Boş"}</strong></div>
              </div>

              <div className={styles.inspectionInfo}>
                <span>Şablon: {item.template}</span><span>Denetçi: {item.inspector}</span><span>Tarih: {item.date}</span>
              </div>

              <div className={styles.inspectionActions}>
                <Link href={`/admin/denetimler/${item.id}`} className={`${styles.smallAction} ${styles.smallActionPrimary}`}>Detay</Link>
                <Link href={`/admin/denetimler/${item.id}/print`} target="_blank" className={styles.smallAction}>App Raporu</Link>
                <Link href={`/admin/denetimler/${item.id}/edit`} className={styles.smallAction}>Düzenle</Link>
                <form action={deleteAction}><input type="hidden" name="remoteId" value={item.id} /><button type="submit" className={`${styles.smallAction} ${styles.dangerButton}`}>Sil</button></form>
              </div>
            </article>
          ))}
        </div>}
      {pagination}
    </section>
  );
}
