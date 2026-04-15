"use client";

import { useEffect, useMemo, useState } from "react";

type CompanyRow = {
  id: string;
  name: string;
  created_at?: string | null;
  user_count?: number;
  yetkili?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: boolean | null;
};

type CompanyResponse = {
  data?: CompanyRow[];
  error?: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  green: "#166534",
  blue: "#1d4ed8",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

function badgeStyle(
  bg: string,
  border: string,
  color: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 12,
    fontWeight: 700,
    color,
    whiteSpace: "nowrap",
  };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIsActive, setEditingIsActive] = useState(true);

  const [newCompany, setNewCompany] = useState({
    name: "",
    yetkili: "",
    phone: "",
    email: "",
    address: "",
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/companies", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: CompanyResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Firmalar alınamadı.");
        setCompanies([]);
        return;
      }

      setCompanies(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error(err);
      setError("Firmalar alınamadı.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((c) => {
      const text = [
        c.name,
        c.yetkili || "",
        c.phone || "",
        c.email || "",
        c.address || "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [companies, search]);

  const addCompany = async () => {
    const name = newCompany.name.trim();

    if (!name) {
      alert("Firma adı gir.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newCompany.name.trim(),
          yetkili: newCompany.yetkili.trim(),
          phone: newCompany.phone.trim(),
          email: newCompany.email.trim(),
          address: newCompany.address.trim(),
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma eklenemedi.");
        return;
      }

      setNewCompany({
        name: "",
        yetkili: "",
        phone: "",
        email: "",
        address: "",
      });

      await loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Firma eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

 const startEdit = (company: CompanyRow) => {
  setEditingId(company.id);
  setEditingName(company.name);
  setEditingIsActive(company.is_active ?? true);
};

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingIsActive(true);
  };

  const saveEdit = async () => {
    const name = editingName.trim();

    if (!editingId || !name) {
      alert("Firma adı boş olamaz.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin/companies", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: editingId,
          name,
          is_active: editingIsActive,
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma güncellenemedi.");
        return;
      }

      cancelEdit();
      await loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Firma güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (id: string, name: string) => {
    const ok = window.confirm(`"${name}" firması silinsin mi?`);
    if (!ok) return;

    try {
      setSaving(true);

      const res = await fetch(
        `/api/admin/companies?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await res.json();

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma silinemedi.");
        return;
      }

      await loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Firma silinemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
            padding: "clamp(16px, 2.4vw, 24px)",
            borderRadius: 24,
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            Firma Yönetimi
          </h1>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            Firma ekle, düzenle, sil ve yapılandırmayı tek ekranda yönet.
          </p>
        </div>

        {error ? (
          <div
            style={{
              ...cardStyle(),
              marginBottom: 20,
              color: BRAND.red,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginBottom: 20,
            alignItems: "start",
          }}
        >
          <div style={cardStyle()}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: BRAND.text,
                marginBottom: 12,
              }}
            >
              Yeni Firma Ekle
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                value={newCompany.name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                placeholder="Firma Adı *"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                  minWidth: 0,
                }}
              />

              <input
                value={newCompany.yetkili}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, yetkili: e.target.value })
                }
                placeholder="Yetkili Kişi"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                  minWidth: 0,
                }}
              />

              <input
                value={newCompany.phone}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, phone: e.target.value })
                }
                placeholder="Telefon"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                  minWidth: 0,
                }}
              />

              <input
                value={newCompany.email}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, email: e.target.value })
                }
                placeholder="E-Posta"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                  minWidth: 0,
                }}
              />

              <textarea
                value={newCompany.address}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, address: e.target.value })
                }
                placeholder="Adres"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  fontSize: 14,
                  resize: "vertical",
                  fontFamily: "inherit",
                  minWidth: 0,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  onClick={addCompany}
                  disabled={saving}
                  style={{
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 18px",
                    background: BRAND.green,
                    color: "#fff",
                    fontWeight: 800,
                    cursor: saving ? "not-allowed" : "pointer",
                    width: "100%",
                    maxWidth: 180,
                  }}
                >
                  Firma Ekle
                </button>
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: BRAND.text,
                marginBottom: 12,
              }}
            >
              Ara
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Firma ara..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
                minWidth: 0,
              }}
            />
          </div>
        </div>

        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
              Firma Listesi
            </h2>

            <div style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
              {filteredCompanies.length} kayıt
            </div>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Firma bulunamadı.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 16,
                    padding: 16,
                    background: "#fff",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {editingId === company.id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "stretch",
                      }}
                    >
                      <input

                      
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 220,
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: `1px solid ${BRAND.border}`,
                          fontSize: 14,
                        }}
                      />

                     <select
    value={editingIsActive ? "active" : "passive"}
    onChange={(e) => setEditingIsActive(e.target.value === "active")}
    style={{
      minWidth: 180,
      padding: "12px 14px",
      borderRadius: 12,
      border: `1px solid ${BRAND.border}`,
      fontSize: 14,
      background: "#fff",
    }}
  >
    <option value="active">Aktif</option>
    <option value="passive">Pasif</option>
  </select>

                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 16px",
                          background: BRAND.green,
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Kaydet
                      </button>

                      <button
                        onClick={cancelEdit}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 16px",
                          background: "#6b7280",
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Vazgeç
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: BRAND.text,
                            wordBreak: "break-word",
                          }}
                        >
                          {company.name}
                        </div>

                        <div
  style={{
    marginTop: 6,
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: company.is_active ? "#dcfce7" : "#fee2e2",
    color: company.is_active ? "#166534" : "#991b1b",
  }}
>
  {company.is_active ? "AKTİF" : "PASİF"}
</div>

                        {company.yetkili && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: BRAND.text,
                              wordBreak: "break-word",
                            }}
                          >
                            👤 {company.yetkili}
                          </div>
                        )}

                        {company.phone && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: BRAND.text,
                              wordBreak: "break-word",
                            }}
                          >
                            📞 {company.phone}
                          </div>
                        )}

                        {company.email && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: BRAND.text,
                              wordBreak: "break-word",
                            }}
                          >
                            📧 {company.email}
                          </div>
                        )}

                        {company.address && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: BRAND.muted,
                              wordBreak: "break-word",
                              lineHeight: 1.6,
                            }}
                          >
                            📍 {company.address}
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 13,
                            color: BRAND.muted,
                            wordBreak: "break-word",
                          }}
                        >
                          👥 Çalışanlar: {company.user_count || 0}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            height: 6,
                            width: "100%",
                            maxWidth: 280,
                            background: "#e5e7eb",
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                (company.user_count || 0) * 10,
                                100
                              )}%`,
                              background: BRAND.red,
                              height: "100%",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: BRAND.muted,
                            wordBreak: "break-word",
                          }}
                        >
                          Oluşturulma:{" "}
                          {company.created_at
                            ? new Date(company.created_at).toLocaleString(
                                "tr-TR"
                              )
                            : "-"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          width: "100%",
                          maxWidth: 220,
                          justifyContent: "flex-start",
                        }}
                      >
                        <button
                          onClick={() => startEdit(company)}
                          style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 14px",
                            background: BRAND.blue,
                            color: "#fff",
                            fontWeight: 800,
                            cursor: "pointer",
                            flex: 1,
                            minWidth: 96,
                          }}
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => deleteCompany(company.id, company.name)}
                          style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 14px",
                            background: BRAND.red,
                            color: "#fff",
                            fontWeight: 800,
                            cursor: "pointer",
                            flex: 1,
                            minWidth: 96,
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}