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
} from "next/navigation";

type TeamMember = {
  id: string;
  firm_id: string;
  full_name: string;
  title?: string | null;
  role_type: string;
  certificate_no?: string | null;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  show_in_report?: boolean | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type MemberForm = {
  id: string;
  fullName: string;
  title: string;
  roleType: string;
  certificateNo: string;
  phone: string;
  email: string;
  note: string;
  showInReport: boolean;
  sortOrder: string;
  isActive: boolean;
};

const ROLE_OPTIONS = [
  {
    value: "ISVEREN_VEKILI",
    label: "İşveren / İşveren Vekili",
  },
  {
    value: "ISG_UZMANI",
    label: "İş Güvenliği Uzmanı",
  },
  {
    value: "ISYERI_HEKIMI",
    label: "İşyeri Hekimi",
  },
  {
    value: "CALISAN_TEMSILCISI",
    label: "Çalışan Temsilcisi",
  },
  {
    value: "DESTEK_ELEMANI",
    label: "Destek Elemanı",
  },
  {
    value: "BIRIM_TEMSILCISI",
    label: "Birim Temsilcisi",
  },
  {
    value: "DIGER",
    label: "Diğer",
  },
];

function emptyForm(): MemberForm {
  return {
    id: "",
    fullName: "",
    title: "",
    roleType:
      "ISVEREN_VEKILI",
    certificateNo: "",
    phone: "",
    email: "",
    note: "",
    showInReport: true,
    sortOrder: "0",
    isActive: true,
  };
}

function roleLabel(
  value?: string | null
): string {
  return (
    ROLE_OPTIONS.find(
      (item) =>
        item.value === value
    )?.label ||
    value ||
    "-"
  );
}

export default function DoraRiskTeamPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const firmId =
    String(
      params.firmId ?? ""
    );

  const [members, setMembers] =
    useState<TeamMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [form, setForm] =
    useState<MemberForm>(
      emptyForm()
    );

  const loadMembers =
    useCallback(
      async () => {
        if (!firmId) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/dora/risk-team?firmId=${encodeURIComponent(
                firmId
              )}`,
              {
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "Risk değerlendirme ekibi alınamadı."
            );
          }

          setMembers(
            Array.isArray(
              data.members
            )
              ? data.members
              : []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Risk değerlendirme ekibi alınamadı."
          );
        } finally {
          setLoading(false);
        }
      },
      [firmId]
    );

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const stats =
    useMemo(() => {
      return {
        total:
          members.length,

        active:
          members.filter(
            (item) =>
              item.is_active !==
              false
          ).length,

        report:
          members.filter(
            (item) =>
              item.show_in_report !==
              false
          ).length,

        specialist:
          members.filter(
            (item) =>
              item.role_type ===
              "ISG_UZMANI"
          ).length,

        doctor:
          members.filter(
            (item) =>
              item.role_type ===
              "ISYERI_HEKIMI"
          ).length,

        representative:
          members.filter(
            (item) =>
              item.role_type ===
              "CALISAN_TEMSILCISI"
          ).length,
      };
    }, [members]);

  const filteredMembers =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return members.filter(
        (member) => {
          if (
            roleFilter !==
              "ALL" &&
            member.role_type !==
              roleFilter
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          const haystack = [
            member.full_name,
            member.title,
            member.role_type,
            member.certificate_no,
            member.phone,
            member.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          return haystack.includes(
            q
          );
        }
      );
    }, [
      members,
      search,
      roleFilter,
    ]);

  function openNew() {
    setForm(
      emptyForm()
    );

    setModalOpen(
      true
    );
  }

  function openEdit(
    member: TeamMember
  ) {
    setForm({
      id:
        member.id,

      fullName:
        member.full_name ||
        "",

      title:
        member.title ||
        "",

      roleType:
        member.role_type ||
        "DIGER",

      certificateNo:
        member.certificate_no ||
        "",

      phone:
        member.phone ||
        "",

      email:
        member.email ||
        "",

      note:
        member.note ||
        "",

      showInReport:
        member.show_in_report !==
        false,

      sortOrder:
        String(
          member.sort_order ??
            0
        ),

      isActive:
        member.is_active !==
        false,
    });

    setModalOpen(
      true
    );
  }

  async function saveMember() {
    if (
      !form.fullName.trim()
    ) {
      alert(
        "Ad soyad zorunludur."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/dora/risk-team",
          {
            method:
              form.id
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

                title:
                  form.title,

                roleType:
                  form.roleType,

                certificateNo:
                  form.certificateNo,

                phone:
                  form.phone,

                email:
                  form.email,

                note:
                  form.note,

                showInReport:
                  form.showInReport,

                sortOrder:
                  Number(
                    form.sortOrder ||
                      0
                  ),

                isActive:
                  form.isActive,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Ekip üyesi kaydedilemedi."
        );
      }

      setModalOpen(
        false
      );

      setForm(
        emptyForm()
      );

      await loadMembers();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Ekip üyesi kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(
    member: TeamMember
  ) {
    const ok =
      window.confirm(
        `"${member.full_name}" ekipten çıkarılsın mı?`
      );

    if (!ok) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/dora/risk-team",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  member.id,

                firmId,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Ekip üyesi silinemedi."
        );
      }

      await loadMembers();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Ekip üyesi silinemedi."
      );
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <button
            className="backBtn"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}`
              )
            }
          >
            ← DORA Firmasına Dön
          </button>

          <div className="eyebrow">
            DORA • RİSK DEĞERLENDİRME EKİBİ
          </div>

          <h1>
            Risk Değerlendirme Ekibi
          </h1>

          <p>
            Fine Kinney risk değerlendirmesinde
            görev alan ekip üyelerini ve rapor
            imza bilgilerini burada yönetin.
          </p>
        </div>

        <div className="heroActions">
          <button
            className="outlineBtn"
            onClick={() =>
              void loadMembers()
            }
          >
            Yenile
          </button>

          <button
            className="primaryBtn"
            onClick={openNew}
          >
            + Ekip Üyesi Ekle
          </button>
        </div>
      </section>

      <section className="kpiGrid">
        <Kpi
          title="Toplam Üye"
          value={stats.total}
        />

        <Kpi
          title="Aktif"
          value={stats.active}
        />

        <Kpi
          title="Raporda"
          value={stats.report}
        />

        <Kpi
          title="İSG Uzmanı"
          value={stats.specialist}
        />

        <Kpi
          title="İşyeri Hekimi"
          value={stats.doctor}
        />

        <Kpi
          title="Çalışan Temsilcisi"
          value={
            stats.representative
          }
        />
      </section>

      <section className="toolbar">
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Ad, unvan, belge no veya iletişim ara..."
        />

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Tüm Roller
          </option>

          {ROLE_OPTIONS.map(
            (role) => (
              <option
                key={role.value}
                value={role.value}
              >
                {role.label}
              </option>
            )
          )}
        </select>
      </section>

      {error && (
        <div className="errorBox">
          {error}
        </div>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="eyebrow">
              EKİP LİSTESİ
            </div>

            <h2>
              Risk Değerlendirme
              Ekibi Üyeleri
            </h2>
          </div>

          <strong>
            {
              filteredMembers.length
            }{" "}
            üye
          </strong>
        </div>

        {loading ? (
          <div className="empty">
            Ekip üyeleri yükleniyor...
          </div>
        ) : filteredMembers.length ===
          0 ? (
          <div className="empty">
            Henüz ekip üyesi yok.
          </div>
        ) : (
          <div className="memberGrid">
            {filteredMembers.map(
              (member) => (
                <article
                  className="memberCard"
                  key={member.id}
                >
                  <div className="memberTop">
                    <div>
                      <div className="role">
                        {roleLabel(
                          member.role_type
                        )}
                      </div>

                      <h3>
                        {
                          member.full_name
                        }
                      </h3>

                      <p>
                        {member.title ||
                          "Unvan belirtilmedi"}
                      </p>
                    </div>

                    <div className="badges">
                      <span
                        className={
                          member.is_active !==
                          false
                            ? "badge active"
                            : "badge passive"
                        }
                      >
                        {member.is_active !==
                        false
                          ? "Aktif"
                          : "Pasif"}
                      </span>

                      {member.show_in_report !==
                        false && (
                        <span className="badge report">
                          Raporda
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="metaGrid">
                    <Meta
                      label="Belge No"
                      value={
                        member.certificate_no ||
                        "-"
                      }
                    />

                    <Meta
                      label="Telefon"
                      value={
                        member.phone ||
                        "-"
                      }
                    />

                    <Meta
                      label="E-posta"
                      value={
                        member.email ||
                        "-"
                      }
                    />

                    <Meta
                      label="Sıra"
                      value={String(
                        member.sort_order ??
                          0
                      )}
                    />
                  </div>

                  {member.note && (
                    <div className="note">
                      {member.note}
                    </div>
                  )}

                  <div className="actions">
                    <button
                      className="outlineBtn"
                      onClick={() =>
                        openEdit(
                          member
                        )
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      className="deleteBtn"
                      onClick={() =>
                        void deleteMember(
                          member
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

      {modalOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalOpen(
                false
              );
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  DORA • EKİP ÜYESİ
                </div>

                <h2>
                  {form.id
                    ? "Ekip Üyesini Düzenle"
                    : "Yeni Ekip Üyesi"}
                </h2>
              </div>

              <button
                className="closeBtn"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <div className="grid2">
                <Field
                  label="Ad Soyad *"
                  value={
                    form.fullName
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      fullName:
                        value,
                    })
                  }
                />

                <Field
                  label="Unvan"
                  value={
                    form.title
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      title:
                        value,
                    })
                  }
                />

                <label className="field">
                  <span>
                    Ekip Rolü
                  </span>

                  <select
                    value={
                      form.roleType
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        roleType:
                          event.target.value,
                      })
                    }
                  >
                    {ROLE_OPTIONS.map(
                      (role) => (
                        <option
                          key={
                            role.value
                          }
                          value={
                            role.value
                          }
                        >
                          {role.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <Field
                  label="Belge No"
                  value={
                    form.certificateNo
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      certificateNo:
                        value,
                    })
                  }
                />

                <Field
                  label="Telefon"
                  value={
                    form.phone
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      phone:
                        value,
                    })
                  }
                />

                <Field
                  label="E-posta"
                  value={
                    form.email
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      email:
                        value,
                    })
                  }
                />

                <label className="field">
                  <span>
                    Rapor Sırası
                  </span>

                  <input
                    type="number"
                    min={0}
                    value={
                      form.sortOrder
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sortOrder:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>
                  Not
                </span>

                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      note:
                        event.target.value,
                    })
                  }
                />
              </label>

              <div className="checks">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      form.showInReport
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        showInReport:
                          event.target.checked,
                      })
                    }
                  />

                  Risk değerlendirme
                  raporunda göster
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isActive:
                          event.target.checked,
                      })
                    }
                  />

                  Aktif ekip üyesi
                </label>
              </div>
            </div>

            <div className="modalFooter">
              <button
                className="outlineBtn"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primaryBtn"
                disabled={saving}
                onClick={() =>
                  void saveMember()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : form.id
                    ? "Değişiklikleri Kaydet"
                    : "Ekip Üyesini Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          background: #f6f7f9;
          color: #172033;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 8px 28px rgba(15,23,42,.05);
        }

        .hero h1 {
          margin: 8px 0;
          font-size: 32px;
        }

        .hero p {
          margin: 0;
          color: #667085;
          line-height: 1.6;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #7a2633;
        }

        .heroActions {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .backBtn,
        .outlineBtn,
        .primaryBtn,
        .deleteBtn {
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 700;
        }

        .backBtn {
          border: 0;
          padding-left: 0;
          background: transparent;
          color: #667085;
        }

        .outlineBtn {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
        }

        .primaryBtn {
          border: 1px solid #7a2633;
          background: #7a2633;
          color: #fff;
        }

        .deleteBtn {
          border: 1px solid #fecdca;
          background: #fff5f5;
          color: #b42318;
        }

        .kpiGrid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0,1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .toolbar {
          display: grid;
          grid-template-columns:
            minmax(300px,1fr)
            260px;
          gap: 10px;
          margin-top: 18px;
        }

        .toolbar input,
        .toolbar select,
        .field input,
        .field select,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          background: #fff;
          padding: 11px 12px;
          color: #172033;
          outline: none;
        }

        .panel {
          margin-top: 18px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
        }

        .panelHeader {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .panelHeader h2 {
          margin: 5px 0 0;
        }

        .memberGrid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 14px;
        }

        .memberCard {
          padding: 17px;
          border: 1px solid #eaecf0;
          border-radius: 14px;
          background: #fff;
        }

        .memberTop {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .role {
          font-size: 11px;
          font-weight: 900;
          color: #7a2633;
        }

        .memberTop h3 {
          margin: 5px 0 2px;
        }

        .memberTop p {
          margin: 0;
          color: #667085;
          font-size: 13px;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }

        .badge {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 850;
        }

        .badge.active {
          background: #ecfdf3;
          color: #027a48;
        }

        .badge.passive {
          background: #f2f4f7;
          color: #667085;
        }

        .badge.report {
          background: #eff8ff;
          color: #175cd3;
        }

        .metaGrid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .note {
          margin-top: 12px;
          padding: 10px;
          border-radius: 9px;
          background: #f8fafc;
          color: #475467;
          font-size: 13px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #f0f1f3;
        }

        .empty,
        .errorBox {
          padding: 30px;
          text-align: center;
        }

        .errorBox {
          margin-top: 18px;
          border: 1px solid #fecdca;
          border-radius: 10px;
          background: #fef3f2;
          color: #b42318;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15,23,42,.52);
        }

        .modal {
          width: min(900px,100%);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          background: #fff;
        }

        .modalHeader,
        .modalFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .modalFooter {
          justify-content: flex-end;
          border-top: 1px solid #eaecf0;
          border-bottom: 0;
        }

        .modalHeader h2 {
          margin: 5px 0 0;
        }

        .closeBtn {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 10px;
          background: #f2f4f7;
          font-size: 24px;
          color: #475467;
        }

        .modalBody {
          overflow-y: auto;
          padding: 22px;
        }

        .grid2 {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 6px;
          margin-bottom: 12px;
        }

        .field span {
          font-size: 12px;
          font-weight: 800;
          color: #475467;
        }

        .checks {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 8px;
        }

        .checks label {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #475467;
          font-size: 13px;
          font-weight: 700;
        }

        @media (
          max-width: 1100px
        ) {
          .kpiGrid {
            grid-template-columns:
              repeat(3,1fr);
          }
        }

        @media (
          max-width: 760px
        ) {
          .page {
            padding: 14px;
          }

          .hero {
            flex-direction: column;
          }

          .heroActions,
          .toolbar,
          .grid2,
          .memberGrid {
            grid-template-columns: 1fr;
          }

          .heroActions {
            flex-wrap: wrap;
          }

          .kpiGrid {
            grid-template-columns:
              repeat(2,1fr);
          }
        }
      `}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article className="kpi">
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <style jsx>{`
        .kpi {
          padding: 16px;
          min-height: 90px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }

        .kpi span {
          display: block;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }

        .kpi strong {
          display: block;
          margin-top: 8px;
          font-size: 28px;
          color: #531823;
        }
      `}</style>
    </article>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="meta">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <style jsx>{`
        .meta {
          padding: 9px;
          border-radius: 9px;
          background: #f8fafc;
        }

        .meta span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 800;
        }

        .meta strong {
          display: block;
          margin-top: 3px;
          color: #344054;
          font-size: 12px;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}