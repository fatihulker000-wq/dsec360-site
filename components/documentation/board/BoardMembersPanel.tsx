"use client";
import type { ReactNode } from "react";

import {
  Building2,
  CheckCircle2,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MemberType = "EMPLOYEE" | "EXTERNAL";
type ViewMode = "grid" | "list";
type StatusFilter = "ALL" | "ACTIVE" | "PASSIVE";
type MemberTypeFilter = "ALL" | MemberType;

type EmployeeRow = {
  id: string;
  full_name: string;
  job_title?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  active?: boolean;
};

type BoardMember = {
  id: string;
  firmId: string;
  employeeId: string | null;
  memberType: MemberType;
  fullName: string;
  organizationName: string | null;
  title: string | null;
  department: string | null;
  boardRole: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  hasVotingRight: boolean;
  isActive: boolean;
};

type FormState = {
  id?: string;
  memberType: MemberType;
  employeeId: string;
  fullName: string;
  organizationName: string;
  title: string;
  department: string;
  boardRole: string;
  email: string;
  phone: string;
  notes: string;
  hasVotingRight: boolean;
  isActive: boolean;
};

type ApiErrorBody = {
  error?: string;
  message?: string;
};

const EMPTY_FORM: FormState = {
  memberType: "EMPLOYEE",
  employeeId: "",
  fullName: "",
  organizationName: "",
  title: "",
  department: "",
  boardRole: "MEMBER",
  email: "",
  phone: "",
  notes: "",
  hasVotingRight: true,
  isActive: true,
};

const ROLES = [
  ["CHAIRPERSON", "Kurul Başkanı"],
  ["SECRETARY", "Kurul Sekreteri"],
  ["EMPLOYER", "İşveren"],
  ["EMPLOYER_REPRESENTATIVE", "İşveren Vekili"],
  ["OHS_SPECIALIST", "İş Güvenliği Uzmanı"],
  ["WORKPLACE_PHYSICIAN", "İşyeri Hekimi"],
  ["HUMAN_RESOURCES", "İnsan Kaynakları"],
  ["EMPLOYEE_REPRESENTATIVE", "Çalışan Temsilcisi"],
  ["SUPPORT_PERSONNEL", "Destek Elemanı"],
  ["MEMBER", "Kurul Üyesi"],
  ["GUEST", "Misafir"],
  ["OTHER", "Diğer"],
] as const;

const ROLE_STYLES: Record<string, string> = {
  CHAIRPERSON: "border-red-200 bg-red-50 text-red-700",
  SECRETARY: "border-violet-200 bg-violet-50 text-violet-700",
  EMPLOYER: "border-blue-200 bg-blue-50 text-blue-700",
  EMPLOYER_REPRESENTATIVE: "border-indigo-200 bg-indigo-50 text-indigo-700",
  OHS_SPECIALIST: "border-emerald-200 bg-emerald-50 text-emerald-700",
  WORKPLACE_PHYSICIAN: "border-green-200 bg-green-50 text-green-700",
  HUMAN_RESOURCES: "border-cyan-200 bg-cyan-50 text-cyan-700",
  EMPLOYEE_REPRESENTATIVE: "border-orange-200 bg-orange-50 text-orange-700",
  SUPPORT_PERSONNEL: "border-amber-200 bg-amber-50 text-amber-700",
  MEMBER: "border-slate-200 bg-slate-50 text-slate-700",
  GUEST: "border-yellow-200 bg-yellow-50 text-yellow-700",
  OTHER: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const roleLabel = (value: string) =>
  ROLES.find(([key]) => key === value)?.[1] ?? value;

const normalizeText = (value: string | null | undefined) =>
  (value ?? "").trim().toLocaleLowerCase("tr-TR");

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export default function BoardMembersPanel({
  firmId,
}: {
  firmId: string;
}) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [memberTypeFilter, setMemberTypeFilter] =
    useState<MemberTypeFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const load = async () => {
    if (!firmId) {
      setMembers([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [memberResponse, employeeResponse] = await Promise.all([
        fetch(
          `/api/admin/documentation/board/members?firmId=${encodeURIComponent(
            firmId
          )}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        ),
        fetch(`/api/admin/employees?firmId=${encodeURIComponent(firmId)}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const memberJson = await readJson<{
        members?: BoardMember[];
      } & ApiErrorBody>(memberResponse);

      const employeeJson = await readJson<{
        data?: EmployeeRow[];
      } & ApiErrorBody>(employeeResponse);

      if (!memberResponse.ok) {
        throw new Error(
          memberJson.error ||
            memberJson.message ||
            "Kurul üyeleri alınamadı."
        );
      }

      if (!employeeResponse.ok) {
        throw new Error(
          employeeJson.error ||
            employeeJson.message ||
            "Çalışanlar alınamadı."
        );
      }

      setMembers(Array.isArray(memberJson.members) ? memberJson.members : []);

      setEmployees(
        (Array.isArray(employeeJson.data) ? employeeJson.data : []).filter(
          (item) => item.active !== false
        )
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Kurul üyesi verileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [firmId]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [success]);

  const filteredEmployees = useMemo(() => {
    const query = normalizeText(employeeSearch);

    if (!query) return employees;

    return employees.filter((employee) =>
      normalizeText(
        [
          employee.full_name,
          employee.job_title,
          employee.department,
          employee.registry_no,
          employee.email,
          employee.phone,
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(query)
    );
  }, [employees, employeeSearch]);

  const filteredMembers = useMemo(() => {
    const query = normalizeText(memberSearch);

    return members.filter((member) => {
      if (statusFilter === "ACTIVE" && !member.isActive) return false;
      if (statusFilter === "PASSIVE" && member.isActive) return false;

      if (
        memberTypeFilter !== "ALL" &&
        member.memberType !== memberTypeFilter
      ) {
        return false;
      }

      if (roleFilter !== "ALL" && member.boardRole !== roleFilter) {
        return false;
      }

      if (!query) return true;

      return normalizeText(
        [
          member.fullName,
          member.title,
          member.department,
          member.organizationName,
          member.email,
          member.phone,
          roleLabel(member.boardRole),
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(query);
    });
  }, [
    members,
    memberSearch,
    memberTypeFilter,
    roleFilter,
    statusFilter,
  ]);

  const totals = useMemo(
    () => ({
      all: members.length,
      active: members.filter((member) => member.isActive).length,
      employee: members.filter(
        (member) => member.memberType === "EMPLOYEE"
      ).length,
      external: members.filter(
        (member) => member.memberType === "EXTERNAL"
      ).length,
    }),
    [members]
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEmployeeSearch("");
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEdit = (member: BoardMember) => {
    setForm({
      id: member.id,
      memberType: member.memberType,
      employeeId: member.employeeId ?? "",
      fullName: member.fullName,
      organizationName: member.organizationName ?? "",
      title: member.title ?? "",
      department: member.department ?? "",
      boardRole: member.boardRole,
      email: member.email ?? "",
      phone: member.phone ?? "",
      notes: member.notes ?? "",
      hasVotingRight: member.hasVotingRight,
      isActive: member.isActive,
    });

    setEmployeeSearch("");
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setEmployeeSearch("");
  };

  const changeMemberType = (memberType: MemberType) => {
    setForm((current) => ({
      ...EMPTY_FORM,
      id: current.id,
      memberType,
      boardRole: current.boardRole || "MEMBER",
      hasVotingRight: current.hasVotingRight,
      isActive: current.isActive,
    }));

    setEmployeeSearch("");
  };

  const selectEmployee = (employeeId: string) => {
    const employee = employees.find(
      (item) => String(item.id) === String(employeeId)
    );

    setForm((current) => ({
      ...current,
      employeeId,
      fullName: employee?.full_name ?? "",
      title: employee?.job_title ?? "",
      department: employee?.department ?? "",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
      organizationName: "",
    }));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firmId) {
      setError("Firma seçimi bulunamadı.");
      return;
    }

    if (form.memberType === "EMPLOYEE" && !form.employeeId) {
      setError("Firma çalışanı seçilmelidir.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Ad soyad zorunludur.");
      return;
    }

    if (!form.boardRole) {
      setError("Kuruldaki görev seçilmelidir.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = form.id
        ? `/api/admin/documentation/board/members/${encodeURIComponent(form.id)}`
        : "/api/admin/documentation/board/members";

      const response = await fetch(url, {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firmId,
          ...form,
          fullName: form.fullName.trim(),
          organizationName: form.organizationName.trim() || null,
          title: form.title.trim() || null,
          department: form.department.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
          employeeId:
            form.memberType === "EMPLOYEE" ? form.employeeId || null : null,
        }),
      });

      const json = await readJson<ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Kurul üyesi kaydedilemedi."
        );
      }

      const editing = Boolean(form.id);

      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEmployeeSearch("");
      setSuccess(
        editing
          ? "Kurul üyesi başarıyla güncellendi."
          : "Kurul üyesi başarıyla eklendi."
      );

      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Kurul üyesi kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: BoardMember) => {
    const approved = window.confirm(
      `${member.fullName} kurul üyeliğinden çıkarılsın mı?`
    );

    if (!approved) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/documentation/board/members/${encodeURIComponent(
          member.id
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await readJson<ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Kurul üyesi silinemedi."
        );
      }

      setSuccess("Kurul üyesi listeden çıkarıldı.");
      await load();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Kurul üyesi silinemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                İSG Kurul Yönetimi
              </div>

              <h2 className="text-2xl font-bold">İSG Kurul Üyeleri</h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Firma çalışanlarından veya firma dışından kurul kadrosunu
                oluşturun, görev ve oy hakkı bilgilerini yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              disabled={!firmId || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Kurul Üyesi Ekle
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Toplam Üye"
            value={totals.all}
            icon={<Users className="h-5 w-5" />}
          />

          <KpiCard
            label="Aktif Üye"
            value={totals.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <KpiCard
            label="Firma Çalışanı"
            value={totals.employee}
            icon={<UserRound className="h-5 w-5" />}
          />

          <KpiCard
            label="Firma Dışı"
            value={totals.external}
            icon={<Building2 className="h-5 w-5" />}
          />
        </div>

        <div className="border-b border-slate-200 p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_220px_220px_180px_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

              <input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Ad, görev, departman, telefon veya e-posta ara"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">Tüm kurul görevleri</option>
              {ROLES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={memberTypeFilter}
              onChange={(event) =>
                setMemberTypeFilter(event.target.value as MemberTypeFilter)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">Tüm üye tipleri</option>
              <option value="EMPLOYEE">Firma çalışanı</option>
              <option value="EXTERNAL">Firma dışı üye</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">Tüm durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PASSIVE">Pasif</option>
            </select>

            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-9 flex-1 items-center justify-center rounded-lg px-3 transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-950"
                }`}
                aria-label="Kart görünümü"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex h-9 flex-1 items-center justify-center rounded-lg px-3 transition ${
                  viewMode === "list"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-950"
                }`}
                aria-label="Liste görünümü"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-4 w-4" />
            {filteredMembers.length} kayıt gösteriliyor.
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-8 w-8 text-slate-400" />
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Kurul üyesi bulunamadı
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Filtreleri temizleyin veya yeni bir kurul üyesi ekleyin.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                saving={saving}
                onEdit={openEdit}
                onDelete={remove}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Üye</th>
                  <th className="px-4 py-3">Kurul Görevi</th>
                  <th className="px-4 py-3">Birim / Kurum</th>
                  <th className="px-4 py-3">İletişim</th>
                  <th className="px-4 py-3">Oy Hakkı</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredMembers.map((member) => (
                  <MemberTableRow
                    key={member.id}
                    member={member}
                    saving={saving}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {form.id
                    ? "Kurul Üyesini Düzenle"
                    : "Kurul Üyesi Ekle"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Firma çalışanından seçim yapın veya firma dışı kişiyi manuel
                  olarak ekleyin.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
                aria-label="Pencereyi kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={save}
              className="max-h-[calc(94vh-90px)] overflow-y-auto"
            >
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => changeMemberType("EMPLOYEE")}
                    className={`h-11 rounded-xl text-sm font-bold transition ${
                      form.memberType === "EMPLOYEE"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Firma Çalışanı
                  </button>

                  <button
                    type="button"
                    onClick={() => changeMemberType("EXTERNAL")}
                    className={`h-11 rounded-xl text-sm font-bold transition ${
                      form.memberType === "EXTERNAL"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Firma Dışı Üye
                  </button>
                </div>

                {form.memberType === "EMPLOYEE" ? (
                  <>
                    <Field label="Çalışan Ara" className="sm:col-span-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                        <input
                          value={employeeSearch}
                          onChange={(event) =>
                            setEmployeeSearch(event.target.value)
                          }
                          placeholder="Ad, sicil, departman, unvan veya e-posta"
                          className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                      </div>
                    </Field>

                    <Field
                      label="Firma Çalışanı *"
                      className="sm:col-span-2"
                    >
                      <select
                        required
                        value={form.employeeId}
                        onChange={(event) =>
                          selectEmployee(event.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      >
                        <option value="">Çalışan seçin</option>

                        {filteredEmployees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                            {employee.department
                              ? ` · ${employee.department}`
                              : ""}
                            {employee.job_title
                              ? ` · ${employee.job_title}`
                              : ""}
                            {employee.registry_no
                              ? ` · Sicil: ${employee.registry_no}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <Field label="Kurumu / Firması">
                    <input
                      value={form.organizationName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          organizationName: event.target.value,
                        }))
                      }
                      placeholder="Örn. ABC Danışmanlık"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </Field>
                )}

                <Field label="Ad Soyad *">
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    readOnly={form.memberType === "EMPLOYEE"}
                    placeholder="Ad soyad"
                    className={`h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${
                      form.memberType === "EMPLOYEE"
                        ? "bg-slate-50 text-slate-600"
                        : "bg-white"
                    }`}
                  />
                </Field>

                <Field label="Kuruldaki Görevi *">
                  <select
                    required
                    value={form.boardRole}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        boardRole: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {ROLES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Mesleği / Unvanı">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Örn. Makine Mühendisi"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </Field>

                <Field label="Departman">
                  <input
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        department: event.target.value,
                      }))
                    }
                    placeholder="Örn. İnsan Kaynakları"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </Field>

                <Field label="Telefon">
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="05xx xxx xx xx"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </Field>

                <Field label="E-posta">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="ornek@firma.com"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </Field>

                <Field label="Açıklama" className="sm:col-span-2">
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Kurul üyeliğine ilişkin ek açıklamalar"
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </Field>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.hasVotingRight}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hasVotingRight: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <div>
                    <span className="block text-sm font-bold text-slate-800">
                      Oy hakkı var
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Kararlarda oy kullanabilir.
                    </span>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  <div>
                    <span className="block text-sm font-bold text-slate-800">
                      Aktif kurul üyesi
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Yeni toplantılara otomatik aktarılır.
                    </span>
                  </div>
                </label>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : form.id ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {form.id ? "Değişiklikleri Kaydet" : "Kurul Üyesini Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </span>
      </div>

      <div className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  saving,
  onEdit,
  onDelete,
}: {
  member: BoardMember;
  saving: boolean;
  onEdit: (member: BoardMember) => void;
  onDelete: (member: BoardMember) => Promise<void>;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <UserRound className="h-6 w-6 text-slate-600" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-950">
                {member.fullName}
              </h3>

              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                  ROLE_STYLES[member.boardRole] ??
                  "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {roleLabel(member.boardRole)}
              </span>
            </div>
          </div>

          <StatusBadge active={member.isActive} />
        </div>
      </div>

      <div className="space-y-3 p-4 text-sm">
        <InfoRow
          icon={<Building2 className="h-4 w-4" />}
          value={
            member.memberType === "EXTERNAL"
              ? member.organizationName || "Firma dışı üye"
              : member.department || "Firma çalışanı"
          }
        />

        <InfoRow
          icon={<UserRound className="h-4 w-4" />}
          value={member.title || "Unvan belirtilmedi"}
        />

        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          value={member.phone || "Telefon belirtilmedi"}
        />

        <InfoRow
          icon={<Mail className="h-4 w-4" />}
          value={member.email || "E-posta belirtilmedi"}
        />

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
          <span className="text-xs font-semibold text-slate-500">Oy hakkı</span>

          <span
            className={`text-xs font-bold ${
              member.hasVotingRight ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {member.hasVotingRight ? "Var" : "Yok"}
          </span>
        </div>

        {member.notes ? (
          <p className="line-clamp-2 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600">
            {member.notes}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onEdit(member)}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 border-r border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </button>

        <button
          type="button"
          onClick={() => void onDelete(member)}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Sil
        </button>
      </div>
    </article>
  );
}

function MemberTableRow({
  member,
  saving,
  onEdit,
  onDelete,
}: {
  member: BoardMember;
  saving: boolean;
  onEdit: (member: BoardMember) => void;
  onDelete: (member: BoardMember) => Promise<void>;
}) {
  return (
    <tr className="text-sm text-slate-700 transition hover:bg-slate-50">
      <td className="px-4 py-4">
        <div className="font-bold text-slate-950">{member.fullName}</div>
        <div className="mt-1 text-xs text-slate-500">
          {member.title || "Unvan belirtilmedi"}
        </div>
      </td>

      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
            ROLE_STYLES[member.boardRole] ??
            "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {roleLabel(member.boardRole)}
        </span>
      </td>

      <td className="px-4 py-4">
        {member.memberType === "EXTERNAL"
          ? member.organizationName || "Firma dışı"
          : member.department || "Firma çalışanı"}
      </td>

      <td className="px-4 py-4">
        <div>{member.phone || "-"}</div>
        <div className="mt-1 text-xs text-slate-500">
          {member.email || "-"}
        </div>
      </td>

      <td className="px-4 py-4">
        {member.hasVotingRight ? "Var" : "Yok"}
      </td>

      <td className="px-4 py-4">
        <StatusBadge active={member.isActive} />
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(member)}
            disabled={saving}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Kurul üyesini düzenle"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void onDelete(member)}
            disabled={saving}
            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            aria-label="Kurul üyesini sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Aktif
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      <XCircle className="h-3.5 w-3.5" />
      Pasif
    </span>
  );
}

function InfoRow({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-slate-600">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}