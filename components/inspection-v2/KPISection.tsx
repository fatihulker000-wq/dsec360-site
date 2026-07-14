import Link from "next/link";
import styles from "./Inspection.module.css";

type InspectionKpiTone =
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple";

type InspectionKpiItem = {
  title: string;
  value: number | string;
  description: string;
  href: string;
  tone?: InspectionKpiTone;
  badge?: string;
};

type KPISectionProps = {
  items: InspectionKpiItem[];
};

export default function KPISection({
  items,
}: KPISectionProps) {
  return (
    <section className={styles.kpiGrid}>
      {items.map((item) => (
        <Link
          key={`${item.title}-${item.href}`}
          href={item.href}
          className={`${styles.kpiCard} ${
            styles[`tone_${item.tone || "slate"}`]
          }`}
        >
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>
              {item.title}
            </span>

            {item.badge && (
              <span className={styles.kpiBadge}>
                {item.badge}
              </span>
            )}
          </div>

          <div className={styles.kpiValue}>
            {item.value}
          </div>

          <div className={styles.kpiDescription}>
            {item.description}
          </div>

          <div className={styles.kpiLine}>
            <span />
          </div>
        </Link>
      ))}
    </section>
  );
}