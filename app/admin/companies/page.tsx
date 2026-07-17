"use client";

import { useEffect, useMemo, useState } from "react";
import CompanyDetailModal from "./components/CompanyDetailModal";

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

  calisan_sayisi?: number | null;
  nace_kodu?: string | null;
  tehlike_sinifi?: string | null;
  sgk_sicil_no?: string | null;
  sektor?: string | null;
  isg_uzmani?: string | null;
  isyeri_hekimi?: string | null;
  dsp?: string | null;
  is_demo?: boolean;
};

type CompanyResponse = {
  data?: CompanyRow[];
  error?: string;
};

type ModulePerformanceItem = {
  key: string;
  title: string;
  score: number;
  status: "GOOD" | "DEVELOP" | "HIGH" | "CRITICAL";
  total: number;
  completed: number;
  missing: number;
  detail: string;
};

type CompanyPerformanceResponse = {
  success?: boolean;
  companyId?: string;
  overallScore?: number;
  modules?: ModulePerformanceItem[];
  warnings?: string[];
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
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "PASSIVE" | "DEMO">("ALL");
  const [sortBy, setSortBy] =
    useState<"NAME" | "EMPLOYEE" | "NEWEST">("NAME");
  const [detailTab, setDetailTab] =
    useState<"PROFILE" | "PERFORMANCE">("PROFILE");
  const [companyPerformance, setCompanyPerformance] =
    useState<CompanyPerformanceResponse | null>(null);
  const [performanceLoading, setPerformanceLoading] =
    useState(false);
  const [performanceError, setPerformanceError] =
    useState("");

 const [editingId, setEditingId] = useState<string | null>(null);
const [editingName, setEditingName] = useState("");
const [editingYetkili, setEditingYetkili] = useState("");
const [editingPhone, setEditingPhone] = useState("");
const [editingEmail, setEditingEmail] = useState("");
const [editingAddress, setEditingAddress] = useState("");
const [editingCalisanSayisi, setEditingCalisanSayisi] = useState("0");
const [editingNaceKodu, setEditingNaceKodu] = useState("");
const [editingTehlikeSinifi, setEditingTehlikeSinifi] = useState("");
const [editingSgkSicilNo, setEditingSgkSicilNo] = useState("");
const [editingSektor, setEditingSektor] = useState("");
const [editingIsgUzmani, setEditingIsgUzmani] = useState("");
const [editingIsyeriHekimi, setEditingIsyeriHekimi] = useState("");
const [editingDsp, setEditingDsp] = useState("");
const [editingIsActive, setEditingIsActive] = useState(true);

const [detailCompany, setDetailCompany] = useState<CompanyRow | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [isMobile, setIsMobile] = useState(false);

const [newCompany, setNewCompany] = useState({
  name: "",
  yetkili: "",
  phone: "",
  email: "",
  address: "",
  calisan_sayisi: "",
  nace_kodu: "",
  tehlike_sinifi: "",
  sgk_sicil_no: "",
  sektor: "",
  isg_uzmani: "",
  isyeri_hekimi: "",
  dsp: "",
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

useEffect(() => {
  if (typeof window === "undefined") return;

  const media = window.matchMedia("(max-width: 900px)");

  const apply = () => setIsMobile(media.matches);

  apply();

  media.addEventListener?.("change", apply);

  return () => media.removeEventListener?.("change", apply);
}, []);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    const filtered = companies.filter((company) => {
      const text = [
        company.name,
        company.yetkili || "",
        company.phone || "",
        company.email || "",
        company.address || "",
        company.sektor || "",
        company.nace_kodu || "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const matchesSearch = !q || text.includes(q);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? company.is_active !== false
          : statusFilter === "PASSIVE"
          ? company.is_active === false
          : Boolean(
              company.is_demo ||
                company.name
                  .toLocaleLowerCase("tr-TR")
                  .includes("d-sec demo lojistik")
            );

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((first, second) => {
      if (sortBy === "EMPLOYEE") {
        return (
          Number(second.user_count || 0) -
          Number(first.user_count || 0)
        );
      }

      if (sortBy === "NEWEST") {
        return (
          new Date(second.created_at || 0).getTime() -
          new Date(first.created_at || 0).getTime()
        );
      }

      return first.name.localeCompare(
        second.name,
        "tr-TR"
      );
    });
  }, [companies, search, statusFilter, sortBy]);

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
  calisan_sayisi: Number(newCompany.calisan_sayisi || 0),
  nace_kodu: newCompany.nace_kodu.trim(),
  tehlike_sinifi: newCompany.tehlike_sinifi.trim(),
  sgk_sicil_no: newCompany.sgk_sicil_no.trim(),
  sektor: newCompany.sektor.trim(),
  isg_uzmani: newCompany.isg_uzmani.trim(),
  isyeri_hekimi: newCompany.isyeri_hekimi.trim(),
  dsp: newCompany.dsp.trim(),
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
  calisan_sayisi: "",
  nace_kodu: "",
  tehlike_sinifi: "",
  sgk_sicil_no: "",
  sektor: "",
  isg_uzmani: "",
  isyeri_hekimi: "",
  dsp: "",
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
  setEditingName(company.name || "");
  setEditingYetkili(company.yetkili || "");
  setEditingPhone(company.phone || "");
  setEditingEmail(company.email || "");
  setEditingAddress(company.address || "");
  setEditingCalisanSayisi(String(company.calisan_sayisi ?? 0));
  setEditingNaceKodu(company.nace_kodu || "");
  setEditingTehlikeSinifi(company.tehlike_sinifi || "");
  setEditingSgkSicilNo(company.sgk_sicil_no || "");
  setEditingSektor(company.sektor || "");
  setEditingIsgUzmani(company.isg_uzmani || "");
  setEditingIsyeriHekimi(company.isyeri_hekimi || "");
  setEditingDsp(company.dsp || "");
  setEditingIsActive(company.is_active ?? true);
};

 const cancelEdit = () => {
  setEditingId(null);
  setEditingName("");
  setEditingYetkili("");
  setEditingPhone("");
  setEditingEmail("");
  setEditingAddress("");
  setEditingCalisanSayisi("0");
  setEditingNaceKodu("");
  setEditingTehlikeSinifi("");
  setEditingSgkSicilNo("");
  setEditingSektor("");
  setEditingIsgUzmani("");
  setEditingIsyeriHekimi("");
  setEditingDsp("");
  setEditingIsActive(true);
};

  const loadCompanyPerformance = async (
    companyId: string
  ) => {
    try {
      setPerformanceLoading(true);
      setPerformanceError("");

      const response = await fetch(
        `/api/admin/companies/performance?companyId=${encodeURIComponent(
          companyId
        )}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const json: CompanyPerformanceResponse =
        await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        setCompanyPerformance(null);
        setPerformanceError(
          json.error ||
            "Firma performansı alınamadı."
        );
        return;
      }

      setCompanyPerformance(json);
    } catch (errorValue) {
      console.error(errorValue);
      setCompanyPerformance(null);
      setPerformanceError(
        "Firma performansı alınamadı."
      );
    } finally {
      setPerformanceLoading(false);
    }
  };

  const openDetail = (company: CompanyRow) => {
    setDetailCompany(company);
    setDetailTab("PROFILE");
    setCompanyPerformance(null);
    setPerformanceError("");
    setShowDetailModal(true);
    void loadCompanyPerformance(company.id);
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
        yetkili: editingYetkili.trim(),
        phone: editingPhone.trim(),
        email: editingEmail.trim(),
        address: editingAddress.trim(),
        calisan_sayisi: Number(editingCalisanSayisi || 0),
        nace_kodu: editingNaceKodu.trim(),
        tehlike_sinifi: editingTehlikeSinifi.trim(),
        sgk_sicil_no: editingSgkSicilNo.trim(),
        sektor: editingSektor.trim(),
        isg_uzmani: editingIsgUzmani.trim(),
        isyeri_hekimi: editingIsyeriHekimi.trim(),
        dsp: editingDsp.trim(),
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

const seedDemoData = async () => {
  const ok = window.confirm(
    "Demo firma ve örnek çalışan verileri oluşturulsun mu?"
  );

  if (!ok) return;

  try {
    setSeedingDemo(true);

    const res = await fetch("/api/admin/demo/seed", {
      method: "POST",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      alert(json?.error || "Demo verileri oluşturulamadı.");
      return;
    }

    alert(
      `Demo verileri oluşturuldu.\nFirma: ${
        json?.company?.name || "Demo Firma"
      }\nEklenen çalışan: ${json?.employees?.inserted ?? 0}\nAtlanan çalışan: ${
        json?.employees?.skipped ?? 0
      }`
    );

    await loadCompanies();
  } catch (err) {
    console.error(err);
    alert("Demo verileri oluşturulamadı.");
  } finally {
    setSeedingDemo(false);
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
            borderRadius: isMobile ? 0 : 24,
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

<input
  value={newCompany.sgk_sicil_no || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, sgk_sicil_no: e.target.value })
  }
  placeholder="SGK Sicil No"
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
  value={newCompany.nace_kodu || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, nace_kodu: e.target.value })
  }
  placeholder="NACE Kodu"
  style={{
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    fontSize: 14,
    minWidth: 0,
  }}
/>

<select
  value={newCompany.tehlike_sinifi || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, tehlike_sinifi: e.target.value })
  }
  style={{
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    fontSize: 14,
    background: "#fff",
    minWidth: 0,
  }}
>
  <option value="">Tehlike Sınıfı Seç</option>
  <option value="Az">Az Tehlikeli</option>
  <option value="Tehlikeli">Tehlikeli</option>
  <option value="Çok">Çok Tehlikeli</option>
</select>

<input
  type="number"
  value={newCompany.calisan_sayisi}
  onChange={(e) =>
    setNewCompany({
      ...newCompany,
      calisan_sayisi: e.target.value,
    })
  }
  placeholder="Firma Çalışan Sayısı"
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
  value={newCompany.sektor || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, sektor: e.target.value })
  }
  placeholder="Sektör"
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
  value={newCompany.isg_uzmani || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, isg_uzmani: e.target.value })
  }
  placeholder="İSG Uzmanı"
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
  value={newCompany.isyeri_hekimi || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, isyeri_hekimi: e.target.value })
  }
  placeholder="İşyeri Hekimi"
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
  value={newCompany.dsp || ""}
  onChange={(e) =>
    setNewCompany({ ...newCompany, dsp: e.target.value })
  }
  placeholder="DSP"
  style={{
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    fontSize: 14,
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
            <button
  type="button"
  onClick={seedDemoData}
  disabled={seedingDemo}
  style={{
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: seedingDemo ? "not-allowed" : "pointer",
    width: "100%",
    marginBottom: 14,
  }}
>
  {seedingDemo ? "Demo Verileri Oluşturuluyor..." : "🚀 Demo Verilerini Oluştur"}
</button>
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
              placeholder="Firma, sektör, NACE veya yetkili ara..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
                minWidth: 0,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "ALL"
                      | "ACTIVE"
                      | "PASSIVE"
                      | "DEMO"
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  fontWeight: 800,
                }}
              >
                <option value="ALL">Tüm Firmalar</option>
                <option value="ACTIVE">Aktif Firmalar</option>
                <option value="PASSIVE">Pasif Firmalar</option>
                <option value="DEMO">Demo Firma</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | "NAME"
                      | "EMPLOYEE"
                      | "NEWEST"
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.border}`,
                  background: "#fff",
                  fontWeight: 800,
                }}
              >
                <option value="NAME">Ada Göre</option>
                <option value="EMPLOYEE">Çalışan Sayısına Göre</option>
                <option value="NEWEST">En Yeni Firma</option>
              </select>
            </div>
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
      display: "grid",
      gap: 10,
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      alignItems: "stretch",
    }}
  >
    <input
      value={editingName}
      onChange={(e) => setEditingName(e.target.value)}
      placeholder="Firma Adı *"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingYetkili}
      onChange={(e) => setEditingYetkili(e.target.value)}
      placeholder="Yetkili Kişi"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingPhone}
      onChange={(e) => setEditingPhone(e.target.value)}
      placeholder="Telefon"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingEmail}
      onChange={(e) => setEditingEmail(e.target.value)}
      placeholder="E-Posta"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingSgkSicilNo}
      onChange={(e) => setEditingSgkSicilNo(e.target.value)}
      placeholder="SGK Sicil No"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingNaceKodu}
      onChange={(e) => setEditingNaceKodu(e.target.value)}
      placeholder="NACE Kodu"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <select
      value={editingTehlikeSinifi}
      onChange={(e) => setEditingTehlikeSinifi(e.target.value)}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
        background: "#fff",
      }}
    >
      <option value="">Tehlike Sınıfı Seç</option>
      <option value="Az">Az Tehlikeli</option>
      <option value="Tehlikeli">Tehlikeli</option>
      <option value="Çok">Çok Tehlikeli</option>
    </select>

    <input
      type="number"
      value={editingCalisanSayisi}
      onChange={(e) => setEditingCalisanSayisi(e.target.value)}
      placeholder="Firma Çalışan Sayısı"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingSektor}
      onChange={(e) => setEditingSektor(e.target.value)}
      placeholder="Sektör"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingIsgUzmani}
      onChange={(e) => setEditingIsgUzmani(e.target.value)}
      placeholder="İSG Uzmanı"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingIsyeriHekimi}
      onChange={(e) => setEditingIsyeriHekimi(e.target.value)}
      placeholder="İşyeri Hekimi"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <input
      value={editingDsp}
      onChange={(e) => setEditingDsp(e.target.value)}
      placeholder="DSP"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />

    <textarea
      value={editingAddress}
      onChange={(e) => setEditingAddress(e.target.value)}
      placeholder="Adres"
      rows={3}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
        resize: "vertical",
        fontFamily: "inherit",
        gridColumn: "1 / -1",
      }}
    />

    <select
      value={editingIsActive ? "active" : "passive"}
      onChange={(e) => setEditingIsActive(e.target.value === "active")}
      style={{
        width: "100%",
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

    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        gridColumn: "1 / -1",
        justifyContent: "flex-end",
      }}
    >
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

{(company.is_demo ||
  company.name
    .toLocaleLowerCase("tr-TR")
    .includes("d-sec demo lojistik")) && (
  <div
    style={{
      marginTop: 6,
      marginLeft: 8,
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 900,
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    }}
  >
    DEMO FİRMA
  </div>
)}

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

{/* 🔥 PREMIUM İSG BİLGİLERİ */}

{company.sgk_sicil_no && (
  <div style={{ marginTop: 6, fontSize: 13 }}>
    🧾 SGK: {company.sgk_sicil_no}
  </div>
)}

{company.nace_kodu && (
  <div style={{ marginTop: 4, fontSize: 13 }}>
    🏭 NACE: {company.nace_kodu}
  </div>
)}

{company.tehlike_sinifi && (
  <div style={{ marginTop: 4 }}>
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background:
          company.tehlike_sinifi === "Çok"
            ? "#fee2e2"
            : company.tehlike_sinifi === "Tehlikeli"
            ? "#fef3c7"
            : "#dcfce7",
        color:
          company.tehlike_sinifi === "Çok"
            ? "#991b1b"
            : company.tehlike_sinifi === "Tehlikeli"
            ? "#92400e"
            : "#166534",
      }}
    >
      ⚠️ {company.tehlike_sinifi}
    </span>
  </div>
)}

{company.sektor && (
  <div style={{ marginTop: 4, fontSize: 13 }}>
    🏢 Sektör: {company.sektor}
  </div>
)}

{company.isg_uzmani && (
  <div style={{ marginTop: 4, fontSize: 13 }}>
    🦺 İSG Uzmanı: {company.isg_uzmani}
  </div>
)}

{company.isyeri_hekimi && (
  <div style={{ marginTop: 4, fontSize: 13 }}>
    🩺 Hekim: {company.isyeri_hekimi}
  </div>
)}

{company.dsp && (
  <div style={{ marginTop: 4, fontSize: 13 }}>
    👷 DSP: {company.dsp}
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
maxWidth: isMobile ? "100%" : 320,
    justifyContent: "flex-start",
  }}
>
  <button
    onClick={() => openDetail(company)}
    style={{
      border: "none",
      borderRadius: 10,
      padding: "10px 14px",
      background: "#111827",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
      flex: isMobile ? "1 1 100%" : 1,
minWidth: isMobile ? "100%" : 96,
    }}
  >
    Detay
  </button>

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
      flex: isMobile ? "1 1 100%" : 1,
minWidth: isMobile ? "100%" : 96,
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
      flex: isMobile ? "1 1 100%" : 1,
minWidth: isMobile ? "100%" : 96,
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

<CompanyDetailModal
  open={showDetailModal}
  company={detailCompany}
  isMobile={isMobile}
  detailTab={detailTab}
  onTabChange={setDetailTab}
  performanceLoading={performanceLoading}
  performanceError={performanceError}
  companyPerformance={companyPerformance}
  onClose={() => setShowDetailModal(false)}
/>

</main>
  );

}