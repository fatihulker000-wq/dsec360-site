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

  const [robotStarted, setRobotStarted] =
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
.docPage{page-break-after:always;min-height:250mm;padding-bottom:8mm}.docPage:last-child{page-break-after:auto}
.meta th{width:26%}.question{margin:0 0 12px;font-size:11px;line-height:1.5}.answerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:25px 0}.certificate{text-align:center;border:3px solid #7a0017;border-radius:20px;padding:28px;min-height:175mm}.certificate h2{font-size:28px;color:#7a0017;margin:28px 0 12px}.fillRow{border:1px solid #b4becd;padding:10px;min-height:38px}.wideTable{overflow:visible}.wideTable table{font-size:8px}.decisionBox{height:170px;border:1px solid #333;margin-bottom:18px}.reqLine{border:1px solid #e1e5eb;border-radius:10px;padding:10px;margin:8px 0;font-size:11px}.reqLine span{color:#7a0017;font-weight:700}
.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:40px;font-size:11px}.sign{height:55px;border-bottom:1px dotted #444}
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

  function employeeName(e: AnyRow) {
    return value(e.full_name ?? e.fullName ?? e.name) || "Çalışan Adı Girilmedi";
  }

  function employeeTc(e: AnyRow) {
    return value(e.tc_no ?? e.tcNo) || "-";
  }

  function employeeJob(e: AnyRow) {
    return value(e.job_title ?? e.jobTitle ?? e.position) || "-";
  }

  function authorityName(...keys: string[]) {
    for (const key of keys) {
      const v = authorities?.[key];
      if (typeof v === "string" && value(v)) return value(v);
      if (v && typeof v === "object") {
        const n = value(v.fullName ?? v.full_name ?? v.name);
        if (n) return n;
      }
    }
    return "-";
  }

  function employeeRowsHtml(withSignature = false) {
    const list = employees.length ? employees : [{ full_name: "Çalışan Adı Girilmedi", tc_no: "-", job_title: "-" }];
    return list.map((e, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(employeeName(e))}</td><td>${escapeHtml(employeeTc(e))}</td><td>${escapeHtml(employeeJob(e))}</td>${withSignature ? '<td style="height:34px"></td>' : ''}</tr>`).join("");
  }

  function selectedDutyRows() {
    const rows: Array<{e: AnyRow; duty: string}> = [];
    for (const e of employees) {
      if (e.isEmployeeRepresentative || e.is_employee_representative) rows.push({e,duty:"Çalışan Temsilcisi"});
      if (e.isChiefRepresentative || e.is_chief_representative) rows.push({e,duty:"Baş Çalışan Temsilcisi"});
      if (e.isFireTeam || e.is_fire_team) rows.push({e,duty:"Yangınla Mücadele Destek Elemanı"});
      if (e.isSearchRescueTeam || e.is_search_rescue_team) rows.push({e,duty:"Arama Kurtarma ve Tahliye Destek Elemanı"});
      if (e.isProtectionTeam || e.is_protection_team) rows.push({e,duty:"Koruma Destek Elemanı"});
      if (e.isFirstAidTeam || e.is_first_aid_team) rows.push({e,duty:"İlk Yardım Destek Elemanı"});
      if (e.isRiskAssessmentTeam || e.is_risk_assessment_team) rows.push({e,duty:"Risk Değerlendirme Ekibi Üyesi"});
      if (e.isIsgBoardMember || e.is_isg_board_member) rows.push({e,duty:"İSG Kurul Üyesi"});
    }
    return rows.length ? rows : [{e:{full_name:"Seçili personel bulunmuyor",tc_no:"-",job_title:"-"},duty:"Atama Yapılmadı"}];
  }

  function pageBreak(title: string, body: string) {
    return `<section class="docPage"><h1>${escapeHtml(title)}</h1>${body}</section>`;
  }

  function trainingPackageHtml() {
    const t = trainings[0] ?? {};
    const trainingName = value(t.title) || "Temel İş Sağlığı ve Güvenliği Eğitimi";
    const trainingDate = value(t.trainingDate) || today();
    const startTime = value(t.startTime) || "09:00";
    const endTime = value(t.endTime) || "17:00";
    const hours = value(t.trainingHours) || "8";
    const place = value(t.place) || "-";
    const trainer = value(t.trainerName) || authorityName("isgExpert","isg_expert");
    const participants = arr(t.participants);
    const pRows = (participants.length ? participants : employees).map((e:any,i:number)=>`<tr><td>${i+1}</td><td>${escapeHtml(value(e.fullName ?? e.full_name) || employeeName(e))}</td><td>${escapeHtml(value(e.tcNo ?? e.tc_no) || employeeTc(e))}</td><td>${escapeHtml(value(e.jobTitle ?? e.job_title) || employeeJob(e))}</td><td style="height:32px"></td></tr>`).join("");
    const questions = [
      "İş sağlığı ve güvenliğinin temel amacı nedir?","İşyerinde tespit edilen tehlikeler kime bildirilmelidir?","Kişisel koruyucu donanımlar hangi amaçla kullanılır?","Acil durumda ilk yapılması gereken işlem nedir?","Yangın söndürücü kullanılmadan önce ne kontrol edilmelidir?","Elle taşıma işlerinde bel sağlığı için nelere dikkat edilmelidir?","Elektrik panolarına kimler müdahale edebilir?","Ramak kala olayların bildirilmesi neden önemlidir?","İş kazası meydana geldiğinde çalışan ne yapmalıdır?","Tahliye sırasında asansör kullanılır mı?","Kaygan zeminde hangi önlem alınmalıdır?","KKD hasarlıysa çalışan ne yapmalıdır?","Acil çıkış kapıları neden açık tutulmalıdır?","İş ekipmanları kimler tarafından kullanılmalıdır?","Kimyasal maddelerde SDS/MSDS ne için kullanılır?","Yüksekte çalışmada temel korunma nedir?","Yangın ekipmanlarının önü kapatılabilir mi?","İşyerinde düzen ve temizlik neden önemlidir?","Meslek hastalığı şüphesi nasıl bildirilmelidir?","Eğitim sonrası sınavın amacı nedir?"
    ];
    const answers = ["1-B","2-C","3-A","4-D","5-B","6-A","7-C","8-D","9-B","10-A","11-C","12-D","13-B","14-A","15-C","16-D","17-A","18-B","19-C","20-D"];
    const topicText = value(t.topicsText) || "Genel konular\nSağlık konuları\nTeknik konular\nİşe ve işyerine özgü riskler";
    const topics = topicText.split(/\n+/).filter(Boolean);
    let html = pageBreak("İŞ SAĞLIĞI VE GÜVENLİĞİ EĞİTİM KATILIM FORMU", `
      <table class="meta"><tr><th>Firma</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>Eğitim Adı</th><td>${escapeHtml(trainingName)}</td></tr><tr><th>Eğitim Tarihi</th><td>${escapeHtml(trainingDate)}</td></tr><tr><th>Saat</th><td>${escapeHtml(startTime)} - ${escapeHtml(endTime)}</td></tr><tr><th>Eğitim Süresi</th><td>${escapeHtml(hours)} Saat</td></tr><tr><th>Eğitim Yeri</th><td>${escapeHtml(place)}</td></tr><tr><th>Eğitici</th><td>${escapeHtml(trainer)}</td></tr><tr><th>İSG Uzmanı</th><td>${escapeHtml(authorityName("isgExpert","isg_expert"))}</td></tr><tr><th>İşyeri Hekimi</th><td>${escapeHtml(authorityName("doctor","workplaceDoctor","workplace_doctor"))}</td></tr></table>
      <table><thead><tr><th>No</th><th>Ad Soyad</th><th>T.C.</th><th>Görev</th><th>İmza</th></tr></thead><tbody>${pRows}</tbody></table>`);
    html += pageBreak("İSG EĞİTİMİ SINAV KAĞIDI", `<p>Firma: ${escapeHtml(firm?.firm_name||"-")}<br/>Eğitim: ${escapeHtml(trainingName)}<br/>Tarih: ${escapeHtml(trainingDate)}<br/><br/>Ad Soyad: ____________________ &nbsp;&nbsp; T.C.: ____________________</p>${questions.map((q,i)=>`<div class="question"><b>${i+1}) ${escapeHtml(q)}</b><br/>A) _______ &nbsp; B) _______ &nbsp; C) _______ &nbsp; D) _______</div>`).join("")}`);
    html += pageBreak("İSG EĞİTİMİ CEVAP ANAHTARI", `<div class="answerGrid">${answers.map(a=>`<b>${a}</b>`).join("")}</div><p>Başarı değerlendirmesi: 100 üzerinden en az 70 puan başarılı kabul edilir.</p><p>Değerlendiren / Eğitici: ${escapeHtml(trainer)}</p>`);
    html += pageBreak("EĞİTİM SONUÇ RAPORU", `<table class="meta"><tr><th>Firma</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>SGK Sicil No</th><td>${escapeHtml(firm?.sgk_no||"-")}</td></tr><tr><th>Adres</th><td>${escapeHtml(firm?.address||"-")}</td></tr><tr><th>Eğitim</th><td>${escapeHtml(trainingName)}</td></tr><tr><th>Tarih</th><td>${escapeHtml(trainingDate)}</td></tr><tr><th>Saat</th><td>${escapeHtml(startTime)} - ${escapeHtml(endTime)}</td></tr><tr><th>Süre</th><td>${escapeHtml(hours)} Saat</td></tr><tr><th>Yer</th><td>${escapeHtml(place)}</td></tr><tr><th>Eğitici</th><td>${escapeHtml(trainer)}</td></tr><tr><th>Katılımcı Sayısı</th><td>${participants.length || employees.length}</td></tr></table><h2>Eğitim Konu Başlıkları</h2><ol>${topics.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol><h2>Değerlendirme</h2><p>Eğitim katılım listesi alınmış, sınav/değerlendirme süreci uygulanmış ve kayıt altına alınmıştır.</p><p>Katılımcıların eğitim içeriği hakkında bilgilendirildiği kabul edilmiştir.</p>`);
    const certPeople = participants.length ? participants : employees;
    html += certPeople.map((e:any,i:number)=>pageBreak("İŞ SAĞLIĞI VE GÜVENLİĞİ EĞİTİM SERTİFİKASI", `<div class="certificate"><p>Aşağıda bilgileri yer alan çalışan, belirtilen eğitime katılmıştır.</p><h2>${escapeHtml(value(e.fullName ?? e.full_name) || employeeName(e))}</h2><p>T.C.: ${escapeHtml(value(e.tcNo ?? e.tc_no) || employeeTc(e))} • Görev: ${escapeHtml(value(e.jobTitle ?? e.job_title) || employeeJob(e))}</p><p>Eğitim Adı: ${escapeHtml(trainingName)}</p><p>Eğitim Tarihi: ${escapeHtml(trainingDate)} • Süre: ${escapeHtml(hours)} Saat</p><p>Firma: ${escapeHtml(firm?.firm_name||"-")}</p><p>SGK Sicil No: ${escapeHtml(firm?.sgk_no||"-")}</p><p>Adres: ${escapeHtml(firm?.address||"-")}</p><div class="signatures"><div><b>Eğitici / İSG Uzmanı</b><br/>${escapeHtml(trainer)}<div class="sign"></div></div><div><b>İşyeri Hekimi</b><br/>${escapeHtml(authorityName("doctor","workplaceDoctor"))}<div class="sign"></div></div><div><b>İşveren / Vekili</b><br/>${escapeHtml(authorityName("employer","employerRep"))}<div class="sign"></div></div></div><p>Sertifika No: DSEC-${new Date().getFullYear()}-${String(i+1).padStart(6,"0")}</p></div>`)).join("");
    return html;
  }

  function commitmentHtml() {
    const commitments = ["İşyerinde verilen iş sağlığı ve güvenliği talimatlarına uyacağımı,","Tarafıma verilen kişisel koruyucu donanımları eksiksiz ve doğru kullanacağımı,","Tehlikeli durumları amirime ve İSG birimine bildireceğimi,","Makine, ekipman ve çalışma alanlarında güvenlik kurallarına uyacağımı,","Acil durum, yangın, tahliye ve ilk yardım talimatlarına uygun hareket edeceğimi,","Yetkim olmayan ekipmanlara müdahale etmeyeceğimi,","İş kazası, ramak kala ve uygunsuzlukları bildireceğimi kabul ve taahhüt ederim."];
    const instructions = ["Genel İş Sağlığı ve Güvenliği Talimatı","Kişisel Koruyucu Donanım Kullanım Talimatı","Yangın ve Acil Durum Talimatı","Elektrik Güvenliği Talimatı","Elle Taşıma İşleri Talimatı","Makine / Ekipman Güvenliği Talimatı","İş Kazası ve Ramak Kala Bildirim Talimatı"];
    const list = employees.length ? employees : [{full_name:"Çalışan Adı Girilmedi",tc_no:"-",job_title:"-"}];
    return list.map(e=>pageBreak("İSG TAAHHÜTNAMESİ VE TALİMAT TESLİM FORMU", `<table class="meta"><tr><th>Firma Ünvanı</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>Çalışan</th><td>${escapeHtml(employeeName(e))}</td></tr><tr><th>T.C. Kimlik No</th><td>${escapeHtml(employeeTc(e))}</td></tr><tr><th>Görev / Ünvan</th><td>${escapeHtml(employeeJob(e))}</td></tr><tr><th>Tarih</th><td>${today()}</td></tr></table><h2>Çalışan Taahhüdü</h2><ul>${commitments.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul><h2>Teslim Edilen Talimatlar</h2><ol>${instructions.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol><div class="signatures"><div>Çalışan İmza<div class="sign"></div></div><div>İşveren / İşveren Vekili<br/>${escapeHtml(authorityName("employer","employerRep"))}<div class="sign"></div></div></div>`)).join("");
  }

  function healthHtml() {
    const list = employees.length ? employees : [{full_name:"Çalışan Adı Girilmedi",tc_no:"-",job_title:"-"}];
    return list.map(e=>pageBreak("EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU TASLAĞI", `<table class="meta"><tr><th>Firma Ünvanı</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>Çalışan Ad Soyad</th><td>${escapeHtml(employeeName(e))}</td></tr><tr><th>T.C. Kimlik No</th><td>${escapeHtml(employeeTc(e))}</td></tr><tr><th>Görev / Ünvan</th><td>${escapeHtml(employeeJob(e))}</td></tr><tr><th>Muayene Türü</th><td>İşe Giriş / Periyodik</td></tr><tr><th>Muayene Tarihi</th><td>__ / __ / __</td></tr><tr><th>İşyeri Hekimi</th><td>${escapeHtml(authorityName("doctor","workplaceDoctor"))}</td></tr></table><h2>Tıbbi Anamnez</h2>${["Yakınma / Şikayet","Geçirilmiş Hastalıklar","İş Kazası / Meslek Hastalığı Geçmişi","Sürekli Kullanılan İlaçlar","Alerji Bilgisi"].map(x=>`<div class="fillRow"><b>${x}</b></div>`).join("")}<h2>Fizik Muayene ve Tetkikler</h2>${["Boy / Kilo / VKİ","Kan Basıncı / Nabız","Görme / İşitme","Solunum Sistemi","Kas İskelet Sistemi","Laboratuvar / Radyoloji","Odyometri / SFT / Diğer"].map(x=>`<div class="fillRow"><b>${x}</b></div>`).join("")}<h2>Kanaat</h2>${["Çalışmaya Elverişlidir","Şartlı Elverişlidir","Çalışmaya Elverişli Değildir","Açıklama / Kısıt"].map(x=>`<div class="fillRow"><b>${x}</b></div>`).join("")}<p><b>İşyeri Hekimi İmza:</b> __________________</p>`)).join("");
  }

  function drillHtml() {
    const fire = employees.filter(e=>e.isFireTeam||e.is_fire_team).map(employeeName).join(", ") || "-";
    const search = employees.filter(e=>e.isSearchRescueTeam||e.is_search_rescue_team).map(employeeName).join(", ") || "-";
    const protection = employees.filter(e=>e.isProtectionTeam||e.is_protection_team).map(employeeName).join(", ") || "-";
    const firstAid = employees.filter(e=>e.isFirstAidTeam||e.is_first_aid_team).map(employeeName).join(", ") || "-";
    const riskTeamNames = employees.filter(e=>e.isRiskAssessmentTeam||e.is_risk_assessment_team).map(employeeName).join(", ") || "-";
    const board = employees.filter(e=>e.isIsgBoardMember||e.is_isg_board_member).map(employeeName).join(", ") || "-";
    const flow = ["Alarm / uyarı sistemi çalıştırılır.","Çalışanlar en yakın güvenli çıkış güzergahından tahliye edilir.","Acil durum ekipleri kendi görev alanlarına yönelir.","Yangın ekibi ilk müdahale senaryosunu uygular.","Arama-kurtarma ve tahliye ekibi alan kontrolü yapar.","Koruma ekibi toplanma alanı ve giriş-çıkış güvenliğini sağlar.","İlk yardım ekibi olası yaralanma senaryosuna müdahale eder.","Toplanma alanında kişi sayımı yapılır.","Tatbikat sonrası değerlendirme toplantısı yapılır."];
    const scenario = pageBreak("ACİL DURUM TAHLİYE TATBİKATI SENARYOSU", `<table class="meta"><tr><th>Firma Ünvanı</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>Tatbikat Türü</th><td>Yangın ve Tahliye Tatbikatı</td></tr><tr><th>Tatbikat Tarihi</th><td>__ / __ / __</td></tr><tr><th>Tatbikat Saati</th><td>__</td></tr><tr><th>Tatbikat Yeri</th><td>İşletme geneli / belirlenen saha</td></tr><tr><th>Tatbikat Koordinatörü</th><td>${escapeHtml(authorityName("isgExpert","isg_expert"))}</td></tr></table><h2>1. Senaryo Tanımı</h2><p>İşletmenin belirlenen bölümünde yangın alarmı verilmesi üzerine çalışanların güvenli şekilde tahliye edilmesi, acil durum ekiplerinin görev dağılımına uygun hareket etmesi ve toplanma alanında personel sayımının yapılması amaçlanmıştır.</p><h2>2. Tatbikat Akışı</h2><ol>${flow.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol><h2>3. Görevli Ekipler</h2><p>Yangın Ekibi: ${escapeHtml(fire)}</p><p>Arama Kurtarma: ${escapeHtml(search)}</p><p>Koruma Ekibi: ${escapeHtml(protection)}</p><p>İlk Yardım Ekibi: ${escapeHtml(firstAid)}</p><p>Risk Değerlendirme Ekibi: ${escapeHtml(riskTeamNames)}</p><p>İSG Kurul Üyeleri: ${escapeHtml(board)}</p><h2>4. Onay</h2><p>İşveren / Vekili: ${escapeHtml(authorityName("employer","employerRep"))}</p><p>İSG Uzmanı: ${escapeHtml(authorityName("isgExpert","isg_expert"))}</p><p>İşyeri Hekimi: ${escapeHtml(authorityName("doctor","workplaceDoctor"))}</p><p>İmza: __________</p>`);
    const rows = (employees.length?employees:[{full_name:"Çalışan Adı Girilmedi",job_title:"-"}]).map((e,i)=>{const duties=[]; if(e.isFireTeam||e.is_fire_team)duties.push("Yangın"); if(e.isSearchRescueTeam||e.is_search_rescue_team)duties.push("Arama/Tahliye"); if(e.isProtectionTeam||e.is_protection_team)duties.push("Koruma"); if(e.isFirstAidTeam||e.is_first_aid_team)duties.push("İlk Yardım"); if(e.isRiskAssessmentTeam||e.is_risk_assessment_team)duties.push("Risk Ekibi"); if(e.isIsgBoardMember||e.is_isg_board_member)duties.push("İSG Kurulu"); return `<tr><td>${i+1}</td><td>${escapeHtml(employeeName(e))}</td><td>${escapeHtml(employeeJob(e))}</td><td>${escapeHtml(duties.join(", ")||"-")}</td><td></td></tr>`}).join("");
    return scenario + pageBreak("TATBİKAT KATILIM FORMU", `<p>Firma: ${escapeHtml(firm?.firm_name||"-")}<br/>Tatbikat: Yangın ve Tahliye Tatbikatı<br/>Tarih: __ / __ / __</p><table><thead><tr><th>No</th><th>Ad Soyad</th><th>Görev</th><th>Ekip Görevi</th><th>İmza</th></tr></thead><tbody>${rows}</tbody></table>`);
  }

  function assignmentHtml() {
    return selectedDutyRows().map(({e,duty})=>pageBreak("GÖREVLENDİRME / ATAMA YAZISI", `<p><b>Firma Ünvanı:</b> ${escapeHtml(firm?.firm_name||"-")}<br/><b>Tarih:</b> ${today()}</p><p><b>Sayın ${escapeHtml(employeeName(e))},</b></p><p>İşyerimizde yürütülen İş Sağlığı ve Güvenliği çalışmaları kapsamında; 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili mevzuat hükümleri doğrultusunda aşağıda belirtilen görev için görevlendirilmiş bulunmaktasınız.</p><table class="meta"><tr><th>Görevlendirilen Personel</th><td>${escapeHtml(employeeName(e))}</td></tr><tr><th>T.C. Kimlik No</th><td>${escapeHtml(employeeTc(e))}</td></tr><tr><th>Görev / Ünvan</th><td>${escapeHtml(employeeJob(e))}</td></tr><tr><th>Atandığı Görev</th><td>${escapeHtml(duty)}</td></tr></table><h2>Görevin kapsamı</h2>${duty.includes("Risk Değerlendirme")?'<ul><li>Risk değerlendirme çalışmalarına aktif katılım sağlamak,</li><li>Tehlike ve risklerin belirlenmesine katkı sunmak,</li><li>Mevcut önlemleri ve alınacak aksiyonları değerlendirmek,</li><li>Aksiyonların takibi ve revizyon süreçlerine destek olmak.</li></ul>':duty.includes("Kurul")?'<ul><li>İSG kurul toplantılarına katılım sağlamak,</li><li>Kurul gündemindeki konulara görüş ve öneri sunmak,</li><li>Alınan kararların takip edilmesine destek olmak,</li><li>Çalışanların İSG konularındaki bildirimlerini kurula taşımak.</li></ul>':'<ul><li>İşyerinde İSG faaliyetlerine katkı sağlamak,</li><li>Acil durum, eğitim, bilgilendirme ve koordinasyon süreçlerinde görev almak,</li><li>İşveren/işveren vekili, İSG uzmanı ve işyeri hekimi ile koordineli çalışmak,</li><li>Göreviyle ilgili eğitim ve bilgilendirme çalışmalarına katılmak.</li></ul>'}<div class="signatures"><div><b>İşveren / İşveren Vekili</b><br/>${escapeHtml(authorityName("employer","employerRep"))}<div class="sign"></div></div></div>`)).join("");
  }

  function riskHtml() {
    const rows = risks.length ? risks.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.activity ?? r.title ?? "-")}</td><td>${escapeHtml(r.hazard ?? "-")}</td><td>${escapeHtml(r.risk ?? r.risk_description ?? "-")}</td><td>${escapeHtml(r.currentMeasure ?? r.current_measure ?? "-")}</td><td>${escapeHtml(r.probability ?? "-")}</td><td>${escapeHtml(r.frequency ?? "-")}</td><td>${escapeHtml(r.severity ?? "-")}</td><td>${escapeHtml(r.score ?? r.risk_score ?? "-")}</td><td>${escapeHtml(r.action ?? "-")}</td><td>${escapeHtml(r.responsible ?? "-")}</td><td>${escapeHtml(r.deadline ?? "-")}</td></tr>`).join("") : '<tr><td colspan="12">Fine Kinney risk kaydı bulunamadı.</td></tr>';
    return pageBreak("FINE KINNEY RİSK DEĞERLENDİRMESİ", `<table class="meta"><tr><th>Firma Ünvanı</th><td>${escapeHtml(firm?.firm_name||"-")}</td><th>SGK Sicil No</th><td>${escapeHtml(firm?.sgk_no||"-")}</td></tr><tr><th>Adres</th><td>${escapeHtml(firm?.address||"-")}</td><th>NACE</th><td>${escapeHtml(firm?.nace_code||"-")}</td></tr><tr><th>Sektör</th><td>${escapeHtml(firm?.sector||"-")}</td><th>Tehlike Sınıfı</th><td>${escapeHtml(firm?.danger_class||"-")}</td></tr></table><div class="wideTable"><table><thead><tr><th>No</th><th>Faaliyet</th><th>Tehlike</th><th>Risk</th><th>Mevcut Önlem</th><th>O</th><th>F</th><th>Ş</th><th>Skor</th><th>Aksiyon</th><th>Sorumlu</th><th>Termin</th></tr></thead><tbody>${rows}</tbody></table></div><div class="signatures"><div>İşveren / Vekili<br/>${escapeHtml(authorityName("employer","employerRep"))}<div class="sign"></div></div><div>İSG Uzmanı<br/>${escapeHtml(authorityName("isgExpert","isg_expert"))}<div class="sign"></div></div><div>İşyeri Hekimi<br/>${escapeHtml(authorityName("doctor","workplaceDoctor"))}<div class="sign"></div></div></div>`);
  }

  function boardMembersHtml(title: string, filter: (e:AnyRow)=>boolean) {
    const list = employees.filter(filter);
    const rows = (list.length?list:employees).map((e,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(employeeName(e))}</td><td>${escapeHtml(employeeTc(e))}</td><td>${escapeHtml(employeeJob(e))}</td><td></td></tr>`).join("");
    return pageBreak(title, `<table class="meta"><tr><th>Firma</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>SGK Sicil No</th><td>${escapeHtml(firm?.sgk_no||"-")}</td></tr><tr><th>Adres</th><td>${escapeHtml(firm?.address||"-")}</td></tr></table><table><thead><tr><th>No</th><th>Ad Soyad</th><th>T.C.</th><th>Görev / Ünvan</th><th>İmza</th></tr></thead><tbody>${rows}</tbody></table><div class="signatures"><div>İşveren / Vekili<br/>${escapeHtml(authorityName("employer","employerRep"))}<div class="sign"></div></div><div>İSG Uzmanı<br/>${escapeHtml(authorityName("isgExpert","isg_expert"))}<div class="sign"></div></div><div>İşyeri Hekimi<br/>${escapeHtml(authorityName("doctor","workplaceDoctor"))}<div class="sign"></div></div></div>`);
  }

  function boardMeetingHtml() {
    const boardNames = employees.filter(e=>e.isIsgBoardMember||e.is_isg_board_member);
    return pageBreak("İSG KURUL TOPLANTI TUTANAĞI", `<table class="meta"><tr><th>Firma Ünvanı</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>SGK Sicil No</th><td>${escapeHtml(firm?.sgk_no||"-")}</td></tr><tr><th>Adres</th><td>${escapeHtml(firm?.address||"-")}</td></tr><tr><th>Toplantı Tarihi</th><td>__ / __ / __</td></tr><tr><th>Toplantı No</th><td>_____</td></tr></table><h2>Gündem</h2><ol><li>İş sağlığı ve güvenliği performansının değerlendirilmesi.</li><li>Risk değerlendirmesi ve açık aksiyonların gözden geçirilmesi.</li><li>İş kazaları, ramak kala olaylar ve uygunsuzlukların değerlendirilmesi.</li><li>Eğitim, sağlık gözetimi, acil durum ve saha denetimlerinin değerlendirilmesi.</li><li>Çalışan görüş ve önerilerinin değerlendirilmesi.</li></ol><h2>Alınan Kararlar</h2><div class="decisionBox"></div><h2>Katılımcılar</h2><table><thead><tr><th>No</th><th>Ad Soyad</th><th>Görev / Ünvan</th><th>İmza</th></tr></thead><tbody>${(boardNames.length?boardNames:employees).map((e,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(employeeName(e))}</td><td>${escapeHtml(employeeJob(e))}</td><td></td></tr>`).join("")}</tbody></table>`);
  }

  function corporateHtml() {
    return pageBreak("DORA KURUMSAL İSG EVRAK PAKETİ", `<h2>1. Firma Bilgileri</h2><table class="meta"><tr><th>Firma</th><td>${escapeHtml(firm?.firm_name||"-")}</td></tr><tr><th>NACE Kodu</th><td>${escapeHtml(firm?.nace_code||"-")}</td></tr><tr><th>Sektör / Faaliyet</th><td>${escapeHtml(firm?.sector||"-")}</td></tr><tr><th>Tehlike Sınıfı</th><td>${escapeHtml(firm?.danger_class||"-")}</td></tr><tr><th>Çalışan Sayısı</th><td>${Math.max(employees.length,num(firm?.employee_count))}</td></tr><tr><th>Kurulum Skoru</th><td>%${effectiveScore}</td></tr><tr><th>Rapor Tarihi</th><td>${new Date().toLocaleString("tr-TR")}</td></tr></table><h2>2. DORA Yönetici Özeti</h2><p>DORA, girilen firma bilgilerine göre kurumsal İSG kurulum ihtiyaçlarını analiz etmiştir.</p><p>Öncelikli alanlar: risk değerlendirmesi, acil durum planı, eğitim planı, sağlık gözetimi ve KKD kayıtları.</p><p>Bu rapor ilk kurulum dokümantasyon yol haritası olarak kullanılabilir.</p><h2>3. Gereklilik Özeti</h2><p>Toplam Gereklilik: ${requirements.length}<br/>Kritik Gereklilik: ${criticalCount}<br/>Profesyonel Gereklilik: ${proCount}</p><h2>4. Robotik Doküman Üretim Listesi</h2>${requirements.map((r,i)=>`<div class="reqLine"><b>${i+1}. ${escapeHtml(r.title)}</b><br/>${escapeHtml(r.description)}<br/><span>Çıktı: ${escapeHtml(r.output)} • ${r.robotCanProduce?"DORA Üretebilir":"Manuel"}</span></div>`).join("")}`);
  }

  function generateRobotDocument(kind: string) {
    let title = "DORA Dokümanı";
    let html = "";
    switch (kind) {
      case "training_package": title = "DORA Eğitim ve Sertifika Paketi"; html = trainingPackageHtml(); break;
      case "corporate": title = "DORA Kurumsal Doküman Paketi"; html = corporateHtml(); break;
      case "fine_kinney": title = "DORA Fine Kinney Risk Değerlendirmesi"; html = riskHtml(); break;
      case "certificates": title = "DORA Toplu İSG Eğitim Sertifikaları"; html = trainingPackageHtml().split('<section class="docPage">').filter(x=>x.includes('EĞİTİM SERTİFİKASI')).map(x=>'<section class="docPage">'+x).join(''); if(!html) html=trainingPackageHtml(); break;
      case "board_minutes": title = "İSG Kurul Toplantı Tutanağı"; html = boardMeetingHtml(); break;
      case "appointments": title = "DORA Atama Yazıları"; html = assignmentHtml(); break;
      case "risk_team": title = "DORA Risk Değerlendirme Ekibi"; html = boardMembersHtml("RİSK DEĞERLENDİRME EKİBİ", e=>Boolean(e.isRiskAssessmentTeam||e.is_risk_assessment_team)); break;
      case "board_members": title = "DORA İSG Kurulu Üyeleri"; html = boardMembersHtml("İSG KURULU ÜYELERİ", e=>Boolean(e.isIsgBoardMember||e.is_isg_board_member)); break;
      case "attendance_exam": title = "DORA Eğitim Katılım ve Sınav Formu"; { const full=trainingPackageHtml(); const sections=full.match(/<section class="docPage">[\s\S]*?<\/section>/g)||[]; html=sections.slice(0,2).join(''); } break;
      case "commitment": title = "DORA İSG Taahhütname ve Talimat"; html = commitmentHtml(); break;
      case "health": title = "DORA Ek-2 Sağlık Formu Taslağı"; html = healthHtml(); break;
      case "drill": title = "DORA Tatbikat Senaryo ve Katılım"; html = drillHtml(); break;
      default: alert("Doküman tipi bulunamadı."); return;
    }
    printDocument(title, html);
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

      <section className="section">
        <div className="sectionHead">
          <div>
            <h2>Robotik Doküman Üretim Sırası</h2>
            <p>DORA’nın oluşturacağı ilk kurumsal doküman paketi.</p>
          </div>
        </div>

        <div className="productionList">
          {requirements.map((item) => (
            <article className="productionCard" key={`prod-${item.id}`}>
              <div className="prodTop">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className={item.priority === "CRITICAL" ? "prodCritical" : "prodPro"}>
                  {item.priority === "CRITICAL" ? "KRİTİK" : "PROFESYONEL"}
                </span>
              </div>
              <strong>Çıktı: {item.output}</strong>
              <div className="chips">
                <span>{item.complete ? "TAMAMLANDI" : "BEKLİYOR"}</span>
                {item.robotCanProduce ? <span className="robotChip">DORA Üretebilir</span> : <span className="manualChip">Manuel</span>}
              </div>
            </article>
          ))}
        </div>

        <button
          className="robotStart"
          onClick={() => setRobotStarted(true)}
        >
          {robotStarted ? "Robotik Üretim Başlatıldı" : "Robotik Doküman Üretimini Başlat"}
        </button>

        {robotStarted ? (
          <div className="robotQueueBlock">
            <div className="sectionHead">
              <div>
                <h2>DORA Robotik Üretim Kuyruğu</h2>
                <p>Kurumsal dokümanlar üretim sırasına alındı.</p>
              </div>
            </div>
            <div className="robotStatusCard">
              <strong>Robotik Üretim Durumu</strong>
              <p>{requirements.filter(x => x.robotCanProduce).length} adet doküman taslak üretim sürecine alındı.</p>
            </div>
            <div className="queue">
              {requirements.filter(x => x.robotCanProduce).map((item, index) => (
                <article className="queueItem robot" key={`auto-${item.id}`}>
                  <div className="queueIcon">{index + 1}</div>
                  <div className="queueBody">
                    <h3>{item.title}</h3>
                    <p>{item.output}</p>
                    <small>DORA otomatik üretim kuyruğunda.</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
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
.productionList{display:grid;gap:12px;margin-top:16px}.productionCard{padding:18px;border:1px solid #eaecf0;border-radius:18px;background:#fff}.prodTop{display:flex;justify-content:space-between;gap:16px}.prodTop h3{margin:0}.prodTop p{color:#667085;line-height:1.5}.prodCritical,.prodPro{height:max-content;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:900}.prodCritical{background:#fee2e2;color:#b42318}.prodPro{background:#fff0d6;color:#9a4c00}.robotStart{width:100%;margin-top:18px;padding:17px 20px;border:0;border-radius:999px;background:#8e1e1e;color:#fff;font-size:17px;font-weight:850}.robotQueueBlock{margin-top:22px}.robotStatusCard{padding:18px;border:1px solid #bfd7ff;border-radius:18px;background:#eff6ff;color:#344054}.robotStatusCard p{margin-bottom:0;color:#667085}.robotSection{margin-top:25px;padding:24px;border-radius:24px;background:#fff;border:1px solid #eaecf0}.robotButtons{display:grid;gap:12px;margin-top:18px}.robotButton{width:100%;padding:17px 20px;border:0;border-radius:999px;background:#8e1e1e;color:#fff;font-size:17px;font-weight:800;box-shadow:0 3px 8px rgba(122,38,51,.12)}
.independence{margin-top:22px;margin-bottom:32px;padding:17px 20px;border:1px solid #f8d9ce;border-radius:18px;background:#fff8f5}.independence strong{color:#7a2633}.independence p{margin:5px 0 0;color:#80545c;line-height:1.5}
.loading,.empty{padding:25px;text-align:center;color:#667085;background:#fff;border:1px solid #eaecf0;border-radius:16px}
@media(max-width:900px){.page{padding:14px}.topbar,.hero{flex-direction:column;align-items:stretch}.topActions{width:100%}.topActions button{flex:1}.heroScore{min-height:auto}.kpis,.expertTop,.requirementGrid{grid-template-columns:1fr 1fr}.sectionHead{flex-direction:column}}
@media(max-width:600px){.kpis,.expertTop,.requirementGrid{grid-template-columns:1fr}.kpi{min-height:135px}.kpi strong{font-size:36px}.robotButton{font-size:15px}}
`;