"use client";

import {
  useEffect,
  useState,
} from "react";

import CompanyDetailModal from "./components/CompanyDetailModal";
import CompanyFormModal from "./components/CompanyFormModal";
import CompanyHeader from "./components/CompanyHeader";
import CompanyPortfolioInsights from "./components/CompanyPortfolioInsights";
import CompanyStats from "./components/CompanyStats";
import CompanyTable from "./components/CompanyTable";
import CompanyToolbar from "./components/CompanyToolbar";

import {
  BRAND,
} from "./constants";

import {
  useCompanies,
} from "./hooks/useCompanies";

import {
  getCompanyPerformance,
} from "./services/companyService";

import type {
  Company,
  CompanyFormData,
  CompanyPerformanceResponse,
} from "./types";

const EMPTY_FORM:
  CompanyFormData = {
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
  const {
    companies,
    filteredCompanies,
    loading,
    saving,
    error,
    search,
    statusFilter,
    sortBy,
    setSearch,
    setStatusFilter,
    setSortBy,
    persistCompany,
    deactivateCompany,
  } = useCompanies();

  const [
    isMobile,
    setIsMobile,
  ] = useState(false);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    formMode,
    setFormMode,
  ] =
    useState<
      "CREATE" | "EDIT"
    >("CREATE");

  const [
    form,
    setForm,
  ] =
    useState<CompanyFormData>(
      EMPTY_FORM
    );

  const [
    detailCompany,
    setDetailCompany,
  ] =
    useState<Company | null>(
      null
    );

  const [
    showDetailModal,
    setShowDetailModal,
  ] = useState(false);

  const [
    detailTab,
    setDetailTab,
  ] =
    useState<
      "PROFILE" |
      "PERFORMANCE"
    >("PROFILE");

  const [
    companyPerformance,
    setCompanyPerformance,
  ] =
    useState<
      CompanyPerformanceResponse |
      null
    >(null);

  const [
    performanceLoading,
    setPerformanceLoading,
  ] = useState(false);

  const [
    performanceError,
    setPerformanceError,
  ] = useState("");

  useEffect(() => {
    const media =
      window.matchMedia(
        "(max-width: 900px)"
      );

    const apply = () =>
      setIsMobile(
        media.matches
      );

    apply();

    media.addEventListener?.(
      "change",
      apply
    );

    return () =>
      media.removeEventListener?.(
        "change",
        apply
      );
  }, []);

  const openCreateForm = () => {
    setFormMode("CREATE");
    setForm({
      ...EMPTY_FORM,
    });
    setShowForm(true);
  };

  const openEditForm = (
    company: Company
  ) => {
    setFormMode("EDIT");

    setForm({
      id: company.id,
      name: company.name,
      local_firm_id:
        company.local_firm_id ??
        null,
      yetkili:
        company.yetkili ||
        "",
      phone:
        company.phone || "",
      email:
        company.email || "",
      address:
        company.address ||
        "",
      calisan_sayisi:
        Number(
          company.calisan_sayisi ??
            company.user_count ??
            0
        ),
      nace_kodu:
        company.nace_kodu ||
        "",
      tehlike_sinifi:
        company.tehlike_sinifi ||
        "",
      sgk_sicil_no:
        company.sgk_sicil_no ||
        "",
      sektor:
        company.sektor ||
        "",
      isg_uzmani:
        company.isg_uzmani ||
        "",
      isyeri_hekimi:
        company.isyeri_hekimi ||
        "",
      dsp:
        company.dsp || "",
      is_active:
        company.is_active !==
        false,
    });

    setShowForm(true);
  };

  const saveCurrentCompany =
    async () => {
      if (
        !form.name.trim()
      ) {
        alert(
          "Firma adı zorunludur."
        );
        return;
      }

      try {
        await persistCompany(
          formMode,
          form
        );

        setShowForm(false);
        setForm({
          ...EMPTY_FORM,
        });
      } catch (errorValue) {
        alert(
          errorValue instanceof Error
            ? errorValue.message
            : "Firma kaydedilemedi."
        );
      }
    };

  const requestDeactivate =
    async (
      company: Company
    ) => {
      const approved =
        window.confirm(
          `"${company.name}" firması pasife alınsın mı?`
        );

      if (!approved) {
        return;
      }

      try {
        await deactivateCompany(
          company
        );
      } catch (errorValue) {
        alert(
          errorValue instanceof Error
            ? errorValue.message
            : "Firma pasife alınamadı."
        );
      }
    };

  const openDetail =
    async (
      company: Company
    ) => {
      setDetailCompany(
        company
      );

      setDetailTab(
        "PROFILE"
      );

      setCompanyPerformance(
        null
      );

      setPerformanceError("");

      setShowDetailModal(
        true
      );

      try {
        setPerformanceLoading(
          true
        );

        setCompanyPerformance(
          await getCompanyPerformance(
            company.id
          )
        );
      } catch (errorValue) {
        setCompanyPerformance(
          null
        );

        setPerformanceError(
          errorValue instanceof Error
            ? errorValue.message
            : "Firma performansı alınamadı."
        );
      } finally {
        setPerformanceLoading(
          false
        );
      }
    };

  return (
    <main
      style={{
        minHeight: "100%",
        background:
          BRAND.background,
        padding:
          "clamp(12px,2vw,24px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        <CompanyHeader
          companies={companies}
          onAddCompany={
            openCreateForm
          }
        />

        <CompanyStats
          companies={companies}
        />

        <CompanyPortfolioInsights
          companies={companies}
          onOpenCompany={openDetail}
        />

        {error ? (
          <div
            style={{
              marginBottom: 18,
              padding: 16,
              borderRadius: 14,
              border:
                "1px solid #fecaca",
              background:
                "#fff7f7",
              color: "#991b1b",
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        ) : null}

        <CompanyToolbar
          search={search}
          onSearchChange={
            setSearch
          }
          status={
            statusFilter
          }
          onStatusChange={(
            value
          ) =>
            setStatusFilter(
              value as
                | "ALL"
                | "ACTIVE"
                | "PASSIVE"
                | "DEMO"
            )
          }
          sort={sortBy}
          onSortChange={(
            value
          ) =>
            setSortBy(
              value as
                | "NAME"
                | "EMPLOYEE"
                | "NEWEST"
            )
          }
        />

        {loading ? (
          <div
            style={{
              padding: 32,
              textAlign:
                "center",
              borderRadius: 16,
              border:
                `1px solid ${BRAND.border}`,
              background: "#fff",
            }}
          >
            Firmalar yükleniyor...
          </div>
        ) : (
          <CompanyTable
            companies={
              filteredCompanies
            }
            onDetail={
              openDetail
            }
            onEdit={
              openEditForm
            }
            onDelete={
              requestDeactivate
            }
          />
        )}

        {showForm ? (
          <CompanyFormModal
            mode={formMode}
            form={form}
            saving={saving}
            isMobile={isMobile}
            onChange={setForm}
            onSave={
              saveCurrentCompany
            }
            onClose={() =>
              setShowForm(false)
            }
          />
        ) : null}

        <CompanyDetailModal
          open={
            showDetailModal
          }
          company={
            detailCompany
          }
          isMobile={
            isMobile
          }
          detailTab={
            detailTab
          }
          onTabChange={
            setDetailTab
          }
          performanceLoading={
            performanceLoading
          }
          performanceError={
            performanceError
          }
          companyPerformance={
            companyPerformance
          }
          onClose={() =>
            setShowDetailModal(
              false
            )
          }
        />
      </div>
    </main>
  );
}
