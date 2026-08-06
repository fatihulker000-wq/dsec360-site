"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

type TemplateSection = {
  id: string;
  title: string;
  order: number;
  columns?: number;
};

type TemplateField = {
  id: string;
  sectionId: string;
  label: string;
  type: string;
  required?: boolean;
  order: number;
  colSpan?: number;
  options?: string[];
};

type FormTemplate = {
  id: string;
  template_code: string;
  title: string;
  short_title: string | null;
  description: string | null;
  legal_basis: string | null;
  version_no: number;
  revision_no: number;
  status: string;
  schema_json: Record<string, unknown> | null;
  sections_json: TemplateSection[] | null;
  fields_json: TemplateField[] | null;
};

type ApiResponse = {
  success?: boolean;
  record?: FormTemplate | null;
  error?: string;
  detail?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    TEXT: "Metin",
    TEXTAREA: "Uzun Metin",
    EMAIL: "E-Posta",
    PHONE: "Telefon",
    NATIONAL_ID: "T.C. Kimlik",
    NUMBER: "Sayı",
    DECIMAL: "Ondalıklı Sayı",
    DATE: "Tarih",
    RADIO: "Tek Seçim",
    YES_NO: "Evet / Hayır",
    YES_NO_NOTE: "Evet / Hayır + Açıklama",
    PHOTO: "Fotoğraf",
    SIGNATURE: "İmza",
    INFO: "Bilgilendirme",
    CALCULATED: "Hesaplanan Alan",
    SMOKING_HISTORY: "Sigara Öyküsü",
    ALCOHOL_HISTORY: "Alkol Öyküsü",
    FITNESS_STATEMENT: "Uygunluk Kanaati",
    CONDITIONAL_FITNESS_STATEMENT:
      "Şartlı Uygunluk Kanaati",
  };

  return map[type] || type;
}

function FieldPreview({
  field,
}: {
  field: TemplateField;
}) {
  if (field.type === "INFO") {
    return (
      <div
        style={{
          border:
            "1px solid #cbd5e1",
          padding: 10,
          fontSize: 11,
          lineHeight: 1.5,
          background: "#f8fafc",
        }}
      >
        {field.label}
      </div>
    );
  }

  if (field.type === "PHOTO") {
    return (
      <div
        style={{
          border:
            "1px solid #0f172a",
          minHeight: 115,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        Fotoğraf
      </div>
    );
  }

  if (
    field.type === "YES_NO" ||
    field.type === "RADIO"
  ) {
    const options =
      field.options?.length
        ? field.options
        : ["Hayır", "Evet"];

    return (
      <div style={{ display: "grid", gap: 5 }}>
        <div style={styles.fieldLabel}>
          {field.label}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            minHeight: 24,
            alignItems: "center",
          }}
        >
          {options.map((option) => (
            <span
              key={option}
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: 5,
                fontSize: 11,
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  border:
                    "1px solid #0f172a",
                }}
              />
              {option}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "YES_NO_NOTE") {
    return (
      <div style={{ display: "grid", gap: 5 }}>
        <div style={styles.fieldLabel}>
          {field.label}
        </div>

        <div
          style={{
            display: "flex",
            gap: 15,
            fontSize: 11,
          }}
        >
          <span>□ Hayır</span>
          <span>□ Evet</span>
        </div>

        <div style={styles.lineArea} />
      </div>
    );
  }

  if (
    field.type === "SIGNATURE"
  ) {
    return (
      <div style={{ display: "grid", gap: 5 }}>
        <div style={styles.fieldLabel}>
          {field.label}
        </div>

        <div
          style={{
            minHeight: 70,
            border:
              "1px solid #0f172a",
          }}
        />
      </div>
    );
  }

  if (
    field.type === "TEXTAREA" ||
    field.type ===
      "SMOKING_HISTORY" ||
    field.type ===
      "ALCOHOL_HISTORY" ||
    field.type ===
      "FITNESS_STATEMENT" ||
    field.type ===
      "CONDITIONAL_FITNESS_STATEMENT"
  ) {
    return (
      <div style={{ display: "grid", gap: 5 }}>
        <div style={styles.fieldLabel}>
          {field.label}
        </div>
        <div style={styles.textArea} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={styles.fieldLabel}>
        {field.label}
        {field.required ? " *" : ""}
      </div>
      <div style={styles.singleLine} />
    </div>
  );
}

export default function FormTemplateDesignerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{
    id: string;
  }>();

  const id = clean(params?.id);
  const mode = clean(searchParams.get("mode")).toLowerCase();
  const isPreviewMode = mode === "preview";
  const isDownloadMode = mode === "download";
  const isReadOnlyMode = isPreviewMode || isDownloadMode;

  const [record, setRecord] =
    useState<FormTemplate | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [selectedSectionId, setSelectedSectionId] =
    useState("");

  const sections = useMemo(
    () =>
      Array.isArray(
        record?.sections_json
      )
        ? [...record.sections_json].sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0)
          )
        : [],
    [record]
  );

  const fields = useMemo(
    () =>
      Array.isArray(
        record?.fields_json
      )
        ? [...record.fields_json].sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0)
          )
        : [],
    [record]
  );

  useEffect(() => {
    if (!id) {
      setError(
        "Form şablonu kimliği bulunamadı."
      );
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/documentation/form-templates?id=${encodeURIComponent(
            id
          )}`,
          {
            cache: "no-store",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

        const json =
          (await response
            .json()
            .catch(() => ({}))) as ApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(
            json.detail ||
              json.error ||
              "Form şablonu alınamadı."
          );
        }

        if (!json.record) {
          throw new Error(
            "Form şablonu bulunamadı."
          );
        }

        setRecord(json.record);

        const firstSection =
          Array.isArray(
            json.record.sections_json
          )
            ? json.record
                .sections_json[0]
            : null;

        setSelectedSectionId(
          firstSection?.id || ""
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Form şablonu alınamadı."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleDownloadBlankForm = () => {
    const oldTitle = document.title;

    document.title =
      "Ek-2_Ise_Giris_Periyodik_Muayene_Formu";

    window.setTimeout(() => {
      window.print();

      window.setTimeout(() => {
        document.title = oldTitle;
      }, 600);
    }, 250);
  };

  useEffect(() => {
    if (
      loading ||
      !record ||
      !isDownloadMode
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleDownloadBlankForm();
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loading, record, isDownloadMode]);

  const saveTemplate = async (
    status?: string
  ) => {
    if (!record) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/documentation/form-templates",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            id: record.id,
            title: record.title,
            shortTitle:
              record.short_title,
            description:
              record.description,
            legalBasis:
              record.legal_basis,
            versionNo:
              record.version_no,
            revisionNo:
              record.revision_no,
            schemaJson:
              record.schema_json || {},
            sectionsJson: sections,
            fieldsJson: fields,
            status:
              status ||
              record.status,
          }),
        }
      );

      const json =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(
          json.detail ||
            json.error ||
            "Form şablonu kaydedilemedi."
        );
      }

      if (json.record) {
        setRecord(json.record);
      }

      setMessage(
        status === "PUBLISHED"
          ? "Ek-2 şablonu yayımlandı."
          : "Ek-2 şablonu kaydedildi."
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Form şablonu kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.loading}>
        <Loader2
          size={34}
          className="designerSpin"
        />
        <strong>
          Ek-2 şablonu hazırlanıyor...
        </strong>

        <style jsx>{`
          .designerSpin {
            animation: designer-spin
              0.9s linear infinite;
          }

          @keyframes designer-spin {
            to {
              transform: rotate(
                360deg
              );
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main style={styles.page}>
        <section style={styles.errorCard}>
          <h1>
            Form şablonu açılamadı
          </h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/documentation/form-templates"
              )
            }
            style={styles.primaryButton}
          >
            Form Şablonlarına Dön
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div
          className="noPrint"
          style={styles.toolbar}
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/documentation/form-templates"
              )
            }
            style={styles.secondaryButton}
          >
            <ArrowLeft size={17} />
            Form Şablonları
          </button>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("ek2-print-root")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
              style={styles.secondaryButton}
            >
              <Eye size={17} />
              Formu Görüntüle
            </button>

            <button
              type="button"
              onClick={handleDownloadBlankForm}
              style={styles.secondaryButton}
            >
              <Download size={17} />
              Boş Formu İndir
            </button>

            {!isReadOnlyMode ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveTemplate()
                  }
                  style={styles.secondaryButton}
                >
                  {saving ? (
                    <Loader2
                      size={16}
                      className="designerSpin"
                    />
                  ) : (
                    <Save size={16} />
                  )}
                  Kaydet
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveTemplate(
                      "PUBLISHED"
                    )
                  }
                  style={styles.primaryButton}
                >
                  <ShieldCheck size={17} />
                  Yayınla
                </button>
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div style={styles.errorMessage}>
            {error}
          </div>
        ) : null}

        {message ? (
          <div style={styles.successMessage}>
            <CheckCircle2 size={17} />
            {message}
          </div>
        ) : null}

        <section style={styles.hero}>
          <div>
            <div style={styles.heroBadge}>
              <FileText size={16} />
              {isReadOnlyMode
                ? "Boş Form Önizleme"
                : "Form Tasarım Merkezi"}
            </div>

            <h1 style={styles.heroTitle}>
              {record.short_title ||
                record.title}
            </h1>

            <p style={styles.heroText}>
              Aynı Ek-2 formu işe giriş
              muayenesinde ve yasal
              periyotlarda yapılan
              periyodik muayenelerde
              kullanılır.
            </p>
          </div>

          <div style={styles.heroMeta}>
            <span style={styles.heroChip}>
              {record.template_code}
            </span>

            <span style={styles.heroChip}>
              v{record.version_no}
            </span>

            <span style={styles.heroChip}>
              Rev. {record.revision_no}
            </span>

            <span style={styles.heroChip}>
              {record.status}
            </span>
          </div>
        </section>

        <div
          className="designerLayout"
          style={{
            ...styles.designerLayout,
            gridTemplateColumns: isReadOnlyMode
              ? "minmax(0,1fr)"
              : "230px minmax(0,1fr) 250px",
          }}
        >
          <aside
            className="noPrint"
            style={{
              ...styles.leftPanel,
              display: isReadOnlyMode
                ? "none"
                : "grid",
            }}
          >
            <div style={styles.panelTitle}>
              <ClipboardList size={17} />
              Form Bölümleri
            </div>

            <div
              style={{
                display: "grid",
                gap: 7,
              }}
            >
              {sections.map(
                (section, index) => {
                  const active =
                    selectedSectionId ===
                    section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(
                          section.id
                        );

                        document
                          .getElementById(
                            `section-${section.id}`
                          )
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      style={{
                        borderRadius: 12,
                        border: active
                          ? "1px solid #7f1d1d"
                          : "1px solid #e5e7eb",
                        background: active
                          ? "#fff1f2"
                          : "#ffffff",
                        color: active
                          ? "#9f1239"
                          : "#475569",
                        padding: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        textAlign: "left",
                        fontWeight: 850,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: active
                            ? "#9f1239"
                            : "#f1f5f9",
                          color: active
                            ? "#ffffff"
                            : "#64748b",
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        {index + 1}
                      </span>

                      {section.title}
                    </button>
                  );
                }
              )}
            </div>
          </aside>

          <section
            id="ek2-print-root"
            style={styles.previewArea}
          >
            <div style={styles.a4Page}>
              <header style={styles.formHeader}>
                <div>
                  <div style={styles.formOldTitle}>
                    Ağır ve Tehlikeli
                    İşlerde Çalışacaklara
                    Ait Sağlık Raporu
                    Örneği
                  </div>

                  <h2 style={styles.formTitle}>
                    İŞE GİRİŞ / PERİYODİK
                    MUAYENE FORMU
                  </h2>
                </div>

                <div style={styles.ek2Badge}>
                  Ek-2
                </div>
              </header>

              <div style={styles.usageRow}>
                <span>
                  □ İşe Giriş Muayenesi
                </span>
                <span>
                  □ Periyodik Muayene
                </span>
              </div>

              {sections.map((section) => {
                const sectionFields =
                  fields.filter(
                    (field) =>
                      field.sectionId ===
                      section.id
                  );

                return (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    style={styles.formSection}
                  >
                    <div
                      style={
                        styles.formSectionTitle
                      }
                    >
                      {section.title}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          section.columns === 1
                            ? "1fr"
                            : section.columns === 3
                            ? "repeat(3,minmax(0,1fr))"
                            : section.columns === 4
                            ? "repeat(4,minmax(0,1fr))"
                            : "repeat(2,minmax(0,1fr))",
                        gap: 0,
                      }}
                    >
                      {sectionFields.map(
                        (field) => (
                          <div
                            key={field.id}
                            style={{
                              gridColumn:
                                field.colSpan === 2
                                  ? "1 / -1"
                                  : undefined,
                              borderRight:
                                "1px solid #0f172a",
                              borderBottom:
                                "1px solid #0f172a",
                              padding: 8,
                              minHeight: 48,
                            }}
                          >
                            <FieldPreview
                              field={field}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </section>
                );
              })}

              <footer style={styles.formFooter}>
                <div>
                  Şablon Kodu:{" "}
                  {record.template_code}
                </div>

                <div>
                  Versiyon:{" "}
                  {record.version_no} /
                  Revizyon:{" "}
                  {record.revision_no}
                </div>
              </footer>
            </div>
          </section>

          <aside
            className="noPrint"
            style={{
              ...styles.rightPanel,
              display: isReadOnlyMode
                ? "none"
                : "grid",
            }}
          >
            <div style={styles.panelTitle}>
              <Eye size={17} />
              Şablon Bilgileri
            </div>

            <div style={styles.infoList}>
              <InfoItem
                label="Form Kodu"
                value={
                  record.template_code
                }
              />

              <InfoItem
                label="Kullanım"
                value="İşe Giriş + Periyodik"
              />

              <InfoItem
                label="Bölüm Sayısı"
                value={String(
                  sections.length
                )}
              />

              <InfoItem
                label="Alan Sayısı"
                value={String(
                  fields.length
                )}
              />

              <InfoItem
                label="Hedef Modül"
                value="HEALTH"
              />

              <InfoItem
                label="Mobil"
                value="Görüntüleme / Kullanma"
              />
            </div>

            <div style={styles.notice}>
              Form oluşturma ve
              düzenleme yalnızca web
              tarafında yapılır. Mobil
              uygulama yayımlanmış boş
              şablonu indirir ve Sağlık
              Modülünde kullanır.
            </div>

            <div style={styles.noticeBlue}>
              Doldurulmuş çalışan sağlık
              kayıtları bu arşivde
              saklanmaz.
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .designerSpin {
          animation: designer-spin
            0.9s linear infinite;
        }

        @keyframes designer-spin {
          to {
            transform: rotate(
              360deg
            );
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body * {
            visibility: hidden !important;
          }

          #ek2-print-root,
          #ek2-print-root * {
            visibility: visible !important;
          }

          #ek2-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          #ek2-print-root > div {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .noPrint {
            display: none !important;
          }
        }

        @media (max-width: 1200px) {
          .designerLayout {
            grid-template-columns:
              220px minmax(0,1fr) !important;
          }

          .designerLayout > aside:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 800px) {
          .designerLayout {
            grid-template-columns:
              1fr !important;
          }

          .designerLayout > aside {
            position: static !important;
          }
        }
      `}</style>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>
        {label}
      </div>

      <div style={styles.infoValue}>
        {value}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    background:
      "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
    padding: 18,
    boxSizing: "border-box",
  },

  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    gap: 12,
    background: "#f8fafc",
    color: "#64748b",
  },

  container: {
    width: "100%",
    display: "grid",
    gap: 16,
  },

  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    gap: 10,
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  primaryButton: {
    minHeight: 42,
    borderRadius: 12,
    border: 0,
    background: "#6b1020",
    color: "#ffffff",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    border:
      "1px solid #dbe3ec",
    background: "#ffffff",
    color: "#475569",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 850,
    cursor: "pointer",
  },

  errorMessage: {
    borderRadius: 13,
    border:
      "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    padding: 12,
    fontWeight: 800,
  },

  successMessage: {
    borderRadius: 13,
    border:
      "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#047857",
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
  },

  hero: {
    borderRadius: 24,
    background:
      "linear-gradient(135deg,#4c0d1a 0%,#9f1239 52%,#ea580c 100%)",
    color: "#ffffff",
    padding: 22,
    display: "flex",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    gap: 16,
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    background:
      "rgba(255,255,255,0.14)",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 900,
  },

  heroTitle: {
    margin: "14px 0 7px",
    fontSize:
      "clamp(25px,3vw,38px)",
    lineHeight: 1.1,
    fontWeight: 950,
  },

  heroText: {
    margin: 0,
    maxWidth: 800,
    color:
      "rgba(255,255,255,0.84)",
    lineHeight: 1.6,
  },

  heroMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    alignContent: "flex-start",
  },

  heroChip: {
    borderRadius: 999,
    background:
      "rgba(255,255,255,0.14)",
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 900,
  },

  designerLayout: {
    display: "grid",
    gridTemplateColumns:
      "230px minmax(0,1fr) 250px",
    gap: 14,
    alignItems: "start",
  },

  leftPanel: {
    position: "sticky",
    top: 12,
    borderRadius: 18,
    border:
      "1px solid #e5e7eb",
    background: "#ffffff",
    padding: 13,
    display: "grid",
    gap: 12,
  },

  rightPanel: {
    position: "sticky",
    top: 12,
    borderRadius: 18,
    border:
      "1px solid #e5e7eb",
    background: "#ffffff",
    padding: 13,
    display: "grid",
    gap: 12,
  },

  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#0f172a",
    fontWeight: 950,
  },

  previewArea: {
    minWidth: 0,
    overflowX: "auto",
    borderRadius: 18,
    border:
      "1px solid #e5e7eb",
    background: "#cbd5e1",
    padding: 18,
  },

  a4Page: {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10mm",
    boxSizing: "border-box",
    boxShadow:
      "0 18px 45px rgba(15,23,42,0.18)",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  formHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: 15,
    border:
      "1px solid #0f172a",
    padding: 10,
  },

  formOldTitle: {
    fontSize: 10,
    marginBottom: 7,
  },

  formTitle: {
    margin: 0,
    fontSize: 17,
    textAlign: "center",
    letterSpacing: "0.01em",
  },

  ek2Badge: {
    fontSize: 14,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  usageRow: {
    display: "flex",
    gap: 30,
    borderLeft:
      "1px solid #0f172a",
    borderRight:
      "1px solid #0f172a",
    borderBottom:
      "1px solid #0f172a",
    padding: 8,
    fontSize: 11,
    fontWeight: 800,
  },

  formSection: {
    borderLeft:
      "1px solid #0f172a",
    borderTop:
      "1px solid #0f172a",
  },

  formSectionTitle: {
    borderRight:
      "1px solid #0f172a",
    borderBottom:
      "1px solid #0f172a",
    background: "#e2e8f0",
    padding: "7px 8px",
    fontSize: 11,
    fontWeight: 950,
  },

  fieldLabel: {
    fontSize: 10,
    lineHeight: 1.35,
    fontWeight: 800,
  },

  singleLine: {
    minHeight: 19,
    borderBottom:
      "1px dotted #475569",
  },

  lineArea: {
    minHeight: 28,
    borderBottom:
      "1px dotted #475569",
  },

  textArea: {
    minHeight: 42,
    border:
      "1px solid #94a3b8",
  },

  formFooter: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: 15,
    border:
      "1px solid #0f172a",
    borderTop: 0,
    padding: 7,
    fontSize: 9,
  },

  infoList: {
    display: "grid",
    gap: 7,
  },

  infoItem: {
    borderRadius: 11,
    background: "#f8fafc",
    padding: 10,
  },

  infoLabel: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: 900,
  },

  infoValue: {
    marginTop: 4,
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  notice: {
    borderRadius: 12,
    background: "#fff7ed",
    color: "#9a3412",
    padding: 11,
    fontSize: 11,
    lineHeight: 1.5,
    fontWeight: 750,
  },

  noticeBlue: {
    borderRadius: 12,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: 11,
    fontSize: 11,
    lineHeight: 1.5,
    fontWeight: 750,
  },

  errorCard: {
    maxWidth: 800,
    margin: "70px auto",
    borderRadius: 20,
    border:
      "1px solid #fecaca",
    background: "#ffffff",
    padding: 25,
    textAlign: "center",
  },
};