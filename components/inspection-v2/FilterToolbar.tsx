import Link from "next/link";
import styles from "./Inspection.module.css";

export type InspectionFirmOption = { id: string; name: string };

type Props = {
  activeFirm: string;
  activeFirmName: string;
  activeType: string;
  firms: InspectionFirmOption[];
  makeFirmHref: (firm: string) => string;
  isActiveFirm: (firm: InspectionFirmOption) => boolean;
};

export default function FilterToolbar(props: Props) {
  return (
    <section className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <div>
          <div className={styles.filterTitle}>Firma ve kapsam filtresi</div>
          <div className={styles.filterDescription}>
            Seçim yapıldığında tüm KPI, DÖF ve denetim kayıtları aynı kapsamda güncellenir.
          </div>
        </div>
        <div className={styles.activeFilter}>
          <span>Aktif kapsam</span>
          <strong>{props.activeFirmName}</strong>
          {props.activeType !== "ALL" && <em>{props.activeType}</em>}
        </div>
      </div>

      <div className={styles.filterPills}>
        <Link href={props.makeFirmHref("ALL")}
          className={`${styles.filterPill} ${props.activeFirm === "ALL" ? styles.filterPillActive : ""}`}>
          Tüm Firmalar
        </Link>
        {props.firms.map((firm) => (
          <Link key={firm.id} href={props.makeFirmHref(firm.id)}
            className={`${styles.filterPill} ${props.isActiveFirm(firm) ? styles.filterPillActive : ""}`}>
            {firm.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
