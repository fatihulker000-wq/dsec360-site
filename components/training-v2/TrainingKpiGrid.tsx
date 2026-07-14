"use client";

import styles from "./Training.module.css";

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
    ["Toplam Çalışan", props.totalEmployees, "Eğitim kapsamındaki çalışanlar", "slate"],
    ["Toplam Eğitim", props.totalTrainings, "Aktif eğitim içerikleri", "purple"],
    ["Toplam Atama", props.totalAssigned, "Çalışan eğitim atamaları", "blue"],
    ["Tamamlanan", props.completed, "Başarıyla biten eğitimler", "green"],
    ["Devam Eden", props.inProgress, "Aktif eğitim süreçleri", "amber"],
    ["Başlamayan", props.notStarted, "Henüz başlanmayan atamalar", "red"],
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
