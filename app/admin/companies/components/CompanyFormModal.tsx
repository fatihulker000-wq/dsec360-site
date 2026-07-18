"use client";

import type {
  CompanyFormData,
} from "../types";

import {
  BRAND,
} from "../constants";

interface Props {
  mode: "CREATE" | "EDIT";
  form: CompanyFormData;
  saving: boolean;
  isMobile: boolean;
  onChange: (
    value: CompanyFormData
  ) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function CompanyFormModal({
  mode,
  form,
  saving,
  isMobile,
  onChange,
  onSave,
  onClose,
}: Props) {
  const setField = <
    K extends keyof CompanyFormData
  >(
    key: K,
    value: CompanyFormData[K]
  ) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

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
        padding: isMobile
          ? 0
          : 20,
        background:
          "rgba(15,23,42,0.58)",
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "100%",
          maxWidth: 920,
          maxHeight: isMobile
            ? "100vh"
            : "92vh",
          overflowY: "auto",
          borderRadius: isMobile
            ? 0
            : 24,
          background: "#fff",
          boxShadow:
            "0 28px 80px rgba(15,23,42,0.28)",
        }}
      >
        <div
          style={{
            padding: 22,
            background:
              `linear-gradient(135deg,${BRAND.redDark},${BRAND.red})`,
            color: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.8,
            }}
          >
            {mode === "CREATE"
              ? "YENİ KAYIT"
              : "FİRMA GÜNCELLEME"}
          </div>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 28,
            }}
          >
            {mode === "CREATE"
              ? "Yeni Firma Ekle"
              : "Firma Bilgilerini Düzenle"}
          </h2>
        </div>

        <div
          style={{
            padding: 22,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 12,
          }}
        >
          <InputField
            label="Firma Adı"
            value={form.name}
            onChange={(value) =>
              setField("name", value)
            }
          />

          <InputField
            label="Yetkili"
            value={form.yetkili || ""}
            onChange={(value) =>
              setField("yetkili", value)
            }
          />

          <InputField
            label="Telefon"
            value={form.phone || ""}
            onChange={(value) =>
              setField("phone", value)
            }
          />

          <InputField
            label="E-posta"
            type="email"
            value={form.email || ""}
            onChange={(value) =>
              setField("email", value)
            }
          />

          <InputField
            label="SGK Sicil No"
            value={
              form.sgk_sicil_no ||
              ""
            }
            onChange={(value) =>
              setField(
                "sgk_sicil_no",
                value
              )
            }
          />

          <InputField
            label="NACE Kodu"
            value={
              form.nace_kodu ||
              ""
            }
            onChange={(value) =>
              setField(
                "nace_kodu",
                value
              )
            }
          />

          <SelectField
            label="Tehlike Sınıfı"
            value={
              form.tehlike_sinifi ||
              ""
            }
            onChange={(value) =>
              setField(
                "tehlike_sinifi",
                value
              )
            }
            options={[
              {
                value: "",
                label:
                  "Tehlike Sınıfı Seç",
              },
              {
                value:
                  "Az Tehlikeli",
                label:
                  "Az Tehlikeli",
              },
              {
                value:
                  "Tehlikeli",
                label:
                  "Tehlikeli",
              },
              {
                value:
                  "Çok Tehlikeli",
                label:
                  "Çok Tehlikeli",
              },
            ]}
          />

          <InputField
            label="Çalışan Sayısı"
            type="number"
            value={String(
              form.calisan_sayisi ||
                0
            )}
            onChange={(value) =>
              setField(
                "calisan_sayisi",
                Number(value || 0)
              )
            }
          />

          <InputField
            label="Sektör"
            value={form.sektor || ""}
            onChange={(value) =>
              setField("sektor", value)
            }
          />

          <InputField
            label="İSG Uzmanı"
            value={
              form.isg_uzmani ||
              ""
            }
            onChange={(value) =>
              setField(
                "isg_uzmani",
                value
              )
            }
          />

          <InputField
            label="İşyeri Hekimi"
            value={
              form.isyeri_hekimi ||
              ""
            }
            onChange={(value) =>
              setField(
                "isyeri_hekimi",
                value
              )
            }
          />

          <InputField
            label="DSP"
            value={form.dsp || ""}
            onChange={(value) =>
              setField("dsp", value)
            }
          />

          <label
            style={{
              gridColumn:
                "1 / -1",
            }}
          >
            <span style={labelStyle}>
              Adres
            </span>

            <textarea
              rows={4}
              value={
                form.address || ""
              }
              onChange={(event) =>
                setField(
                  "address",
                  event.target.value
                )
              }
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          {mode === "EDIT" ? (
            <SelectField
              label="Firma Durumu"
              value={
                form.is_active ===
                false
                  ? "PASSIVE"
                  : "ACTIVE"
              }
              onChange={(value) =>
                setField(
                  "is_active",
                  value === "ACTIVE"
                )
              }
              options={[
                {
                  value: "ACTIVE",
                  label: "Aktif",
                },
                {
                  value: "PASSIVE",
                  label: "Pasif",
                },
              ]}
            />
          ) : null}

          <div
            style={{
              gridColumn:
                "1 / -1",
              display: "flex",
              justifyContent:
                "flex-end",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={
                secondaryButton
              }
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{
                ...primaryButton,
                opacity: saving
                  ? 0.65
                  : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Kaydediliyor..."
                : "Kaydet"}
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
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <label>
      <span style={labelStyle}>
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={inputStyle}
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
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span style={labelStyle}>
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={{
          ...inputStyle,
          background: "#fff",
        }}
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

const labelStyle:
  React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 800,
    color: BRAND.muted,
  };

const inputStyle:
  React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border:
      `1px solid ${BRAND.border}`,
  };

const secondaryButton:
  React.CSSProperties = {
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    background: "#6b7280",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };

const primaryButton:
  React.CSSProperties = {
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    background: BRAND.green,
    color: "#fff",
    fontWeight: 900,
  };