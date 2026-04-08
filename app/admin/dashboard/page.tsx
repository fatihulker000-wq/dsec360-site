"use client";

import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/training-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Veri alınamadı.");
        return;
      }

    } catch (err) {
      console.error(err);
      setError("Veri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ✅ TEK PDF FONKSİYONU
  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const element = document.body;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

    pdf.save("dsec-dashboard.pdf");
  };

  if (loading) return <div style={{ padding: 20 }}>Yükleniyor...</div>;
  if (error) return <div style={{ padding: 20 }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <button
        onClick={exportPDF}
        style={{
          padding: "10px 16px",
          background: "#c62828",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        PDF İndir
      </button>
    </div>
  );
}