"use client";

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
  function changeFirm(value: string) {
    window.location.assign(props.makeFirmHref(value));
  }

  return (
    <section className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <div>
          <div className={styles.filterTitle}>Firma ve kapsam filtresi</div>
          <div className={styles.filterDescription}>
            Seçilen firma; KPI, uygunluk, DÖF, analiz ve denetim kayıtlarının tamamına uygulanır.
          </div>
        </div>

        <div className={styles.activeFilter}>
          <span>Aktif kapsam</span>
          <strong>{props.activeFirmName}</strong>
          {props.activeType !== "ALL" && <em>{props.activeType}</em>}
        </div>
      </div>

      <div className={styles.firmSelectorGrid}>
        <label className={styles.firmSelectBox}>
          <span>Firma seç</span>
          <select
            value={props.activeFirm}
            onChange={(event) => changeFirm(event.target.value)}
            aria-label="Denetim firma filtresi"
          >
            <option value="ALL">Tüm Firmalar — Kurumsal Görünüm</option>
            {props.firms.map((firm) => (
              <option key={firm.id} value={firm.id}>
                {firm.name}
              </option>
            ))}
          </select>
          <small>
            Firma değiştirildiğinde sayfadaki tüm denetim verileri aynı UUID kapsamıyla yeniden yüklenir.
          </small>
        </label>

        <div className={styles.filterPills}>
          <Link
            href={props.makeFirmHref("ALL")}
            className={`${styles.filterPill} ${
              props.activeFirm === "ALL" ? styles.filterPillActive : ""
            }`}
          >
            Tüm Firmalar
          </Link>

          {props.firms.map((firm) => (
            <Link
              key={firm.id}
              href={props.makeFirmHref(firm.id)}
              className={`${styles.filterPill} ${
                props.isActiveFirm(firm) ? styles.filterPillActive : ""
              }`}
            >
              {firm.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
