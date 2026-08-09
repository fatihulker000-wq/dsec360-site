"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

type Company = {
  id: string;
  firm_id: string;
  company_name: string;
  authorized_person?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_no?: string | null;
  work_scope?: string | null;
  contract_start_millis?: number | null;
  contract_end_millis?: number | null;
  application_status?: string | null;
  approval_status?: string | null;
  revision_note?: string | null;
  is_active?: boolean | null;
};

type Employee = {
  id: string;
  firm_id: string;
  company_id: string;

  full_name: string;
  tc_no?: string | null;
  position?: string | null;
  phone?: string | null;
  entry_card_no?: string | null;
  photo_url?: string | null;

  is_inside?: boolean | null;

  sgk_entry_ok?: boolean | null;
  isg_training_ok?: boolean | null;
  health_report_ok?: boolean | null;
  myk_certificate_ok?: boolean | null;
  kkd_delivery_ok?: boolean | null;
  site_orientation_ok?: boolean | null;
  work_at_height_ok?: boolean | null;

  access_blocked_note?: string | null;

  employee_status?: string | null;
  approval_status?: string | null;
  entry_permission?: boolean | null;

  approved_at_millis?: number | null;
  approved_by?: string | null;
  revision_note?: string | null;
};

type CompanyDocument = {
  id: string;
  firm_id?: string | null;
  company_id?: string | null;

  app_local_id?: number | null;
  sync_key?: string | null;

  doc_key?: string | null;
  doc_title?: string | null;

  is_required?: boolean | null;
  status?: string | null;

  file_url?: string | null;
  valid_until_millis?: number | null;
  note?: string | null;

  is_deleted?: boolean | null;
  source?: string | null;

  updated_at_millis?: number | null;
  created_at_millis?: number | null;
};

type EmployeeDocument = {
  id: string;
  employee_id?: string | null;
  status?: string | null;
  is_required?: boolean | null;
  valid_until_millis?: number | null;
};

type WorkPermit = {
  id: string;
  company_id?: string | null;
  status?: string | null;
  start_millis?: number | null;
  end_millis?: number | null;
};

type EntryLog = {
  id: string;
  company_id?: string | null;
  employee_id?: string | null;
  entry_time_millis?: number | null;
};

type QrToken = {
  id: string;
  company_id?: string | null;
  employee_id?: string | null;
};

type ApiResponse = {
  success?: boolean;
  error?: string;

  companies?: Company[];
  employees?: Employee[];

  companyDocuments?: CompanyDocument[];
  employeeDocuments?: EmployeeDocument[];

  permits?: WorkPermit[];
  entryLogs?: EntryLog[];
  qrTokens?: QrToken[];
};

type CompanyDocumentForm = {
  id: string;
  docKey: string;
  docTitle: string;
  isRequired: boolean;
  status: string;
  fileUrl: string;
  validUntil: string;
  note: string;
};

const EMPTY_COMPANY_DOCUMENT: CompanyDocumentForm = {
  id: "",
  docKey: "",
  docTitle: "",
  isRequired: true,
  status: "EKSIK",
  fileUrl: "",
  validUntil: "",
  note: "",
};

type EmployeeForm = {
  id: string;

  fullName: string;
  tcNo: string;
  position: string;
  phone: string;
  entryCardNo: string;

  sgkEntryOk: boolean;
  isgTrainingOk: boolean;
  healthReportOk: boolean;
  mykCertificateOk: boolean;
  kkdDeliveryOk: boolean;
  siteOrientationOk: boolean;
  workAtHeightOk: boolean;

  employeeStatus: string;
  approvalStatus: string;
  entryPermission: boolean;

  accessBlockedNote: string;
  revisionNote: string;
};

const EMPTY_EMPLOYEE: EmployeeForm = {
  id: "",

  fullName: "",
  tcNo: "",
  position: "",
  phone: "",
  entryCardNo: "",

  sgkEntryOk: false,
  isgTrainingOk: false,
  healthReportOk: false,
  mykCertificateOk: false,
  kkdDeliveryOk: false,
  siteOrientationOk: false,
  workAtHeightOk: false,

  employeeStatus: "TASLAK",
  approvalStatus: "BEKLIYOR",
  entryPermission: false,

  accessBlockedNote: "",
  revisionNote: "",
};

function value(v: unknown) {
  return String(v ?? "").trim();
}

function formatDate(ms?: number | null) {
  if (!ms) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(new Date(Number(ms)));
}

function labelStatus(v?: string | null) {
  return value(v)
    .replaceAll("_", " ")
    .toLocaleLowerCase("tr-TR")
    .replace(
      /(^|\s)\S/g,
      (char) =>
        char.toLocaleUpperCase("tr-TR")
    );
}

function complianceCount(
  employee: Employee
) {
  return [
    employee.sgk_entry_ok,
    employee.isg_training_ok,
    employee.health_report_ok,
    employee.myk_certificate_ok,
    employee.kkd_delivery_ok,
    employee.site_orientation_ok,
    employee.work_at_height_ok,
  ].filter(Boolean).length;
}

export default function SubcontractorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const companyId =
    value(params.companyId);

  const firmId =
    value(
      searchParams.get("firmId")
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [data, setData] =
    useState<ApiResponse>({});

const [
  companyDocumentModalOpen,
  setCompanyDocumentModalOpen,
] = useState(false);

const [
  companyDocumentForm,
  setCompanyDocumentForm,
] = useState<CompanyDocumentForm>(
  EMPTY_COMPANY_DOCUMENT
);

const [
  companyDocumentFileUploading,
  setCompanyDocumentFileUploading,
] = useState(false);

  const [
    employeeModalOpen,
    setEmployeeModalOpen,
  ] = useState(false);

  const [
    employeeForm,
    setEmployeeForm,
  ] = useState<EmployeeForm>(
    EMPTY_EMPLOYEE
  );

  const load = useCallback(
    async () => {
      if (!firmId || !companyId) {
        setError(
          "Firma bilgileri eksik."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/admin/subcontractors?firmId=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
            }
          );

        const json =
          (await response.json()) as ApiResponse;

        if (
          !response.ok ||
          json.success === false
        ) {
          throw new Error(
            json.error ||
              "Taşeron bilgileri alınamadı."
          );
        }

        setData(json);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Veriler alınamadı."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      firmId,
      companyId,
    ]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const company =
    useMemo(
      () =>
        (data.companies ?? [])
          .find(
            (item) =>
              String(item.id) ===
              companyId
          ),
      [
        data.companies,
        companyId,
      ]
    );

  const employees =
    useMemo(
      () =>
        (data.employees ?? [])
          .filter(
            (item) =>
              String(
                item.company_id
              ) === companyId
          ),
      [
        data.employees,
        companyId,
      ]
    );

  const companyDocuments =
    useMemo(
      () =>
        (
          data.companyDocuments ??
          []
        ).filter(
          (item) =>
            String(
              item.company_id ?? ""
            ) === companyId
        ),
      [
        data.companyDocuments,
        companyId,
      ]
    );

  const employeeIds =
    useMemo(
      () =>
        new Set(
          employees.map(
            (employee) =>
              String(employee.id)
          )
        ),
      [employees]
    );

  const employeeDocuments =
    useMemo(
      () =>
        (
          data.employeeDocuments ??
          []
        ).filter((item) =>
          employeeIds.has(
            String(
              item.employee_id ?? ""
            )
          )
        ),
      [
        data.employeeDocuments,
        employeeIds,
      ]
    );

  const permits =
    useMemo(
      () =>
        (data.permits ?? [])
          .filter(
            (item) =>
              String(
                item.company_id ?? ""
              ) === companyId
          ),
      [
        data.permits,
        companyId,
      ]
    );

  const entryLogs =
    useMemo(
      () =>
        (
          data.entryLogs ?? []
        ).filter((item) => {
          if (
            String(
              item.company_id ?? ""
            ) === companyId
          ) {
            return true;
          }

          return employeeIds.has(
            String(
              item.employee_id ?? ""
            )
          );
        }),
      [
        data.entryLogs,
        companyId,
        employeeIds,
      ]
    );

  const qrTokens =
    useMemo(
      () =>
        (
          data.qrTokens ?? []
        ).filter((item) => {
          if (
            String(
              item.company_id ?? ""
            ) === companyId
          ) {
            return true;
          }

          return employeeIds.has(
            String(
              item.employee_id ?? ""
            )
          );
        }),
      [
        data.qrTokens,
        companyId,
        employeeIds,
      ]
    );

  const insideCount =
    employees.filter(
      (employee) =>
        employee.is_inside === true
    ).length;

  const allowedCount =
    employees.filter(
      (employee) =>
        employee.entry_permission ===
        true
    ).length;

  const blockedCount =
    employees.filter(
      (employee) =>
        employee.entry_permission !==
          true ||
        Boolean(
          value(
            employee.access_blocked_note
          )
        )
    ).length;

  const activePermitCount =
    permits.filter(
      (permit) => {
        const now = Date.now();

        return (
          value(permit.status)
            .toUpperCase() ===
            "AKTIF" &&
          Number(
            permit.start_millis ?? 0
          ) <= now &&
          (
            !permit.end_millis ||
            Number(
              permit.end_millis
            ) >= now
          )
        );
      }
    ).length;

  function newEmployee() {
    setEmployeeForm({
      ...EMPTY_EMPLOYEE,
    });

    setEmployeeModalOpen(true);
  }

  function editEmployee(
    employee: Employee
  ) {
    setEmployeeForm({
      id:
        employee.id,

      fullName:
        value(
          employee.full_name
        ),

      tcNo:
        value(
          employee.tc_no
        ),

      position:
        value(
          employee.position
        ),

      phone:
        value(
          employee.phone
        ),

      entryCardNo:
        value(
          employee.entry_card_no
        ),

      sgkEntryOk:
        employee.sgk_entry_ok ===
        true,

      isgTrainingOk:
        employee.isg_training_ok ===
        true,

      healthReportOk:
        employee.health_report_ok ===
        true,

      mykCertificateOk:
        employee.myk_certificate_ok ===
        true,

      kkdDeliveryOk:
        employee.kkd_delivery_ok ===
        true,

      siteOrientationOk:
        employee.site_orientation_ok ===
        true,

      workAtHeightOk:
        employee.work_at_height_ok ===
        true,

      employeeStatus:
        value(
          employee.employee_status
        ) || "TASLAK",

      approvalStatus:
        value(
          employee.approval_status
        ) || "BEKLIYOR",

      entryPermission:
        employee.entry_permission ===
        true,

      accessBlockedNote:
        value(
          employee.access_blocked_note
        ),

      revisionNote:
        value(
          employee.revision_note
        ),
    });

    setEmployeeModalOpen(true);
  }

  async function saveEmployee() {
    if (!employeeForm.fullName.trim()) {
      alert(
        "Ad soyad zorunludur."
      );
      return;
    }

    try {
      setSaving(true);

      const editing =
        Boolean(employeeForm.id);

      const response =
        await fetch(
          "/api/admin/subcontractors/employees",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  employeeForm.id ||
                  undefined,

                firmId,
                companyId,

                fullName:
                  employeeForm.fullName,

                tcNo:
                  employeeForm.tcNo,

                position:
                  employeeForm.position,

                phone:
                  employeeForm.phone,

                entryCardNo:
                  employeeForm.entryCardNo,

                sgkEntryOk:
                  employeeForm.sgkEntryOk,

                isgTrainingOk:
                  employeeForm.isgTrainingOk,

                healthReportOk:
                  employeeForm.healthReportOk,

                mykCertificateOk:
                  employeeForm.mykCertificateOk,

                kkdDeliveryOk:
                  employeeForm.kkdDeliveryOk,

                siteOrientationOk:
                  employeeForm.siteOrientationOk,

                workAtHeightOk:
                  employeeForm.workAtHeightOk,

                employeeStatus:
                  employeeForm.employeeStatus,

                approvalStatus:
                  employeeForm.approvalStatus,

                entryPermission:
                  employeeForm.entryPermission,

                accessBlockedNote:
                  employeeForm.accessBlockedNote,

                revisionNote:
                  employeeForm.revisionNote,
              }),
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Çalışan kaydedilemedi."
        );
      }

      setEmployeeModalOpen(false);

      setEmployeeForm({
        ...EMPTY_EMPLOYEE,
      });

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Çalışan kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(
    employee: Employee
  ) {
    const ok =
      window.confirm(
        `${employee.full_name} çalışan kaydı silinsin mi?`
      );

    if (!ok) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/admin/subcontractors/employees",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  employee.id,

                firmId,
                companyId,
              }),
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Çalışan silinemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Çalışan silinemedi."
      );
    }
  }

async function uploadCompanyDocumentFile(
  file: File
) {
  try {
    setCompanyDocumentFileUploading(true);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "firmId",
      firmId
    );

    formData.append(
      "companyId",
      companyId
    );

    const response =
      await fetch(
        "/api/admin/subcontractors/company-documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    const json =
      await response.json();

    if (
      !response.ok ||
      json.success === false
    ) {
      throw new Error(
        json.error ||
          "Dosya yüklenemedi."
      );
    }

    const fileUrl =
      String(
        json.fileUrl ?? ""
      ).trim();

    if (!fileUrl) {
      throw new Error(
        "Dosya URL bilgisi alınamadı."
      );
    }

    setCompanyDocumentForm(
      (old) => ({
        ...old,
        fileUrl,
      })
    );

  } catch (e) {

    alert(
      e instanceof Error
        ? e.message
        : "Dosya yüklenemedi."
    );

  } finally {

    setCompanyDocumentFileUploading(
      false
    );
  }
}

function newCompanyDocument() {
  setCompanyDocumentForm({
    ...EMPTY_COMPANY_DOCUMENT,
  });

  setCompanyDocumentModalOpen(true);
}

function editCompanyDocument(
  document: CompanyDocument
) {
  let validUntil = "";

  if (document.valid_until_millis) {
    const date = new Date(
      Number(document.valid_until_millis)
    );

    if (!Number.isNaN(date.getTime())) {
      validUntil =
        date.toISOString().slice(0, 10);
    }
  }

  setCompanyDocumentForm({
    id: document.id,
    docKey: value(document.doc_key),
    docTitle: value(document.doc_title),

    isRequired:
      document.is_required !== false,

    status:
      value(document.status) || "EKSIK",

    fileUrl:
      value(document.file_url),

    validUntil,

    note:
      value(document.note),
  });

  setCompanyDocumentModalOpen(true);
}

async function saveCompanyDocument() {
  if (
    !companyDocumentForm.docTitle.trim()
  ) {
    alert("Evrak adı zorunludur.");
    return;
  }

  if (
    !companyDocumentForm.docKey.trim()
  ) {
    alert("Evrak kodu zorunludur.");
    return;
  }

  try {
    setSaving(true);

    const editing =
      Boolean(companyDocumentForm.id);

    let validUntilMillis:
      | number
      | null = null;

    if (companyDocumentForm.validUntil) {
      const date = new Date(
        `${companyDocumentForm.validUntil}T23:59:59`
      );

      if (!Number.isNaN(date.getTime())) {
        validUntilMillis =
          date.getTime();
      }
    }

    const response = await fetch(
      "/api/admin/subcontractors/company-documents",
      {
        method: editing
          ? "PATCH"
          : "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id:
            companyDocumentForm.id ||
            undefined,

          firmId,
          companyId,

          docKey:
            companyDocumentForm.docKey,

          docTitle:
            companyDocumentForm.docTitle,

          isRequired:
            companyDocumentForm.isRequired,

          status:
            companyDocumentForm.status,

          fileUrl:
            companyDocumentForm.fileUrl,

          validUntilMillis,

          note:
            companyDocumentForm.note,
        }),
      }
    );

    const json =
      await response.json();

    if (
      !response.ok ||
      json.success === false
    ) {
      throw new Error(
        json.error ||
          "Firma evrakı kaydedilemedi."
      );
    }

    setCompanyDocumentModalOpen(false);

    setCompanyDocumentForm({
      ...EMPTY_COMPANY_DOCUMENT,
    });

    await load();
  } catch (e) {
    alert(
      e instanceof Error
        ? e.message
        : "Firma evrakı kaydedilemedi."
    );
  } finally {
    setSaving(false);
  }
}

async function deleteCompanyDocument(
  document: CompanyDocument
) {
  const ok = window.confirm(
    `${
      document.doc_title ||
      "Firma evrakı"
    } silinsin mi?`
  );

  if (!ok) {
    return;
  }

  try {
    setSaving(true);

    const response = await fetch(
      "/api/admin/subcontractors/company-documents",
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: document.id,
          firmId,
          companyId,
        }),
      }
    );

    const json =
      await response.json();

    if (
      !response.ok ||
      json.success === false
    ) {
      throw new Error(
        json.error ||
          "Firma evrakı silinemedi."
      );
    }

    await load();
  } catch (e) {
    alert(
      e instanceof Error
        ? e.message
        : "Firma evrakı silinemedi."
    );
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          Taşeron firma bilgileri
          yükleniyor...
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <button
          className="back"
          onClick={() =>
            router.back()
          }
        >
          ← Geri
        </button>

        <div className="error">
          {error}
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="page">
        <button
          className="back"
          onClick={() =>
            router.back()
          }
        >
          ← Geri
        </button>

        <div className="error">
          Taşeron firma bulunamadı.
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="back"
          onClick={() =>
            router.back()
          }
        >
          ← Taşeron Yönetimi
        </button>

        <button
          className="refresh"
          onClick={() =>
            void load()
          }
        >
          Yenile
        </button>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            TAŞERON FİRMA YÖNETİMİ
          </div>

          <h1>
            {company.company_name}
          </h1>

          <p>
            Çalışan uygunluğu,
            saha giriş yetkileri,
            evraklar, iş izinleri
            ve saha hareketleri.
          </p>
        </div>

        <div className="heroStatus">
          <span
            className={
              company.is_active
                ? "dot active"
                : "dot"
            }
          />

          {company.is_active
            ? "Aktif Firma"
            : "Pasif Firma"}
        </div>
      </section>

      <section className="kpis">
        <Kpi
          title="Çalışan"
          value={employees.length}
          detail="Toplam kayıtlı çalışan"
        />

        <Kpi
          title="Sahada"
          value={insideCount}
          detail="Şu anda içeride"
        />

        <Kpi
          title="Giriş Yetkili"
          value={allowedCount}
          detail="Sahaya girebilir"
        />

        <Kpi
          title="Giriş Engelli"
          value={blockedCount}
          detail="Kontrol gerektiriyor"
        />

        <Kpi
          title="Aktif İş İzni"
          value={activePermitCount}
          detail={`${permits.length} toplam izin`}
        />

        <Kpi
          title="Evrak"
          value={
            companyDocuments.length +
            employeeDocuments.length
          }
          detail="Firma + çalışan evrakları"
        />
      </section>

      <section className="companyCard">
        <div className="sectionTitle">
          <div>
            <h2>
              Firma Bilgileri
            </h2>

            <p>
              Taşeron firmanın temel
              kayıt ve sözleşme
              bilgileri.
            </p>
          </div>
        </div>

        <div className="infoGrid">
          <Info
            label="Yetkili"
            value={
              company.authorized_person
            }
          />

          <Info
            label="Telefon"
            value={company.phone}
          />

          <Info
            label="E-posta"
            value={company.email}
          />

          <Info
            label="Vergi No"
            value={company.tax_no}
          />

          <Info
            label="İş Kapsamı"
            value={company.work_scope}
          />

          <Info
            label="Başvuru"
            value={labelStatus(
              company.application_status
            )}
          />

          <Info
            label="Onay"
            value={labelStatus(
              company.approval_status
            )}
          />

          <Info
            label="Sözleşme Başlangıç"
            value={formatDate(
              company.contract_start_millis
            )}
          />

          <Info
            label="Sözleşme Bitiş"
            value={formatDate(
              company.contract_end_millis
            )}
          />
        </div>
      </section>

      <section className="moduleGrid">
        <ModuleCard
          title="Çalışan Evrakları"
          count={
            employeeDocuments.length
          }
          description="SGK, eğitim, sağlık, MYK ve diğer çalışan belgeleri"
        />

        <ModuleCard
          title="Firma Evrakları"
          count={
            companyDocuments.length
          }
          description="Firma bazlı zorunlu ve süreli belgeler"
        />

        <ModuleCard
          title="İş İzinleri"
          count={permits.length}
          description="Aktif ve geçmiş çalışma izinları"
        />

        <ModuleCard
          title="QR / Saha Girişleri"
          count={
            qrTokens.length +
            entryLogs.length
          }
          description="QR kayıtları ve saha hareket geçmişi"
        />
      </section>

<section className="employeeSection">
  <div className="sectionTitle">
    <div>
      <h2>Firma Evrakları</h2>

      <p>
        Taşeron firmaya ait zorunlu,
        süreli ve diğer belgeleri yönetin.
      </p>
    </div>

    <button
      className="primary"
      onClick={newCompanyDocument}
    >
      + Firma Evrakı Ekle
    </button>
  </div>

  {companyDocuments.length === 0 ? (
    <div className="empty">
      Bu taşeron firmaya ait firma
      evrakı bulunmuyor.
    </div>
  ) : (
    <div className="employeeList">
      {companyDocuments.map(
        (document) => {
          const status =
            value(document.status)
              .toUpperCase() ||
            "EKSIK";

          const expired =
            Boolean(
              document.valid_until_millis
            ) &&
            Number(
              document.valid_until_millis
            ) < Date.now();

          const effectiveStatus =
            expired
              ? "SURESI_GECMIS"
              : status;

          return (
            <article
              className="employeeCard"
              key={document.id}
            >
              <div className="employeeTop">
                <div className="avatar">
                  📄
                </div>

                <div className="employeeIdentity">
                  <h3>
                    {document.doc_title ||
                      "Adsız Evrak"}
                  </h3>

                  <p>
                    Evrak Kodu:{" "}
                    {document.doc_key ||
                      "-"}
                  </p>
                </div>

                <span
                  className={
                    effectiveStatus ===
                    "TAM"
                      ? "permission allowed"
                      : "permission blocked"
                  }
                >
                  {labelStatus(
                    effectiveStatus
                  )}
                </span>
              </div>

              <div className="employeeMeta">
                <span>
                  Tür:{" "}
                  {document.is_required !==
                  false
                    ? "Zorunlu"
                    : "İsteğe Bağlı"}
                </span>

                <span>
                  Geçerlilik:{" "}
                  {formatDate(
                    document.valid_until_millis
                  )}
                </span>

                <span>
                  Kaynak:{" "}
                  {document.source ||
                    "-"}
                </span>
              </div>

              {value(document.note) && (
                <div className="warning">
                  <strong>Not:</strong>{" "}
                  {document.note}
                </div>
              )}

              {document.file_url ? (
                <div
                  className="employeeActions"
                  style={{
                    justifyContent:
                      "flex-start",
                  }}
                >
                  <a
                    className="documentLink"
                    href={
                      document.file_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Evrakı Görüntüle
                  </a>
                </div>
              ) : (
                <div className="warning">
                  Bu evraka henüz dosya
                  yüklenmemiş.
                </div>
              )}

              <div className="employeeActions">
                <button
                  className="outline"
                  onClick={() =>
                    editCompanyDocument(
                      document
                    )
                  }
                >
                  Düzenle
                </button>

                <button
                  className="danger"
                  disabled={saving}
                  onClick={() =>
                    void deleteCompanyDocument(
                      document
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </article>
          );
        }
      )}
    </div>
  )}
</section>

      <section className="employeeSection">
        <div className="sectionTitle">
          <div>
            <h2>
              Taşeron Çalışanları
            </h2>

            <p>
              Personel uygunluğu ve
              saha giriş durumlarını
              yönetin.
            </p>
          </div>

          <button
            className="primary"
            onClick={newEmployee}
          >
            + Yeni Çalışan
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="empty">
            Bu taşeron firmaya bağlı
            çalışan bulunmuyor.
          </div>
        ) : (
          <div className="employeeList">
            {employees.map(
              (employee) => {
                const compliance =
                  complianceCount(
                    employee
                  );

                return (
                  <article
                    className="employeeCard"
                    key={employee.id}
                  >
                    <div className="employeeTop">
                      <div className="avatar">
                        {employee.full_name
                          ?.trim()
                          .charAt(0)
                          .toLocaleUpperCase(
                            "tr-TR"
                          ) || "Ç"}
                      </div>

                      <div className="employeeIdentity">
                        <h3>
                          {
                            employee.full_name
                          }
                        </h3>

                        <p>
                          {employee.position ||
                            "Görev belirtilmemiş"}
                        </p>
                      </div>

                      <span
                        className={
                          employee.entry_permission
                            ? "permission allowed"
                            : "permission blocked"
                        }
                      >
                        {employee.entry_permission
                          ? "Giriş Yetkili"
                          : "Giriş Engelli"}
                      </span>
                    </div>

                    <div className="employeeMeta">
                      <span>
                        TC:{" "}
                        {employee.tc_no ||
                          "-"}
                      </span>

                      <span>
                        Telefon:{" "}
                        {employee.phone ||
                          "-"}
                      </span>

                      <span>
                        Kart:{" "}
                        {employee.entry_card_no ||
                          "-"}
                      </span>

                      <span>
                        Durum:{" "}
                        {labelStatus(
                          employee.employee_status
                        )}
                      </span>
                    </div>

                    <div className="complianceHeader">
                      <strong>
                        Uygunluk
                      </strong>

                      <span>
                        {compliance}/7
                      </span>
                    </div>

                    <div className="checks">
                      <Check
                        label="SGK"
                        ok={
                          employee.sgk_entry_ok ===
                          true
                        }
                      />

                      <Check
                        label="İSG Eğitimi"
                        ok={
                          employee.isg_training_ok ===
                          true
                        }
                      />

                      <Check
                        label="Sağlık"
                        ok={
                          employee.health_report_ok ===
                          true
                        }
                      />

                      <Check
                        label="MYK"
                        ok={
                          employee.myk_certificate_ok ===
                          true
                        }
                      />

                      <Check
                        label="KKD"
                        ok={
                          employee.kkd_delivery_ok ===
                          true
                        }
                      />

                      <Check
                        label="Oryantasyon"
                        ok={
                          employee.site_orientation_ok ===
                          true
                        }
                      />

                      <Check
                        label="Yüksekte Çalışma"
                        ok={
                          employee.work_at_height_ok ===
                          true
                        }
                      />
                    </div>

                    {value(
                      employee.access_blocked_note
                    ) && (
                      <div className="warning">
                        <strong>
                          Giriş engeli:
                        </strong>{" "}
                        {
                          employee.access_blocked_note
                        }
                      </div>
                    )}

                    <div className="employeeActions">
                      <button
                        className="outline"
                        onClick={() =>
                          editEmployee(
                            employee
                          )
                        }
                      >
                        Düzenle
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          void deleteEmployee(
                            employee
                          )
                        }
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>


{companyDocumentModalOpen && (
  <div
    className="modalBackdrop"
    onMouseDown={() =>
      setCompanyDocumentModalOpen(false)
    }
  >
    <div
      className="modal"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="modalHeader">
        <div>
          <h2>
            {companyDocumentForm.id
              ? "Firma Evrakını Düzenle"
              : "Yeni Firma Evrakı"}
          </h2>

          <p>
            {company.company_name}
          </p>
        </div>

        <button
          className="close"
          onClick={() =>
            setCompanyDocumentModalOpen(
              false
            )
          }
        >
          ×
        </button>
      </div>

      <div className="formGrid">
        <Field
          label="Evrak Adı *"
          value={
            companyDocumentForm.docTitle
          }
          onChange={(v) =>
            setCompanyDocumentForm(
              (old) => ({
                ...old,
                docTitle: v,
              })
            )
          }
        />

        <Field
          label="Evrak Kodu *"
          value={
            companyDocumentForm.docKey
          }
          onChange={(v) =>
            setCompanyDocumentForm(
              (old) => ({
                ...old,
                docKey:
                  v
                    .toLocaleUpperCase(
                      "tr-TR"
                    )
                    .replace(
                      /\s+/g,
                      "_"
                    ),
              })
            )
          }
        />

        <SelectField
          label="Evrak Durumu"
          value={
            companyDocumentForm.status
          }
          options={[
            "EKSIK",
            "TAM",
            "SURESI_GECMIS",
            "REVIZE_ISTENDI",
            "REDDEDILDI",
          ]}
          onChange={(v) =>
            setCompanyDocumentForm(
              (old) => ({
                ...old,
                status: v,
              })
            )
          }
        />

        <label className="field">
          <span>
            Geçerlilik Tarihi
          </span>

          <input
            type="date"
            value={
              companyDocumentForm.validUntil
            }
            onChange={(event) =>
              setCompanyDocumentForm(
                (old) => ({
                  ...old,
                  validUntil:
                    event.target.value,
                })
              )
            }
          />
        </label>

       <label className="field">
  <span>Firma Evrakı Dosyası</span>

  <input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
    disabled={
      companyDocumentFileUploading
    }
    onChange={(event) => {
      const file =
        event.target.files?.[0];

      if (file) {
        void uploadCompanyDocumentFile(
          file
        );
      }

      event.target.value = "";
    }}
  />

  {companyDocumentFileUploading && (
    <small>
      Dosya yükleniyor...
    </small>
  )}

  {!companyDocumentFileUploading &&
    companyDocumentForm.fileUrl && (
      <div className="uploadedFileBox">
        <span>
          ✓ Dosya yüklendi
        </span>

        <a
          href={
            companyDocumentForm.fileUrl
          }
          target="_blank"
          rel="noreferrer"
        >
          Dosyayı Görüntüle
        </a>
      </div>
    )}
</label>

        <Field
          label="Not / Açıklama"
          value={
            companyDocumentForm.note
          }
          onChange={(v) =>
            setCompanyDocumentForm(
              (old) => ({
                ...old,
                note: v,
              })
            )
          }
        />
      </div>

      <div className="formSection">
        <Toggle
          label="Zorunlu Evrak"
          checked={
            companyDocumentForm.isRequired
          }
          onChange={(v) =>
            setCompanyDocumentForm(
              (old) => ({
                ...old,
                isRequired: v,
              })
            )
          }
        />
      </div>

      <div className="modalActions">
        <button
          className="outline"
          disabled={saving}
          onClick={() =>
            setCompanyDocumentModalOpen(
              false
            )
          }
        >
          Vazgeç
        </button>

        <button
          className="primary"
          disabled={
  saving ||
  companyDocumentFileUploading
}
          onClick={() =>
            void saveCompanyDocument()
          }
        >
         {companyDocumentFileUploading
  ? "Dosya Yükleniyor..."
  : saving
    ? "Kaydediliyor..."
    : companyDocumentForm.id
      ? "Değişiklikleri Kaydet"
      : "Evrakı Kaydet"}
        </button>
      </div>
    </div>
  </div>
)}

      {employeeModalOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            setEmployeeModalOpen(
              false
            )
          }
        >
          <div
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modalHeader">
              <div>
                <h2>
                  {employeeForm.id
                    ? "Çalışanı Düzenle"
                    : "Yeni Çalışan"}
                </h2>

                <p>
                  {company.company_name}
                </p>
              </div>

              <button
                className="close"
                onClick={() =>
                  setEmployeeModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <Field
                label="Ad Soyad *"
                value={
                  employeeForm.fullName
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      fullName: v,
                    })
                  )
                }
              />

              <Field
                label="T.C. Kimlik No"
                value={
                  employeeForm.tcNo
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      tcNo: v,
                    })
                  )
                }
              />

              <Field
                label="Görev / Pozisyon"
                value={
                  employeeForm.position
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      position: v,
                    })
                  )
                }
              />

              <Field
                label="Telefon"
                value={
                  employeeForm.phone
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      phone: v,
                    })
                  )
                }
              />

              <Field
                label="Giriş Kart / QR No"
                value={
                  employeeForm.entryCardNo
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      entryCardNo: v,
                    })
                  )
                }
              />

              <SelectField
                label="Çalışan Durumu"
                value={
                  employeeForm.employeeStatus
                }
                options={[
                  "TASLAK",
                  "EVRAK_BEKLIYOR",
                  "INCELEMEDE",
                  "REVIZE_ISTENDI",
                  "ONAYLANDI",
                  "SAHAYA_GIREBILIR",
                  "GIRIS_ENGELLI",
                  "IS_TEN_AYRILDI",
                ]}
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      employeeStatus: v,
                    })
                  )
                }
              />

              <SelectField
                label="Onay Durumu"
                value={
                  employeeForm.approvalStatus
                }
                options={[
                  "BEKLIYOR",
                  "ONAYLANDI",
                  "REDDEDILDI",
                ]}
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      approvalStatus: v,
                    })
                  )
                }
              />
            </div>

            <div className="formSection">
              <h3>
                Çalışan Uygunluk
                Kontrolleri
              </h3>

              <div className="toggleGrid">
                <Toggle
                  label="SGK Girişi"
                  checked={
                    employeeForm.sgkEntryOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        sgkEntryOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="İSG Eğitimi"
                  checked={
                    employeeForm.isgTrainingOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        isgTrainingOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="Sağlık Raporu"
                  checked={
                    employeeForm.healthReportOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        healthReportOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="MYK Belgesi"
                  checked={
                    employeeForm.mykCertificateOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        mykCertificateOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="KKD Teslimi"
                  checked={
                    employeeForm.kkdDeliveryOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        kkdDeliveryOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="Saha Oryantasyonu"
                  checked={
                    employeeForm.siteOrientationOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        siteOrientationOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="Yüksekte Çalışma"
                  checked={
                    employeeForm.workAtHeightOk
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        workAtHeightOk: v,
                      })
                    )
                  }
                />

                <Toggle
                  label="Saha Giriş Yetkisi"
                  checked={
                    employeeForm.entryPermission
                  }
                  onChange={(v) =>
                    setEmployeeForm(
                      (old) => ({
                        ...old,
                        entryPermission: v,
                      })
                    )
                  }
                />
              </div>
            </div>

            <div className="formGrid">
              <Field
                label="Giriş Engel Açıklaması"
                value={
                  employeeForm.accessBlockedNote
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      accessBlockedNote:
                        v,
                    })
                  )
                }
              />

              <Field
                label="Revizyon Notu"
                value={
                  employeeForm.revisionNote
                }
                onChange={(v) =>
                  setEmployeeForm(
                    (old) => ({
                      ...old,
                      revisionNote: v,
                    })
                  )
                }
              />
            </div>

            <div className="modalActions">
              <button
                className="outline"
                disabled={saving}
                onClick={() =>
                  setEmployeeModalOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primary"
                disabled={saving}
                onClick={() =>
                  void saveEmployee()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : employeeForm.id
                    ? "Değişiklikleri Kaydet"
                    : "Çalışanı Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="kpi">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Info({
  label,
  value: itemValue,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>
        {value(itemValue) || "-"}
      </strong>
    </div>
  );
}

function ModuleCard({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <div className="moduleCard">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <strong>{count}</strong>
    </div>
  );
}

function Check({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <span
      className={
        ok
          ? "check ok"
          : "check missing"
      }
    >
      {ok ? "✓" : "×"} {label}
    </span>
  );
}

function Field({
  label,
  value: fieldValue,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        value={fieldValue}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

function SelectField({
  label,
  value: fieldValue,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <select
        value={fieldValue}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              value={option}
              key={option}
            >
              {labelStatus(option)}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
      />

      <span>{label}</span>
    </label>
  );
}

const styles = `
  .page {
    min-height: 100vh;
    padding: 28px;
    background: #f5f7fb;
    color: #172033;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .back,
  .refresh,
  .outline,
  .danger {
    border: 1px solid #d9e0ea;
    background: #ffffff;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 700;
  }

  .back,
  .refresh,
  .outline {
    color: #344054;
  }

  .danger {
    color: #b42318;
    border-color: #f2c7c3;
    background: #fff8f7;
  }

  .primary {
    border: 0;
    border-radius: 12px;
    padding: 11px 16px;
    background: #172033;
    color: white;
    font-weight: 800;
  }

  .primary:disabled,
  .outline:disabled {
    opacity: .6;
    cursor: default;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding: 30px;
    border-radius: 24px;
    color: white;
    background:
      linear-gradient(
        135deg,
        #172033 0%,
        #28364f 100%
      );
    box-shadow:
      0 16px 40px rgba(20, 32, 55, .12);
  }

  .eyebrow {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .12em;
    opacity: .7;
  }

  .hero h1 {
    margin: 0;
    font-size: 30px;
  }

  .hero p {
    max-width: 700px;
    margin: 10px 0 0;
    color: #dbe4f2;
    line-height: 1.6;
  }

  .heroStatus {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    padding: 9px 12px;
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 999px;
    background: rgba(255,255,255,.08);
    font-size: 13px;
    font-weight: 800;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #98a2b3;
  }

  .dot.active {
    background: #6ce9a6;
  }

  .kpis {
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .kpi,
  .companyCard,
  .employeeSection,
  .moduleCard {
    border: 1px solid #e4e9f1;
    background: white;
    box-shadow:
      0 8px 24px rgba(20, 32, 55, .05);
  }

  .kpi {
    min-height: 125px;
    padding: 18px;
    border-radius: 18px;
  }

  .kpi span {
    display: block;
    color: #667085;
    font-size: 13px;
    font-weight: 700;
  }

  .kpi strong {
    display: block;
    margin: 9px 0 5px;
    font-size: 28px;
  }

  .kpi small {
    color: #98a2b3;
  }

  .companyCard,
  .employeeSection {
    margin-top: 16px;
    padding: 22px;
    border-radius: 20px;
  }

  .sectionTitle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 18px;
  }

  .sectionTitle h2 {
    margin: 0;
    font-size: 19px;
  }

  .sectionTitle p {
    margin: 5px 0 0;
    color: #667085;
    font-size: 13px;
  }

  .infoGrid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .info {
    min-height: 76px;
    padding: 14px;
    border: 1px solid #edf0f5;
    border-radius: 14px;
    background: #fafbfc;
  }

  .info span {
    display: block;
    margin-bottom: 6px;
    color: #667085;
    font-size: 12px;
    font-weight: 700;
  }

  .info strong {
    font-size: 14px;
  }

  .moduleGrid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .moduleCard {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    min-height: 120px;
    padding: 18px;
    border-radius: 18px;
  }

  .moduleCard h3 {
    margin: 0;
    font-size: 15px;
  }

  .moduleCard p {
    margin: 8px 0 0;
    color: #667085;
    font-size: 12px;
    line-height: 1.5;
  }

  .moduleCard > strong {
    font-size: 28px;
  }

  .employeeList {
    display: grid;
    gap: 12px;
  }

  .employeeCard {
    padding: 18px;
    border: 1px solid #e6eaf0;
    border-radius: 18px;
    background: #fff;
  }

  .employeeTop {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 14px;
    background: #eef2f7;
    color: #172033;
    font-weight: 900;
  }

  .employeeIdentity {
    flex: 1;
  }

  .employeeIdentity h3 {
    margin: 0;
    font-size: 16px;
  }

  .employeeIdentity p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 13px;
  }

  .permission {
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }

  .permission.allowed {
    color: #067647;
    background: #ecfdf3;
  }

  .permission.blocked {
    color: #b42318;
    background: #fef3f2;
  }

  .employeeMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: 14px;
    color: #667085;
    font-size: 12px;
  }

  .complianceHeader {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    font-size: 13px;
  }

  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 9px;
  }

  .check {
    padding: 6px 9px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 800;
  }

  .check.ok {
    color: #067647;
    background: #ecfdf3;
  }

  .check.missing {
    color: #b42318;
    background: #fef3f2;
  }

  .warning {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #b54708;
    background: #fffaeb;
    font-size: 12px;
  }

  .employeeActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #edf0f5;
  }

.documentLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border: 1px solid #d0d5dd;
  border-radius: 12px;
  background: #ffffff;
  color: #344054;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.documentLink:hover {
  background: #f8fafc;
}

.uploadedFileBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid #abefc6;
  border-radius: 10px;
  background: #ecfdf3;
  color: #067647;
  font-size: 12px;
  font-weight: 800;
}

.uploadedFileBox a {
  color: #175cd3;
  text-decoration: none;
  font-weight: 800;
}

.uploadedFileBox a:hover {
  text-decoration: underline;
}

.field small {
  color: #667085;
  font-size: 12px;
}

  .empty,
  .loading,
  .error {
    padding: 28px;
    border: 1px dashed #d0d5dd;
    border-radius: 16px;
    background: white;
    text-align: center;
    color: #667085;
  }

  .error {
    color: #b42318;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(15, 23, 42, .52);
  }

  .modal {
    width: min(900px, 100%);
    max-height: 92vh;
    overflow: auto;
    padding: 22px;
    border-radius: 22px;
    background: white;
    box-shadow:
      0 30px 80px rgba(15, 23, 42, .24);
  }

  .modalHeader {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .modalHeader h2 {
    margin: 0;
  }

  .modalHeader p {
    margin: 5px 0 0;
    color: #667085;
  }

  .close {
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 10px;
    background: #f2f4f7;
    font-size: 22px;
  }

  .formGrid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .field {
    display: grid;
    gap: 7px;
  }

  .field span {
    color: #475467;
    font-size: 12px;
    font-weight: 800;
  }

  .field input,
  .field select {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 11px;
    background: white;
    color: #172033;
    outline: none;
  }

  .field input:focus,
  .field select:focus {
    border-color: #667085;
  }

  .formSection {
    margin: 18px 0;
    padding: 16px;
    border: 1px solid #e4e7ec;
    border-radius: 15px;
    background: #fafafa;
  }

  .formSection h3 {
    margin: 0 0 12px;
    font-size: 14px;
  }

  .toggleGrid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    background: white;
    font-size: 12px;
    font-weight: 700;
  }

  .modalActions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 20px;
  }

  @media (max-width: 1200px) {
    .kpis {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .moduleGrid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .page {
      padding: 14px;
    }

    .hero {
      flex-direction: column;
      padding: 22px;
    }

    .kpis,
    .moduleGrid,
    .infoGrid,
    .formGrid,
    .toggleGrid {
      grid-template-columns: 1fr;
    }

    .sectionTitle,
    .employeeTop {
      align-items: flex-start;
    }

    .sectionTitle {
      flex-direction: column;
    }

    .employeeTop {
      flex-wrap: wrap;
    }

    .permission {
      margin-left: 56px;
    }
  }
`;