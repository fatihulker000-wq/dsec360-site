export default function PricingPage() {
  return (
    <main style={{ padding: "80px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: "42px", fontWeight: 800 }}>
        Fiyatlandırma
      </h1>

      <p style={{ marginTop: 20, fontSize: "18px", opacity: 0.8 }}>
        D-SEC platformu için size özel fiyatlandırma sunuyoruz.
      </p>

      <div style={{ marginTop: 40 }}>
        <a
          href="/contact"
          style={{
            padding: "14px 24px",
            background: "#b91c1c",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Teklif Al
        </a>
      </div>
    </main>
  );
}