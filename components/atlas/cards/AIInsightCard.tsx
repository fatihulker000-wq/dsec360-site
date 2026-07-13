"use client";

import Link from "next/link";
import { Bot, ArrowRight, Sparkles } from "lucide-react";
import styles from "./AIInsightCard.module.css";

interface AIInsightCardProps {
  title?: string;
  subtitle?: string;
  insights: string[];
  href?: string;
  actionLabel?: string;
}

export default function AIInsightCard({
  title = "DORA Executive Intelligence",
  subtitle = "Bugünkü yönetici özeti",
  insights,
  href,
  actionLabel = "Detaylı analizi aç",
}: AIInsightCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          <Bot size={24} />
        </div>

        <div>
          <div className={styles.aiLabel}>
            <Sparkles size={14} />
            AI Insight
          </div>

          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className={styles.list}>
        {insights.map((insight, index) => (
          <div key={`${insight}-${index}`} className={styles.insight}>
            <span className={styles.dot} />
            <p>{insight}</p>
          </div>
        ))}
      </div>

      {href && (
        <Link href={href} className={styles.action}>
          <span>{actionLabel}</span>
          <ArrowRight size={17} />
        </Link>
      )}
    </section>
  );
}