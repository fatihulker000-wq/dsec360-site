"use client";

import { useEffect, useMemo, useState } from "react";

type ContactRecord = {
  id: number;
  full_name: string;
  email: string;
  message: string;
  created_at: string;
};

async function readSafeJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: "Sunucudan geçersiz yanıt geldi." };
  }
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("tr-TR");
  } catch {
    return dateString;
  }
}

export default function AdminContactPage() {
  const [records, setRecords] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");

  const loadRecords = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await fetch("/api/admin/contact", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        setRecords([]);
        setPageError(result?.error || "İletişim kayıtları alınamadı.");
        return;
      }

      setRecords(result?.data ?? []);
    } catch (error) {
      console.error("İletişim kayıt yükleme hatası:", error);
      setRecords([]);
      setPageError("İletişim kayıtları yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const deleteRecord = async (id: number) => {
    const ok = window.confirm("Bu mesajı silmek istediğine emin misin?");
    if (!ok) return;

    try {
      setBusyId(id);

      const response = await fetch("/api/admin/contact", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        alert(result?.error || "Mesaj silinemedi.");
        return;
      }

      await loadRecords();
    } catch (error) {
      console.error("İletişim mesajı silme hatası:", error);
      alert("Mesaj silinirken hata oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;

    return records.filter((item) => {
      return (
        item.full_name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query)
      );
    });
  }, [records, search]);

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Yönetim</div>
          <h1 className="hero-title">İletişim Mesajları Paneli</h1>
          <p className="hero-desc">
            İletişim formundan gelen teklif, demo ve genel talepleri tek ekranda
            görüntüleyin.
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
                Gelen İletişim Mesajları
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

            <button onClick={loadRecords} className="cbs-button">
              Yenile
            </button>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "24px",
              display: "grid",
              gap: "18px",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, email veya mesaj içinde ara"
              className="cbs-input"
            />
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
              <p className="card-text">İletişim kayıtları getiriliyor...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="card">
              <h3 className="card-title">Henüz mesaj yok</h3>
              <p className="card-text">
                İletişim formundan gönderilen kayıtlar burada görünecek.
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
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      Yeni Mesaj
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