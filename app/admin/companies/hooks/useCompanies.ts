"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Company,
  CompanyFormData,
} from "../types";

import {
  disableCompany,
  getCompanies,
  saveCompany,
} from "../services/companyService";

export type CompanyStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "PASSIVE"
  | "DEMO";

export type CompanySort =
  | "NAME"
  | "EMPLOYEE"
  | "NEWEST";

export function useCompanies() {
  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<CompanyStatusFilter>(
      "ALL"
    );

  const [sortBy, setSortBy] =
    useState<CompanySort>("NAME");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getCompanies();

      setCompanies(data);
    } catch (e) {
      console.error(e);

      setCompanies([]);

      setError(
        e instanceof Error
          ? e.message
          : "Firmalar alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredCompanies =
    useMemo(() => {
      const query = search
        .trim()
        .toLocaleLowerCase("tr-TR");

      const filtered =
        companies.filter(
          (company) => {
            const text = [
              company.name,
              company.yetkili || "",
              company.email || "",
              company.phone || "",
              company.address || "",
              company.sektor || "",
              company.nace_kodu || "",
            ]
              .join(" ")
              .toLocaleLowerCase(
                "tr-TR"
              );

            const isDemo =
              Boolean(
                company.is_demo
              ) ||
              company.name
                .toLocaleLowerCase(
                  "tr-TR"
                )
                .includes(
                  "d-sec demo lojistik"
                );

            const statusOk =
              statusFilter === "ALL"
                ? true
                : statusFilter ===
                  "ACTIVE"
                ? company.is_active !==
                  false
                : statusFilter ===
                  "PASSIVE"
                ? company.is_active ===
                  false
                : isDemo;

            return (
              (!query ||
                text.includes(query)) &&
              statusOk
            );
          }
        );

      return [...filtered].sort(
        (a, b) => {
          switch (sortBy) {
            case "EMPLOYEE":
              return (
                Number(
                  b.user_count || 0
                ) -
                Number(
                  a.user_count || 0
                )
              );

            case "NEWEST":
              return (
                new Date(
                  b.created_at || 0
                ).getTime() -
                new Date(
                  a.created_at || 0
                ).getTime()
              );

            default:
              return a.name.localeCompare(
                b.name,
                "tr-TR"
              );
          }
        }
      );
    }, [
      companies,
      search,
      statusFilter,
      sortBy,
    ]);

  const persistCompany =
    useCallback(
      async (
        mode:
          | "CREATE"
          | "EDIT",
        form: CompanyFormData
      ) => {
        try {
          setSaving(true);

          await saveCompany(
            mode,
            form
          );

          await load();
        } finally {
          setSaving(false);
        }
      },
      [load]
    );

  const deactivateCompany =
    useCallback(
      async (
        company: Company
      ) => {
        try {
          setSaving(true);

          await disableCompany(
            company
          );

          await load();
        } finally {
          setSaving(false);
        }
      },
      [load]
    );

  return {
    companies,
    filteredCompanies,

    loading,
    saving,
    error,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    sortBy,
    setSortBy,

    reload: load,

    persistCompany,

    deactivateCompany,
  };
}