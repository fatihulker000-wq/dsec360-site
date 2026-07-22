"use client";

import {
  BookOpenCheck,
  CheckCircle2,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  record: RiskRecord;
  legislation?: string[];
};

function inferLegislation(record: RiskRecord) {
  const text = [
    record.activity,
    record.hazard,
    record.consequence,
    record.existingControl,
    record.proposedControl,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  const items = new Set<string>([
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği",
  ]);

  if (
    /forklift|makine|ekipman|pres|konveyör|vinç|transpalet/.test(
      text
    )
  ) {
    items.add(
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği"
    );
  }

  if (/yangın|tahliye|acil|patlama/.test(text)) {
    items.add(
      "İşyerlerinde Acil Durumlar Hakkında Yönetmelik"
    );
    items.add(
      "Binaların Yangından Korunması Hakkında Yönetmelik"
    );
  }

  if (/elektrik|pano|kablo|ark/.test(text)) {
    items.add("Elektrik İç Tesisleri Yönetmeliği");
  }

  if (/elle taşıma|kaldırma|ergonomi|bel/.test(text)) {
    items.add("Elle Taşıma İşleri Yönetmeliği");
  }

  if (/kimyasal|solvent|asit|gaz|toz/.test(text)) {
    items.add(
      "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik"
    );
  }

  if (/kkd|baret|eldiven|gözlük|maske/.test(text)) {
    items.add(
      "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik"
    );
  }

  if (/işaret|levha|uyarı|trafik planı/.test(text)) {
    items.add("Sağlık ve Güvenlik İşaretleri Yönetmeliği");
  }

  return Array.from(items);
}

export default function RiskLegislationPanel({
  record,
  legislation,
}: Props) {
  const items =
    legislation && legislation.length > 0
      ? legislation
      : inferLegislation(record);

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid #ddd6fe",
        background: "#f5f3ff",
        padding: 15,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          color: "#6d28d9",
          fontWeight: 950,
        }}
      >
        <BookOpenCheck size={19} />
        İlgili Mevzuat
      </div>

      <div
        style={{
          marginTop: 11,
          display: "grid",
          gap: 8,
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: "grid",
              gridTemplateColumns: "17px 1fr",
              gap: 7,
              color: "#334155",
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            <CheckCircle2
              size={15}
              color="#6d28d9"
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}