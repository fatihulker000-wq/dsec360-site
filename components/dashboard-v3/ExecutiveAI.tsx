"use client";

import { AIInsightCard } from "@/components/atlas";

type ExecutiveAIProps = {
  insights: string[];
};

export default function ExecutiveAI({ insights }: ExecutiveAIProps) {
  return (
    <AIInsightCard
      title="DORA Executive Intelligence"
      subtitle="Canlı verilerden oluşturulan yönetici özeti"
      insights={insights}
      href="/admin/dora"
      actionLabel="DORA analiz merkezini aç"
    />
  );
}
