"use client";

import {
  Archive,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Status =
  | "DRAFT"
  | "PUBLISHED"
  | "PASSIVE"
  | "REVISION";

type Category =
  | "ALL"
  | "GENERAL"
  | "OHS"
  | "HEALTH"
  | "PPE"
  | "MACHINE"
  | "ELECTRICAL"
  | "CHEMICAL"
  | "EMERGENCY"
  | "WORK_PERMIT"
  | "OTHER";

type InstructionRecord = {
  id: string;

  companyId: string | null;

  instructionCode: string;

  title: string;

  shortTitle: string;

  category: Exclude<
    Category,
    "ALL"
  >;

  purpose: string;

  scope: string;

  responsibilities: string;

  contentJson: unknown[];

  attachmentsJson: unknown[];

  versionNo: number;

  revisionNo: number;

  revisionReason: string;

  status: Status;

  isSystem: boolean;

  isActive: boolean;

  isDeleted: boolean;

  requiresReadConfirmation: boolean;

  publishedAt: string | null;

  createdAt: string;

  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;

  records?: InstructionRecord[];

  record?: InstructionRecord | null;

  error?: string;

  detail?: string;
};

type EditorState = {
  id: string;

  instructionCode: string;

  title: string;

  shortTitle: string;

  category: Exclude<
    Category,
    "ALL"
  >;

  purpose: string;

  scope: string;

  responsibilities: string;

  contentJson: string;

  attachmentsJson: string;

  versionNo: number;

  revisionNo: number;

  revisionReason: string;

  status: Status;

  requiresReadConfirmation: boolean;
};

const EMPTY_EDITOR: EditorState = {
  id: "",

  instructionCode: "",

  title: "",

  shortTitle: "",

  category: "GENERAL",

  purpose: "",

  scope: "",

  responsibilities: "",

  contentJson: "[]",

  attachmentsJson: "[]",

  versionNo: 1,

  revisionNo: 0,

  revisionReason: "",

  status: "DRAFT",

  requiresReadConfirmation: true,
};

function categoryLabel(
  value: Exclude<
    Category,
    "ALL"
  >
): string {
  const labels: Record<
    Exclude<
      Category,
      "ALL"
    >,
    string
  > = {
    GENERAL:
      "Genel Talimatlar",

    OHS:
      "İSG Talimatları",

    HEALTH:
      "Sağlık Talimatları",

    PPE:
      "KKD Talimatları",

    MACHINE:
      "Makine / Ekipman",

    ELECTRICAL:
      "Elektrik",

    CHEMICAL:
      "Kimyasal",

    EMERGENCY:
      "Acil Durum",

    WORK_PERMIT:
      "Çalışma İzinleri",

    OTHER:
      "Diğer",
  };

  return labels[value];
}

function statusLabel(
  value: Status
): string {
  const labels: Record<
    Status,
    string
  > = {
    DRAFT:
      "Taslak",

    PUBLISHED:
      "Yayında",

    PASSIVE:
      "Pasif",

    REVISION:
      "Revizyonda",
  };

  return labels[value];
}

function statusStyle(
  value: Status
): React.CSSProperties {
  if (
    value ===
    "PUBLISHED"
  ) {
    return {
      background:
        "#dcfce7",

      color:
        "#166534",
    };
  }

  if (
    value ===
    "REVISION"
  ) {
    return {
      background:
        "#fef3c7",

      color:
        "#92400e",
    };
  }

  if (
    value ===
    "DRAFT"
  ) {
    return {
      background:
        "#f1f5f9",

      color:
        "#475569",
    };
  }

  return {
    background:
      "#fee2e2",

    color:
      "#991b1b",
  };
}

function parseArray(
  text: string,
  label: string
): unknown[] {
  const parsed =
    JSON.parse(
      text || "[]"
    );

  if (
    !Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      `${label} JSON dizi biçiminde olmalıdır.`
    );
  }

  return parsed;
}

function formatDate(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "tr-TR"
  );
}

export default function InstructionsPage() {
  const [
    records,
    setRecords,
  ] =
    useState<
      InstructionRecord[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState<Category>(
      "ALL"
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      "ALL" | Status
    >("ALL");

  const [
    showEditor,
    setShowEditor,
  ] =
    useState(false);

  const [
    editor,
    setEditor,
  ] =
    useState<EditorState>(
      EMPTY_EDITOR
    );

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await fetch(
              "/api/admin/documentation/instructions",
              {
                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const json =
            (await response
              .json()
              .catch(
                () => ({})
              )) as ApiResponse;

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.detail ||
                json.error ||
                "Talimatlar alınamadı."
            );
          }

          setRecords(
            Array.isArray(
              json.records
            )
              ? json.records
              : []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "Talimatlar alınamadı."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return records.filter(
        (record) => {
          const haystack = [
            record.instructionCode,
            record.title,
            record.shortTitle,
            record.purpose,
            record.scope,
            record.responsibilities,
            categoryLabel(
              record.category
            ),
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          const matchesSearch =
            !query ||
            haystack.includes(
              query
            );

          const matchesCategory =
            category ===
              "ALL" ||
            record.category ===
              category;

          const matchesStatus =
            status ===
              "ALL" ||
            record.status ===
              status;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      records,
      search,
      category,
      status,
    ]);

  const totals =
    useMemo(
      () => ({
        total:
          records.length,

        published:
          records.filter(
            (record) =>
              record.status ===
              "PUBLISHED"
          ).length,

        draft:
          records.filter(
            (record) =>
              record.status ===
              "DRAFT"
          ).length,

        revision:
          records.filter(
            (record) =>
              record.status ===
              "REVISION"
          ).length,

        system:
          records.filter(
            (record) =>
              record.isSystem
          ).length,

        confirmation:
          records.filter(
            (record) =>
              record.requiresReadConfirmation
          ).length,
      }),
      [records]
    );

  const openNew =
    () => {
      setEditor(
        EMPTY_EDITOR
      );

      setError("");

      setMessage("");

      setShowEditor(
        true
      );
    };

  const openEdit = (
    record:
      InstructionRecord
  ) => {
    setEditor({
      id:
        record.id,

      instructionCode:
        record.instructionCode,

      title:
        record.title,

      shortTitle:
        record.shortTitle,

      category:
        record.category,

      purpose:
        record.purpose,

      scope:
        record.scope,

      responsibilities:
        record.responsibilities,

      contentJson:
        JSON.stringify(
          record.contentJson ||
            [],
          null,
          2
        ),

      attachmentsJson:
        JSON.stringify(
          record.attachmentsJson ||
            [],
          null,
          2
        ),

      versionNo:
        Number(
          record.versionNo ||
            1
        ),

      revisionNo:
        Number(
          record.revisionNo ||
            0
        ),

      revisionReason:
        record.revisionReason,

      status:
        record.status,

      requiresReadConfirmation:
        record.requiresReadConfirmation,
    });

    setError("");

    setMessage("");

    setShowEditor(
      true
    );
  };

  const save =
    async () => {
      try {
        setSaving(
          true
        );

        setError("");

        setMessage("");

        if (
          !editor.instructionCode.trim()
        ) {
          throw new Error(
            "Talimat kodu zorunludur."
          );
        }

        if (
          !editor.title.trim()
        ) {
          throw new Error(
            "Talimat başlığı zorunludur."
          );
        }

        const payload = {
          id:
            editor.id ||
            undefined,

          instructionCode:
            editor.instructionCode
              .trim()
              .toUpperCase(),

          title:
            editor.title.trim(),

          shortTitle:
            editor.shortTitle.trim(),

          category:
            editor.category,

          purpose:
            editor.purpose.trim(),

          scope:
            editor.scope.trim(),

          responsibilities:
            editor.responsibilities.trim(),

          contentJson:
            parseArray(
              editor.contentJson,
              "Talimat içeriği"
            ),

          attachmentsJson:
            parseArray(
              editor.attachmentsJson,
              "Ekler"
            ),

          versionNo:
            Math.max(
              1,
              Number(
                editor.versionNo ||
                  1
              )
            ),

          revisionNo:
            Math.max(
              0,
              Number(
                editor.revisionNo ||
                  0
              )
            ),

          revisionReason:
            editor.revisionReason.trim(),

          status:
            editor.status,

          requiresReadConfirmation:
            editor.requiresReadConfirmation,

          isActive:
            editor.status !==
            "PASSIVE",
        };

        const response =
          await fetch(
            "/api/admin/documentation/instructions",
            {
              method:
                editor.id
                  ? "PATCH"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const json =
          (await response
            .json()
            .catch(
              () => ({})
            )) as ApiResponse;

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.detail ||
              json.error ||
              "Talimat kaydedilemedi."
          );
        }

        setShowEditor(
          false
        );

        setEditor(
          EMPTY_EDITOR
        );

        setMessage(
          editor.id
            ? "Talimat güncellendi."
            : "Yeni talimat oluşturuldu."
        );

        await load();
      } catch (
        saveError
      ) {
        setError(
          saveError instanceof
          Error
            ? saveError.message
            : "Talimat kaydedilemedi."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const remove =
    async (
      record:
        InstructionRecord
    ) => {
      if (
        record.isSystem
      ) {
        setError(
          "Sistem talimatları silinemez. Gerekirse pasif duruma alınmalıdır."
        );

        return;
      }

      if (
        !window.confirm(
          `"${record.shortTitle || record.title}" talimatı silinsin mi?`
        )
      ) {
        return;
      }

      try {
        setDeletingId(
          record.id
        );

        setError("");

        const response =
          await fetch(
            `/api/admin/documentation/instructions?id=${encodeURIComponent(
              record.id
            )}`,
            {
              method:
                "DELETE",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const json =
          (await response
            .json()
            .catch(
              () => ({})
            )) as ApiResponse;

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.detail ||
              json.error ||
              "Talimat silinemedi."
          );
        }

        setMessage(
          "Talimat arşivden kaldırıldı."
        );

        await load();
      } catch (
        deleteError
      ) {
        setError(
          deleteError instanceof
          Error
            ? deleteError.message
            : "Talimat silinemedi."
        );
      } finally {
        setDeletingId(
          ""
        );
      }
    };

  return (
    <main style={s.page}>
      <section style={s.hero}>
        <div>
          <div style={s.badge}>
            <BookOpen
              size={16}
            />

            D-SEC Dokümantasyon
          </div>

          <h1
            style={
              s.heroTitle
            }
          >
            Talimat Merkezi
          </h1>

          <p
            style={
              s.heroText
            }
          >
            İSG ve işletme
            talimatlarını
            merkezi olarak
            oluşturun,
            yayınlayın,
            revizyonlarını
            yönetin ve ilgili
            modüllerde
            kullandırın.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openNew
          }
          style={
            s.heroButton
          }
        >
          <Plus
            size={17}
          />

          Yeni Talimat
        </button>

        <div
          className="kpiGrid"
          style={
            s.kpiGrid
          }
        >
          {[
            [
              "Toplam Talimat",
              totals.total,
              <Archive
                size={17}
                key="total"
              />,
            ],

            [
              "Yayında",
              totals.published,
              <CheckCircle2
                size={17}
                key="published"
              />,
            ],

            [
              "Taslak",
              totals.draft,
              <FileText
                size={17}
                key="draft"
              />,
            ],

            [
              "Revizyonda",
              totals.revision,
              <RefreshCw
                size={17}
                key="revision"
              />,
            ],

            [
              "Sistem Talimatı",
              totals.system,
              <ShieldCheck
                size={17}
                key="system"
              />,
            ],

            [
              "Okundu Onayı",
              totals.confirmation,
              <BookOpen
                size={17}
                key="read"
              />,
            ],
          ].map(
            ([
              label,
              value,
              icon,
            ]) => (
              <div
                key={String(
                  label
                )}
                style={
                  s.kpiCard
                }
              >
                <div
                  style={
                    s.kpiLabel
                  }
                >
                  {icon}

                  {label}
                </div>

                <div
                  style={
                    s.kpiValue
                  }
                >
                  {value}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {error ? (
        <div
          style={
            s.error
          }
        >
          <X
            size={17}
          />

          {error}
        </div>
      ) : null}

      {message ? (
        <div
          style={
            s.success
          }
        >
          <CheckCircle2
            size={17}
          />

          {message}
        </div>
      ) : null}

      <section
        style={
          s.filters
        }
      >
        <div
          style={
            s.searchWrap
          }
        >
          <Search
            size={17}
            style={
              s.searchIcon
            }
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Talimat adı, kodu, kapsamı veya amacı ara..."
            style={
              s.input
            }
          />
        </div>

        <select
          value={
            category
          }
          onChange={(
            event
          ) =>
            setCategory(
              event.target
                .value as Category
            )
          }
          style={
            s.select
          }
        >
          <option value="ALL">
            Tüm Kategoriler
          </option>

          <option value="GENERAL">
            Genel
          </option>

          <option value="OHS">
            İSG
          </option>

          <option value="HEALTH">
            Sağlık
          </option>

          <option value="PPE">
            KKD
          </option>

          <option value="MACHINE">
            Makine / Ekipman
          </option>

          <option value="ELECTRICAL">
            Elektrik
          </option>

          <option value="CHEMICAL">
            Kimyasal
          </option>

          <option value="EMERGENCY">
            Acil Durum
          </option>

          <option value="WORK_PERMIT">
            Çalışma İzinleri
          </option>

          <option value="OTHER">
            Diğer
          </option>
        </select>

        <select
          value={
            status
          }
          onChange={(
            event
          ) =>
            setStatus(
              event.target
                .value as
                | "ALL"
                | Status
            )
          }
          style={
            s.select
          }
        >
          <option value="ALL">
            Tüm Durumlar
          </option>

          <option value="PUBLISHED">
            Yayında
          </option>

          <option value="DRAFT">
            Taslak
          </option>

          <option value="REVISION">
            Revizyonda
          </option>

          <option value="PASSIVE">
            Pasif
          </option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearch("");

            setCategory(
              "ALL"
            );

            setStatus(
              "ALL"
            );
          }}
          style={
            s.secondaryButton
          }
        >
          <Filter
            size={16}
          />

          Temizle
        </button>

        <button
          type="button"
          onClick={() =>
            void load()
          }
          disabled={
            loading
          }
          style={
            s.secondaryButton
          }
        >
          {loading ? (
            <Loader2
              size={16}
              className="spin"
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          Yenile
        </button>
      </section>

      <section>
        <div
          style={
            s.sectionHeader
          }
        >
          <div>
            <h2
              style={
                s.sectionTitle
              }
            >
              Talimat Kütüphanesi
            </h2>

            <p
              style={
                s.sectionText
              }
            >
              Web ve mobil
              uygulamanın kaynak
              olarak kullandığı
              yayınlanmış ve taslak
              talimatlar.
            </p>
          </div>

          <span
            style={
              s.count
            }
          >
            {
              filtered.length
            }{" "}
            kayıt
          </span>
        </div>

        {loading ? (
          <div
            style={
              s.loading
            }
          >
            <Loader2
              size={30}
              className="spin"
            />
          </div>
        ) : filtered.length ===
          0 ? (
          <div
            style={
              s.empty
            }
          >
            Talimat
            bulunamadı.
          </div>
        ) : (
          <div
            style={
              s.cards
            }
          >
            {filtered.map(
              (
                record
              ) => (
                <article
                  key={
                    record.id
                  }
                  style={
                    s.card
                  }
                >
                  <div
                    style={
                      s.cardTop
                    }
                  >
                    <div
                      style={{
                        minWidth:
                          0,
                      }}
                    >
                      <div
                        style={
                          s.codeRow
                        }
                      >
                        <span
                          style={
                            s.code
                          }
                        >
                          {
                            record.instructionCode
                          }
                        </span>

                        {record.isSystem ? (
                          <span
                            style={
                              s.system
                            }
                          >
                            Sistem
                          </span>
                        ) : null}

                        {record.requiresReadConfirmation ? (
                          <span
                            style={
                              s.confirmationChip
                            }
                          >
                            Okundu Onayı
                          </span>
                        ) : null}
                      </div>

                      <h3
                        style={
                          s.cardTitle
                        }
                      >
                        {record.shortTitle ||
                          record.title}
                      </h3>

                      <p
                        style={
                          s.cardText
                        }
                      >
                        {record.purpose ||
                          "Talimat açıklaması bulunmuyor."}
                      </p>
                    </div>

                    <span
                      style={{
                        ...s.status,

                        ...statusStyle(
                          record.status
                        ),
                      }}
                    >
                      {statusLabel(
                        record.status
                      )}
                    </span>
                  </div>

                  <div
                    style={
                      s.metaGrid
                    }
                  >
                    {[
                      [
                        "Kategori",
                        categoryLabel(
                          record.category
                        ),
                      ],

                      [
                        "Versiyon",
                        `v${record.versionNo}`,
                      ],

                      [
                        "Revizyon",
                        `Rev. ${record.revisionNo}`,
                      ],

                      [
                        "Güncelleme",
                        formatDate(
                          record.updatedAt
                        ),
                      ],
                    ].map(
                      ([
                        label,
                        value,
                      ]) => (
                        <div
                          key={
                            label
                          }
                          style={
                            s.meta
                          }
                        >
                          <div
                            style={
                              s.metaLabel
                            }
                          >
                            {
                              label
                            }
                          </div>

                          <div
                            style={
                              s.metaValue
                            }
                          >
                            {
                              value
                            }
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div
                    style={
                      s.scopeBox
                    }
                  >
                    <div
                      style={
                        s.metaLabel
                      }
                    >
                      KAPSAM
                    </div>

                    <div
                      style={
                        s.scopeText
                      }
                    >
                      {record.scope ||
                        "Belirtilmedi"}
                    </div>
                  </div>

                  <div
                    style={
                      s.actions
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/admin/documentation/instructions/${record.id}`;
                      }}
                      style={
                        s.editButton
                      }
                    >
                      <Pencil
                        size={14}
                      />

                      Tasarla
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/admin/documentation/instructions/${record.id}?mode=preview`;
                      }}
                      style={
                        s.previewButton
                      }
                    >
                      <Eye
                        size={14}
                      />

                      Görüntüle
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/admin/documentation/instructions/${record.id}?mode=download`;
                      }}
                      style={
                        s.downloadButton
                      }
                    >
                      <Download
                        size={14}
                      />

                      PDF
                    </button>

                    {!record.isSystem ? (
                      <button
                        type="button"
                        onClick={() =>
                          void remove(
                            record
                          )
                        }
                        disabled={
                          deletingId ===
                          record.id
                        }
                        style={
                          s.deleteButton
                        }
                      >
                        {deletingId ===
                        record.id ? (
                          <Loader2
                            size={15}
                            className="spin"
                          />
                        ) : (
                          <Trash2
                            size={15}
                          />
                        )}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {showEditor ? (
        <div
          style={
            s.overlay
          }
        >
          <div
            style={
              s.modal
            }
          >
            <div
              style={
                s.modalHeader
              }
            >
              <div>
                <h2
                  style={
                    s.modalTitle
                  }
                >
                  {editor.id
                    ? "Talimatı Düzenle"
                    : "Yeni Talimat"}
                </h2>

                <p
                  style={
                    s.modalText
                  }
                >
                  Temel talimat
                  bilgilerini
                  oluşturun. İçerik
                  tasarımı sonraki
                  ekranda
                  detaylandırılacaktır.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditor(
                    false
                  )
                }
                disabled={
                  saving
                }
                style={
                  s.close
                }
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div
              className="editorGrid"
              style={
                s.editorGrid
              }
            >
              <Field
                label="Talimat Kodu"
                value={
                  editor.instructionCode
                }
                disabled={
                  Boolean(
                    editor.id
                  )
                }
                placeholder="Örn. TLM-ISG-001"
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      instructionCode:
                        value.toUpperCase(),
                    })
                  )
                }
              />

              <Field
                label="Kısa Başlık"
                value={
                  editor.shortTitle
                }
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      shortTitle:
                        value,
                    })
                  )
                }
              />

              <Field
                label="Tam Başlık"
                value={
                  editor.title
                }
                full
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      title:
                        value,
                    })
                  )
                }
              />

              <SelectField
                label="Kategori"
                value={
                  editor.category
                }
                options={[
                  [
                    "GENERAL",
                    "Genel",
                  ],

                  [
                    "OHS",
                    "İSG",
                  ],

                  [
                    "HEALTH",
                    "Sağlık",
                  ],

                  [
                    "PPE",
                    "KKD",
                  ],

                  [
                    "MACHINE",
                    "Makine / Ekipman",
                  ],

                  [
                    "ELECTRICAL",
                    "Elektrik",
                  ],

                  [
                    "CHEMICAL",
                    "Kimyasal",
                  ],

                  [
                    "EMERGENCY",
                    "Acil Durum",
                  ],

                  [
                    "WORK_PERMIT",
                    "Çalışma İzinleri",
                  ],

                  [
                    "OTHER",
                    "Diğer",
                  ],
                ]}
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      category:
                        value as Exclude<
                          Category,
                          "ALL"
                        >,
                    })
                  )
                }
              />

              <SelectField
                label="Durum"
                value={
                  editor.status
                }
                options={[
                  [
                    "DRAFT",
                    "Taslak",
                  ],

                  [
                    "PUBLISHED",
                    "Yayında",
                  ],

                  [
                    "REVISION",
                    "Revizyonda",
                  ],

                  [
                    "PASSIVE",
                    "Pasif",
                  ],
                ]}
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      status:
                        value as Status,
                    })
                  )
                }
              />

              <NumberField
                label="Versiyon"
                value={
                  editor.versionNo
                }
                min={1}
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      versionNo:
                        value,
                    })
                  )
                }
              />

              <NumberField
                label="Revizyon"
                value={
                  editor.revisionNo
                }
                min={0}
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      revisionNo:
                        value,
                    })
                  )
                }
              />

              <ToggleField
                label="Okundu Onayı"
                checked={
                  editor.requiresReadConfirmation
                }
                onChange={(
                  checked
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      requiresReadConfirmation:
                        checked,
                    })
                  )
                }
              />

              <TextArea
                label="Amaç"
                value={
                  editor.purpose
                }
                full
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      purpose:
                        value,
                    })
                  )
                }
              />

              <TextArea
                label="Kapsam"
                value={
                  editor.scope
                }
                full
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      scope:
                        value,
                    })
                  )
                }
              />

              <TextArea
                label="Sorumluluklar"
                value={
                  editor.responsibilities
                }
                full
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      responsibilities:
                        value,
                    })
                  )
                }
              />

              <TextArea
                label="Revizyon Nedeni"
                value={
                  editor.revisionReason
                }
                full
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      revisionReason:
                        value,
                    })
                  )
                }
              />

              <TextArea
                label="Talimat İçeriği JSON"
                value={
                  editor.contentJson
                }
                full
                code
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      contentJson:
                        value,
                    })
                  )
                }
              />

              <TextArea
                label="Ekler JSON"
                value={
                  editor.attachmentsJson
                }
                full
                code
                onChange={(
                  value
                ) =>
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      attachmentsJson:
                        value,
                    })
                  )
                }
              />
            </div>

            <div
              style={
                s.modalFooter
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowEditor(
                    false
                  )
                }
                disabled={
                  saving
                }
                style={
                  s.secondaryButton
                }
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() =>
                  void save()
                }
                disabled={
                  saving
                }
                style={
                  s.primaryButton
                }
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="spin"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}

                {editor.id
                  ? "Talimatı Güncelle"
                  : "Talimatı Oluştur"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .spin {
          animation:
            instruction-spin
            0.9s
            linear
            infinite;
        }

        @keyframes instruction-spin {
          to {
            transform:
              rotate(
                360deg
              );
          }
        }

        @media (max-width: 760px) {
          .editorGrid {
            grid-template-columns:
              1fr !important;
          }

          .kpiGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              ) !important;
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  full,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  placeholder?: string;

  disabled?: boolean;

  full?: boolean;
}) {
  return (
    <label
      style={{
        display:
          "grid",

        gap:
          6,

        gridColumn:
          full
            ? "1 / -1"
            : undefined,
      }}
    >
      <span
        style={
          s.fieldLabel
        }
      >
        {label}
      </span>

      <input
        value={
          value
        }
        disabled={
          disabled
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        style={
          s.field
        }
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;

  value: string;

  options:
    Array<
      [
        string,
        string
      ]
    >;

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <label
      style={{
        display:
          "grid",

        gap:
          6,
      }}
    >
      <span
        style={
          s.fieldLabel
        }
      >
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        style={
          s.field
        }
      >
        {options.map(
          ([
            value,
            text,
          ]) => (
            <option
              key={
                value
              }
              value={
                value
              }
            >
              {text}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;

  value: number;

  min: number;

  onChange:
    (
      value: number
    ) => void;
}) {
  return (
    <label
      style={{
        display:
          "grid",

        gap:
          6,
      }}
    >
      <span
        style={
          s.fieldLabel
        }
      >
        {label}
      </span>

      <input
        type="number"
        min={
          min
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Math.max(
              min,
              Number(
                event.target
                  .value ||
                  min
              )
            )
          )
        }
        style={
          s.field
        }
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;

  checked: boolean;

  onChange:
    (
      checked: boolean
    ) => void;
}) {
  return (
    <label
      style={
        s.toggleField
      }
    >
      <div>
        <div
          style={
            s.fieldLabel
          }
        >
          {label}
        </div>

        <small
          style={
            s.toggleHelp
          }
        >
          Çalışanın
          talimatı okuduğunu
          onaylaması istenir.
        </small>
      </div>

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .checked
          )
        }
        style={{
          width:
            20,

          height:
            20,
        }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  full,
  code,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  full?: boolean;

  code?: boolean;
}) {
  return (
    <label
      style={{
        display:
          "grid",

        gap:
          6,

        gridColumn:
          full
            ? "1 / -1"
            : undefined,
      }}
    >
      <span
        style={
          s.fieldLabel
        }
      >
        {label}
      </span>

      <textarea
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        style={{
          ...s.textarea,

          minHeight:
            code
              ? 165
              : 90,

          fontFamily:
            code
              ? "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
              : "inherit",
        }}
      />
    </label>
  );
}

const s: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight:
      "100vh",

    width:
      "100%",

    maxWidth:
      "100%",

    overflowX:
      "hidden",

    boxSizing:
      "border-box",

    background:
      "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",

    padding:
      18,

    display:
      "grid",

    gap:
      18,
  },

  hero: {
    width:
      "100%",

    boxSizing:
      "border-box",

    borderRadius:
      26,

    background:
      "linear-gradient(135deg,#4c0d1a 0%,#9f1239 50%,#ea580c 100%)",

    color:
      "#ffffff",

    padding:
      24,

    boxShadow:
      "0 24px 60px rgba(76,13,26,.20)",
  },

  badge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      8,

    borderRadius:
      999,

    background:
      "rgba(255,255,255,.14)",

    padding:
      "7px 11px",

    fontSize:
      12,

    fontWeight:
      900,
  },

  heroTitle: {
    margin:
      "16px 0 8px",

    fontSize:
      "clamp(26px,3vw,40px)",

    fontWeight:
      950,
  },

  heroText: {
    margin:
      0,

    maxWidth:
      900,

    color:
      "rgba(255,255,255,.84)",

    lineHeight:
      1.6,
  },

  heroButton: {
    marginTop:
      16,

    minHeight:
      44,

    borderRadius:
      13,

    border:
      "1px solid rgba(255,255,255,.24)",

    background:
      "rgba(255,255,255,.14)",

    color:
      "#ffffff",

    padding:
      "0 15px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      8,

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  kpiGrid: {
    marginTop:
      22,

    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(150px,1fr))",

    gap:
      10,
  },

  kpiCard: {
    borderRadius:
      16,

    border:
      "1px solid rgba(255,255,255,.16)",

    background:
      "rgba(255,255,255,.10)",

    padding:
      14,
  },

  kpiLabel: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      7,

    color:
      "rgba(255,255,255,.80)",

    fontSize:
      11,

    fontWeight:
      850,
  },

  kpiValue: {
    marginTop:
      7,

    fontSize:
      25,

    fontWeight:
      950,
  },

  error: {
    borderRadius:
      14,

    border:
      "1px solid #fecaca",

    background:
      "#fef2f2",

    color:
      "#b91c1c",

    padding:
      13,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      8,

    fontWeight:
      800,
  },

  success: {
    borderRadius:
      14,

    border:
      "1px solid #bbf7d0",

    background:
      "#ecfdf5",

    color:
      "#047857",

    padding:
      13,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      8,

    fontWeight:
      800,
  },

  filters: {
    borderRadius:
      20,

    border:
      "1px solid #e5e7eb",

    background:
      "#ffffff",

    padding:
      15,

    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      9,

    alignItems:
      "center",
  },

  searchWrap: {
    position:
      "relative",

    flex:
      "1 1 320px",

    minWidth:
      0,
  },

  searchIcon: {
    position:
      "absolute",

    left:
      13,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    color:
      "#94a3b8",
  },

  input: {
    width:
      "100%",

    minWidth:
      0,

    height:
      43,

    borderRadius:
      12,

    border:
      "1px solid #dbe3ec",

    padding:
      "0 12px 0 40px",

    boxSizing:
      "border-box",
  },

  select: {
    minWidth:
      160,

    height:
      43,

    borderRadius:
      12,

    border:
      "1px solid #dbe3ec",

    padding:
      "0 10px",
  },

  secondaryButton: {
    minHeight:
      43,

    borderRadius:
      12,

    border:
      "1px solid #dbe3ec",

    background:
      "#ffffff",

    color:
      "#475569",

    padding:
      "0 12px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      7,

    fontWeight:
      850,

    cursor:
      "pointer",
  },

  primaryButton: {
    minHeight:
      43,

    borderRadius:
      12,

    border:
      0,

    background:
      "#6b1020",

    color:
      "#ffffff",

    padding:
      "0 15px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      7,

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  sectionHeader: {
    display:
      "flex",

    flexWrap:
      "wrap",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      10,
  },

  sectionTitle: {
    margin:
      0,

    color:
      "#0f172a",

    fontSize:
      24,

    fontWeight:
      950,
  },

  sectionText: {
    margin:
      "5px 0 0",

    color:
      "#64748b",

    fontSize:
      13,
  },

  count: {
    borderRadius:
      999,

    background:
      "#f1f5f9",

    color:
      "#475569",

    padding:
      "7px 11px",

    fontSize:
      12,

    fontWeight:
      900,
  },

  loading: {
    minHeight:
      320,

    borderRadius:
      20,

    border:
      "1px solid #e5e7eb",

    background:
      "#ffffff",

    display:
      "grid",

    placeItems:
      "center",

    color:
      "#64748b",
  },

  empty: {
    minHeight:
      300,

    borderRadius:
      20,

    border:
      "1px dashed #cbd5e1",

    background:
      "#ffffff",

    display:
      "grid",

    placeItems:
      "center",

    color:
      "#94a3b8",
  },

  cards: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(300px,1fr))",

    gap:
      14,
  },

  card: {
    minWidth:
      0,

    borderRadius:
      20,

    border:
      "1px solid #e5e7eb",

    background:
      "#ffffff",

    padding:
      17,

    boxShadow:
      "0 12px 30px rgba(15,23,42,.05)",

    display:
      "grid",

    gap:
      14,
  },

  cardTop: {
    display:
      "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap:
      12,
  },

  codeRow: {
    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      7,
  },

  code: {
    borderRadius:
      999,

    background:
      "#f1f5f9",

    color:
      "#475569",

    padding:
      "4px 8px",

    fontSize:
      10,

    fontWeight:
      900,
  },

  system: {
    borderRadius:
      999,

    background:
      "#eff6ff",

    color:
      "#1d4ed8",

    padding:
      "4px 8px",

    fontSize:
      10,

    fontWeight:
      900,
  },

  confirmationChip: {
    borderRadius:
      999,

    background:
      "#fdf2f8",

    color:
      "#9d174d",

    padding:
      "4px 8px",

    fontSize:
      10,

    fontWeight:
      900,
  },

  cardTitle: {
    margin:
      "9px 0 4px",

    color:
      "#0f172a",

    fontSize:
      18,

    fontWeight:
      950,
  },

  cardText: {
    margin:
      0,

    color:
      "#64748b",

    fontSize:
      12,

    lineHeight:
      1.55,
  },

  status: {
    flex:
      "0 0 auto",

    borderRadius:
      999,

    padding:
      "5px 9px",

    fontSize:
      10,

    fontWeight:
      900,
  },

  metaGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",

    gap:
      9,
  },

  meta: {
    borderRadius:
      12,

    background:
      "#f8fafc",

    padding:
      10,
  },

  metaLabel: {
    color:
      "#94a3b8",

    fontSize:
      9,

    fontWeight:
      900,
  },

  metaValue: {
    marginTop:
      4,

    color:
      "#0f172a",

    fontSize:
      12,

    fontWeight:
      900,
  },

  scopeBox: {
    borderRadius:
      13,

    border:
      "1px solid #eef2f7",

    padding:
      11,
  },

  scopeText: {
    marginTop:
      5,

    color:
      "#475569",

    fontSize:
      12,

    lineHeight:
      1.5,
  },

  actions: {
    display:
      "flex",

    justifyContent:
      "flex-end",

    flexWrap:
      "wrap",

    gap:
      7,
  },

  editButton: {
    minHeight:
      38,

    borderRadius:
      10,

    border:
      "1px solid #bfdbfe",

    background:
      "#eff6ff",

    color:
      "#1d4ed8",

    padding:
      "0 11px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      6,

    fontWeight:
      850,

    cursor:
      "pointer",
  },

  previewButton: {
    minHeight:
      38,

    borderRadius:
      10,

    border:
      "1px solid #bbf7d0",

    background:
      "#ecfdf5",

    color:
      "#047857",

    padding:
      "0 11px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      6,

    fontWeight:
      850,

    cursor:
      "pointer",
  },

  downloadButton: {
    minHeight:
      38,

    borderRadius:
      10,

    border:
      "1px solid #fed7aa",

    background:
      "#fff7ed",

    color:
      "#c2410c",

    padding:
      "0 11px",

    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      6,

    fontWeight:
      850,

    cursor:
      "pointer",
  },

  deleteButton: {
    width:
      38,

    height:
      38,

    borderRadius:
      10,

    border:
      "1px solid #fecaca",

    background:
      "#fef2f2",

    color:
      "#b91c1c",

    display:
      "grid",

    placeItems:
      "center",

    cursor:
      "pointer",
  },

  overlay: {
    position:
      "fixed",

    inset:
      0,

    zIndex:
      1000,

    background:
      "rgba(15,23,42,.48)",

    display:
      "grid",

    placeItems:
      "center",

    padding:
      16,
  },

  modal: {
    width:
      "min(960px,100%)",

    maxHeight:
      "92vh",

    overflowY:
      "auto",

    borderRadius:
      24,

    background:
      "#ffffff",

    boxShadow:
      "0 30px 80px rgba(15,23,42,.28)",
  },

  modalHeader: {
    position:
      "sticky",

    top:
      0,

    zIndex:
      2,

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      12,

    padding:
      18,

    borderBottom:
      "1px solid #e5e7eb",

    background:
      "#ffffff",
  },

  modalTitle: {
    margin:
      0,

    color:
      "#0f172a",

    fontSize:
      22,

    fontWeight:
      950,
  },

  modalText: {
    margin:
      "5px 0 0",

    color:
      "#64748b",

    fontSize:
      12,
  },

  close: {
    width:
      40,

    height:
      40,

    borderRadius:
      12,

    border:
      "1px solid #e5e7eb",

    background:
      "#ffffff",

    display:
      "grid",

    placeItems:
      "center",

    cursor:
      "pointer",
  },

  editorGrid: {
    padding:
      18,

    display:
      "grid",

    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",

    gap:
      14,
  },

  modalFooter: {
    position:
      "sticky",

    bottom:
      0,

    display:
      "flex",

    justifyContent:
      "flex-end",

    gap:
      8,

    padding:
      16,

    borderTop:
      "1px solid #e5e7eb",

    background:
      "#ffffff",
  },

  fieldLabel: {
    color:
      "#475569",

    fontSize:
      11,

    fontWeight:
      900,
  },

  field: {
    width:
      "100%",

    minWidth:
      0,

    height:
      43,

    borderRadius:
      11,

    border:
      "1px solid #dbe3ec",

    padding:
      "0 11px",

    boxSizing:
      "border-box",
  },

  textarea: {
    width:
      "100%",

    minWidth:
      0,

    resize:
      "vertical",

    borderRadius:
      11,

    border:
      "1px solid #dbe3ec",

    padding:
      11,

    boxSizing:
      "border-box",

    lineHeight:
      1.5,
  },

  toggleField: {
    minHeight:
      72,

    border:
      "1px solid #e5e7eb",

    borderRadius:
      12,

    padding:
      12,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      12,
  },

  toggleHelp: {
    display:
      "block",

    marginTop:
      4,

    color:
      "#94a3b8",

    lineHeight:
      1.35,
  },
};