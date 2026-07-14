type AnalysisCardProps = {
  title: string;
  value: string;
  description: string;
  tone: "good" | "bad" | "neutral";
};

export default function AnalysisCard({
  title,
  value,
  description,
  tone,
}: AnalysisCardProps) {
  const color =
    tone === "good"
      ? "#15803d"
      : tone === "bad"
        ? "#b91c1c"
        : "#5a0f1f";

  const iconBackground =
    tone === "good"
      ? "#f0fdf4"
      : tone === "bad"
        ? "#fee2e2"
        : "#fff7f7";

  return (
    <article
      style={{
        minHeight: 126,
        padding: 18,
        borderRadius: 20,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        boxShadow: "0 12px 32px rgba(15,23,42,0.055)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 7,
              color,
              fontSize: 24,
              lineHeight: 1.1,
              fontWeight: 950,
            }}
          >
            {value}
          </div>

          <div
            style={{
              marginTop: 7,
              color: "#94a3b8",
              fontSize: 11,
              lineHeight: 1.5,
              fontWeight: 700,
            }}
          >
            {description}
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            borderRadius: 14,
            background: iconBackground,
            color,
            fontSize: 18,
            fontWeight: 950,
          }}
        >
          ●
        </div>
      </div>
    </article>
  );
}
