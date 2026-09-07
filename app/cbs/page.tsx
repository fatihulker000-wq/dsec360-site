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
  firma_adi?: string;
  firmId?: number | string | null;
  suggestedFirmId?: string | null;
  suggestedFirmName?: string | null;
  assignedTo?: string;
  resolutionNote?: string;
  status?: string;
  priority?: "low" | "normal" | "high" | "critical" | string;
  sla_due_at?: string | null;
  closed_at?: string | null;
  reference_no?: string | null;
  application_type?: string | null;
  privacy_mode?: "identified" | "confidential" | "anonymous" | string;
  category_code?: string | null;
  first_response_at?: string | null;
  assigned_at?: string | null;
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


function getApplicationTypeLabel(value?: string | null) {
  switch ((value || "").toUpperCase()) {
    case "ONERI": return "Öneri";
    case "TALEP": return "Talep";
    case "BILGI": return "Bilgi Bildirimi";
    default: return "Şikâyet";
  }
}

function getPrivacyLabel(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "anonymous": return "Anonim";
    case "confidential": return "Gizli";
    default: return "Kimlikli";
  }
}

function getPrivacyStyle(value?: string | null): React.CSSProperties {
  const v=(value||"").toLowerCase();
  if(v==="anonymous") return {background:"#f1f5f9",color:"#334155",border:"1px solid #cbd5e1"};
  if(v==="confidential") return {background:"#fef3c7",color:"#92400e",border:"1px solid #fde68a"};
  return {background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe"};
}

function getFirstResponseText(created?: string | null, first?: string | null) {
  if (!created) return "-";
  if (!first) return "Henüz yanıt yok";
  const a=new Date(created).getTime(), b=new Date(first).getTime();
  if(Number.isNaN(a)||Number.isNaN(b)) return "-";
  const mins=Math.max(0,Math.round((b-a)/60000));
  if(mins<60) return `${mins} dk`;
  const hours=Math.floor(mins/60), rem=mins%60;
  return rem ? `${hours} sa ${rem} dk` : `${hours} saat`;
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
const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
const [selectedFirmId, setSelectedFirmId] = useState("all");
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
  const [editFirmId, setEditFirmId] = useState("none");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setPageError("");

     const response = await fetch("/api/admin/cbs", {
  method: "GET",
  cache: "no-store",
  headers: {
    "x-role": "super_admin", // 🔥 şimdilik sabit
    "x-firm-id": selectedFirmId !== "all" ? selectedFirmId : "",
  },
});

      const result = await readSafeJson(response);

      if (!response.ok) {
        setRecords([]);
        setPageError(result?.error || "CBS kayıtları alınamadı.");
        return;
      }

      setRecords(Array.isArray(result?.data) ? result.data : []);
      setCompanies(result?.companies ?? []);
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
}, [selectedFirmId]);

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
  firmId: editFirmId === "none" ? null : editFirmId,
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
      setEditFirmId("none")
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
  setEditFirmId(
    String(item.firmId || item.suggestedFirmId || "none").trim() || "none"
  );
};

const cancelEdit = () => {
  setEditId(null);
  setEditCategory("");
  setEditAssignedTo("");
  setEditPriority("normal");
  setEditResolutionNote("");
  setEditFirmId("none");
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

const bindSuggestedFirm = async (
  id: number,
  suggestedFirmId?: string | null,
  suggestedFirmName?: string | null
) => {
  if (!suggestedFirmId) return;

  const ok = window.confirm(
    `"${suggestedFirmName || "Önerilen firma"}" kayda bağlansın mı?`
  );
  if (!ok) return;

  try {
    setBusyId(id);

    const response = await fetch("/api/admin/cbs", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        firmId: suggestedFirmId,
      }),
    });

    const result = await readSafeJson(response);

    if (!response.ok) {
      alert(result?.error || "Firma bağlanamadı.");
      return;
    }

    await loadRecords();
    alert("Firma başarıyla bağlandı.");
  } catch (error) {
    console.error("Firma bağlama hatası:", error);
    alert("Firma bağlanırken hata oluştu.");
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
  credentials: "include",
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

if (selectedFirmId !== "all") {
  data = data.filter((item) => {
    const directFirmId = String(item.firmId || "").trim();
    const suggestedFirmId = String(item.suggestedFirmId || "").trim();

    return (
      directFirmId === selectedFirmId ||
      suggestedFirmId === selectedFirmId
    );
  });
}

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
        item.firma_adi?.toLowerCase().includes(query) ||
        item.assignedTo?.toLowerCase().includes(query) ||
        item.resolutionNote?.toLowerCase().includes(query) ||
        item.priority?.toLowerCase().includes(query)
      );
    });
  }, [records, filter, search, selectedFirmId]);

  const countAll = filteredRecords.length;

  const countNew = filteredRecords.filter(
    (item) => (item.status || "new") === "new"
  ).length;

  const countRead = filteredRecords.filter(
    (item) => item.status === "read"
  ).length;

  const countProcessing = filteredRecords.filter(
    (item) => item.status === "processing"
  ).length;

  const countClosed = filteredRecords.filter(
    (item) => item.status === "closed"
  ).length;

  const countSlaExceeded = filteredRecords.filter((item) =>
    isSlaExceeded(item.sla_due_at, item.status)
  ).length;

  const closedRate =
    countAll > 0 ? Math.round((countClosed / countAll) * 100) : 0;

  const slaSafeCount = countAll - countSlaExceeded;

  const criticalCount = filteredRecords.filter(
    (item) => String(item.priority || "").toLowerCase() === "critical"
  ).length;

  const highCount = filteredRecords.filter(
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

  const maxChartValue = Math.max(
    countNew,
    countProcessing,
    countRead,
    countClosed,
    1
  );

const categoryStats = useMemo(() => {
  const map = new Map<string, number>();

  filteredRecords.forEach((item) => {
    const key = item.category?.trim() || "Genel";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}, [filteredRecords]);

  const maxCategoryValue = Math.max(...categoryStats.map((x) => x.value), 1);
  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((item) => {
      const key = getApplicationTypeLabel(item.application_type);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }, [records]);

  const privacyStats = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((item) => {
      const key = getPrivacyLabel(item.privacy_mode);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  }, [records]);

  const unansweredCount = records.filter(item => !item.first_response_at && item.status !== "closed").length;
  const assignedCount = records.filter(item => !!item.assignedTo).length;


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

  const selectedCompanyName =
    selectedFirmId === "all"
      ? "Tüm Firmalar"
      : companies.find((company) => company.id === selectedFirmId)?.name || "Seçili Firma";

  const actionButton = (tone: "dark" | "light" | "danger" = "light"): React.CSSProperties => ({
    border: tone === "light" ? "1px solid #e2e8f0" : "1px solid transparent",
    background: tone === "dark" ? "#111827" : tone === "danger" ? "#7f1d1d" : "#ffffff",
    color: tone === "light" ? "#334155" : "#ffffff",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: tone === "light" ? "0 1px 2px rgba(15,23,42,.04)" : "0 8px 18px rgba(15,23,42,.10)",
  });

  return (
    <main style={{ background: "#f6f7f9", minHeight: "100vh", padding: "20px 16px 48px" }}>
      <section style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            background: "linear-gradient(120deg, #4a0d1a 0%, #7f1734 48%, #b4232f 100%)",
            boxShadow: "0 20px 50px rgba(74,13,26,.18)",
            marginBottom: 18,
          }}
        >
          <div style={{ padding: "28px 30px", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 760 }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", opacity: .78 }}>
                  D-SEC • Çalışan Bildirim Sistemi
                </div>
                <h1 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 3.2vw, 42px)", lineHeight: 1.08, fontWeight: 950, letterSpacing: "-.03em" }}>
                  ÇBS Operasyon Merkezi
                </h1>
                <p style={{ margin: "10px 0 0", maxWidth: 700, fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,.86)" }}>
                  Çalışan şikayet, öneri ve taleplerini firma bazında yönetin; SLA, öncelik ve kapanış performansını tek ekrandan izleyin.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={loadRecords} style={{ ...actionButton("light"), background: "rgba(255,255,255,.96)" }}>↻&nbsp; Yenile</button>
                <button onClick={exportPdfReport} style={{ ...actionButton("light"), background: "rgba(255,255,255,.96)" }}>⇩&nbsp; PDF Rapor</button>
                <button onClick={handleLogout} style={{ ...actionButton("danger"), border: "1px solid rgba(255,255,255,.16)" }}>Çıkış</button>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
              {[
                ["Toplam", countAll],
                ["Yeni", countNew],
                ["İşlemde", countProcessing],
                ["Okundu", countRead],
                ["Kapalı", countClosed],
                ["SLA Aşımı", countSlaExceeded],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(8px)" }}>
                  <div style={{ fontSize: 12, fontWeight: 750, color: "rgba(255,255,255,.72)" }}>{label}</div>
                  <div style={{ marginTop: 5, fontSize: 24, lineHeight: 1, fontWeight: 950 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="page-container" id="cbs-report-area" style={{ maxWidth: "none", padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, .65fr)", gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ margin: 0, borderRadius: 20, padding: 20, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(15,23,42,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 850, color: "#8f1732", textTransform: "uppercase", letterSpacing: ".08em" }}>Operasyon Görünümü</div>
                  <div style={{ marginTop: 4, fontSize: 21, fontWeight: 900, color: "#111827" }}>{selectedCompanyName}</div>
                </div>
                <div style={{ padding: "8px 11px", borderRadius: 999, background: countSlaExceeded > 0 ? "#fef2f2" : "#ecfdf5", color: countSlaExceeded > 0 ? "#b91c1c" : "#166534", border: `1px solid ${countSlaExceeded > 0 ? "#fecaca" : "#bbf7d0"}`, fontSize: 12, fontWeight: 850 }}>
                  {countSlaExceeded > 0 ? `${countSlaExceeded} SLA aşımı` : "SLA durumu sağlıklı"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                <StatusPill label="Kapanış Oranı" value={`%${closedRate}`} bg="#f8fafc" color="#0f172a" border="#e2e8f0" />
                <StatusPill label="SLA Sağlıklı" value={slaSafeCount} bg="#ecfdf5" color="#166534" border="#bbf7d0" />
                <StatusPill label="Yanıt Bekleyen" value={unansweredCount} bg="#fff7ed" color="#9a3412" border="#fed7aa" />
                <StatusPill label="Atanmış" value={assignedCount} bg="#eff6ff" color="#1d4ed8" border="#bfdbfe" />
                <StatusPill label="Yüksek Öncelik" value={highCount} bg="#fff7ed" color="#c2410c" border="#fed7aa" />
                <StatusPill label="Kritik" value={criticalCount} bg="#fef2f2" color="#b91c1c" border="#fecaca" />
              </div>

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                <div style={{ border: "1px solid #eef2f7", borderRadius: 16, padding: 16, background: "#fbfcfe" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Durum Dağılımı</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "end", height: 132 }}>
                    <TinyBar label="Yeni" value={countNew} max={maxChartValue} color="#ef4444" />
                    <TinyBar label="İşlemde" value={countProcessing} max={maxChartValue} color="#f59e0b" />
                    <TinyBar label="Okundu" value={countRead} max={maxChartValue} color="#3b82f6" />
                    <TinyBar label="Kapalı" value={countClosed} max={maxChartValue} color="#22c55e" />
                  </div>
                </div>

                <div style={{ border: "1px solid #eef2f7", borderRadius: 16, padding: 16, background: "#fbfcfe" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Kategori Yoğunluğu</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {categoryStats.length === 0 ? (
                      <div style={{ color: "#64748b", fontSize: 13 }}>Kategori verisi yok.</div>
                    ) : categoryStats.map((item) => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5, fontSize: 12 }}>
                          <span style={{ fontWeight: 750, color: "#334155" }}>{item.label}</span><span style={{ color: "#64748b" }}>{item.value}</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "#e9edf3", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.max(8, Math.round((item.value / maxCategoryValue) * 100))}%`, background: "linear-gradient(90deg,#7f1734,#c62828)", borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ margin: 0, borderRadius: 20, padding: 20, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(15,23,42,.04)", background: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 850, color: "#8f1732", textTransform: "uppercase", letterSpacing: ".08em" }}>Yönetici Özeti</div>
              <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: "#111827" }}>Operasyon İçgörüsü</div>
              <div style={{ marginTop: 14, padding: 15, borderRadius: 14, background: countSlaExceeded > 0 ? "#fff7ed" : "#f0fdf4", border: `1px solid ${countSlaExceeded > 0 ? "#fed7aa" : "#bbf7d0"}` }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: countSlaExceeded > 0 ? "#9a3412" : "#166534" }}>
                  {countSlaExceeded > 0 ? "Dikkat gerektiren süreçler var" : "Süreç akışı kontrol altında"}
                </div>
                <div style={{ marginTop: 7, fontSize: 13, lineHeight: 1.65, color: "#475569" }}>{aiSummary}</div>
              </div>
              <div style={{ marginTop: 16, display: "grid", gap: 9 }}>
                {[
                  ["Kapanış performansı", `%${closedRate}`],
                  ["Açık kayıt", Math.max(0, countAll - countClosed)],
                  ["Kritik öncelik", criticalCount],
                  ["SLA aşımı", countSlaExceeded],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #eef2f7" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span><strong style={{ fontSize: 14, color: "#0f172a" }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18, borderRadius: 20, padding: 18, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(15,23,42,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12,marginBottom:16}}>
                  <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:14,background:"#fff"}}>
                    <div style={{fontSize:11,fontWeight:900,color:"#64748b",letterSpacing:".06em",marginBottom:9}}>BAŞVURU TÜRLERİ</div>
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      {typeStats.map(x=><span key={x.label} style={{padding:"6px 9px",borderRadius:999,background:"#fff1f2",color:"#9f1239",fontSize:11,fontWeight:900}}>{x.label} · {x.value}</span>)}
                    </div>
                  </div>
                  <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:14,background:"#fff"}}>
                    <div style={{fontSize:11,fontWeight:900,color:"#64748b",letterSpacing:".06em",marginBottom:9}}>GİZLİLİK DAĞILIMI</div>
                    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                      {privacyStats.map(x=><span key={x.label} style={{padding:"6px 9px",borderRadius:999,background:"#f8fafc",color:"#334155",fontSize:11,fontWeight:900}}>{x.label} · {x.value}</span>)}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>Başvuru Yönetimi</div>
                <div style={{ marginTop: 3, fontSize: 13, color: "#64748b" }}>{loading ? "Kayıtlar yükleniyor..." : `${countAll} kayıt görüntüleniyor`}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 750, color: "#64748b" }}>Firma, durum ve metin filtresi</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,.7fr) minmax(280px,1.3fr)", gap: 10, marginBottom: 12 }}>
              <select value={selectedFirmId} onChange={(e) => setSelectedFirmId(e.target.value)} className="cbs-input" style={{ margin: 0 }}>
                <option value="all">Tüm Firmalar</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim, e-posta, kategori, atanan kişi veya mesaj içinde ara" className="cbs-input" />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={filterButtonStyle(filter === "all")} onClick={() => setFilter("all")}>Tümü</button>
              <button style={filterButtonStyle(filter === "new")} onClick={() => setFilter("new")}>Yeni</button>
              <button style={filterButtonStyle(filter === "processing")} onClick={() => setFilter("processing")}>İşlemde</button>
              <button style={filterButtonStyle(filter === "read")} onClick={() => setFilter("read")}>Okundu</button>
              <button style={filterButtonStyle(filter === "closed")} onClick={() => setFilter("closed")}>Kapalı</button>
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
                <div
  key={item.id}
  className="card"
  style={{
    transition: "all 0.2s ease",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "";
  }}
>
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
                        {item.privacy_mode === "anonymous"
                          ? "Anonim Başvuru"
                          : item.full_name || "Adsız kayıt"}
                      </h3>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"7px 0 2px"}}>
                        <span style={{padding:"5px 8px",borderRadius:999,background:"#111827",color:"#fff",fontSize:11,fontWeight:900}}>
                          {item.reference_no || `#${item.id}`}
                        </span>
                        <span style={{padding:"5px 8px",borderRadius:999,background:"#fff1f2",color:"#9f1239",border:"1px solid #fecdd3",fontSize:11,fontWeight:900}}>
                          {getApplicationTypeLabel(item.application_type)}
                        </span>
                        <span style={{...getPrivacyStyle(item.privacy_mode),padding:"5px 8px",borderRadius:999,fontSize:11,fontWeight:900}}>
                          {getPrivacyLabel(item.privacy_mode)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          lineHeight: "1.7",
                        }}
                      >
                        <div>
                          <strong>Email:</strong>{" "}
                          {item.privacy_mode === "anonymous" ? "Kaydedilmedi" : (item.email || "-")}
                        </div>
                        <div>
                          <strong>Tarih:</strong> {formatDate(item.created_at)}
                        </div>
                        <div>
                          <strong>Kategori:</strong> {item.category || "Genel"}
                        </div>
                        <div>
                          <strong>İlk Yanıt:</strong> {getFirstResponseText(item.created_at, item.first_response_at)}
                        </div>

                        {item.firma_adi && (
  <div>
    <strong>Firma / Kurum:</strong> {item.firma_adi}
  </div>
)}

{!item.firmId && item.suggestedFirmName && (
  <div>
    <strong>Önerilen Firma:</strong> {item.suggestedFirmName}
  </div>
)}

                        {item.assignedTo && (
                          <div>
                            <strong>Atanan:</strong> {item.assignedTo}
                            {item.assigned_at ? ` • ${formatDate(item.assigned_at)}` : ""}
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

{!item.firmId && item.suggestedFirmId && (
  <button
    onClick={() =>
      bindSuggestedFirm(
        item.id,
        item.suggestedFirmId,
        item.suggestedFirmName
      )
    }
    disabled={busyId === item.id}
    className="cbs-button"
    style={{ background: "#0f766e" }}
  >
    Firmaya Bağla
  </button>
)}

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
      Firma / Kurum
    </label>
    <input
      value={item.firma_adi || ""}
      className="cbs-input"
      placeholder="Firma / kurum adı"
      disabled
    />
{!item.firmId && item.suggestedFirmName && (
  <div
    style={{
      marginTop: "8px",
      fontSize: "12px",
      fontWeight: 700,
      color: "#0f766e",
    }}
  >
    Önerilen eşleşme: {item.suggestedFirmName}
  </div>
)}

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
    Sistem Firması Seç
  </label>

  <select
    value={editFirmId}
    onChange={(e) => setEditFirmId(e.target.value)}
    className="cbs-input"
  >
    <option value="none">Firma seçilmedi</option>
    {companies.map((company) => (
      <option key={company.id} value={company.id}>
        {company.name}
      </option>
    ))}
  </select>

  {editFirmId !== "none" && (
    <div
      style={{
        marginTop: "8px",
        fontSize: "12px",
        fontWeight: 700,
        color: "#166534",
      }}
    >
      Kayıt seçilen firmaya bağlanacak.
    </div>
  )}
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