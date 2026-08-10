"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  danger_class?: string | null;
  sector?: string | null;
  nace_code?: string | null;
  employee_count?: number | null;
};

type DoraEmployee = {
  id: string;
  firm_id: string;

  sync_key?: string | null;
  app_local_id?: number | null;
  app_firm_local_id?: number | null;

  full_name: string;
  tc_no?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  special_group?: string | null;
  is_active?: boolean | null;
  note?: string | null;

  is_deleted?: boolean | null;
  source?: string | null;
  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type DoraFirmResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm;
};

type DoraEmployeesResponse = {
  success?: boolean;
  error?: string;
  employees?: DoraEmployee[];
  employee?: DoraEmployee;

  inserted?: number;
  skipped?: number;
  errors?: string[];
  message?: string;
};

type DoraEmployeeForm = {
  id: string;
  fullName: string;
  tcNo: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  specialGroup: string;
  isActive: boolean;
  note: string;
};

const EMPTY_FORM: DoraEmployeeForm = {
  id: "",
  fullName: "",
  tcNo: "",
  position: "",
  department: "",
  phone: "",
  email: "",
  specialGroup: "",
  isActive: true,
  note: "",
};

function value(v: unknown): string {
  return String(v ?? "").trim();
}

function statusLabel(
  input?: string | null
): string {
  const normalized =
    value(input);

  if (!normalized) {
    return "-";
  }

  return normalized
    .replaceAll("_", " ")
    .toLocaleLowerCase("tr-TR")
    .replace(
      /(^|\s)\S/g,
      (char) =>
        char.toLocaleUpperCase("tr-TR")
    );
}

export default function DoraEmployeesPage() {
  const router = useRouter();
  const params = useParams();

  const firmId =
    value(params.firmId);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [firm, setFirm] =
    useState<DoraFirm | null>(
      null
    );

  const [employees, setEmployees] =
    useState<DoraEmployee[]>([]);

  const [search, setSearch] =
    useState("");

  const [bulkImporting, setBulkImporting] =
    useState(false);

  const [bulkResult, setBulkResult] =
    useState("");

  const bulkFileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [modalOpen, setModalOpen] =
    useState(false);

  const [form, setForm] =
    useState<DoraEmployeeForm>(
      EMPTY_FORM
    );

  const load = useCallback(
    async () => {
      if (!firmId) {
        setError(
          "DORA firma ID bulunamadı."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          firmResponse,
          employeesResponse,
        ] = await Promise.all([
          fetch(
            `/api/dora/firms?id=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `/api/dora/employees?firmId=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const firmJson =
          (await firmResponse.json()) as DoraFirmResponse;

        const employeesJson =
          (await employeesResponse.json()) as DoraEmployeesResponse;

        if (
          !firmResponse.ok ||
          firmJson.success === false
        ) {
          throw new Error(
            firmJson.error ||
              "DORA firma bilgileri alınamadı."
          );
        }

        if (
          !employeesResponse.ok ||
          employeesJson.success === false
        ) {
          throw new Error(
            employeesJson.error ||
              "DORA çalışanları alınamadı."
          );
        }

        setFirm(
          firmJson.firm ?? null
        );

        setEmployees(
          Array.isArray(
            employeesJson.employees
          )
            ? employeesJson.employees
            : []
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "DORA çalışan verileri alınamadı."
        );
      } finally {
        setLoading(false);
      }
    },
    [firmId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            employee.is_active !== false
        ).length,
      [employees]
    );

  const passiveCount =
    employees.length -
    activeCount;

  const specialGroupCount =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            value(
              employee.special_group
            ).length > 0
        ).length,
      [employees]
    );

  const filteredEmployees =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!q) {
        return employees;
      }

      return employees.filter(
        (employee) => {
          const haystack = [
            employee.full_name,
            employee.tc_no,
            employee.position,
            employee.department,
            employee.phone,
            employee.email,
            employee.special_group,
            employee.note,
          ]
            .map(value)
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          return haystack.includes(q);
        }
      );
    }, [employees, search]);

  function newEmployee() {
    setForm({
      ...EMPTY_FORM,
    });

    setModalOpen(true);
  }

  function editEmployee(
    employee: DoraEmployee
  ) {
    setForm({
      id: employee.id,
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
      department:
        value(
          employee.department
        ),
      phone:
        value(
          employee.phone
        ),
      email:
        value(
          employee.email
        ),
      specialGroup:
        value(
          employee.special_group
        ),
      isActive:
        employee.is_active !== false,
      note:
        value(
          employee.note
        ),
    });

    setModalOpen(true);
  }

  async function saveEmployee() {
    if (!form.fullName.trim()) {
      alert(
        "Ad soyad zorunludur."
      );
      return;
    }

    try {
      setSaving(true);

      const editing =
        Boolean(form.id);

      const response =
        await fetch(
          "/api/dora/employees",
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
                  form.id ||
                  undefined,

                firmId,

                fullName:
                  form.fullName,

                tcNo:
                  form.tcNo,

                position:
                  form.position,

                department:
                  form.department,

                phone:
                  form.phone,

                email:
                  form.email,

                specialGroup:
                  form.specialGroup,

                isActive:
                  form.isActive,

                note:
                  form.note,
              }),
          }
        );

      const json =
        (await response.json()) as DoraEmployeesResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA çalışanı kaydedilemedi."
        );
      }

      setModalOpen(false);

      setForm({
        ...EMPTY_FORM,
      });

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA çalışanı kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleEmployee(
    employee: DoraEmployee
  ) {
    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/dora/employees",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  employee.id,

                firmId,

                isActive:
                  employee.is_active ===
                  false,
              }),
          }
        );

      const json =
        (await response.json()) as DoraEmployeesResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Çalışan durumu güncellenemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Çalışan durumu güncellenemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(
    employee: DoraEmployee
  ) {
    const ok =
      window.confirm(
        `${employee.full_name} DORA çalışan kaydı silinsin mi?\n\nBu işlem yalnızca DORA çalışan havuzunu etkiler.`
      );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/dora/employees",
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
              }),
          }
        );

      const json =
        (await response.json()) as DoraEmployeesResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA çalışanı silinemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA çalışanı silinemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function importExcel(
    file: File
  ) {
    try {
      setBulkImporting(true);
      setBulkResult("");

      const formData =
        new FormData();

      formData.append(
        "firmId",
        firmId
      );

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/dora/employees/bulk",
          {
            method: "POST",
            body: formData,
          }
        );

      const json =
        (await response.json()) as DoraEmployeesResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Excel toplu aktarımı başarısız."
        );
      }

      const inserted =
        Number(
          json.inserted ?? 0
        );

      const skipped =
        Number(
          json.skipped ?? 0
        );

      const errorCount =
        Array.isArray(
          json.errors
        )
          ? json.errors.length
          : 0;

      setBulkResult(
        `${inserted} çalışan aktarıldı • ${skipped} satır atlandı${
          errorCount > 0
            ? ` • ${errorCount} satır hatalı`
            : ""
        }`
      );

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Excel toplu aktarımı başarısız."
      );
    } finally {
      setBulkImporting(false);

      if (
        bulkFileInputRef.current
      ) {
        bulkFileInputRef.current.value =
          "";
      }
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          DORA çalışan merkezi
          yükleniyor...
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error || !firm) {
    return (
      <main className="page">
        <div className="topbar">
          <button
            className="back"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}`
              )
            }
          >
            ← DORA
          </button>
        </div>

        <div className="error">
          {error ||
            "DORA firma bilgisi bulunamadı."}
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
            router.push(
              `/admin/dora/${firmId}`
            )
          }
        >
          ← DORA Çalışma Alanı
        </button>

        <button
          className="refresh"
          disabled={loading}
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
            DORA • BAĞIMSIZ ÇALIŞAN HAVUZU
          </div>

          <h1>
            DORA Çalışanları
          </h1>

          <p>
            {firm.firm_name} için
            yalnızca DORA içerisinde
            kullanılacak çalışan
            kayıtlarını yönetin.
          </p>

          <div className="heroMeta">
            <span>
              Firma: {firm.firm_name}
            </span>

            <span>
              Ana Çalışanlar modülünden bağımsız
            </span>
          </div>
        </div>

        <div className="heroButtons">
          <a
            className="heroSecondary"
            href="/templates/dora-calisan-toplu-aktarim.xlsx"
            download
          >
            Excel Şablonu
          </a>

          <button
            className="heroSecondary"
            disabled={bulkImporting}
            onClick={() =>
              bulkFileInputRef.current?.click()
            }
          >
            {bulkImporting
              ? "Aktarılıyor..."
              : "Excel'den Toplu Aktar"}
          </button>

          <button
            className="heroPrimary"
            onClick={newEmployee}
          >
            + Yeni DORA Çalışanı
          </button>

          <input
            ref={bulkFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{
              display: "none",
            }}
            onChange={(event) => {
              const file =
                event.target.files?.[0];

              if (file) {
                void importExcel(
                  file
                );
              }
            }}
          />
        </div>
      </section>

      <section className="kpis">
        <Kpi
          title="Toplam"
          value={employees.length}
          detail="DORA çalışan kaydı"
        />

        <Kpi
          title="Aktif"
          value={activeCount}
          detail="Aktif çalışan"
        />

        <Kpi
          title="Pasif"
          value={passiveCount}
          detail="Pasif çalışan"
        />

        <Kpi
          title="Özel Grup"
          value={specialGroupCount}
          detail="Özel grup bilgisi bulunan"
        />
      </section>

      {bulkResult && (
        <div className="bulkResult">
          {bulkResult}
        </div>
      )}

      <section className="section">
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              ÇALIŞAN MERKEZİ
            </div>

            <h2>
              DORA çalışan havuzu
            </h2>

            <p>
              Bu kişiler ileride DORA
              kurul, destek ekibi,
              eğitim, KKD ve doküman
              üretimlerinde seçilebilir.
            </p>
          </div>

          <div className="sectionActions">
            <a
              className="outline linkButton"
              href="/templates/dora-calisan-toplu-aktarim.xlsx"
              download
            >
              Excel Şablonu
            </a>

            <button
              className="outline"
              disabled={bulkImporting}
              onClick={() =>
                bulkFileInputRef.current?.click()
              }
            >
              Excel'den Aktar
            </button>

            <button
              className="primary"
              onClick={newEmployee}
            >
              + Yeni Çalışan
            </button>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Ad, T.C., pozisyon, departman veya özel grup ara..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <div className="resultCount">
            {filteredEmployees.length}
            {" "}kayıt
          </div>
        </div>

        {filteredEmployees.length ===
        0 ? (
          <div className="empty">
            <div className="emptyMark">
              D
            </div>

            <h3>
              DORA çalışanı bulunamadı
            </h3>

            <p>
              İlk çalışanınızı
              oluşturarak bağımsız
              çalışan havuzunu
              başlatabilirsiniz.
            </p>

            <button
              className="primary"
              onClick={newEmployee}
            >
              İlk Çalışanı Oluştur
            </button>
          </div>
        ) : (
          <div className="employeeGrid">
            {filteredEmployees.map(
              (employee) => (
                <article
                  className="employeeCard"
                  key={employee.id}
                >
                  <div className="employeeTop">
                    <div className="avatar">
                      {value(
                        employee.full_name
                      )
                        .slice(0, 1)
                        .toLocaleUpperCase(
                          "tr-TR"
                        ) || "D"}
                    </div>

                    <div className="identity">
                      <h3>
                        {employee.full_name}
                      </h3>

                      <p>
                        {employee.position ||
                          "Pozisyon belirtilmemiş"}
                      </p>
                    </div>

                    <span
                      className={
                        employee.is_active !==
                        false
                          ? "state active"
                          : "state passive"
                      }
                    >
                      {employee.is_active !==
                      false
                        ? "Aktif"
                        : "Pasif"}
                    </span>
                  </div>

                  <div className="metaGrid">
                    <Meta
                      label="T.C."
                      value={
                        employee.tc_no ||
                        "-"
                      }
                    />

                    <Meta
                      label="Departman"
                      value={
                        employee.department ||
                        "-"
                      }
                    />

                    <Meta
                      label="Telefon"
                      value={
                        employee.phone ||
                        "-"
                      }
                    />

                    <Meta
                      label="E-posta"
                      value={
                        employee.email ||
                        "-"
                      }
                    />
                  </div>

                  {employee.special_group && (
                    <div className="special">
                      <span>
                        Özel Grup
                      </span>

                      <strong>
                        {statusLabel(
                          employee.special_group
                        )}
                      </strong>
                    </div>
                  )}

                  {employee.note && (
                    <div className="note">
                      {employee.note}
                    </div>
                  )}

                  <div className="actions">
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
                      className="outline"
                      disabled={saving}
                      onClick={() =>
                        void toggleEmployee(
                          employee
                        )
                      }
                    >
                      {employee.is_active !==
                      false
                        ? "Pasif Yap"
                        : "Aktif Yap"}
                    </button>

                    <button
                      className="dangerBtn"
                      disabled={saving}
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
              )
            )}
          </div>
        )}
      </section>

      <section className="independence">
        <div className="independenceMark">
          D
        </div>

        <div>
          <strong>
            DORA çalışanları bağımsızdır.
          </strong>

          <p>
            Bu ekranda oluşturulan
            kayıtlar yalnızca
            dora_employees veri alanında
            tutulur. Ana D-SEC Çalışanlar,
            Eğitim, Sağlık veya diğer
            modüllere otomatik kayıt
            yapılmaz.
          </p>
        </div>
      </section>

      {modalOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            !saving &&
            setModalOpen(false)
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
                <div className="sectionEyebrow">
                  DORA ÇALIŞAN PROFİLİ
                </div>

                <h2>
                  {form.id
                    ? "DORA Çalışanını Düzenle"
                    : "Yeni DORA Çalışanı"}
                </h2>

                <p>
                  Bu kayıt yalnızca
                  DORA içinde
                  kullanılacaktır.
                </p>
              </div>

              <button
                className="close"
                disabled={saving}
                onClick={() =>
                  setModalOpen(false)
                }
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <Field
                label="Ad Soyad *"
                value={form.fullName}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      fullName: v,
                    })
                  )
                }
              />

              <Field
                label="T.C. Kimlik No"
                value={form.tcNo}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      tcNo: v,
                    })
                  )
                }
              />

              <Field
                label="Pozisyon"
                value={form.position}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      position: v,
                    })
                  )
                }
              />

              <Field
                label="Departman"
                value={form.department}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      department: v,
                    })
                  )
                }
              />

              <Field
                label="Telefon"
                value={form.phone}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      phone: v,
                    })
                  )
                }
              />

              <Field
                label="E-posta"
                value={form.email}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      email: v,
                    })
                  )
                }
              />

              <label className="field">
                <span>
                  Özel Grup
                </span>

                <select
                  value={
                    form.specialGroup
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        specialGroup:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="">
                    Yok / Seçilmedi
                  </option>

                  <option value="GENC">
                    Genç Çalışan
                  </option>

                  <option value="YASLI">
                    Yaşlı Çalışan
                  </option>

                  <option value="ENGELLI">
                    Engelli Çalışan
                  </option>

                  <option value="GEBE">
                    Gebe Çalışan
                  </option>

                  <option value="EMZIREN">
                    Emziren Çalışan
                  </option>

                  <option value="KRONIK">
                    Kronik Rahatsızlık
                  </option>

                  <option value="DIGER">
                    Diğer
                  </option>
                </select>
              </label>

              <label className="checkRow">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        isActive:
                          event.target.checked,
                      })
                    )
                  }
                />

                <span>
                  Çalışan aktif
                </span>
              </label>
            </div>

            <div className="formSection">
              <label className="field">
                <span>Not</span>

                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        note:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>
            </div>

            <div className="modalActions">
              <button
                className="outline"
                disabled={saving}
                onClick={() =>
                  setModalOpen(false)
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
                  : form.id
                    ? "Değişiklikleri Kaydet"
                    : "DORA Çalışanını Oluştur"}
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
  value: kpiValue,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="kpi">
      <span>{title}</span>
      <strong>{kpiValue}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Meta({
  label,
  value: metaValue,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{metaValue}</strong>
    </div>
  );
}

function Field({
  label,
  value: fieldValue,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    padding: 24px;
    color: #172033;
    background:
      linear-gradient(
        180deg,
        #f7f8fb 0%,
        #ffffff 430px
      );
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  .topbar {
    max-width: 1450px;
    margin: 0 auto 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .back,
  .refresh,
  .outline,
  .dangerBtn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    padding: 10px 14px;
    border-radius: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .dangerBtn {
    color: #b42318;
    border-color: #fecdca;
    background: #fffafa;
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .hero {
    max-width: 1450px;
    margin: 0 auto;
    min-height: 235px;
    padding: 30px;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 82% 20%,
        rgba(255,255,255,0.18),
        transparent 28%
      ),
      linear-gradient(
        120deg,
        #50141f 0%,
        #7a2633 48%,
        #d0602c 100%
      );
    box-shadow:
      0 22px 50px
      rgba(73,20,31,0.17);
  }

  .eyebrow,
  .sectionEyebrow {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .eyebrow {
    color: rgba(255,255,255,0.76);
    margin-bottom: 10px;
  }

  .sectionEyebrow {
    color: #8c3543;
    margin-bottom: 7px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 56px);
    letter-spacing: -0.04em;
  }

  .hero p {
    margin: 14px 0 0;
    max-width: 760px;
    color: rgba(255,255,255,0.86);
    line-height: 1.6;
  }

  .heroMeta {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 17px;
  }

  .heroMeta span {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.11);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 750;
  }

  .heroPrimary,
  .heroSecondary,
  .primary {
    border: 0;
    cursor: pointer;
    font-weight: 850;
    border-radius: 13px;
  }

  .heroButtons {
    display: flex;
    gap: 9px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .heroPrimary {
    padding: 13px 18px;
    background: #ffffff;
    color: #681d2a;
    flex: 0 0 auto;
  }

  .heroSecondary {
    padding: 12px 15px;
    color: #ffffff;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    text-decoration: none;
    border-radius: 13px;
    cursor: pointer;
  }

  .primary {
    background: #7a2633;
    color: #ffffff;
    padding: 11px 15px;
  }

  .kpis {
    max-width: 1400px;
    margin: -26px auto 0;
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .kpi {
    min-height: 116px;
    padding: 17px;
    border-radius: 19px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    box-shadow:
      0 14px 34px
      rgba(16,24,40,0.07);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .kpi span {
    color: #667085;
    font-size: 12px;
    font-weight: 800;
  }

  .kpi strong {
    color: #531823;
    font-size: 32px;
    margin: 7px 0;
  }

  .kpi small {
    color: #98a2b3;
  }

  .section,
  .independence {
    max-width: 1450px;
    margin-left: auto;
    margin-right: auto;
  }

  .section {
    margin-top: 26px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 23px;
    padding: 22px;
  }

  .bulkResult {
    max-width: 1450px;
    margin: 20px auto 0;
    padding: 13px 15px;
    border: 1px solid #abefc6;
    background: #ecfdf3;
    color: #027a48;
    border-radius: 14px;
    font-weight: 800;
  }

  .sectionTitle {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .sectionTitle h2 {
    margin: 0;
  }

  .sectionActions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .linkButton {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }

  .sectionTitle p {
    margin: 7px 0 0;
    color: #667085;
    line-height: 1.55;
  }

  .toolbar {
    margin-top: 18px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search {
    flex: 1;
    border: 1px solid #d0d5dd;
    border-radius: 13px;
    padding: 12px 13px;
    outline: none;
  }

  .search:focus {
    border-color: #9b5360;
    box-shadow:
      0 0 0 3px
      rgba(122,38,51,0.08);
  }

  .resultCount {
    color: #667085;
    font-size: 13px;
    font-weight: 750;
  }

  .employeeGrid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .employeeCard {
    border: 1px solid #e4e7ec;
    border-radius: 20px;
    padding: 17px;
    background: #fcfcfd;
  }

  .employeeTop {
    display: flex;
    gap: 11px;
    align-items: center;
  }

  .avatar {
    width: 46px;
    height: 46px;
    flex: 0 0 auto;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: #f5e9eb;
    color: #7a2633;
    font-weight: 950;
    font-size: 18px;
  }

  .identity {
    flex: 1;
    min-width: 0;
  }

  .identity h3 {
    margin: 0;
    color: #101828;
    font-size: 17px;
  }

  .identity p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 12px;
  }

  .state {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 850;
  }

  .state.active {
    background: #ecfdf3;
    color: #027a48;
  }

  .state.passive {
    background: #f2f4f7;
    color: #667085;
  }

  .metaGrid {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .meta {
    min-height: 64px;
    padding: 9px 10px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #f0f1f3;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta span {
    color: #98a2b3;
    font-size: 10px;
    font-weight: 800;
  }

  .meta strong {
    color: #344054;
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .special {
    margin-top: 10px;
    padding: 10px;
    border-radius: 12px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .special span {
    color: #80545c;
    font-size: 11px;
    font-weight: 750;
  }

  .special strong {
    color: #7a2633;
    font-size: 12px;
  }

  .note {
    margin-top: 10px;
    color: #667085;
    font-size: 12px;
    line-height: 1.5;
    background: #ffffff;
    border: 1px solid #f0f1f3;
    border-radius: 12px;
    padding: 10px;
  }

  .actions {
    margin-top: 14px;
    padding-top: 13px;
    border-top: 1px solid #eaecf0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .empty {
    margin-top: 18px;
    padding: 42px 20px;
    text-align: center;
    border: 1px dashed #d0d5dd;
    border-radius: 18px;
    background: #fcfcfd;
  }

  .emptyMark {
    width: 58px;
    height: 58px;
    margin: 0 auto 11px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: #f5e9eb;
    color: #7a2633;
    font-weight: 950;
    font-size: 20px;
  }

  .empty h3 {
    margin: 0;
  }

  .empty p {
    color: #667085;
    margin: 7px 0 16px;
  }

  .independence {
    margin-top: 22px;
    margin-bottom: 34px;
    border-radius: 19px;
    padding: 18px;
    display: flex;
    gap: 13px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
  }

  .independenceMark {
    width: 43px;
    height: 43px;
    flex: 0 0 auto;
    border-radius: 13px;
    display: grid;
    place-items: center;
    background: #7a2633;
    color: #ffffff;
    font-weight: 950;
  }

  .independence strong {
    color: #6e1f2c;
  }

  .independence p {
    margin: 5px 0 0;
    color: #80545c;
    font-size: 13px;
    line-height: 1.55;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 24px;
    background: rgba(15,23,42,0.55);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    overflow-y: auto;
  }

  .modal {
    width: min(820px, 100%);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    background: #ffffff;
    border-radius: 23px;
    box-shadow:
      0 30px 80px
      rgba(15,23,42,0.28);
  }

  .modalHeader {
    padding: 21px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    border-bottom: 1px solid #eaecf0;
  }

  .modalHeader h2 {
    margin: 0;
  }

  .modalHeader p {
    margin: 6px 0 0;
    color: #667085;
  }

  .close {
    width: 37px;
    height: 37px;
    border: 1px solid #eaecf0;
    border-radius: 11px;
    background: #ffffff;
    color: #667085;
    font-size: 24px;
    cursor: pointer;
  }

  .formGrid {
    padding: 21px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .formSection {
    padding: 0 21px 21px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field span {
    color: #475467;
    font-size: 12px;
    font-weight: 800;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    border: 1px solid #d0d5dd;
    background: #ffffff;
    border-radius: 12px;
    padding: 11px 12px;
    color: #172033;
    outline: none;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #9b5360;
    box-shadow:
      0 0 0 3px
      rgba(122,38,51,0.08);
  }

  .field textarea {
    resize: vertical;
  }

  .checkRow {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #475467;
    font-weight: 750;
    align-self: end;
    min-height: 43px;
  }

  .checkRow input {
    width: 18px;
    height: 18px;
  }

  .modalActions {
    padding: 17px 21px 21px;
    border-top: 1px solid #eaecf0;
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .loading,
  .error {
    max-width: 900px;
    margin: 60px auto;
    padding: 20px;
    border-radius: 16px;
  }

  .loading {
    background: #ffffff;
    border: 1px solid #eaecf0;
    color: #667085;
    text-align: center;
  }

  .error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-weight: 700;
  }

  @media (
    max-width: 920px
  ) {
    .kpis {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .employeeGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (
    max-width: 700px
  ) {
    .page {
      padding: 14px;
    }

    .hero {
      min-height: auto;
      padding: 22px 18px;
      border-radius: 22px;
      align-items: flex-start;
      flex-direction: column;
    }

    .heroButtons {
      width: 100%;
      justify-content: stretch;
    }

    .heroPrimary,
    .heroSecondary {
      width: 100%;
      text-align: center;
    }

    .kpis {
      margin-top: 14px;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .sectionTitle,
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .formGrid {
      grid-template-columns: 1fr;
    }

    .modalBackdrop {
      padding: 12px;
    }
  }
`;