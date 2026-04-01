"use client";

import { useEffect, useMemo, useState } from "react";

type CbsRecord = {
  id: number;
  full_name: string;
  email: string;
  message: string;
  created_at: string;
  status?: string;
};

type FilterType = "all" | "new" | "read" | "processing";

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("tr-TR");
  } catch {
    return dateString;
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

export default function AdminCbsPage() {
  const [records, setRecords] = useState<CbsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");

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
    loadRecords();
  }, []);

  const updateStatus = async (
    id: number,
    status: "new" | "read" | "processing"
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

  const getStatusLabel = (status?: string) => {
    if (status === "read") return "Okundu";
    if (status === "processing") return "İşlemde";
    return "Yeni Başvuru";
  };

  const getStatusStyle = (status?: string) => {
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
        item.message?.toLowerCase().includes(query)
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
            Web sitesinden gelen şikayet, öneri ve talepleri tek ekranda takip
            edin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
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
                {loading
                  ? "Kayıtlar yükleniyor..."
                  : "Toplam kayıt: " + records.length}
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
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  padding: "16px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Toplam
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px" }}>
                  {countAll}
                </div>
              </div>

              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "18px",
                  padding: "16px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#9f1239" }}>Yeni</div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px" }}>
                  {countNew}
                </div>
              </div>

              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "18px",
                  padding: "16px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#92400e" }}>İşlemde</div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px" }}>
                  {countProcessing}
                </div>
              </div>

              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "18px",
                  padding: "16px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#1d4ed8" }}>Okundu</div>
                <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px" }}>
                  {countRead}
                </div>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, email veya mesaj içinde ara"
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
              <p className="card-text">
                Seçili filtreye uygun kayıt görünmüyor.
              </p>
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
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <h3 className="card-title" style={{ marginBottom: "6px" }}>
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
                      </div>
                    </div>

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
                      disabled={busyId === item.id}
                      className="cbs-button"
                    >
                      Okundu
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "processing")}
                      disabled={busyId === item.id}
                      className="cbs-button"
                      style={{ background: "#f59e0b" }}
                    >
                      İşlemde
                    </button>

                    <button
                      onClick={() => updateStatus(item.id, "new")}
                      disabled={busyId === item.id}
                      className="cbs-button"
                      style={{ background: "#dc2626" }}
                    >
                      Yeniye Al
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
