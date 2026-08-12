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

type AnyRow = Record<string, any>;

type DoraFirm = {
  id: string;
  firm_name?: string | null;
  sgk_no?: string | null;
  tax_no?: string | null;
  tax_office?: string | null;
  mersis_no?: string | null;
  nace_code?: string | null;
  sector?: string | null;
  danger_class?: string | null;
  employee_count?: number | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  authorized_person?: string | null;
  setup_score?: number | null;
  setup_status?: string | null;
};

type SyncResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm | null;
  employees?: AnyRow[];
  risks?: AnyRow[];
  documents?: AnyRow[];
  riskTeam?: AnyRow[];
  authorities?: AnyRow;
  trainings?: {
    items?: AnyRow[];
    count?: number;
  };
  certificates?: {
    items?: AnyRow[];
    count?: number;
  };
  expert?: AnyRow;
  corporate?: AnyRow;
};

type Requirement = {
  id: string;
  title: string;
  description: string;
  output: string;
  priority: "CRITICAL" | "PRO";
  source: string;
  complete: boolean;
  robotCanProduce: boolean;
  route?: string;
};

type QueueItem = {
  id: string;
  title: string;
  detail: string;
  reason: string;
  type: "WARNING" | "ROBOT" | "DONE";
  domain: string;
  robotCanProduce: boolean;
};

function value(input: unknown) {
  return String(input ?? "").trim();
}

function arr(input: unknown): AnyRow[] {
  return Array.isArray(input)
    ? input.filter((x) => !!x && typeof x === "object")
    : [];
}

function num(input: unknown) {
  const n = Number(input ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pct(input: number) {
  return Math.max(0, Math.min(100, Math.round(input)));
}

function escapeHtml(input: unknown) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function today() {
  return new Date().toLocaleDateString("tr-TR");
}

async function readJson<T>(
  response: Response,
  serviceName: string
): Promise<T> {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    const raw = await response.text();

    throw new Error(
      `${serviceName} JSON döndürmedi. HTTP ${response.status}. ${raw
        .replace(/\s+/g, " ")
        .slice(0, 160)}`
    );
  }

  return (await response.json()) as T;
}

export default function DoraExpertPage() {
  const router = useRouter();
  const params = useParams();
  const firmId = value(params?.firmId);

  const [loading, setLoading] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [data, setData] =
    useState<SyncResponse | null>(null);

  const [lastAnalysisAt, setLastAnalysisAt] =
    useState<number>(0);

  const load = useCallback(async () => {
    if (!firmId) {
      setError("DORA firma ID bulunamadı.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/dora/mobile/sync?firmId=${encodeURIComponent(
          firmId
        )}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "x-api-key": "dsec_mobile_123",
          },
        }
      );

      const json =
        await readJson<SyncResponse>(
          response,
          "DORA Expert senkron servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA Expert verileri alınamadı."
        );
      }

      setData(json);

      setLastAnalysisAt(
        num(json.expert?.analyzedAtMillis)
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA Expert yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void load();
  }, [load]);

  const firm =
    data?.firm ?? null;

  const employees =
    arr(data?.employees);

  const risks =
    arr(data?.risks);

  const documents =
    arr(data?.documents);

  const riskTeam =
    arr(data?.riskTeam);

  const trainings =
    arr(data?.trainings?.items);

  const certificates =
    arr(data?.certificates?.items);

  const authorities =
    data?.authorities &&
    typeof data.authorities === "object"
      ? data.authorities
      : {};

  const authorityCount =
    [
      authorities.employer,
      authorities.isgExpert,
      authorities.doctor,
      authorities.otherHealthStaff,
    ].filter(Boolean).length;

  const completedTrainingCount =
    trainings.filter(
      (x) =>
        value(x.status).toUpperCase() ===
        "TAMAMLANDI"
    ).length;

  const participantCount =
    trainings.reduce(
      (total, training) =>
        total +
        arr(training.participants).length,
      0
    );

  const requirements =
    useMemo<Requirement[]>(() => {
      if (!firm) return [];

      const employeeCount =
        Math.max(
          employees.length,
          num(firm.employee_count)
        );

      const danger =
        value(firm.danger_class)
          .toUpperCase();

      const hasFirmIdentity =
        Boolean(value(firm.firm_name));

      const hasLegalIdentity =
        Boolean(
          value(firm.sgk_no) ||
            value(firm.tax_no)
        );

      const hasNace =
        Boolean(value(firm.nace_code));

      const hasDanger =
        Boolean(danger);

      const hasContact =
        Boolean(
          value(firm.address) &&
            value(firm.phone)
        );

      const hasAuthorized =
        Boolean(
          value(firm.authorized_person)
        );

      const hasEmployees =
        employeeCount > 0;

      const hasAuthorities =
        authorityCount >= 3;

      const hasRiskTeam =
        riskTeam.length >= 4;

      const hasRisk =
        risks.length > 0;

      const hasTraining =
        trainings.length > 0;

      const hasCompletedTraining =
        completedTrainingCount > 0;

      const hasCertificates =
        certificates.length > 0;

      const hasDocs =
        documents.length > 0;

      const docText = documents
        .map((x) =>
          `${value(x.document_type)} ${value(
            x.title
          )}`.toLocaleUpperCase("tr-TR")
        )
        .join(" | ");

      const hasPolicy =
        docText.includes("POLIT");

      const hasEmergencyPlan =
        docText.includes("ACIL") &&
        docText.includes("PLAN");

      const hasAnnualTraining =
        docText.includes("EGITIM") &&
        docText.includes("PLAN");

      const hasRiskTeamDoc =
        docText.includes("RISK") &&
        docText.includes("EKIP");

      const hasSupportTeam =
        docText.includes("DESTEK") ||
        docText.includes("YANGIN") ||
        docText.includes("ILK_YARDIM");

      const hasKkd =
        docText.includes("KKD");

      const hasInstructions =
        docText.includes("TALIMAT");

      const boardNeeded =
        employeeCount >= 50;

      const hasBoard =
        docText.includes("KURUL");

      const score = (
        id: string,
        title: string,
        description: string,
        output: string,
        priority: "CRITICAL" | "PRO",
        complete: boolean,
        robotCanProduce: boolean,
        source: string,
        route?: string
      ): Requirement => ({
        id,
        title,
        description,
        output,
        priority,
        complete,
        robotCanProduce,
        source,
        route,
      });

      return [
        score("FIRM_NAME","Firma ünvanı bilgisini tamamlayın","DORA çalışma alanının hukuki kimliği.","Firma profil kaydı","CRITICAL",hasFirmIdentity,false,"Company"),
        score("LEGAL_ID","SGK / vergi kimlik bilgilerini tamamlayın","Kurumsal kayıt ve çıktılarda kullanılacaktır.","Firma kimlik bilgileri","CRITICAL",hasLegalIdentity,false,"Company"),
        score("NACE","NACE kodunu tamamlayın","Faaliyet alanı ve tehlike analizinin temelidir.","NACE kaydı","CRITICAL",hasNace,false,"Company"),
        score("DANGER","Tehlike sınıfını doğrulayın","İSG yükümlülüklerinin kapsamını belirler.","Tehlike sınıfı kaydı","CRITICAL",hasDanger,false,"Company"),
        score("CONTACT","İşyeri iletişim bilgilerini tamamlayın","Resmî dokümanların firma üst bilgilerinde kullanılır.","İşyeri iletişim kaydı","PRO",hasContact,false,"Company"),
        score("AUTHORIZED","İşveren / işveren vekili bilgisini tamamlayın","Atama ve imza süreçleri için gereklidir.","Yetkili kaydı","CRITICAL",hasAuthorized,false,"Company"),
        score("EMPLOYEES","Çalışan listesini oluşturun","Risk, eğitim, kurul ve ekip süreçlerinin personel kaynağıdır.","Çalışan listesi","CRITICAL",hasEmployees,false,"Employee",`/admin/dora/${firmId}/employees`),
        score("AUTHORITIES","Kurumsal İSG yetkililerini tanımlayın","İSG uzmanı, işyeri hekimi ve diğer görevlilerin kayıtları.","Yetkili görevlendirme yapısı","CRITICAL",hasAuthorities,false,"Authority"),
        score("POLICY","İSG politikasını oluşturun","Kurumsal İSG yönetiminin temel politika dokümanı.","İSG Politikası PDF","PRO",hasPolicy,true,"Document",`/admin/dora/${firmId}/documents`),
        score("RISK_TEAM","Risk değerlendirme ekibini oluşturun","Risk değerlendirmesinin mevzuata uygun ekip yapısı.","Risk Değerlendirme Ekibi PDF","CRITICAL",hasRiskTeam,true,"Risk",`/admin/dora/${firmId}/risk-team`),
        score("RISK","Risk değerlendirmesi kayıtlarını oluşturun","DORA Fine Kinney değerlendirme kayıtları.","Fine Kinney Risk Değerlendirmesi PDF","CRITICAL",hasRisk,true,"Risk",`/admin/dora/${firmId}/risks`),
        score("EMERGENCY","Acil durum planını oluşturun","Acil durum organizasyonu ve müdahale yapısı.","Acil Durum Planı PDF","CRITICAL",hasEmergencyPlan,true,"Emergency"),
        score("SUPPORT_TEAM","Acil durum destek ekiplerini oluşturun","Yangın, arama-kurtarma, tahliye ve ilk yardım organizasyonu.","Destek Ekipleri Görevlendirme PDF","CRITICAL",hasSupportTeam,true,"Emergency"),
        score("TRAINING_PLAN","Yıllık eğitim planını oluşturun","İSG eğitimlerinin yıllık planlanması.","Yıllık Eğitim Planı PDF","CRITICAL",hasAnnualTraining,true,"Training",`/admin/dora/${firmId}/training`),
        score("TRAINING","DORA eğitim kayıtlarını oluşturun","Çalışanların DORA içindeki eğitim oturumları.","Eğitim kayıtları","CRITICAL",hasTraining,false,"Training",`/admin/dora/${firmId}/training`),
        score("TRAINING_COMPLETE","Planlanan eğitimleri tamamlayın","Tamamlanan eğitimler sertifika üretiminin temelidir.","Tamamlanmış eğitim kayıtları","CRITICAL",hasCompletedTraining,false,"Training",`/admin/dora/${firmId}/training`),
        score("CERTIFICATE","Eğitim belgelerini oluşturun","Tamamlanmış eğitim katılımcıları için DORA belgeleri.","Toplu İSG Eğitim Sertifikası PDF","CRITICAL",hasCertificates,true,"Training",`/admin/dora/${firmId}/training`),
        score("ATTENDANCE","Eğitim katılım kayıtlarını tamamlayın","Katılımcı ve imza listeleri eğitim kaydının parçasıdır.","Eğitim Katılım ve Sınav Formu PDF","CRITICAL",participantCount > 0,true,"Training",`/admin/dora/${firmId}/training`),
        score("KKD","KKD teslim kayıtlarını oluşturun","KKD kullanım ve teslim süreçlerinin kayıt altına alınması.","KKD Zimmet Formu PDF","PRO",hasKkd,true,"Document"),
        score("INSTRUCTIONS","İSG talimatlarını oluşturun","Faaliyet ve risklere uygun çalışma talimatları.","İSG Taahhütname ve Talimat PDF","PRO",hasInstructions,true,"Document"),
        score("BOARD","İSG kurulu yapısını kontrol edin",boardNeeded ? "Çalışan sayısı 50 veya üzerindedir; kurul yapısı kontrol edilmelidir." : "Çalışan sayısına göre kurul yükümlülüğünü kontrol edin.","İSG Kurul Üyeleri / Toplantı Tutanağı PDF","CRITICAL",!boardNeeded || hasBoard,true,"Board"),
        score("HEALTH","Sağlık gözetimi altyapısını hazırlayın","İşe giriş/periyodik sağlık gözetimi süreçleri için hazırlık.","Ek-2 Sağlık Formu Taslak PDF","CRITICAL",false,true,"Health"),
        score("DRILL","Acil durum tatbikat kaydını hazırlayın","Tatbikat senaryosu, katılım ve sonuç kayıtları.","Tatbikat Senaryo ve Katılım PDF","PRO",false,true,"Emergency"),
        score("AUDIT","DORA saha denetimini gerçekleştirin","Kurulumun saha koşulları ile doğrulanması.","DORA Denetim Raporu","PRO",false,false,"Audit",`/admin/dora/${firmId}/audits`),
        score("CORRECTIVE","Denetim bulgularını kapatın","Bulgular ve DÖF kayıtlarının izlenmesi.","DÖF takip çıktısı","PRO",false,false,"Audit",`/admin/dora/${firmId}/audits`),
        score("REPRESENTATIVE","Çalışan temsilcisi yapısını oluşturun","Çalışan katılım mekanizmasının kayıt altına alınması.","Çalışan temsilcisi seçim/atama PDF","CRITICAL",false,true,"Employee"),
        score("FIRST_AID","İlk yardımcı yeterliliğini kontrol edin","Çalışan sayısı ve tehlike sınıfına göre ilk yardımcı organizasyonu.","İlk yardımcı kontrol listesi","PRO",false,true,"Emergency"),
        score("PERIODIC","Periyodik kontrol ihtiyaçlarını belirleyin","İş ekipmanı ve tesisat kontrollerinin planlanması.","Periyodik Kontrol Planı","PRO",false,true,"Document"),
        score("ENVIRONMENT","Ortam ölçüm ihtiyaçlarını belirleyin","Maruziyet ve çalışma ortamı ölçümlerinin planlanması.","Ortam Ölçüm Planı","PRO",false,true,"Document"),
        score("MANAGEMENT","Yönetim gözden geçirme çıktısını oluşturun","DORA kurulumunun üst yönetim özeti.","Kurumsal DORA Yönetim Özeti PDF","PRO",false,true,"Expert"),
      ];
    }, [
      firm,
      employees.length,
      authorityCount,
      riskTeam.length,
      risks.length,
      trainings,
      certificates.length,
      completedTrainingCount,
      participantCount,
      documents,
      firmId,
    ]);

  const criticalCount =
    requirements.filter(
      (x) =>
        x.priority === "CRITICAL"
    ).length;

  const proCount =
    requirements.filter(
      (x) => x.priority === "PRO"
    ).length;

  const completedCount =
    requirements.filter(
      (x) => x.complete
    ).length;

  const calculatedScore =
    requirements.length > 0
      ? pct(
          (completedCount /
            requirements.length) *
            100
        )
      : 0;

  const effectiveScore =
    lastAnalysisAt > 0
      ? pct(
          num(
            data?.expert?.setupScore ??
              calculatedScore
          )
        )
      : calculatedScore;

  const missing =
    requirements.filter(
      (x) => !x.complete
    );

  const queue =
    useMemo<QueueItem[]>(
      () =>
        requirements.map(
          (item) => ({
            id: item.id,
            title:
              item.complete
                ? `${item.title} ✓`
                : item.title,
            detail:
              item.description,
            reason:
              item.complete
                ? "Bu gereklilik DORA verilerinde karşılanmış görünüyor."
                : item.robotCanProduce
                ? `Eksik çıktı: ${item.output}`
                : "DORA verilerinde eksik bilgi/kayıt tespit edildi.",
            type: item.complete
              ? "DONE"
              : item.robotCanProduce
              ? "ROBOT"
              : "WARNING",
            domain: item.source,
            robotCanProduce:
              item.robotCanProduce,
          })
        ),
      [requirements]
    );

  const priorityPlan =
    missing.slice(0, 5);

  const estimatedMinutes =
    missing.reduce(
      (total, item) =>
        total +
        (item.robotCanProduce
          ? 20
          : 45),
      0
    );

  const expertComment =
    missing.length === 0
      ? "DORA temel kurulum gereklilikleri tamamlanmış görünüyor. Süreklilik için saha denetimleri, eğitim yenilemeleri ve doküman revizyonları takip edilmelidir."
      : `Bu işletme için ${missing.length} DORA gerekliliğinde çalışma ihtiyacı belirlenmiştir. İlk fazda ${priorityPlan
          .map((x) => x.title)
          .slice(0, 3)
          .join(", ")} başlıklarına öncelik verilmelidir.`;

  async function runAnalysis() {
    try {
      setAnalyzing(true);
      setError("");
      setSuccess("");

      const expertPayload = {
        setupScore: calculatedScore,
        requirementCount:
          requirements.length,
        criticalCount,
        professionalCount:
          proCount,
        completedCount,
        missingCount:
          missing.length,
        complianceScore:
          calculatedScore,
        informationMatchScore:
          pct(
            ((Boolean(
              value(
                firm?.firm_name
              )
            )
              ? 1
              : 0) +
              (employees.length > 0
                ? 1
                : 0) +
              (risks.length > 0
                ? 1
                : 0) +
              (documents.length > 0
                ? 1
                : 0) +
              (trainings.length > 0
                ? 1
                : 0)) /
              5 *
              100
          ),
        estimatedMinutes,
        comment: expertComment,
        priorityPlan:
          priorityPlan.map(
            (x) => ({
              id: x.id,
              title: x.title,
              output: x.output,
              robotCanProduce:
                x.robotCanProduce,
              priority: x.priority,
              estimatedMinutes:
                x.robotCanProduce
                  ? 20
                  : 45,
            })
          ),
        queue: queue.map(
          (x) => ({
            id: x.id,
            title: x.title,
            detail: x.detail,
            reason: x.reason,
            type: x.type,
            domain: x.domain,
            robotCanProduce:
              x.robotCanProduce,
          })
        ),
        requirements,
        analyzedAtMillis:
          Date.now(),
      };

      const response =
        await fetch(
          "/api/dora/mobile/sync",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              "x-api-key":
                "dsec_mobile_123",
            },
            body: JSON.stringify({
              firmId,
              expert: expertPayload,
            }),
          }
        );

      const json =
        await readJson<SyncResponse>(
          response,
          "DORA Expert analiz servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA analizi kaydedilemedi."
        );
      }

      setData(json);
      setLastAnalysisAt(
        expertPayload.analyzedAtMillis
      );
      setSuccess(
        "DORA analizi tamamlandı ve DORA App ⇄ Web ortak state alanına kaydedildi."
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA analizi başarısız."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function printDocument(
    title: string,
    bodyHtml: string
  ) {
    const win =
      window.open(
        "",
        "_blank",
        "width=1100,height=900"
      );

    if (!win) {
      alert(
        "PDF/yazdırma penceresi açılamadı."
      );
      return;
    }

    win.document.write(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}
body{margin:0;background:#eee;color:#111;font-family:Arial,sans-serif}
.toolbar{position:sticky;top:0;background:#7a2633;padding:10px;text-align:center}
.toolbar button{padding:10px 18px;font-weight:800}
.sheet{width:210mm;min-height:297mm;margin:12px auto;background:#fff;padding:14mm}
h1{font-size:22px;margin:0 0 8px;color:#531823}
h2{font-size:15px;margin:18px 0 8px}
.meta{color:#667085;font-size:11px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border:1px solid #333;padding:7px;text-align:left;vertical-align:top}
th{background:#f2f4f7}
ul,ol{font-size:11px;line-height:1.55}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;font-size:11px}
.sign{height:55px;border-bottom:1px dotted #444}
@media print{body{background:#fff}.toolbar{display:none}.sheet{width:auto;min-height:auto;margin:0;padding:0}}
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Yazdır / PDF Olarak Kaydet</button></div>
<div class="sheet">
<h1>${escapeHtml(title)}</h1>
<div class="meta">
Firma: ${escapeHtml(firm?.firm_name || "-")} •
Tarih: ${escapeHtml(today())} •
DORA Firma ID: ${escapeHtml(firmId)}
</div>
${bodyHtml}
</div>
</body>
</html>`);
    win.document.close();
  }

  function requirementTable() {
    return `
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Gereklilik</th>
            <th>Durum</th>
            <th>Öncelik</th>
            <th>Çıktı</th>
          </tr>
        </thead>
        <tbody>
          ${requirements
            .map(
              (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.title)}</td>
                <td>${r.complete ? "Tamamlandı" : "Eksik"}</td>
                <td>${r.priority === "CRITICAL" ? "Kritik" : "Profesyonel"}</td>
                <td>${escapeHtml(r.output)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  function generateRobotDocument(
    kind: string
  ) {
    const employeeRows =
      employees.length > 0
        ? employees
            .map(
              (employee, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(
                  employee.full_name ??
                    employee.fullName
                )}</td>
                <td>${escapeHtml(
                  employee.tc_no ??
                    employee.tcNo ??
                    "-"
                )}</td>
                <td>${escapeHtml(
                  employee.job_title ??
                    employee.position ??
                    "-"
                )}</td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="4">DORA çalışan kaydı bulunamadı.</td></tr>`;

    const riskRows =
      risks.length > 0
        ? risks
            .slice(0, 100)
            .map(
              (risk, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(
                  risk.activity ??
                    risk.title ??
                    "-"
                )}</td>
                <td>${escapeHtml(
                  risk.hazard ?? "-"
                )}</td>
                <td>${escapeHtml(
                  risk.risk ??
                    risk.risk_description ??
                    "-"
                )}</td>
                <td>${escapeHtml(
                  risk.score ??
                    risk.risk_score ??
                    "-"
                )}</td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="5">DORA risk kaydı bulunamadı.</td></tr>`;

    const trainingRows =
      trainings.length > 0
        ? trainings
            .map(
              (training, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(
                  training.title
                )}</td>
                <td>${escapeHtml(
                  training.trainingDate ??
                    "-"
                )}</td>
                <td>${arr(
                  training.participants
                ).length}</td>
                <td>${escapeHtml(
                  training.status ??
                    "-"
                )}</td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="5">DORA eğitim kaydı bulunamadı.</td></tr>`;

    const docs: Record<
      string,
      {
        title: string;
        body: string;
      }
    > = {
      training_package: {
        title:
          "DORA Eğitim ve Sertifika Paketi",
        body: `
          <h2>Eğitim Oturumları</h2>
          <table><tr><th>No</th><th>Eğitim</th><th>Tarih</th><th>Katılımcı</th><th>Durum</th></tr>${trainingRows}</table>
          <h2>Sertifika Özeti</h2>
          <p>Toplam DORA sertifikası: <b>${certificates.length}</b></p>
          <p>Bu paket DORA Eğitim ve Sertifika Merkezi kayıtlarından oluşturulmuştur.</p>`,
      },

      corporate: {
        title:
          "DORA Kurumsal Doküman Paketi",
        body: `
          <h2>Kurulum Durumu</h2>
          <p>Kurulum skoru: <b>%${effectiveScore}</b></p>
          ${requirementTable()}
          <h2>DORA Yorumu</h2><p>${escapeHtml(expertComment)}</p>`,
      },

      fine_kinney: {
        title:
          "DORA Fine Kinney Risk Değerlendirmesi",
        body: `<table><tr><th>No</th><th>Faaliyet</th><th>Tehlike</th><th>Risk</th><th>Skor</th></tr>${riskRows}</table>`,
      },

      certificates: {
        title:
          "DORA Toplu İSG Eğitim Sertifikaları",
        body: certificates.length > 0
          ? certificates
              .map(
                (c, i) => `
                <h2>${i + 1}. ${escapeHtml(c.employeeName ?? "-")}</h2>
                <table>
                  <tr><th>Belge No</th><td>${escapeHtml(c.certificateNo ?? "-")}</td></tr>
                  <tr><th>Eğitim</th><td>${escapeHtml(c.trainingTitle ?? "-")}</td></tr>
                  <tr><th>Düzenlenme</th><td>${escapeHtml(c.issueDate ?? "-")}</td></tr>
                </table>`
              )
              .join("")
          : "<p>DORA sertifika kaydı bulunamadı.</p>",
      },

      board_minutes: {
        title:
          "İSG Kurul Toplantı Tutanağı Taslağı",
        body: `
          <table>
            <tr><th>İşyeri</th><td>${escapeHtml(firm?.firm_name || "-")}</td></tr>
            <tr><th>Toplantı Tarihi</th><td>................................</td></tr>
            <tr><th>Toplantı No</th><td>................................</td></tr>
          </table>
          <h2>Gündem</h2><ol><li>İSG performansının değerlendirilmesi</li><li>Risk ve aksiyonların gözden geçirilmesi</li><li>Eğitim ve çalışan katılımının değerlendirilmesi</li><li>Yeni kararlar</li></ol>
          <h2>Kararlar</h2><div style="height:180px;border:1px solid #333"></div>
          <div class="signatures"><div>Kurul Başkanı<div class="sign"></div></div><div>Üyeler<div class="sign"></div></div></div>`,
      },

      appointments: {
        title:
          "DORA Atama Yazıları Personel Listesi",
        body: `<table><tr><th>No</th><th>Ad Soyad</th><th>TC</th><th>Görev/Unvan</th></tr>${employeeRows}</table>
        <p>Görevlendirme türüne göre imzalı atama yazıları DORA kurumsal kayıtları kapsamında düzenlenir.</p>`,
      },

      risk_team: {
        title:
          "DORA Risk Değerlendirme Ekibi",
        body: riskTeam.length > 0
          ? `<table><tr><th>No</th><th>Ad Soyad</th><th>Rol</th></tr>${riskTeam
              .map(
                (m, i) =>
                  `<tr><td>${i + 1}</td><td>${escapeHtml(m.full_name ?? m.fullName ?? m.name ?? "-")}</td><td>${escapeHtml(m.role ?? m.team_role ?? "-")}</td></tr>`
              )
              .join("")}</table>`
          : "<p>Risk değerlendirme ekibi kaydı bulunamadı.</p>",
      },

      board_members: {
        title:
          "DORA İSG Kurulu Üyeleri",
        body: `<p>Çalışan sayısı: <b>${Math.max(employees.length, num(firm?.employee_count))}</b></p>
        <p>Kurul yükümlülüğü değerlendirmesi DORA analizindeki firma bilgilerine göre yapılmıştır.</p>
        <table><tr><th>No</th><th>Ad Soyad</th><th>TC</th><th>Görev/Unvan</th></tr>${employeeRows}</table>`,
      },

      attendance_exam: {
        title:
          "DORA Eğitim Katılım ve Sınav Formu",
        body: `<h2>Eğitim Oturumları</h2><table><tr><th>No</th><th>Eğitim</th><th>Tarih</th><th>Katılımcı</th><th>Durum</th></tr>${trainingRows}</table>
        <h2>Katılımcı İmza / Sınav Alanı</h2>
        <table><tr><th>No</th><th>Ad Soyad</th><th>TC</th><th>Unvan</th><th>İmza</th><th>Sınav Puanı</th></tr>${employees
          .map(
            (e, i) =>
              `<tr><td>${i + 1}</td><td>${escapeHtml(e.full_name ?? e.fullName ?? "-")}</td><td>${escapeHtml(e.tc_no ?? e.tcNo ?? "-")}</td><td>${escapeHtml(e.job_title ?? e.position ?? "-")}</td><td style="height:32px"></td><td></td></tr>`
          )
          .join("")}</table>`,
      },

      commitment: {
        title:
          "DORA İSG Taahhütname ve Talimat",
        body: `<p>İş sağlığı ve güvenliği kurallarına, işveren talimatlarına, güvenli çalışma yöntemlerine ve kişisel koruyucu donanım kullanım kurallarına uyacağımı; tehlikeli durumları derhal bildireceğimi kabul ve taahhüt ederim.</p>
        <table><tr><th>Çalışan</th><td>................................</td></tr><tr><th>Görev</th><td>................................</td></tr><tr><th>Tarih</th><td>${today()}</td></tr></table><div class="signatures"><div>Çalışan İmzası<div class="sign"></div></div><div>İşveren / Vekili<div class="sign"></div></div></div>`,
      },

      health: {
        title:
          "DORA Sağlık Gözetimi Formu Taslağı",
        body: `<p>Bu çıktı DORA kurulum sürecindeki sağlık gözetimi hazırlığı için taslak kayıt formudur. Yetkili işyeri hekimi tarafından mevzuata uygun nihai sağlık değerlendirmesi ayrıca yapılmalıdır.</p>
        <table><tr><th>Çalışan</th><td>................................</td></tr><tr><th>Görev</th><td>................................</td></tr><tr><th>Muayene Tarihi</th><td>................................</td></tr><tr><th>Hekim Değerlendirmesi</th><td style="height:120px"></td></tr></table>`,
      },

      drill: {
        title:
          "DORA Tatbikat Senaryo ve Katılım Tutanağı",
        body: `<table><tr><th>Tatbikat Türü</th><td>Yangın / Tahliye / Acil Durum</td></tr><tr><th>Tarih</th><td>................................</td></tr><tr><th>Senaryo</th><td style="height:100px"></td></tr></table>
        <h2>Katılımcılar</h2><table><tr><th>No</th><th>Ad Soyad</th><th>TC</th><th>Görev</th><th>İmza</th></tr>${employees
          .map(
            (e, i) =>
              `<tr><td>${i + 1}</td><td>${escapeHtml(e.full_name ?? e.fullName ?? "-")}</td><td>${escapeHtml(e.tc_no ?? e.tcNo ?? "-")}</td><td>${escapeHtml(e.job_title ?? e.position ?? "-")}</td><td></td></tr>`
          )
          .join("")}</table>`,
      },
    };

    const doc =
      docs[kind];

    if (!doc) {
      alert(
        "Doküman tipi bulunamadı."
      );
      return;
    }

    printDocument(
      doc.title,
      doc.body
    );
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          DORA Expert yükleniyor...
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="page">
        <button
          className="outline"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}`
            )
          }
        >
          ← Firma Merkezine Dön
        </button>

        <div className="error">
          {error}
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="outline"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}`
            )
          }
        >
          ← Firma Merkezine Dön
        </button>

        <div className="topActions">
          <button
            className="outline"
            onClick={() =>
              void load()
            }
          >
            Yenile
          </button>

          <button
            className="primary"
            disabled={analyzing}
            onClick={() =>
              void runAnalysis()
            }
          >
            {analyzing
              ? "DORA Analiz Ediyor..."
              : "DORA Analizi Başlat"}
          </button>
        </div>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            DORA • KURUMSAL KURULUM ROBOTU
          </div>

          <h1>
            DORA Durum Analizi ve Robot
          </h1>

          <p>
            {firm?.firm_name ||
              "DORA firması"}{" "}
            için kurulum gerekliliklerini,
            eksikleri, öncelikli işleri ve
            DORA&apos;nın üretebileceği
            kurumsal çıktıları tek merkezden
            yönetin.
          </p>

          {lastAnalysisAt > 0 ? (
            <small>
              Son analiz:{" "}
              {new Date(
                lastAnalysisAt
              ).toLocaleString(
                "tr-TR"
              )}
            </small>
          ) : null}
        </div>

        <div className="heroScore">
          <strong>
            %{effectiveScore}
          </strong>
          <span>
            Kurulum Skoru
          </span>
        </div>
      </section>

      {error ? (
        <div className="error">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="success">
          {success}
        </div>
      ) : null}

      <section className="section">
        <div className="sectionHead">
          <div>
            <h2>
              DORA Kurumsal Kurulum Analizi
            </h2>
            <p>
              Firma, çalışan, risk, eğitim,
              doküman ve kurumsal kayıtlara
              göre anlık DORA analizi.
            </p>
          </div>
        </div>

        <div className="kpis">
          <Kpi
            title="Kurulum Skoru"
            value={`%${effectiveScore}`}
            tone="pink"
          />

          <Kpi
            title="Gereklilik"
            value={requirements.length}
            tone="blue"
          />

          <Kpi
            title="Kritik"
            value={criticalCount}
            tone="red"
          />

          <Kpi
            title="Profesyonel"
            value={proCount}
            tone="amber"
          />
        </div>
      </section>

      <section className="commentCard">
        <h2>DORA Yorumu</h2>
        <p>{expertComment}</p>
      </section>

      <section className="expertSummary">
        <div className="sectionEyebrow">
          DORA EXPERT ÖZETİ
        </div>

        <div className="expertTop">
          <div>
            <span>Uyum skoru</span>
            <strong>
              %{effectiveScore}
            </strong>
          </div>

          <div>
            <span>
              Bilgi eşleşme
            </span>
            <strong>
              %
              {pct(
                ((Boolean(
                  value(
                    firm?.firm_name
                  )
                )
                  ? 1
                  : 0) +
                  (employees.length >
                  0
                    ? 1
                    : 0) +
                  (risks.length > 0
                    ? 1
                    : 0) +
                  (documents.length >
                  0
                    ? 1
                    : 0) +
                  (trainings.length >
                  0
                    ? 1
                    : 0)) /
                  5 *
                  100
              )}
            </strong>
          </div>

          <div>
            <span>
              Eksik görev
            </span>
            <strong>
              {missing.length}
            </strong>
          </div>
        </div>

        <h3>
          Öncelikli İş Planı
        </h3>

        {priorityPlan.length ===
        0 ? (
          <div className="empty">
            Öncelikli eksik görev bulunmuyor.
          </div>
        ) : (
          <ol className="priorityList">
            {priorityPlan.map(
              (item) => (
                <li key={item.id}>
                  <strong>
                    {item.title}
                  </strong>
                  <span>
                    ~
                    {item.robotCanProduce
                      ? 20
                      : 45}{" "}
                    dk •{" "}
                    {item.priority ===
                    "CRITICAL"
                      ? "kritik"
                      : "profesyonel"}
                  </span>
                </li>
              )
            )}
          </ol>
        )}

        <div className="estimate">
          Toplam tahmini süre:{" "}
          <strong>
            {estimatedMinutes} dakika
          </strong>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <h2>
              Öncelikli Kurulum Görevleri
            </h2>
            <p>
              Eksik gereklilikler ve
              DORA&apos;nın otomatik
              üretebileceği çıktılar.
            </p>
          </div>
        </div>

        <div className="requirementGrid">
          {missing
            .slice(0, 12)
            .map((item) => (
              <article
                className="requirement"
                key={item.id}
              >
                <div className="reqIcon">
                  !
                </div>

                <div>
                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.description}
                  </p>

                  <strong>
                    Çıktı:{" "}
                    {item.output}
                  </strong>

                  <div className="chips">
                    <span className="criticalChip">
                      {item.priority ===
                      "CRITICAL"
                        ? "KRİTİK"
                        : "PRO"}
                    </span>

                    {item.robotCanProduce ? (
                      <span className="robotChip">
                        DORA Üretebilir
                      </span>
                    ) : (
                      <span className="manualChip">
                        Manuel
                      </span>
                    )}
                  </div>

                  {item.route ? (
                    <button
                      className="linkButton"
                      onClick={() =>
                        router.push(
                          item.route!
                        )
                      }
                    >
                      İlgili Merkezi Aç
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <h2>
              DORA Robot İş Kuyruğu
            </h2>
            <p>
              Robotun hangi işi beklettiği,
              tamamladığı veya üretebildiği
              burada görünür.
            </p>
          </div>

          <span className="queueCount">
            {queue.length} görev
          </span>
        </div>

        <div className="queue">
          {queue.map((item) => (
            <article
              className={`queueItem ${item.type.toLowerCase()}`}
              key={item.id}
            >
              <div className="queueIcon">
                {item.type === "DONE"
                  ? "✓"
                  : item.type === "ROBOT"
                  ? "D"
                  : "!"}
              </div>

              <div className="queueBody">
                <h3>
                  {item.title}
                </h3>
                <p>
                  {item.detail}
                </p>
                <small>
                  Gerekçe:{" "}
                  {item.reason}
                </small>

                <div className="chips">
                  <span>
                    {item.type === "DONE"
                      ? "Tamamlandı"
                      : item.type ===
                        "ROBOT"
                      ? "Robot"
                      : "Uyarı"}
                  </span>

                  <span>
                    {item.domain}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="robotSection">
        <div className="sectionHead">
          <div>
            <div className="sectionEyebrow">
              DORA ROBOT
            </div>
            <h2>
              Robotik Doküman Üretimi
            </h2>
            <p>
              DORA kayıtlarını kullanarak
              kurumsal çalışma çıktıları
              oluşturun.
            </p>
          </div>
        </div>

        <div className="robotButtons">
          <RobotButton
            title="Eğitim ve Sertifika Paketi PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "training_package"
              )
            }
          />

          <RobotButton
            title="Kurumsal Doküman Paketi PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "corporate"
              )
            }
          />

          <RobotButton
            title="Fine Kinney Risk Değerlendirmesi PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "fine_kinney"
              )
            }
          />

          <RobotButton
            title="Toplu İSG Eğitim Sertifikası PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "certificates"
              )
            }
          />

          <RobotButton
            title="İSG Kurul Toplantı Tutanağı PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "board_minutes"
              )
            }
          />

          <RobotButton
            title="Atama Yazıları PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "appointments"
              )
            }
          />

          <RobotButton
            title="Risk Değerlendirme Ekibi PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "risk_team"
              )
            }
          />

          <RobotButton
            title="İSG Kurulu Üyeleri PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "board_members"
              )
            }
          />

          <RobotButton
            title="Eğitim Katılım ve Sınav Formu PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "attendance_exam"
              )
            }
          />

          <RobotButton
            title="İSG Taahhütname ve Talimat PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "commitment"
              )
            }
          />

          <RobotButton
            title="Ek-2 Sağlık Formu Taslak PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "health"
              )
            }
          />

          <RobotButton
            title="Tatbikat Senaryo ve Katılım PDF Üret"
            onClick={() =>
              generateRobotDocument(
                "drill"
              )
            }
          />
        </div>
      </section>

      <section className="independence">
        <strong>
          DORA App ⇄ DORA Web
        </strong>
        <p>
          Bu Expert analizi yalnızca DORA
          verilerini kullanır. Genel D-SEC
          eğitim, risk, çalışan veya diğer
          modüllerine veri aktarmaz.
        </p>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone:
    | "pink"
    | "blue"
    | "red"
    | "amber";
}) {
  return (
    <article
      className={`kpi ${tone}`}
    >
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RobotButton({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className="robotButton"
      onClick={onClick}
    >
      {title}
    </button>
  );
}

const styles = `
:global(*){box-sizing:border-box}
.page{min-height:100vh;padding:24px;background:linear-gradient(180deg,#f8f9fc,#fff 430px);color:#172033}
button{font:inherit;cursor:pointer}button:disabled{opacity:.6;cursor:not-allowed}
.topbar,.hero,.section,.commentCard,.expertSummary,.robotSection,.independence{max-width:1450px;margin-left:auto;margin-right:auto}
.topbar{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
.topActions{display:flex;gap:9px}
.outline,.primary{padding:11px 15px;border-radius:12px;font-weight:850}
.outline{border:1px solid #d0d5dd;background:#fff;color:#344054}
.primary{border:0;background:#8e1e1e;color:#fff}
.hero{display:flex;justify-content:space-between;align-items:center;gap:30px;padding:32px;border-radius:28px;color:#fff;background:linear-gradient(120deg,#50141f,#7a2633 48%,#d0602c);box-shadow:0 22px 50px rgba(73,20,31,.16)}
.eyebrow,.sectionEyebrow{font-size:11px;font-weight:900;letter-spacing:.14em}
.hero h1{margin:8px 0;font-size:clamp(32px,4.8vw,54px)}
.hero p{max-width:830px;color:rgba(255,255,255,.86);line-height:1.6}
.hero small{color:rgba(255,255,255,.68)}
.heroScore{min-width:175px;min-height:150px;padding:22px;border-radius:24px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);display:grid;place-items:center;text-align:center}
.heroScore strong{font-size:44px}.heroScore span{font-weight:800}
.error,.success{max-width:1450px;margin:16px auto;padding:15px;border-radius:14px}.error{background:#fff2f2;color:#b42318;border:1px solid #f1b4b4}.success{background:#ecfdf3;color:#067647;border:1px solid #abefc6;font-weight:800}
.section{margin-top:24px}.sectionHead{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.sectionHead h2{margin:0;font-size:28px}.sectionHead p{margin:6px 0 0;color:#667085}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}.kpi{min-height:180px;padding:24px;border-radius:24px;border:1px solid #e5e7eb;display:flex;flex-direction:column;justify-content:center;box-shadow:0 4px 10px rgba(16,24,40,.05)}.kpi span{font-weight:850}.kpi strong{font-size:44px;margin-top:18px}.kpi.pink{background:#fce5eb}.kpi.blue{background:#e9f4ff}.kpi.red{background:#fde6e6}.kpi.amber{background:#fff0d6}
.commentCard,.expertSummary{margin-top:20px;padding:24px;border:1px solid #eaecf0;border-radius:22px;background:#fff}.commentCard h2,.expertSummary h2{margin-top:0}.commentCard p{color:#667085;line-height:1.7}
.expertTop{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}.expertTop>div{padding:16px;background:#f8fafc;border-radius:16px}.expertTop span{display:block;color:#667085;font-size:12px}.expertTop strong{display:block;font-size:28px;margin-top:5px;color:#16794d}
.expertSummary h3{margin-top:18px}.priorityList{display:grid;gap:8px;padding-left:22px}.priorityList li{padding:7px 0;color:#344054}.priorityList span{display:block;color:#667085;font-size:12px;margin-top:3px}.estimate{margin-top:18px;color:#8e1e1e;font-size:19px;font-weight:800}
.requirementGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:13px;margin-top:16px}.requirement{display:flex;gap:14px;padding:18px;border:1px solid #eaecf0;border-radius:18px;background:#fff}.reqIcon,.queueIcon{width:46px;height:46px;flex:0 0 46px;border-radius:14px;display:grid;place-items:center;font-size:22px;font-weight:900;background:#fee2e2;color:#b42318}.requirement h3{margin:0}.requirement p{color:#667085;line-height:1.5}.requirement>div>strong{font-size:12px;color:#8e1e1e}
.chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.chips span{padding:5px 10px;border-radius:999px;font-size:11px;font-weight:900;background:#fce7ea;color:#8e1e1e}.robotChip{background:#eaf8ef!important;color:#2e7d32!important}.manualChip{background:#f2f4f7!important;color:#667085!important}.linkButton{margin-top:11px;border:1px solid #d0d5dd;background:#fff;border-radius:10px;padding:8px 11px;font-weight:800;color:#344054}
.queueCount{padding:7px 11px;border-radius:999px;background:#f2f4f7;color:#667085;font-size:12px;font-weight:850}.queue{display:grid;gap:12px;margin-top:16px}.queueItem{display:flex;gap:15px;padding:19px;border:1px solid #eaecf0;border-radius:19px;background:#fff}.queueItem.done .queueIcon{background:#dcfae6;color:#067647}.queueItem.robot .queueIcon{background:#eaf1ff;color:#2563eb}.queueItem h3{margin:0}.queueItem p{margin:6px 0;color:#667085}.queueItem small{color:#98a2b3}
.robotSection{margin-top:25px;padding:24px;border-radius:24px;background:#fff;border:1px solid #eaecf0}.robotButtons{display:grid;gap:12px;margin-top:18px}.robotButton{width:100%;padding:17px 20px;border:0;border-radius:999px;background:#8e1e1e;color:#fff;font-size:17px;font-weight:800;box-shadow:0 3px 8px rgba(122,38,51,.12)}
.independence{margin-top:22px;margin-bottom:32px;padding:17px 20px;border:1px solid #f8d9ce;border-radius:18px;background:#fff8f5}.independence strong{color:#7a2633}.independence p{margin:5px 0 0;color:#80545c;line-height:1.5}
.loading,.empty{padding:25px;text-align:center;color:#667085;background:#fff;border:1px solid #eaecf0;border-radius:16px}
@media(max-width:900px){.page{padding:14px}.topbar,.hero{flex-direction:column;align-items:stretch}.topActions{width:100%}.topActions button{flex:1}.heroScore{min-height:auto}.kpis,.expertTop,.requirementGrid{grid-template-columns:1fr 1fr}.sectionHead{flex-direction:column}}
@media(max-width:600px){.kpis,.expertTop,.requirementGrid{grid-template-columns:1fr}.kpi{min-height:135px}.kpi strong{font-size:36px}.robotButton{font-size:15px}}
`;