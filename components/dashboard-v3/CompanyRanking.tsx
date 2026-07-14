"use client";

import Link from "next/link";
import { ArrowUpRight, Award, Building2, Medal } from "lucide-react";
import styles from "./DashboardV3.module.css";

export type CompanyPerformanceItem = {
  name: string;
  score: number;
  completed: number;
  total: number;
};

type CompanyRankingProps = {
  companies: CompanyPerformanceItem[];
};

function rankIcon(index: number) {
  if (index === 0) return <Award size={19} />;
  if (index === 1 || index === 2) return <Medal size={18} />;
  return <span>{index + 1}</span>;
}

export default function CompanyRanking({
  companies,
}: CompanyRankingProps) {
  return (
    <section className={styles.insightPanel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelEyebrow}>
            <Building2 size={14} />
            Firma karşılaştırması
          </div>
          <h2>Firma Performans Sıralaması</h2>
          <p>Eğitim tamamlama oranına göre en güçlü firma görünümü.</p>
        </div>

        <Link className={styles.panelLink} href="/admin/companies">
          Tüm firmalar
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className={styles.compactEmpty}>
          <Building2 size={28} />
          <strong>Firma performans verisi yok</strong>
          <span>Eğitim atamaları tamamlandıkça sıralama oluşacak.</span>
        </div>
      ) : (
        <div className={styles.rankingList}>
          {companies.slice(0, 6).map((company, index) => (
            <article className={styles.rankingItem} key={company.name}>
              <div className={`${styles.rankBadge} ${index < 3 ? styles.rankTop : ""}`}>
                {rankIcon(index)}
              </div>

              <div className={styles.rankingMain}>
                <div className={styles.rankingTitle}>
                  <strong>{company.name}</strong>
                  <span>%{company.score}</span>
                </div>

                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressValue}
                    style={{ width: `${company.score}%` }}
                  />
                </div>

                <div className={styles.rankingMeta}>
                  <span>{company.completed} tamamlandı</span>
                  <span>{company.total} toplam atama</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
