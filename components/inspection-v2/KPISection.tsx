import Link from "next/link";
import styles from "./Inspection.module.css";

type Tone = "slate" | "blue" | "green" | "amber" | "red" | "purple";

export type InspectionKpiItem = {
  title: string;
  value: number | string;
  description: string;
  href: string;
  tone?: Tone;
  badge?: string;
};

const toneIcon: Record<Tone, string> = {
  slate: "◫",
  blue: "◎",
  green: "✓",
  amber: "△",
  red: "!",
  purple: "✦",
};

export default function KPISection({ items }: { items: InspectionKpiItem[] }) {
  return (
    <section className={styles.kpiGridV2} aria-label="Denetim performans göstergeleri">
      {items.map((item, index) => {
        const tone = item.tone || "slate";

        return (
          <Link
            key={`${item.title}-${item.href}`}
            href={item.href}
            className={`${styles.kpiCardV2} ${styles[`kpiTone_${tone}`]}`}
          >
            <div className={styles.kpiCardV2Top}>
              <span className={styles.kpiCardV2Icon}>{toneIcon[tone]}</span>

              <div className={styles.kpiCardV2Status}>
                {item.badge || (index === 0 ? "Canlı" : "İzleniyor")}
              </div>
            </div>

            <div className={styles.kpiCardV2Body}>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </div>

            <div className={styles.kpiCardV2Footer}>
              <span>Detayı görüntüle</span>
              <strong>→</strong>
            </div>

            <div className={styles.kpiCardV2Accent} />
          </Link>
        );
      })}
    </section>
  );
}
