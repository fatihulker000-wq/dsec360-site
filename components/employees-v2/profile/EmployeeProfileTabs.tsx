"use client";

import type { EmployeeProfileTab } from "./types";

const tabs: Array<{
  key: EmployeeProfileTab;
  title: string;
}> = [
  { key: "OVERVIEW", title: "Genel" },
  { key: "IDENTITY", title: "Kimlik" },
  { key: "CONTACT", title: "İletişim" },
  { key: "TRAINING", title: "Eğitim" },
  { key: "HEALTH", title: "Sağlık" },
  { key: "PPE", title: "KKD" },
  { key: "RISK", title: "Risk" },
  { key: "AUDITS", title: "Denetimler" },
  { key: "ACCIDENTS", title: "İş Kazaları" },
  { key: "DOCUMENTS", title: "Belgeler" },
  { key: "AGENDA", title: "Ajanda" },
  { key: "SGK", title: "SGK" },
  { key: "IBYS", title: "İBYS" },
  { key: "ACTIVITY", title: "Geçmiş" },
];

export default function EmployeeProfileTabs({
  activeTab,
  onChange,
}: {
  activeTab: EmployeeProfileTab;
  onChange(tab: EmployeeProfileTab): void;
}) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: 8,
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          style={{
            border: "none",
            borderRadius: 11,
            padding: "9px 12px",
            background:
              activeTab === tab.key
                ? "#b91c1c"
                : "#f1f5f9",
            color:
              activeTab === tab.key
                ? "#fff"
                : "#334155",
            fontWeight: 900,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {tab.title}
        </button>
      ))}
    </nav>
  );
}
