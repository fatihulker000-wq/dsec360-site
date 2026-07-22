import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RiskRecordPayload = {
  activity?: string;
  hazard?: string;
  consequence?: string;
  existingControl?: string;
  proposedControl?: string;
  responsible?: string;
  score?: number;
  method?: string;
  level?: string;
  completed?: boolean;
  dueDateMillis?: number | null;
  department?: string;
  process?: string;
};

async function getAdminContext() {
  const cookieStore = await cookies();

  const auth =
    cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value;

  const role =
    cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value;

  return {
    allowed:
      auth === "ok" &&
      (role === "super_admin" ||
        role === "company_admin" ||
        role === "demo_user"),
  };
}

function riskText(record: RiskRecordPayload) {
  return [
    record.activity,
    record.hazard,
    record.consequence,
    record.existingControl,
    record.proposedControl,
    record.department,
    record.process,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");
}

function legislation(text: string) {
  const result = new Set<string>([
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği",
  ]);

  if (
    /forklift|makine|ekipman|pres|vinç|konveyör|transpalet/.test(
      text
    )
  ) {
    result.add(
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği"
    );
  }

  if (/yangın|acil|tahliye|patlama/.test(text)) {
    result.add(
      "İşyerlerinde Acil Durumlar Hakkında Yönetmelik"
    );
    result.add(
      "Binaların Yangından Korunması Hakkında Yönetmelik"
    );
  }

  if (/elektrik|pano|kablo|ark/.test(text)) {
    result.add("Elektrik İç Tesisleri Yönetmeliği");
  }

  if (/elle taşıma|kaldırma|ergonomi|bel/.test(text)) {
    result.add("Elle Taşıma İşleri Yönetmeliği");
  }

  if (/kimyasal|solvent|asit|gaz|toz/.test(text)) {
    result.add(
      "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik"
    );
  }

  if (/kkd|baret|eldiven|gözlük|maske/.test(text)) {
    result.add(
      "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik"
    );
  }

  return Array.from(result);
}

function rootCauses(text: string) {
  const causes = [
    "Tehlikeli faaliyet için saha koşullarına özgü kontrol tedbirlerinin yetersiz kalması.",
    "Mevcut kontrollerin uygulanma sıklığının ve etkinliğinin kayıtlarla doğrulanmaması.",
    "Sorumluluk, termin ve denetim mekanizmasının yeterince net tanımlanmaması.",
  ];

  if (/forklift|araç|trafik/.test(text)) {
    causes.push(
      "Yaya ve araç yollarının fiziksel olarak ayrılmaması veya kör nokta yönetiminin yetersiz olması."
    );
  }

  if (/elektrik|pano/.test(text)) {
    causes.push(
      "Enerji izolasyonu, erişim kontrolü veya elektriksel bakım disiplininin yetersiz olması."
    );
  }

  if (/makine|pres|konveyör/.test(text)) {
    causes.push(
      "Makine koruyucularının, interlock sistemlerinin veya kilitleme-etiketleme uygulamasının yetersiz olması."
    );
  }

  return causes;
}

function engineeringControls(text: string) {
  const items = [
    "Tehlikeyi çalışanlardan fiziksel olarak ayıracak mühendislik çözümü uygulanmalıdır.",
    "Koruyucu sistemlerin çalışırlığı periyodik fonksiyon testleriyle doğrulanmalıdır.",
  ];

  if (/forklift|araç|trafik/.test(text)) {
    items.push(
      "Yaya ve araç yolları sabit bariyerlerle ayrılmalı; kör noktalara sensör, ayna ve sesli-ışıklı uyarı sistemi kurulmalıdır."
    );
  }

  if (/elektrik|pano/.test(text)) {
    items.push(
      "Canlı kısımlara erişimi engelleyen pano kapakları tamamlanmalı ve enerji izolasyon noktaları kilitlenebilir hale getirilmelidir."
    );
  }

  if (/makine|pres|konveyör/.test(text)) {
    items.push(
      "Tehlikeli hareket noktaları sabit veya kilitlemeli koruyucularla kapatılmalıdır."
    );
  }

  return items;
}

function administrativeControls(record: RiskRecordPayload) {
  return [
    "Faaliyete özgü yazılı çalışma talimatı ve kontrol listesi hazırlanmalıdır.",
    "Sorumlu kişi, termin ve etkinlik doğrulama yöntemi DÖF kaydında açıkça tanımlanmalıdır.",
    "Çalışanlara tehlike, yasak davranışlar ve acil durumda uygulanacak işlemler hakkında uygulamalı eğitim verilmelidir.",
    record.completed
      ? "Kapatılan DÖF'ün etkinliği saha gözlemi ve kalan risk hesabıyla yeniden doğrulanmalıdır."
      : "Açık DÖF yönetici takibine alınmalı ve termin aşımı oluşmadan tamamlanmalıdır.",
  ];
}

function ppeRecommendations(text: string) {
  const items = [
    "KKD seçimi risk değerlendirmesine, çalışma ortamına ve kişiye uygunluk kriterlerine göre yapılmalıdır.",
    "KKD kullanımı mühendislik ve idari kontrollerin yerine geçmemeli, tamamlayıcı tedbir olarak uygulanmalıdır.",
  ];

  if (/forklift|depo|yükleme/.test(text)) {
    items.push(
      "Reflektif yelek, koruyucu ayakkabı ve gerekli alanlarda baret kullanımı sağlanmalıdır."
    );
  }

  if (/elektrik|pano/.test(text)) {
    items.push(
      "Elektriksel risk seviyesine uygun yalıtkan eldiven, yüz siperi ve ark dayanımlı koruyucu giysi değerlendirilmelidir."
    );
  }

  if (/kimyasal|toz|gaz/.test(text)) {
    items.push(
      "Kimyasalın güvenlik bilgi formuna uygun eldiven, göz-yüz koruyucu ve solunum koruyucu seçilmelidir."
    );
  }

  return items;
}

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const record: RiskRecordPayload =
      body.record || {};

    if (!record.hazard?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "DORA analizi için tehlike açıklaması gereklidir.",
        },
        { status: 400 }
      );
    }

    const text = riskText(record);
    const score = Number(record.score || 0);

    const managementDecision =
      score >= 400
        ? "Risk mevcut haliyle kabul edilemez. Faaliyet durdurulmalı, geçici güvenlik tedbirleri derhal uygulanmalı ve risk kabul edilebilir seviyeye indirilmeden çalışma yeniden başlatılmamalıdır."
        : score >= 200
          ? "Risk yönetim önceliği çok yüksektir. Kısa terminli DÖF açılması, mühendislik kontrolünün planlanması ve uygulamanın yönetici seviyesinde izlenmesi önerilir."
          : score >= 70
            ? "Risk için planlı düzeltici faaliyet oluşturulmalı, sorumlu ve termin atanmalı ve kontrol tedbirlerinin etkinliği kalan risk hesabıyla doğrulanmalıdır."
            : "Mevcut kontroller korunmalı, ilave iyileştirmeler planlı biçimde uygulanmalı ve risk periyodik olarak yeniden değerlendirilmelidir.";

    const accidentScenario = [
      `${record.hazard.trim()} çalışma sırasında ortaya çıkar veya kontrol dışına çıkar.`,
      "Çalışan tehlike alanında bulunur ve mevcut kontroller olayın gerçekleşmesini tamamen önleyemez.",
      record.consequence?.trim() ||
        "Yaralanma, iş günü kaybı, maddi hasar veya operasyon kesintisi meydana gelir.",
      "İlk müdahale, olay bildirimi ve faaliyet durdurma süreçleri başlatılır.",
      "Kök neden analizi yapılır ve ilave kontroller tamamlanmadan benzer çalışma güvenli kabul edilmez.",
    ];

    const residualRiskEstimate =
      score >= 200
        ? "Önerilen mühendislik ve idari kontrollerin eksiksiz uygulanması halinde riskin orta veya düşük seviyeye indirilebilmesi beklenir. Kalan risk mutlaka yeni olasılık, frekans ve şiddet değerleriyle yeniden hesaplanmalıdır."
        : "Kontrollerin sahada etkin biçimde uygulanması ve sürdürülebilirliğinin doğrulanması halinde risk seviyesinde belirgin azalma beklenir. Kalan risk hesabı yapılmadan kayıt kapatılmamalıdır.";

    return NextResponse.json({
      success: true,
      analysis: {
        summary:
          `${record.activity || "İlgili faaliyet"} kapsamında tanımlanan risk; çalışan güvenliği, iş sürekliliği ve yasal uyum açısından değerlendirilmelidir. ` +
          `${record.hazard.trim()} tehlikesinin mevcut kontrollerle tamamen yönetilemediği durumlarda olayın ciddi sonuçlara dönüşme ihtimali bulunmaktadır.`,

        rootCauses: rootCauses(text),
        accidentScenario,
        engineeringControls:
          engineeringControls(text),
        administrativeControls:
          administrativeControls(record),
        ppeRecommendations:
          ppeRecommendations(text),
        managementDecision,
        legislation: legislation(text),
        residualRiskEstimate,
      },
    });
  } catch (error) {
    console.error(
      "risk AI analysis error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "DORA risk analizi oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}