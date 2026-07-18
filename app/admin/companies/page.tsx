"use client";

import { useEffect, useMemo, useState } from "react";

import CompanyDetailModal from "./components/CompanyDetailModal";
import CompanyHeader from "./components/CompanyHeader";
import CompanyStats from "./components/CompanyStats";
import CompanyTable from "./components/CompanyTable";
import CompanyToolbar from "./components/CompanyToolbar";

import { BRAND } from "./constants";
import type {
  Company,
  CompanyFormData,
  CompanyPerformanceResponse,
  CompanyResponse,
} from "./types";

const EMPTY_FORM: CompanyFormData = {
  name: "",
  yetkili: "",
  phone: "",
  email: "",
  address: "",
  calisan_sayisi: 0,
  nace_kodu: "",
  tehlike_sinifi: "",
  sgk_sicil_no: "",
  sektor: "",
  isg_uzmani: "",
  isyeri_hekimi: "",
  dsp: "",
  is_active: true,
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "PASSIVE" | "DEMO">("ALL");
  const [sortBy, setSortBy] =
    useState<"NAME" | "EMPLOYEE" | "NEWEST">("NAME");

  const [isMobile, setIsMobile] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] =
    useState<"CREATE" | "EDIT">("CREATE");
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM);

  const [detailCompany, setDetailCompany] =
    useState<Company | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] =
    useState<"PROFILE" | "PERFORMANCE">("PROFILE");

  const [companyPerformance, setCompanyPerformance] =
    useState<CompanyPerformanceResponse | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/companies", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: CompanyResponse = await response.json();

      if (!response.ok) {
        setCompanies([]);
        setError(json.error || "Firmalar alınamadı.");
        return;
      }

      setCompanies(Array.isArray(json.data) ? json.data : []);
    } catch (errorValue) {
      console.error(errorValue);
      setCompanies([]);
      setError("Firmalar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsMobile(media.matches);

    apply();
    media.addEventListener?.("change", apply);

    return () => media.removeEventListener?.("change", apply);
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    const result = companies.filter((company) => {
      const searchText = [
        company.name,
        company.yetkili || "",
        company.email || "",
        company.phone || "",
        company.address || "",
        company.sektor || "",
        company.nace_kodu || "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const isDemo =
        Boolean(company.is_demo) ||
        company.name
          .toLocaleLowerCase("tr-TR")
          .includes("d-sec demo lojistik");

      const statusMatches =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? company.is_active !== false
          : statusFilter === "PASSIVE"
          ? company.is_active === false
          : isDemo;

      return (!query || searchText.includes(query)) && statusMatches;
    });

    return [...result].sort((first, second) => {
      if (sortBy === "EMPLOYEE") {
        return Number(second.user_count || 0) - Number(first.user_count || 0);
      }

      if (sortBy === "NEWEST") {
        return (
          new Date(second.created_at || 0).getTime() -
          new Date(first.created_at || 0).getTime()
        );
      }

      return first.name.localeCompare(second.name, "tr-TR");
    });
  }, [companies, search, statusFilter, sortBy]);

  const openCreateForm = () => {
    setFormMode("CREATE");
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (company: Company) => {
    setFormMode("EDIT");
    setForm({
      id: company.id,
      name: company.name,
      local_firm_id: company.local_firm_id ?? null,
      yetkili: company.yetkili || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      calisan_sayisi: Number(
        company.calisan_sayisi ?? company.user_count ?? 0
      ),
      nace_kodu: company.nace_kodu || "",
      tehlike_sinifi: company.tehlike_sinifi || "",
      sgk_sicil_no: company.sgk_sicil_no || "",
      sektor: company.sektor || "",
      isg_uzmani: company.isg_uzmani || "",
      isyeri_hekimi: company.isyeri_hekimi || "",
      dsp: company.dsp || "",
      is_active: company.is_active !== false,
    });
    setShowForm(true);
  };

  const saveCompany = async () => {
    if (!form.name.trim()) {
      alert("Firma adı zorunludur.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/companies", {
        method: formMode === "CREATE" ? "POST" : "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          calisan_sayisi: Number(form.calisan_sayisi || 0),
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        alert(json.error || "Firma kaydedilemedi.");
        return;
      }

      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      await loadCompanies();
    } catch (errorValue) {
      console.error(errorValue);
      alert("Firma kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (company: Company) => {
    const approved = window.confirm(
      `"${company.name}" firması pasife alınsın mı?`
    );

    if (!approved) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/companies?id=${encodeURIComponent(company.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(json.error || "Firma pasife alınamadı.");
        return;
      }

      await loadCompanies();
    } catch (errorValue) {
      console.error(errorValue);
      alert("Firma pasife alınamadı.");
    } finally {
      setSaving(false);
    }
  };

  const loadCompanyPerformance = async (companyId: string) => {
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

      const json = (await response.json().catch(() => ({}))) as
        | CompanyPerformanceResponse
        | { error?: string };

      if (!response.ok || !("success" in json) || !json.success) {
        setCompanyPerformance(null);
        setPerformanceError(
          ("error" in json && json.error) ||
            "Firma performansı alınamadı."
        );
        return;
      }

      setCompanyPerformance(json);
    } catch (errorValue) {
      console.error(errorValue);
      setCompanyPerformance(null);
      setPerformanceError("Firma performansı alınamadı.");
    } finally {
      setPerformanceLoading(false);
    }
  };

  const openDetail = (company: Company) => {
    setDetailCompany(company);
    setDetailTab("PROFILE");
    setCompanyPerformance(null);
    setPerformanceError("");
    setShowDetailModal(true);
    void loadCompanyPerformance(company.id);
  };

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.background,
        padding: "clamp(12px,2vw,24px)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1440, margin: "0 auto" }}>
        <CompanyHeader
          companies={companies}
          onAddCompany={openCreateForm}
        />

        <CompanyStats companies={companies} />

        {error ? (
          <div
            style={{
              marginBottom: 18,
              padding: 16,
              borderRadius: 14,
              border: "1px solid #fecaca",
              background: "#fff7f7",
              color: "#991b1b",
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        ) : null}

        <CompanyToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={(value) =>
            setStatusFilter(
              value as "ALL" | "ACTIVE" | "PASSIVE" | "DEMO"
            )
          }
          sort={sortBy}
          onSortChange={(value) =>
            setSortBy(value as "NAME" | "EMPLOYEE" | "NEWEST")
          }
        />

        {loading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              borderRadius: 16,
              border: `1px solid ${BRAND.border}`,
              background: "#fff",
            }}
          >
            Firmalar yükleniyor...
          </div>
        ) : (
          <CompanyTable
            companies={filteredCompanies}
            onDetail={openDetail}
            onEdit={openEditForm}
            onDelete={deleteCompany}
          />
        )}

        {showForm ? (
          <CompanyFormModal
            mode={formMode}
            form={form}
            saving={saving}
            isMobile={isMobile}
            onChange={setForm}
            onSave={saveCompany}
            onClose={() => setShowForm(false)}
          />
        ) : null}

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
      </div>
    </main>
  );
}

function CompanyFormModal({
  mode,
  form,
  saving,
  isMobile,
  onChange,
  onSave,
  onClose,
}: {
  mode: "CREATE" | "EDIT";
  form: CompanyFormData;
  saving: boolean;
  isMobile: boolean;
  onChange: (value: CompanyFormData) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const setField = <K extends keyof CompanyFormData>(
    key: K,
    value: CompanyFormData[K]
  ) => onChange({ ...form, [key]: value });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 20,
        background: "rgba(15,23,42,0.58)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 920,
          maxHeight: isMobile ? "100vh" : "92vh",
          overflowY: "auto",
          borderRadius: isMobile ? 0 : 24,
          background: "#fff",
          boxShadow: "0 28px 80px rgba(15,23,42,0.28)",
        }}
      >
        <div
          style={{
            padding: 22,
            background: `linear-gradient(135deg,${BRAND.redDark},${BRAND.red})`,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}>
            {mode === "CREATE" ? "YENİ KAYIT" : "FİRMA GÜNCELLEME"}
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>
            {mode === "CREATE"
              ? "Yeni Firma Ekle"
              : "Firma Bilgilerini Düzenle"}
          </h2>
        </div>

        <div
          style={{
            padding: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 12,
          }}
        >
          <InputField
            label="Firma Adı"
            value={form.name}
            onChange={(value) => setField("name", value)}
          />
          <InputField
            label="Yetkili"
            value={form.yetkili || ""}
            onChange={(value) => setField("yetkili", value)}
          />
          <InputField
            label="Telefon"
            value={form.phone || ""}
            onChange={(value) => setField("phone", value)}
          />
          <InputField
            label="E-posta"
            value={form.email || ""}
            onChange={(value) => setField("email", value)}
          />
          <InputField
            label="SGK Sicil No"
            value={form.sgk_sicil_no || ""}
            onChange={(value) => setField("sgk_sicil_no", value)}
          />
          <InputField
            label="NACE Kodu"
            value={form.nace_kodu || ""}
            onChange={(value) => setField("nace_kodu", value)}
          />
          <InputField
            label="Tehlike Sınıfı"
            value={form.tehlike_sinifi || ""}
            onChange={(value) => setField("tehlike_sinifi", value)}
          />
          <InputField
            label="Çalışan Sayısı"
            type="number"
            value={String(form.calisan_sayisi || 0)}
            onChange={(value) =>
              setField("calisan_sayisi", Number(value || 0))
            }
          />
          <InputField
            label="Sektör"
            value={form.sektor || ""}
            onChange={(value) => setField("sektor", value)}
          />
          <InputField
            label="İSG Uzmanı"
            value={form.isg_uzmani || ""}
            onChange={(value) => setField("isg_uzmani", value)}
          />
          <InputField
            label="İşyeri Hekimi"
            value={form.isyeri_hekimi || ""}
            onChange={(value) => setField("isyeri_hekimi", value)}
          />
          <InputField
            label="DSP"
            value={form.dsp || ""}
            onChange={(value) => setField("dsp", value)}
          />

          <label style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Adres</span>
            <textarea
              rows={4}
              value={form.address || ""}
              onChange={(event) => setField("address", event.target.value)}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </label>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={secondaryButton}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={primaryButton}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
  color: BRAND.muted,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${BRAND.border}`,
};

const secondaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  background: "#6b7280",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  background: BRAND.green,
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};