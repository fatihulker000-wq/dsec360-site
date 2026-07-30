"use client";

import styles from "./training.module.css";

type Props = {
  totalEmployees: number;
  totalTrainings: number;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
};

export default function TrainingKpiGrid(props: Props) {
  const items = [
    ["Toplam Ã‡alÄ±ÅŸan", props.totalEmployees, "EÄŸitim kapsamÄ±ndaki Ã§alÄ±ÅŸanlar", "slate"],
    ["Toplam EÄŸitim", props.totalTrainings, "Aktif eÄŸitim iÃ§erikleri", "purple"],
    ["Toplam Atama", props.totalAssigned, "Ã‡alÄ±ÅŸan eÄŸitim atamalarÄ±", "blue"],
    ["Tamamlanan", props.completed, "BaÅŸarÄ±yla biten eÄŸitimler", "green"],
    ["Devam Eden", props.inProgress, "Aktif eÄŸitim sÃ¼reÃ§leri", "amber"],
    ["BaÅŸlamayan", props.notStarted, "HenÃ¼z baÅŸlanmayan atamalar", "red"],
  ] as const;

  return (
    <section className={styles.kpiGrid}>
      {items.map(([title,value,desc,tone]) => (
        <article key={title} className={`${styles.kpiCard} ${styles[`tone_${tone}`]}`}>
          <span>{title}</span><strong>{value}</strong><p>{desc}</p><i />
        </article>
      ))}
    </section>
  );
}

