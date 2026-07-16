"use client";

export default function DoraEmployeeSignals({
  positiveSignals,
  riskSignals,
}: {
  positiveSignals: string[];
  riskSignals: string[];
}) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(280px,1fr))",
        gap: 14,
      }}
    >
      <SignalPanel
        title="Olumlu Sinyaller"
        items={positiveSignals}
        background="#ecfdf5"
        color="#166534"
        emptyText="Olumlu sinyal üretmek için yeterli veri bulunmuyor."
      />

      <SignalPanel
        title="Risk Sinyalleri"
        items={riskSignals}
        background="#fff7ed"
        color="#b45309"
        emptyText="Belirgin risk sinyali bulunmuyor."
      />
    </section>
  );
}

function SignalPanel({
  title,
  items,
  background,
  color,
  emptyText,
}: {
  title: string;
  items: string[];
  background: string;
  color: string;
  emptyText: string;
}) {
  return (
    <article
      style={{
        padding: 18,
        borderRadius: 18,
        background,
        border: `1px solid ${color}22`,
      }}
    >
      <div
        style={{
          color,
          fontSize: 18,
          fontWeight: 950,
        }}
      >
        {title}
      </div>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 12,
            color,
            fontSize: 12,
            fontWeight: 750,
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 12,
          }}
        >
          {items.map((item) => (
            <div
              key={item}
              style={{
                padding: 10,
                borderRadius: 11,
                background: "#fff",
                color,
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
