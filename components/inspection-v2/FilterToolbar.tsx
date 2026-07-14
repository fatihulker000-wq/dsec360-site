import Link from "next/link";
import styles from "./Inspection.module.css";

type InspectionFirmOption = {
  id: string;
  name: string;
};

type FilterToolbarProps = {
  activeFirm: string;
  activeFirmName: string;
  activeType: string;
  firms: InspectionFirmOption[];
  makeFirmHref: (firm: string) => string;
  isActiveFirm: (
    firm: InspectionFirmOption
  ) => boolean;
};

export default function FilterToolbar({
  activeFirm,
  activeFirmName,
  activeType,
  firms,
  makeFirmHref,
  isActiveFirm,
}: FilterToolbarProps) {
  return (
    <section className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <div>
          <div className={styles.filterTitle}>
            Firma ve kapsam filtresi
          </div>

          <div className={styles.filterDescription}>
            Seçim yapıldığında tüm KPI, DÖF ve
            denetim kayıtları aynı kapsamda güncellenir.
          </div>
        </div>

        <div className={styles.activeFilter}>
          <span>Aktif kapsam</span>
          <strong>{activeFirmName}</strong>

          {activeType !== "ALL" && (
            <em>{activeType}</em>
          )}
        </div>
      </div>

      <div className={styles.filterPills}>
        <Link
          href={makeFirmHref("ALL")}
          className={`${styles.filterPill} ${
            activeFirm === "ALL"
              ? styles.filterPillActive
              : ""
          }`}
        >
          Tüm Firmalar
        </Link>

        {firms.map((firm) => (
          <Link
            key={firm.id}
            href={makeFirmHref(firm.id)}
            className={`${styles.filterPill} ${
              isActiveFirm(firm)
                ? styles.filterPillActive
                : ""
            }`}
          >
            {firm.name}
          </Link>
        ))}
      </div>
    </section>
  );
}