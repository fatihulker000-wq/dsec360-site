"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EmployeeDashboard,
} from "@/components/employees-v2/dashboard";

import {
  EmployeeListCenter,
} from "@/components/employees-v2/list";

import type {
  EmployeeListRow,
} from "@/components/employees-v2/list";

import {
  EmployeeProfile,
} from "@/components/employees-v2/profile";

import type {
  EmployeeProfileEmployee,
} from "@/components/employees-v2/profile";

import {
  EmployeeIntegrationBridge,
  mapIntegrationToEmployeeSummary,
  mapIntegrationToProfileProps,
} from "@/components/employees-v2/integration";

import {
  DoraEmployeeProfileBridge,
} from "@/components/employees-v2/dora-analysis";

type Employee = {
  id: string;
  firm_id?: string | null;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  tc_no?: string | null;
  start_date?: string | null;
  exit_date?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  disability_status?: string | null;
  education_level?: string | null;
  blood_type?: string | null;
  active: boolean;
};

type Company = {
  id: string;
  name: string;
};

type EmployeeForm = {
  full_name: string;
  department: string;
  job_title: string;
  phone: string;
  email: string;
  registry_no: string;
  tc_no: string;
  start_date: string;
  birth_date: string;
  gender: string;
  disability_status: string;
  education_level: string;
  blood_type: string;
};

const emptyForm: EmployeeForm = {
  full_name: "",
  department: "",
  job_title: "",
  phone: "",
  email: "",
  registry_no: "",
  tc_no: "",
  start_date: "",
  birth_date: "",
  gender: "",
  disability_status: "",
  education_level: "",
  blood_type: "",
};

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [firmFilter, setFirmFilter] = useState("all");
  const [readOnly, setReadOnly] = useState(false);

  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeForm>(emptyForm);

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeForm>(emptyForm);

  const [profileEmployee, setProfileEmployee] =
    useState<Employee | null>(null);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSummary, setPreviewSummary] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadEmployees = async (firmId = "all") => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/admin/employees?firmId=${encodeURIComponent(firmId)}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setData([]);
        setError(json?.error || "Çalışanlar alınamadı.");
        return;
      }

      const nextEmployees = Array.isArray(json?.data)
  ? json.data
  : [];

const nextCompanies = Array.isArray(json?.companies)
  ? json.companies
  : [];

const nextReadOnly =
  json?.scope?.read_only === true;

const scopedCompanyId = String(
  json?.scope?.company_id || ""
).trim();

setData(nextEmployees);
setCompanies(nextCompanies);
setReadOnly(nextReadOnly);

/*
 * Demo ve firma kapsamlı kullanıcıda firma seçimini
 * API'nin döndürdüğü firmaya sabitliyoruz.
 */
if (scopedCompanyId && nextCompanies.length === 1) {
  setFirmFilter(scopedCompanyId);
}
    } catch {
  setData([]);
  setCompanies([]);
  setReadOnly(false);
  setError(
    "Çalışan listesi yüklenirken hata oluştu."
  );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees("all");
  }, []);

  const companyMap = useMemo(() => {
    return new Map(
      companies.map((company) => [
        String(company.id),
        company.name,
      ])
    );
  }, [companies]);

  const employeeRows = useMemo<EmployeeListRow[]>(
    () =>
      data.map((employee) => ({
        ...employee,
        id: String(employee.id),
        firm_id: employee.firm_id
          ? String(employee.firm_id)
          : null,
        firm_name: employee.firm_id
          ? companyMap.get(String(employee.firm_id)) || null
          : null,
        training_status: "UNKNOWN",
        health_status: "UNKNOWN",
        ppe_status: "UNKNOWN",
        document_status: "UNKNOWN",
        risk_status: "UNKNOWN",
        accident_count: 0,
      })),
    [data, companyMap]
  );

  const selectedCompanyName = useMemo(() => {
  if (
    readOnly &&
    companies.length === 1
  ) {
    return companies[0]?.name || "Demo firma";
  }

  if (firmFilter === "all") {
    return "Tüm firmalar";
  }

  return (
    companyMap.get(String(firmFilter)) ||
    "Seçili firma"
  );
}, [
  firmFilter,
  companyMap,
  companies,
  readOnly,
]);

  const handleAddEmployee = () => {
  if (readOnly) {
    return;
  }

  if (firmFilter === "all") {
      alert("Yeni çalışan eklemek için önce işlem firmasını seçmelisin.");
      return;
    }

    setAddForm(emptyForm);
    setAddModal(true);
  };

  const saveNewEmployee = async () => {
    if (firmFilter === "all") {
      alert("Önce firma seçmelisin.");
      return;
    }

    if (!addForm.full_name.trim()) {
      alert("Ad Soyad zorunlu.");
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firm_id: firmFilter,
          ...normalizeForm(addForm),
          active: true,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
  setData([]);
  setCompanies([]);
  setReadOnly(false);
  setError(
    json?.error ||
      "Çalışanlar alınamadı."
  );
  return;
}

      setAddModal(false);
      setAddForm(emptyForm);
      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditModal(employee);
    setEditForm({
      full_name: employee.full_name || "",
      department: employee.department || "",
      job_title: employee.job_title || "",
      phone: employee.phone || "",
      email: employee.email || "",
      registry_no: employee.registry_no || "",
      tc_no: employee.tc_no || "",
      start_date: employee.start_date || "",
      birth_date: employee.birth_date || "",
      gender: employee.gender || "",
      disability_status: employee.disability_status || "",
      education_level: employee.education_level || "",
      blood_type: employee.blood_type || "",
    });
  };

  const saveEditEmployee = async () => {
    if (!editModal) return;

    if (!editForm.full_name.trim()) {
      alert("Ad Soyad zorunlu.");
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch("/api/admin/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editModal.id,
          ...normalizeForm(editForm),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan güncellenemedi.");
        return;
      }

      setEditModal(null);
      setEditForm(emptyForm);
      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateEmployee = async (employee: Employee) => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/admin/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: employee.id,
          active: true,
          exit_date: "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan aktifleştirilemedi.");
        return;
      }

      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePassiveEmployee = async (employee: Employee) => {
    if (!confirm(`${employee.full_name} pasife alınsın mı?`)) {
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch(
        `/api/admin/employees?id=${encodeURIComponent(employee.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan pasife alınamadı.");
        return;
      }

      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDeleteEmployee = async (employee: Employee) => {
    const confirmed = confirm(
      `${employee.full_name} kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const res = await fetch(
        `/api/admin/employees?id=${encodeURIComponent(
          employee.id
        )}&mode=hard`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan silinemedi.");
        return;
      }

      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const findOriginalEmployee = (
    employee: EmployeeListRow
  ): Employee | null => {
    return (
      data.find(
        (item) => String(item.id) === String(employee.id)
      ) || null
    );
  };

  const handleBulkActivate = async (ids: string[]) => {
    for (const id of ids) {
      const employee = data.find(
        (item) => String(item.id) === String(id)
      );

      if (employee && !employee.active) {
        await handleActivateEmployee(employee);
      }
    }
  };

  const handleBulkPassive = async (ids: string[]) => {
    if (
      !confirm(
        `${ids.length} çalışan pasife alınacak. Devam edilsin mi?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await Promise.all(
        ids.map((id) =>
          fetch(
            `/api/admin/employees?id=${encodeURIComponent(id)}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          )
        )
      );

      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (
      !confirm(
        `${ids.length} çalışan kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await Promise.all(
        ids.map((id) =>
          fetch(
            `/api/admin/employees?id=${encodeURIComponent(
              id
            )}&mode=hard`,
            {
              method: "DELETE",
              credentials: "include",
            }
          )
        )
      );

      await loadEmployees("all");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadEmployeeTemplate = () => {
    const csv =
      "full_name,department,job_title,phone,email,registry_no,tc_no,start_date,birth_date,gender,disability_status,education_level,blood_type,active\n" +
      "Ali Veli,Depo,Operatör,05551234567,ali.veli@mail.com,SCL-001,11111111111,2026-01-01,1990-01-01,Erkek,Yok,Lise,A Rh+,true\n";

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "dsec-calisan-toplu-yukleme-sablon.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const uploadBulkEmployees = async () => {
    if (firmFilter === "all") {
      alert("Toplu yükleme için önce işlem firmasını seçmelisin.");
      return;
    }

    if (!bulkFile) {
      alert("Önce CSV veya Excel dosyası seç.");
      return;
    }

    try {
      setBulkLoading(true);

      const formData = new FormData();
      formData.append("file", bulkFile);
      formData.append("firm_id", firmFilter);

      const res = await fetch(
        "/api/admin/employees/bulk-upload",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(
          json?.error || "Toplu çalışan yükleme başarısız."
        );
        return;
      }

      alert(
        `Toplu yükleme tamamlandı.\nEklenen: ${
          json.insertedCount || 0
        }\nAtlanan: ${json.skippedCount || 0}`
      );

      setBulkFile(null);
      await loadEmployees("all");
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkPreview = async () => {
    if (!bulkFile) {
      alert("Önce dosya seç.");
      return;
    }

    if (firmFilter === "all") {
      alert("Önce işlem firmasını seç.");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("firm_id", firmFilter);

    const res = await fetch(
      "/api/admin/employees/bulk-preview",
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Önizleme hatası.");
      return;
    }

    setPreviewData(
      Array.isArray(json?.preview) ? json.preview : []
    );
    setPreviewSummary(json?.summary || null);
    setPreviewOpen(true);
  };

  const uploadFromPreview = async () => {
    if (!previewData.length) {
      alert("Önizleme verisi yok.");
      return;
    }

    try {
      setBulkLoading(true);

      const res = await fetch(
        "/api/admin/employees/bulk-upload-from-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            firm_id: firmFilter,
            rows: previewData,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Yükleme hatası.");
        return;
      }

      alert(`Eklenen: ${json.insertedCount || 0}`);

      setPreviewOpen(false);
      setPreviewData([]);
      setPreviewSummary(null);
      setBulkFile(null);

      await loadEmployees("all");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: 28,
        display: "grid",
        gap: 20,
      }}
    >
      <EmployeeDashboard
        employees={data}
        visibleEmployees={data}
        selectedCompanyName={selectedCompanyName}
        onEmployeeClick={(employeeId) => {
          const employee =
            data.find(
              (item) =>
                String(item.id) === String(employeeId)
            ) || null;

          setProfileEmployee(employee);
        }}
      />

{!readOnly ? (
      <section
        style={{
          display: "grid",
          gap: 14,
          padding: 18,
          borderRadius: 20,
          background: "#fff",
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 950,
              color: "#111827",
            }}
          >
            Kayıt ve Toplu İşlem Merkezi
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Yeni çalışan ve toplu yükleme işlemlerinde
            kullanılacak firmayı seçin.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <select
            value={firmFilter}
            onChange={(event) =>
              setFirmFilter(event.target.value)
            }
            style={inputStyle}
          >
            <option value="all">
              İşlem firması seç
            </option>

            {companies.map((company) => (
              <option
                key={company.id}
                value={company.id}
              >
                {company.name || "Firma"}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={downloadEmployeeTemplate}
            style={darkBtn()}
          >
            Şablon İndir
          </button>

          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) =>
              setBulkFile(
                event.target.files?.[0] || null
              )
            }
            style={{
              minWidth: 220,
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "10px 12px",
              background: "#fff",
              fontWeight: 800,
            }}
          />

          <button
            type="button"
            onClick={openBulkPreview}
            disabled={!bulkFile}
            style={darkBtn(!bulkFile)}
          >
            Önizleme
          </button>

          <button
            type="button"
            onClick={uploadBulkEmployees}
            disabled={bulkLoading || !bulkFile}
            style={blueBtn(bulkLoading || !bulkFile)}
          >
            {bulkLoading
              ? "Yükleniyor..."
              : "Toplu Yükle"}
          </button>
        </div>
       </section>
) : null}

      {error ? (
        <CardText
          title="Çalışan verileri alınamadı"
          text={error}
        />
      ) : (
        <EmployeeListCenter
  employees={employeeRows}
  companies={companies}
  loading={loading}
  actionLoading={actionLoading}
  readOnly={readOnly}
          onRefresh={() => {
            void loadEmployees("all");
          }}
          onAdd={handleAddEmployee}
          onOpen={(employee) => {
            setProfileEmployee(
              findOriginalEmployee(employee)
            );
          }}
          onEdit={(employee) => {
            const original =
              findOriginalEmployee(employee);

            if (original) {
              openEditModal(original);
            }
          }}
          onActivate={(employee) => {
            const original =
              findOriginalEmployee(employee);

            if (original) {
              void handleActivateEmployee(original);
            }
          }}
          onPassive={(employee) => {
            const original =
              findOriginalEmployee(employee);

            if (original) {
              void handlePassiveEmployee(original);
            }
          }}
          onDelete={(employee) => {
            const original =
              findOriginalEmployee(employee);

            if (original) {
              void handleHardDeleteEmployee(original);
            }
          }}
          onBulkActivate={(ids) => {
            void handleBulkActivate(ids);
          }}
          onBulkPassive={(ids) => {
            void handleBulkPassive(ids);
          }}
          onBulkDelete={(ids) => {
            void handleBulkDelete(ids);
          }}
        />
      )}

      {addModal ? (
        <EmployeeFormModal
          eyebrow="Yeni Çalışan"
          title="Çalışan Ekle"
          form={addForm}
          loading={actionLoading}
          onChange={setAddForm}
          onCancel={() => {
            setAddModal(false);
            setAddForm(emptyForm);
          }}
          onSave={() => {
            void saveNewEmployee();
          }}
        />
      ) : null}

      {editModal ? (
        <EmployeeFormModal
          eyebrow="Çalışan Bilgisi"
          title="Çalışanı Düzenle"
          form={editForm}
          loading={actionLoading}
          onChange={setEditForm}
          onCancel={() => {
            setEditModal(null);
            setEditForm(emptyForm);
          }}
          onSave={() => {
            void saveEditEmployee();
          }}
        />
      ) : null}

      {previewOpen ? (
        <BulkPreviewModal
          rows={previewData}
          summary={previewSummary}
          loading={bulkLoading}
          onClose={() => setPreviewOpen(false)}
          onUpload={() => {
            void uploadFromPreview();
          }}
        />
      ) : null}

      {profileEmployee ? (
        <EmployeeIntegrationBridge
          employeeId={profileEmployee.id}
        >
          {({ integration }) => {
            const summary =
              mapIntegrationToEmployeeSummary(
                integration
              );

            const profileProps =
              mapIntegrationToProfileProps(
                integration
              );

            const employee: EmployeeProfileEmployee = {
              ...profileEmployee,
              firm_name:
                profileEmployee.firm_id
                  ? companyMap.get(
                      String(
                        profileEmployee.firm_id
                      )
                    ) || null
                  : null,
              ...summary,
            };

            return (
              <div
                onClick={() =>
                  setProfileEmployee(null)
                }
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 15000,
                  overflowY: "auto",
                  padding: 18,
                  background:
                    "rgba(15,23,42,.72)",
                }}
              >
                <div
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  style={{
                    width: "min(1500px,100%)",
                    margin: "0 auto",
                    display: "grid",
                    gap: 18,
                    padding: 20,
                    borderRadius: 28,
                    background: "#f8fafc",
                    boxShadow:
                      "0 34px 100px rgba(0,0,0,.30)",
                  }}
                >
                  <EmployeeProfile
                    employee={employee}
                    readOnly={readOnly}
                    onClose={() =>
                      setProfileEmployee(null)
                    }
                    onEdit={() => {
  if (readOnly) {
    return;
  }

  setProfileEmployee(null);
  openEditModal(
    profileEmployee
  );
}}
                    {...profileProps}
                  />

                  <DoraEmployeeProfileBridge
                    employee={employee}
                    integration={integration}
                  />
                </div>
              </div>
            );
          }}
        </EmployeeIntegrationBridge>
      ) : null}
    </main>
  );
}

function normalizeForm(form: EmployeeForm) {
  return {
    full_name: form.full_name.trim(),
    department: form.department.trim(),
    job_title: form.job_title.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    registry_no: form.registry_no.trim(),
    tc_no: form.tc_no.trim(),
    start_date: form.start_date.trim(),
    birth_date: form.birth_date.trim(),
    gender: form.gender.trim(),
    disability_status:
      form.disability_status.trim(),
    education_level:
      form.education_level.trim(),
    blood_type: form.blood_type.trim(),
  };
}

function EmployeeFormModal({
  eyebrow,
  title,
  form,
  loading,
  onChange,
  onCancel,
  onSave,
}: {
  eyebrow: string;
  title: string;
  form: EmployeeForm;
  loading: boolean;
  onChange(form: EmployeeForm): void;
  onCancel(): void;
  onSave(): void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 16000,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "rgba(15,23,42,0.60)",
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(880px,100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 24,
          borderRadius: 25,
          background: "#fff",
          boxShadow:
            "0 32px 90px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            padding: 20,
            marginBottom: 18,
            borderRadius: 20,
            color: "#fff",
            background:
              "linear-gradient(135deg,#111827 0%,#4a0d1a 50%,#c62828 100%)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.82,
            }}
          >
            {eyebrow}
          </div>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 27,
              fontWeight: 950,
            }}
          >
            {title}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}
        >
          <FormInput
            label="Ad Soyad *"
            value={form.full_name}
            onChange={(value) =>
              onChange({
                ...form,
                full_name: value,
              })
            }
          />

          <FormInput
            label="Departman"
            value={form.department}
            onChange={(value) =>
              onChange({
                ...form,
                department: value,
              })
            }
          />

          <FormInput
            label="Ünvan"
            value={form.job_title}
            onChange={(value) =>
              onChange({
                ...form,
                job_title: value,
              })
            }
          />

          <FormInput
            label="Telefon"
            value={form.phone}
            onChange={(value) =>
              onChange({
                ...form,
                phone: value,
              })
            }
          />

          <FormInput
            label="E-posta"
            value={form.email}
            onChange={(value) =>
              onChange({
                ...form,
                email: value,
              })
            }
          />

          <FormInput
            label="Sicil No"
            value={form.registry_no}
            onChange={(value) =>
              onChange({
                ...form,
                registry_no: value,
              })
            }
          />

          <FormInput
            label="T.C. No"
            value={form.tc_no}
            onChange={(value) =>
              onChange({
                ...form,
                tc_no: value,
              })
            }
          />

          <FormInput
            label="İşe Giriş Tarihi"
            type="date"
            value={form.start_date}
            onChange={(value) =>
              onChange({
                ...form,
                start_date: value,
              })
            }
          />

          <FormInput
            label="Doğum Tarihi"
            type="date"
            value={form.birth_date}
            onChange={(value) =>
              onChange({
                ...form,
                birth_date: value,
              })
            }
          />

          <FormInput
            label="Cinsiyet"
            value={form.gender}
            onChange={(value) =>
              onChange({
                ...form,
                gender: value,
              })
            }
          />

          <FormInput
            label="Engellilik Durumu"
            value={form.disability_status}
            onChange={(value) =>
              onChange({
                ...form,
                disability_status: value,
              })
            }
          />

          <FormInput
            label="Öğrenim Durumu"
            value={form.education_level}
            onChange={(value) =>
              onChange({
                ...form,
                education_level: value,
              })
            }
          />

          <FormInput
            label="Kan Grubu"
            value={form.blood_type}
            onChange={(value) =>
              onChange({
                ...form,
                blood_type: value,
              })
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={darkBtn()}
          >
            İptal
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            style={blueBtn(loading)}
          >
            {loading
              ? "Kaydediliyor..."
              : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkPreviewModal({
  rows,
  summary,
  loading,
  onClose,
  onUpload,
}: {
  rows: any[];
  summary: any;
  loading: boolean;
  onClose(): void;
  onUpload(): void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 17000,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(0,0,0,.66)",
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(1200px,96%)",
          maxHeight: "92vh",
          overflow: "auto",
          padding: 22,
          borderRadius: 22,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Toplu Yükleme Önizleme
        </h2>

        <div
          style={{
            marginBottom: 14,
            color: "#475569",
            fontWeight: 800,
          }}
        >
          Toplam: {summary?.total || 0} ·
          Hatalı: {summary?.errorCount || 0} ·
          Uyarı: {summary?.warningCount || 0} ·
          Hazır: {summary?.readyCount || 0}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 760,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <Th>Ad Soyad</Th>
                <Th>E-posta</Th>
                <Th>Sicil</Th>
                <Th>Durum</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const errors = Array.isArray(
                  row.errors
                )
                  ? row.errors
                  : [];

                const warnings = Array.isArray(
                  row.warnings
                )
                  ? row.warnings
                  : [];

                const background =
                  errors.length > 0
                    ? "#fee2e2"
                    : warnings.length > 0
                    ? "#fef9c3"
                    : "#ecfdf5";

                return (
                  <tr
                    key={index}
                    style={{ background }}
                  >
                    <Td>{row.full_name || "-"}</Td>
                    <Td>{row.email || "-"}</Td>
                    <Td>{row.registry_no || "-"}</Td>
                    <Td>
                      {errors.join(", ") ||
                        warnings.join(", ") ||
                        "Hazır"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={darkBtn()}
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={onUpload}
            disabled={loading}
            style={blueBtn(loading)}
          >
            {loading
              ? "Yükleniyor..."
              : "Onayla ve Yükle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange(value: string): void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 850,
          color: "#374151",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          fontSize: 14,
          color: "#111827",
        }}
      />
    </label>
  );
}

function CardText({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 22,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#111827",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginBottom: 0,
          color: "#6b7280",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding: 12,
        textAlign: "left",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {children}
    </td>
  );
}

const inputStyle: React.CSSProperties = {
  minWidth: 260,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  fontSize: 14,
  fontWeight: 800,
};

function darkBtn(
  disabled = false
): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: disabled
      ? "#94a3b8"
      : "#111827",
    color: "#fff",
    fontWeight: 850,
    cursor: disabled
      ? "not-allowed"
      : "pointer",
  };
}

function blueBtn(
  disabled: boolean
): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: disabled
      ? "#93c5fd"
      : "#2563eb",
    color: "#fff",
    fontWeight: 850,
    cursor: disabled
      ? "not-allowed"
      : "pointer",
  };
}