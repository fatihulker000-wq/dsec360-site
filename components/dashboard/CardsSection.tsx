"use client";

import { BRAND, cardStyle, metricCardStyle, formatPercent } from "./styles";
import type { CbsSummary } from "./types";

type CardsSectionProps = {
  isMobile: boolean;
  adminRole: string;
  cbsSummary: CbsSummary | null;
  totalAssignments: number;
  completionRate: number;
  inProgressRate: number;
  riskRate: number;
};

export default function CardsSection({
  isMobile,
  adminRole,
  cbsSummary,
  totalAssignments,
  completionRate,
  inProgressRate,
  riskRate,
}: CardsSectionProps) {
  return (
    <>
      {adminRole === "super_admin" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle(isMobile)}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Yönetim</div>

            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 900,
                color: BRAND.text,
              }}
            >
              Firma Yönetimi
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: BRAND.muted,
                lineHeight: 1.7,
              }}
            >
              Firma ekleme, düzenleme ve firma atama işlemleri sadece süper
              admin tarafından yönetilir.
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/companies";
              }}
              style={{
                marginTop: 16,
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                background: BRAND.red,
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Firma Yönetimine Git
            </button>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            ...cardStyle(isMobile),
            border: `1px solid ${BRAND.border}`,
            background: BRAND.white,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              background: "#eef2ff",
              color: "#3730a3",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            ÇBS MODÜLÜ
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            Şikayet / Öneri Yönetimi
          </h3>

          <p style={{ marginTop: 10, color: BRAND.muted, lineHeight: 1.7 }}>
            Dış kullanıcılar tarafından gönderilen talepleri görüntüleyin,
            yönlendirin ve sonuçlandırın.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 10,
              marginTop: 14,
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
                {cbsSummary?.total || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#9f1239" }}>Yeni</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                  color: "#be123c",
                }}
              >
                {cbsSummary?.new || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#92400e" }}>İşlemde</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                  color: "#a16207",
                }}
              >
                {cbsSummary?.processing || 0}
              </div>
            </div>

            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#b91c1c" }}>SLA</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                  color: "#b91c1c",
                }}
              >
                {cbsSummary?.slaExceeded || 0}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = "/admin/cbs";
            }}
            style={{
              marginTop: 18,
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              background: "#1e3a8a",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ÇBS Paneline Git
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: isMobile ? 12 : 16,
          marginBottom: 20,
        }}
      >
        <div style={metricCardStyle(BRAND.slate, isMobile)}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 5,
              height: "100%",
              background: BRAND.slate,
            }}
          />
          <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Atama</div>
          <div
            style={{
              fontSize: isMobile ? 28 : 34,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            {totalAssignments}
          </div>
          <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
            Toplam eğitim atama yükü
          </div>
        </div>

        <div style={metricCardStyle(BRAND.green, isMobile)}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 5,
              height: "100%",
              background: BRAND.green,
            }}
          />
          <div style={{ fontSize: 13, color: BRAND.green }}>Tamamlanma</div>
          <div
            style={{
              fontSize: isMobile ? 28 : 34,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            %{formatPercent(completionRate)}
          </div>
          <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
            Tamamlanan eğitim oranı
          </div>
        </div>

        <div style={metricCardStyle(BRAND.blue, isMobile)}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 5,
              height: "100%",
              background: BRAND.blue,
            }}
          />
          <div style={{ fontSize: 13, color: BRAND.blue }}>Devam Eden</div>
          <div
            style={{
              fontSize: isMobile ? 28 : 34,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            %{formatPercent(inProgressRate)}
          </div>
          <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
            Açık süreçte kalan eğitimler
          </div>
        </div>

        <div style={metricCardStyle(BRAND.amber, isMobile)}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 5,
              height: "100%",
              background: BRAND.amber,
            }}
          />
          <div style={{ fontSize: 13, color: BRAND.amber }}>Riskli Oran</div>
          <div
            style={{
              fontSize: isMobile ? 28 : 34,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            %{formatPercent(riskRate)}
          </div>
          <div style={{ marginTop: 8, color: BRAND.muted, fontSize: 13 }}>
            Başlamamış eğitim yoğunluğu
          </div>
        </div>
      </div>
    </>
  );
}