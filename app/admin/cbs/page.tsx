"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type CbsRecord = {
  id: number;
  full_name: string;
  email: string;
  message: string;
  created_at: string;
  category?: string;
  firmId?: number;
  assignedTo?: string;
  resolutionNote?: string;
  status?: string;
  priority?: "low" | "normal" | "high" | "critical" | string;
  sla_due_at?: string | null;
  closed_at?: string | null;
};

type FilterType = "all" | "new" | "read" | "processing" | "closed";

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("tr-TR");
  } catch {
    return dateString;
  }
}

function isSlaExceeded(sla?: string | null, status?: string) {
  if (!sla) return false;
  if (status === "closed") return false;

  const due = new Date(sla).getTime();
  if (Number.isNaN(due)) return false;

  return due < Date.now();
}

function getSlaText(sla?: string | null, status?: string) {
  if (!sla) return "SLA tanımlı değil";
  if (status === "closed") return "Kayıt kapatıldı";

  const due = new Date(sla).getTime();
  if (Number.isNaN(due)) return "SLA tanımsız";

  const diffMs = due - Date.now();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return `SLA aşıldı • ${Math.abs(diffHours)} saat geçti`;
  }

  if (diffHours === 0) {
    return "SLA bugün doluyor";
  }

  return `SLA kalan süre • ${diffHours} saat`;
}

function getPriorityLabel(priority?: string) {
  switch ((priority || "").toLowerCase()) {
    case "low":
      return "Düşük";
    case "high":
      return "Yüksek";
    case "critical":
      return "Kritik";
    default:
      return "Normal";
  }
}

function getPriorityStyle(priority?: string): React.CSSProperties {
  switch ((priority || "").toLowerCase()) {
    case "low":
      return {
        background: "#ecfdf5",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "high":
      return {
        background: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fdba74",
      };
    case "critical":
      return {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #cbd5e1",
      };
  }
}

async function readSafeJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: "Sunucudan geçersiz yanıt geldi." };
  }
}

function StatusPill({
  label,
  value,
  bg,
  color,
  border,
}: {
  label: string;
  value: number | string;
  bg: string;
  color: string;
  border: string;
}) {
  return (
    <div
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          marginTop: 8,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TinyBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const height = Math.max(16, Math.round((value / Math.max(max, 1)) * 110));

  return (
    <div
      style={{
        flex: 1,
        minWidth: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 54,
          height,
          background: color,
          borderRadius: "14px 14px 6px 6px",
          boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
        }}
      />

      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function AdminCbsPage() {
  const [records, setRecords] = useState<CbsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");

  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editPriority, setEditPriority] = useState<
    "low" | "normal" | "high" | "critical"
  >("normal");
  const [editResolutionNote, setEditResolutionNote] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/cbs", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        setRecords([]);
        setPageError(result?.error || "CBS kayıtları alınamadı.");
        return;
      }

      setRecords(result?.data ?? []);
    } catch (error) {
      console.error("CBS kayıt yükleme hatası:", error);
      setRecords([]);
      setPageError("CBS kayıtları yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const updateStatus = async (
    id: number,
    status: "new" | "read" | "processing" | "closed"
  ) => {
    try {
      setBusyId(id);

      const response = await fetch("/api/admin/cbs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        alert(result?.error || "Durum güncellenemedi.");
        return;
      }

      await loadRecords();
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
      alert("Durum güncellenirken hata oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  const saveDetails = async () => {
    if (!editId) return;

    try {
      setSavingEdit(true);

      const response = await fetch("/api/admin/cbs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editId,
          category: editCategory.trim() || null,
          assignedTo: editAssignedTo.trim() || null,
          resolutionNote: editResolutionNote.trim() || null,
          priority: editPriority,
        }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        alert(result?.error || "Detaylar kaydedilemedi.");
        return;
      }

      setEditId(null);
      setEditCategory("");
      setEditAssignedTo("");
      setEditPriority("normal");
      setEditResolutionNote("");
      await loadRecords();
      alert("Kayıt detayları güncellendi.");
    } catch (error) {
      console.error("CBS detay kayıt hatası:", error);
      alert("Detaylar kaydedilirken hata oluştu.");
    } finally {
      setSavingEdit(false);
    }
  };

  const openEdit = (item: CbsRecord) => {
    setReplyId(null);
    setReplyText("");
    setEditId(item.id);
    setEditCategory(item.category || "");
    setEditAssignedTo(item.assignedTo || "");
    setEditPriority(
      (item.priority as "low" | "normal" | "high" | "critical") || "normal"
    );
    setEditResolutionNote(item.resolutionNote || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditCategory("");
    setEditAssignedTo("");
    setEditPriority("normal");
    setEditResolutionNote("");
  };

  const deleteRecord = async (id: number) => {
    const ok = window.confirm("Bu kaydı silmek istediğine emin misin?");
    if (!ok) return;

    try {
      setBusyId(id);

      const response = await fetch("/api/admin/cbs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        alert(result?.error || "Kayıt silinemedi.");
        return;
      }

      await loadRecords();
    } catch (error) {
      console.error("Kayıt silme hatası:", error);
      alert("Kayıt silinirken hata oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  const sendReply = async () => {
    if (!replyId) return;
    if (!replyText.trim()) {
      alert("Lütfen cevap metni yaz.");
      return;
    }

    try {
      setSendingReply(true);

      const response = await fetch("/api/admin/cbs-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: replyId,
          replyMessage: replyText.trim(),
        }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        alert(result?.error || "Cevap gönderilemedi.");
        return;
      }

      setReplyId(null);
      setReplyText("");
      await loadRecords();

      if (result?.warning) {
        alert(result.warning);
        return;
      }

      alert("Cevap gönderildi ve kayıt kapatıldı.");
    } catch (error) {
      console.error("CBS cevap gönderim hatası:", error);
      alert("Cevap gönderilirken hata oluştu.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  const exportPdfReport = async () => {
    const element = document.getElementById("cbs-report-area");
    if (!element) {
      alert("Rapor alanı bulunamadı.");
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save("dsec-cbs-raporu.pdf");
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      alert("PDF oluşturulurken hata oluştu.");
    }
  };

  const getStatusLabel = (status?: string) => {
    if (status === "read") return "Okundu";
    if (status === "processing") return "İşlemde";
    if (status === "closed") return "Kapalı";
    return "Yeni Başvuru";
  };

  const getStatusStyle = (status?: string): React.CSSProperties => {
    if (status === "read") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (status === "processing") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (status === "closed") {
      return {
        background: "#ecfdf5",
        color: "#166534",
      };
    }

    return {
      background: "#fee2e2",
      color: "#b91c1c",
    };
  };

  const filteredRecords = useMemo(() => {
    let data = records;

    if (filter !== "all") {
      data = data.filter((item) => (item.status || "new") === filter);
    }

    const query = search.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) => {
      return (
        item.full_name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.assignedTo?.toLowerCase().includes(query) ||
        item.resolutionNote?.toLowerCase().includes(query) ||
        item.priority?.toLowerCase().includes(query)
      );
    });
  }, [records, filter, search]);

  const countAll = records.length;
  const countNew = records.filter(
    (item) => (item.status || "new") === "new"
  ).length;
  const countRead = records.filter((item) => item.status === "read").length;
  const countProcessing = records.filter(
    (item) => item.status === "processing"
  ).length;
  const countClosed = records.filter((item) => item.status === "closed").length;
  const countSlaExceeded = records.filter((item) =>
    isSlaExceeded(item.sla_due_at, item.status)
  ).length;

  const closedRate = countAll > 0 ? Math.round((countClosed / countAll) * 100) : 0;
  const slaSafeCount = countAll - countSlaExceeded;

  const criticalCount = records.filter(
    (item) => String(item.priority || "").toLowerCase() === "critical"
  ).length;

  const highCount = records.filter(
    (item) => String(item.priority || "").toLowerCase() === "high"
  ).length;

  const aiSummary =
    countSlaExceeded > 0
      ? `SLA aşımı bulunan ${countSlaExceeded} kayıt var. Süreçte gecikme riski oluşmuş görünüyor. Öncelikli aksiyon önerilir.`
      : criticalCount > 0
      ? `Kritik öncelikte ${criticalCount} kayıt var. Operasyonel müdahale ve hızlı dönüş önerilir.`
      : countNew > countClosed
      ? `Yeni kayıt yoğunluğu kapanan kayıtlardan fazla. Operasyon yükü artıyor olabilir.`
      : `Kapanış oranı %${closedRate}. Genel akış kontrollü ve sistem sağlıklı görünüyor.`;

  const maxChartValue = Math.max(countNew, countProcessing, countRead, countClosed, 1);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();

    records.forEach((item) => {
      const key = item.category?.trim() || "Genel";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [records]);

  const maxCategoryValue = Math.max(...categoryStats.map((x) => x.value), 1);

  const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    border: "1px solid #e5e7eb",
    background: active ? "#111827" : "#ffffff",
    color: active ? "#ffffff" : "#374151",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Yönetim</div>
          <h1 className="hero-title">ÇBS Başvuru Paneli</h1>
          <p className="hero-desc">
            Web sitesinden gelen şikayet, öneri ve talepleri tek ekranda takip edin,
            yönetin ve kapatın.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container" id="cbs-report-area">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "26px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "34px",
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Gelen ÇBS Kayıtları
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  color: "#6b7280",
                  fontSize: "16px",
                }}
              >
                {loading ? "Kayıtlar yükleniyor..." : "Toplam kayıt: " + records.length}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button onClick={loadRecords} className="cbs-button">
                Yenile
              </button>

              <button
                onClick={exportPdfReport}
                className="cbs-button"
                style={{ background: "#2563eb" }}
              >
                PDF Rapor
              </button>

              <button
                onClick={handleLogout}
                className="cbs-button"
                style={{ background: "#111827" }}
              >
                Çıkış Yap
              </button>
            </div>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "24px",
              display: "grid",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 18,
              }}
            >
              <div
                style={{
                  borderRadius: 22,
                  padding: 22,
                  background:
                    "linear-gradient(135deg, #4a0d1a 0%, #7f1734 38%, #c62828 100%)",
                  color: "#ffffff",
                  boxShadow: "0 24px 54px rgba(127, 23, 52, 0.22)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  D-SEC • Premium Dashboard
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    lineHeight: 1.15,
                  }}
                >
                  ÇBS Operasyon Merkezi
                </div>

                <div
                  style={{
                    marginTop: 10,
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  Başvuru akışı, SLA kontrolü, öncelik takibi ve yönetim görünürlüğü
                  tek panelde izlenir.
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Toplam: {countAll}
                  </span>
                  <span
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Kapanış: %{closedRate}
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: 22,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 16px 38px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#111827",
                    marginBottom: 12,
                  }}
                >
                  AI Yönetici Özeti
                </div>

                <div
                  style={{
                    background: "#111827",
                    color: "#ffffff",
                    padding: 16,
                    borderRadius: 16,
                    lineHeight: 1.75,
                    fontSize: 14,
                  }}
                >
                  <strong>Sistem Durumu</strong>
                  <br />
                  {countSlaExceeded > 0
                    ? `⚠ Kritik uyarı: ${countSlaExceeded} adet SLA aşımı var`
                    : "✔ Sistem sağlıklı görünüyor"}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    color: "#6b7280",
                    lineHeight: 1.8,
                    fontSize: 14,
                  }}
                >
                  {aiSummary}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Kapanış Oranı: %{closedRate}
                  </span>

                  <span
                    style={{
                      background: "#ecfdf5",
                      color: "#166534",
                      border: "1px solid #86efac",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    SLA Sağlıklı: {slaSafeCount}
                  </span>

                  <span
                    style={{
                      background: "#fff7ed",
                      color: "#c2410c",
                      border: "1px solid #fdba74",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Yüksek Öncelik: {highCount}
                  </span>

                  <span
                    style={{
                      background: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fca5a5",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Kritik Öncelik: {criticalCount}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
              }}
            >
              <StatusPill
                label="Toplam"
                value={countAll}
                bg="#f8fafc"
                color="#334155"
                border="#e5e7eb"
              />
              <StatusPill
                label="Yeni"
                value={countNew}
                bg="#fff1f2"
                color="#9f1239"
                border="#fecdd3"
              />
              <StatusPill
                label="İşlemde"
                value={countProcessing}
                bg="#fffbeb"
                color="#92400e"
                border="#fde68a"
              />
              <StatusPill
                label="Okundu"
                value={countRead}
                bg="#eff6ff"
                color="#1d4ed8"
                border="#bfdbfe"
              />
              <StatusPill
                label="Kapalı"
                value={countClosed}
                bg="#ecfdf5"
                color="#166534"
                border="#86efac"
              />
              <StatusPill
                label="SLA Aşımı"
                value={countSlaExceeded}
                bg="#fef2f2"
                color="#b91c1c"
                border="#fca5a5"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 18,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 20,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 14, color: "#111827" }}>
                  Durum Dağılımı
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "end",
                    height: 170,
                    paddingTop: 8,
                  }}
                >
                  <TinyBar
                    label="Yeni"
                    value={countNew}
                    max={maxChartValue}
                    color="#ef4444"
                  />
                  <TinyBar
                    label="İşlemde"
                    value={countProcessing}
                    max={maxChartValue}
                    color="#f59e0b"
                  />
                  <TinyBar
                    label="Okundu"
                    value={countRead}
                    max={maxChartValue}
                    color="#3b82f6"
                  />
                  <TinyBar
                    label="Kapalı"
                    value={countClosed}
                    max={maxChartValue}
                    color="#22c55e"
                  />
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 20,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 14, color: "#111827" }}>
                  Kategori Yoğunluğu
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {categoryStats.length === 0 ? (
                    <div style={{ color: "#6b7280" }}>Kategori verisi yok.</div>
                  ) : (
                    categoryStats.map((item) => (
                      <div key={item.label}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 6,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#111827" }}>
                            {item.label}
                          </span>
                          <span style={{ color: "#6b7280" }}>{item.value}</span>
                        </div>

                        <div
                          style={{
                            height: 10,
                            borderRadius: 999,
                            background: "#f1f5f9",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(
                                8,
                                Math.round((item.value / maxCategoryValue) * 100)
                              )}%`,
                              background:
                                "linear-gradient(90deg, #7f1734 0%, #c62828 100%)",
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, email, kategori, atanan kişi, öncelik veya mesaj içinde ara"
              className="cbs-input"
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                style={filterButtonStyle(filter === "all")}
                onClick={() => setFilter("all")}
              >
                Tümü
              </button>

              <button
                style={filterButtonStyle(filter === "new")}
                onClick={() => setFilter("new")}
              >
                Yeni
              </button>

              <button
                style={filterButtonStyle(filter === "processing")}
                onClick={() => setFilter("processing")}
              >
                İşlemde
              </button>

              <button
                style={filterButtonStyle(filter === "read")}
                onClick={() => setFilter("read")}
              >
                Okundu
              </button>

              <button
                style={filterButtonStyle(filter === "closed")}
                onClick={() => setFilter("closed")}
              >
                Kapalı
              </button>
            </div>
          </div>

          {pageError && (
            <div className="card" style={{ marginBottom: "20px" }}>
              <h3 className="card-title">Hata</h3>
              <p className="card-text">{pageError}</p>
            </div>
          )}

          {loading ? (
            <div className="card">
              <h3 className="card-title">Yükleniyor</h3>
              <p className="card-text">ÇBS kayıtları getiriliyor...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="card">
              <h3 className="card-title">Kayıt bulunamadı</h3>
              <p className="card-text">Seçili filtreye uygun kayıt görünmüyor.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              {filteredRecords.map((item) => (
                <div key={item.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <h3
                        className="card-title"
                        style={{ marginBottom: "6px" }}
                      >
                        {item.full_name || "Adsız kayıt"}
                      </h3>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          lineHeight: "1.7",
                        }}
                      >
                        <div>
                          <strong>Email:</strong> {item.email}
                        </div>
                        <div>
                          <strong>Tarih:</strong> {formatDate(item.created_at)}
                        </div>
                        <div>
                          <strong>ID:</strong> #{item.id}
                        </div>

                        {item.category && (
                          <div>
                            <strong>Kategori:</strong> {item.category}
                          </div>
                        )}

                        {item.assignedTo && (
                          <div>
                            <strong>Atanan:</strong> {item.assignedTo}
                          </div>
                        )}

                        {item.closed_at && (
                          <div>
                            <strong>Kapanış:</strong> {formatDate(item.closed_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        justifyItems: "end",
                      }}
                    >
                      <div
                        style={{
                          ...getStatusStyle(item.status),
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {getStatusLabel(item.status)}
                      </div>

                      <div
                        style={{
                          ...getPriorityStyle(item.priority),
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Öncelik: {getPriorityLabel(item.priority)}
                      </div>

                      {isSlaExceeded(item.sla_due_at, item.status) ? (
                        <div
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            padding: "8px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            border: "1px solid #fca5a5",
                          }}
                        >
                          SLA AŞILDI 🚨
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "#f8fafc",
                            color: "#334155",
                            padding: "8px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {getSlaText(item.sla_due_at, item.status)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      Mesaj
                    </div>

                    <div
                      style={{
                        fontSize: "15px",
                        color: "#374151",
                        lineHeight: "1.8",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.message}
                    </div>
                  </div>

                  {item.resolutionNote && (
                    <div
                      style={{
                        marginTop: "14px",
                        background: "#ecfeff",
                        border: "1px solid #a5f3fc",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#155e75",
                          marginBottom: "8px",
                        }}
                      >
                        Çözüm Notu
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#0f172a",
                          lineHeight: "1.8",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.resolutionNote}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => updateStatus(item.id, "read")}
                      disabled={busyId === item.id || item.status === "closed"}
                      className="cbs-button"
                    >
                      Okundu
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "processing")}
                      disabled={busyId === item.id || item.status === "closed"}
                      className="cbs-button"
                      style={{ background: "#f59e0b" }}
                    >
                      İşlemde
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "new")}
                      disabled={busyId === item.id || item.status === "closed"}
                      className="cbs-button"
                      style={{ background: "#dc2626" }}
                    >
                      Yeniye Al
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "closed")}
                      disabled={busyId === item.id || item.status === "closed"}
                      className="cbs-button"
                      style={{ background: "#16a34a" }}
                    >
                      Kapat
                    </button>

                    <button
                      onClick={() => openEdit(item)}
                      disabled={savingEdit || sendingReply}
                      className="cbs-button"
                      style={{ background: "#7c3aed" }}
                    >
                      Düzenle
                    </button>

                    <button
                      onClick={() => {
                        setEditId(null);
                        setReplyId(item.id);
                        setReplyText(item.resolutionNote || "");
                      }}
                      disabled={item.status === "closed" || sendingReply}
                      className="cbs-button"
                      style={{ background: "#2563eb" }}
                    >
                      Cevapla & Kapat
                    </button>

                    <button
                      onClick={() => deleteRecord(item.id)}
                      disabled={busyId === item.id}
                      className="cbs-button"
                      style={{ background: "#111827" }}
                    >
                      Sil
                    </button>
                  </div>

                  {editId === item.id && (
                    <div
                      style={{
                        marginTop: "16px",
                        border: "1px solid #e9d5ff",
                        background: "#faf5ff",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#6d28d9",
                          marginBottom: "12px",
                        }}
                      >
                        Kayıt Detaylarını Düzenle
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#374151",
                              marginBottom: "6px",
                            }}
                          >
                            Kategori
                          </label>
                          <input
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="cbs-input"
                            placeholder="Kategori gir"
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#374151",
                              marginBottom: "6px",
                            }}
                          >
                            Atanan Kişi
                          </label>
                          <input
                            value={editAssignedTo}
                            onChange={(e) => setEditAssignedTo(e.target.value)}
                            className="cbs-input"
                            placeholder="Atanan kişi gir"
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#374151",
                              marginBottom: "6px",
                            }}
                          >
                            Öncelik
                          </label>
                          <select
                            value={editPriority}
                            onChange={(e) =>
                              setEditPriority(
                                e.target.value as
                                  | "low"
                                  | "normal"
                                  | "high"
                                  | "critical"
                              )
                            }
                            className="cbs-input"
                          >
                            <option value="low">Düşük</option>
                            <option value="normal">Normal</option>
                            <option value="high">Yüksek</option>
                            <option value="critical">Kritik</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#374151",
                            marginBottom: "6px",
                          }}
                        >
                          Çözüm Notu
                        </label>
                        <textarea
                          value={editResolutionNote}
                          onChange={(e) =>
                            setEditResolutionNote(e.target.value)
                          }
                          placeholder="Çözüm notunu yaz..."
                          className="cbs-textarea"
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={saveDetails}
                          disabled={savingEdit}
                          className="cbs-button"
                          style={{ background: "#16a34a" }}
                        >
                          {savingEdit ? "Kaydediliyor..." : "Kaydet"}
                        </button>

                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="cbs-button"
                          style={{ background: "#64748b" }}
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}

                  {replyId === item.id && (
                    <div
                      style={{
                        marginTop: "16px",
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1d4ed8",
                          marginBottom: "10px",
                        }}
                      >
                        Kullanıcıya cevap gönder ve kaydı kapat
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Admin cevabını buraya yaz..."
                        className="cbs-textarea"
                      />

                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={sendReply}
                          disabled={sendingReply}
                          className="cbs-button"
                          style={{ background: "#16a34a" }}
                        >
                          {sendingReply ? "Gönderiliyor..." : "Gönder & Kapat"}
                        </button>

                        <button
                          onClick={() => {
                            setReplyId(null);
                            setReplyText("");
                          }}
                          disabled={sendingReply}
                          className="cbs-button"
                          style={{ background: "#64748b" }}
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}