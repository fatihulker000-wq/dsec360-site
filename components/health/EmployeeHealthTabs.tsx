"use client";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const tabs = [
  "Genel",
  "EK-2",
  "Muayeneler",
  "Reçeteler",
  "Laboratuvar",
  "Odyometri",
  "Solunum",
  "Aşılar",
  "İş Kazaları",
  "Dosyalar",
  "Geçmiş",
];

export default function EmployeeHealthTabs({
  activeTab,
  setActiveTab,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 12,
        marginBottom: 20,
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "10px 14px",
              borderRadius: 999,
              fontWeight: 800,
              background: active
                ? "linear-gradient(135deg, #7f1d1d, #b91c1c)"
                : "#f8fafc",
              color: active ? "#fff" : "#334155",
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}