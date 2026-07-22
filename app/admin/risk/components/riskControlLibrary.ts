export type ControlSuggestion = {
  id: string;
  title: string;
  text: string;
};

export type DofSuggestion = {
  id: string;
  title: string;
  action: string;
  responsibleRole: string;
  suggestedDays: number;
};

export type RiskControlBundle = {
  existing: ControlSuggestion[];
  additional: ControlSuggestion[];
  dof: DofSuggestion[];
};

const GENERAL_EXISTING: ControlSuggestion[] = [
  {
    id: "training",
    title: "Eğitim ve yetkilendirme",
    text:
      "Faaliyeti yürüten çalışanların görevleriyle ilgili tehlikeler, güvenli çalışma adımları, yasak davranışlar ve acil durumda uygulanacak işlemler konusunda eğitim alması; yalnızca yetkilendirilmiş personelin görevlendirilmesi ve eğitim kayıtlarının güncel tutulması sağlanmalıdır.",
  },
  {
    id: "inspection",
    title: "Periyodik saha kontrolü",
    text:
      "Çalışma alanı, ekipman ve uygulamalar belirlenmiş kontrol listeleriyle periyodik olarak denetlenmeli; tespit edilen uygunsuzluklar sorumlu ve termin bilgisiyle kayıt altına alınmalı, kapatma kanıtları doğrulanmadan tamamlanmış kabul edilmemelidir.",
  },
  {
    id: "instruction",
    title: "Yazılı talimat ve prosedür",
    text:
      "Faaliyetin güvenli şekilde yürütülmesi için görev, yetki, çalışma adımları, kontrol noktaları, yasaklar ve acil durum uygulamalarını içeren yazılı talimat hazırlanmalı; talimat çalışanların erişebileceği yerde bulundurulmalı ve saha uygulamasıyla uyumu düzenli olarak kontrol edilmelidir.",
  },
];

const GENERAL_ADDITIONAL: ControlSuggestion[] = [
  {
    id: "hierarchy",
    title: "Kontrol hiyerarşisine göre iyileştirme",
    text:
      "Riskin azaltılmasında öncelikle tehlikenin tamamen ortadan kaldırılması veya daha az tehlikeli yöntemle değiştirilmesi değerlendirilmelidir. Bunun mümkün olmadığı durumlarda mühendislik kontrolleri uygulanmalı, idari tedbirler ve kişisel koruyucu donanımlar yalnızca tamamlayıcı kontrol olarak kullanılmalıdır.",
  },
  {
    id: "verification",
    title: "Etkinlik doğrulaması",
    text:
      "Uygulanan tedbirlerin yalnızca tamamlandığı değil, riski gerçekten azalttığı da saha gözlemleri, ölçümler, çalışan geri bildirimleri ve tekrar değerlendirme yoluyla doğrulanmalıdır. Kontrolün etkisiz kaldığı veya yeni risk oluşturduğu durumlarda ek iyileştirme planı hazırlanmalıdır.",
  },
  {
    id: "maintenance",
    title: "Bakım ve süreklilik",
    text:
      "Koruyucu sistemlerin, ekipmanların ve güvenlik donanımlarının işlevini sürdürebilmesi için bakım, kontrol ve test periyotları belirlenmeli; arızalı veya devre dışı güvenlik bileşenleri giderilmeden faaliyetin sürdürülmesine izin verilmemelidir.",
  },
];

export const RISK_CONTROL_LIBRARY: Record<
  string,
  RiskControlBundle
> = {
  "forklift-yaya-trafigi": {
    existing: [
      {
        id: "forklift-authorized",
        title: "Operatör yetkilendirmesi",
        text:
          "Forkliftlerin yalnızca ilgili ekipman türü için eğitim almış, operatörlük yetkinliği doğrulanmış ve işveren tarafından yazılı olarak görevlendirilmiş personel tarafından kullanılması sağlanmalıdır. Yetki belgeleri, sağlık uygunluğu ve eğitim yenileme tarihleri düzenli olarak kontrol edilmelidir.",
      },
      {
        id: "forklift-daily",
        title: "Vardiya öncesi günlük kontrol",
        text:
          "Operatör her vardiya öncesinde fren, direksiyon, korna, geri vites alarmı, ikaz lambaları, lastikler, çatallar, hidrolik sistem ve emniyet kemeri gibi kritik noktaları kontrol etmeli; uygunsuzluk tespit edilen forklift kayıt altına alınarak kullanımdan çekilmelidir.",
      },
      {
        id: "forklift-traffic",
        title: "Saha trafik kuralları",
        text:
          "İşyerine özgü forklift trafik planı hazırlanmalı; hız limitleri, geçiş üstünlüğü, park alanları, yükleme noktaları, kör noktalar ve yaya geçişleri açıkça tanımlanmalı ve tüm çalışanlara uygulamalı olarak aktarılmalıdır.",
      },
    ],
    additional: [
      {
        id: "forklift-separation",
        title: "Yaya ve araç yollarının fiziksel ayrılması",
        text:
          "Forklift yolları ile yaya yolları, mümkün olan tüm güzergâhlarda darbeye dayanıklı sabit bariyerlerle ayrılmalıdır. Yaya geçişleri kontrollü noktalarda oluşturulmalı, bariyerlerin sürekliliği depo yerleşimi veya malzeme istifi nedeniyle bozulmamalıdır.",
      },
      {
        id: "forklift-warning",
        title: "Kör nokta ve yaklaşım uyarıları",
        text:
          "Kavşaklar, raf araları ve görüşün kısıtlandığı bölgelerde geniş açılı aynalar, sesli-ışıklı yaklaşım uyarıları, mavi ikaz lambaları, geri görüş kamerası veya yaya algılama sensörleri kullanılmalıdır. Sistemlerin çalışırlığı günlük kontrole dahil edilmelidir.",
      },
      {
        id: "forklift-speed",
        title: "Elektronik hız kontrolü",
        text:
          "Hız limitlerinin yalnızca levhayla belirtilmesiyle yetinilmemeli; saha şartlarına uygun elektronik hız sınırlayıcı, bölgesel hız kontrolü veya telematik takip sistemi kullanılmalı ve limit ihlalleri kayıt altına alınarak değerlendirilmelidir.",
      },
    ],
    dof: [
      {
        id: "forklift-dof-traffic",
        title: "Forklift-yaya trafik planını revize et",
        action:
          "Depo ve sevkiyat alanlarının mevcut trafik akışı yerinde incelenerek forklift güzergâhları, yaya yolları, kontrollü geçiş noktaları, hız limitleri, kör noktalar ve park alanlarını gösteren güncel trafik planı hazırlanmalı; plan fiziksel bariyer, yatay-düşey işaretleme ve saha eğitimiyle uygulanmalıdır.",
        responsibleRole: "Lojistik Müdürü / İSG Uzmanı",
        suggestedDays: 14,
      },
      {
        id: "forklift-dof-barrier",
        title: "Fiziksel ayırıcı bariyer kur",
        action:
          "Forklift ve yaya trafiğinin kesiştiği alanlar belirlenmeli, risk önceliğine göre sabit koruyucu bariyerler ve kontrollü yaya kapıları kurulmalı; montaj sonrası geçiş güvenliği saha gözlemiyle doğrulanmalı ve eksik kalan noktalar tamamlanmalıdır.",
        responsibleRole: "Teknik Müdür / Lojistik Sorumlusu",
        suggestedDays: 30,
      },
    ],
  },

  "elektrik-panosu-acik": {
    existing: [
      {
        id: "electrical-authorized",
        title: "Yetkili personel erişimi",
        text:
          "Elektrik panolarına yalnızca elektrik konusunda yetkili ve görevlendirilmiş personelin erişmesi sağlanmalı; pano odaları veya kapakları kilitli tutulmalı ve anahtar yönetimi kontrol altında bulundurulmalıdır.",
      },
      {
        id: "electrical-periodic",
        title: "Elektrik tesisatı kontrolleri",
        text:
          "Elektrik tesisatı, topraklama, kaçak akım koruma sistemleri ve pano bağlantıları yetkili kişilerce belirlenen periyotlarda kontrol edilmeli; ölçüm sonuçları raporlanmalı ve uygunsuzluklar giderilmeden sistem güvenli kabul edilmemelidir.",
      },
    ],
    additional: [
      {
        id: "electrical-loto",
        title: "Kilitleme-etiketleme uygulaması",
        text:
          "Bakım, arıza giderme ve pano içi çalışmalarda tüm enerji kaynaklarının belirlenmesi, kesilmesi, kilitlenmesi, etiketlenmesi ve enerjisizliğin uygun ölçüm cihazıyla doğrulanmasını içeren kilitleme-etiketleme prosedürü zorunlu uygulanmalıdır.",
      },
      {
        id: "electrical-thermal",
        title: "Termal kontrol ve bağlantı bakımı",
        text:
          "Panolarda aşırı ısınma, gevşek bağlantı ve dengesiz yüklerin erken tespiti için termal kamera kontrolleri yapılmalı; kritik sıcaklık artışları bakım planına alınmalı ve müdahale sonrası tekrar ölçümle doğrulanmalıdır.",
      },
    ],
    dof: [
      {
        id: "electrical-dof-close",
        title: "Pano açıklıklarını ve erişimi güvenli hale getir",
        action:
          "Açık veya hasarlı pano kapakları uygun standartta yenilenmeli, canlı bölümlere doğrudan erişimi önleyen iç koruyucu kapaklar tamamlanmalı, kilit sistemi kurulmalı ve pano önündeki güvenli çalışma alanı boşaltılarak zeminde işaretlenmelidir.",
        responsibleRole: "Elektrik Bakım Sorumlusu",
        suggestedDays: 7,
      },
    ],
  },

  "kaygan-zemin": {
    existing: [
      {
        id: "slip-cleaning",
        title: "Döküntüye hızlı müdahale",
        text:
          "Su, yağ, ürün veya kimyasal döküntülerinin fark edildiği anda alanın güvenli şekilde çevrilmesi, uyarı levhası yerleştirilmesi ve uygun yöntemle temizlenmesi sağlanmalı; müdahale sorumluluğu ve bildirim yöntemi çalışanlar tarafından bilinmelidir.",
      },
    ],
    additional: [
      {
        id: "slip-floor",
        title: "Kaymaz zemin ve drenaj iyileştirmesi",
        text:
          "Sürekli ıslanan, yağlanan veya döküntü oluşan alanlarda zemin yüzeyi kayma direnci yüksek malzemeyle kaplanmalı; suyun birikmesini önleyecek eğim ve drenaj sistemi oluşturulmalı, bozuk yüzeyler bakım planıyla yenilenmelidir.",
      },
      {
        id: "slip-analysis",
        title: "Tekrarlayan olayların kök neden analizi",
        text:
          "Kayma ve düşme olayları yalnızca temizlik eksikliği olarak değerlendirilmemeli; döküntünün kaynağı, proses kaçağı, zemin yapısı, ayakkabı uygunluğu, aydınlatma ve çalışma yoğunluğu birlikte incelenerek kalıcı iyileştirme yapılmalıdır.",
      },
    ],
    dof: [
      {
        id: "slip-dof-area",
        title: "Kaygan alanı kalıcı olarak iyileştir",
        action:
          "Kayma olayının gerçekleştiği veya tekrar ettiği alanın zemin kaplaması, drenajı ve döküntü kaynağı teknik olarak incelenmeli; kaymaz yüzey uygulaması, kaçak giderme ve hızlı müdahale düzenlemesi tamamlanarak etkinlik saha testiyle doğrulanmalıdır.",
        responsibleRole: "Teknik İşler / İdari İşler",
        suggestedDays: 30,
      },
    ],
  },

  "elle-tasima": {
    existing: [
      {
        id: "manual-training",
        title: "Güvenli kaldırma eğitimi",
        text:
          "Çalışanlara yükü değerlendirme, vücuda yakın tutma, dizlerden destek alma, dönerek kaldırmadan kaçınma, ekip çalışması ve mekanik yardımcı kullanımı konularında uygulamalı eğitim verilmelidir.",
      },
    ],
    additional: [
      {
        id: "manual-mechanical",
        title: "Mekanik kaldırma yardımcıları",
        text:
          "Manuel kaldırma ve taşıma ihtiyacı; taşıma arabası, transpalet, konveyör, vakumlu kaldırıcı, kaldırma platformu veya uygun tutma aparatı kullanılarak azaltılmalı; yardımcı ekipmanın çalışma alanında kolay erişilebilir olması sağlanmalıdır.",
      },
      {
        id: "manual-layout",
        title: "Ergonomik yerleşim",
        text:
          "Sık kullanılan ve ağır malzemeler diz ile omuz yüksekliği arasına yerleştirilmeli; zeminden veya baş üstünden kaldırma gerektiren raf düzenleri değiştirilerek taşıma mesafesi ve gövde dönüşü azaltılmalıdır.",
      },
    ],
    dof: [
      {
        id: "manual-dof-ergonomic",
        title: "Ergonomik iş analizi yap",
        action:
          "Elle taşıma faaliyetleri yük ağırlığı, taşıma mesafesi, tutuş koşulları, kaldırma yüksekliği, tekrar sayısı ve çalışan özellikleri dikkate alınarak ergonomik yöntemle analiz edilmeli; yüksek riskli işler için mekanik yardımcı ve yerleşim iyileştirme planı hazırlanmalıdır.",
        responsibleRole: "Bölüm Müdürü / İSG Uzmanı",
        suggestedDays: 30,
      },
    ],
  },

  "yangin-tupu-onu-kapali": {
    existing: [
      {
        id: "fire-access",
        title: "Erişim alanının boş tutulması",
        text:
          "Yangın söndürücü, yangın dolabı ve diğer ilk müdahale ekipmanlarının önü sürekli boş tutulmalı; ekipmanın bulunduğu alan ürün, palet, araç veya geçici malzeme depolamak amacıyla kullanılmamalıdır.",
      },
    ],
    additional: [
      {
        id: "fire-marking",
        title: "Zemin ve düşey işaretleme",
        text:
          "Yangın ekipmanına ait erişim alanı zeminde dikkat çekici çizgilerle sınırlandırılmalı, ekipmanın yeri uzaktan görülebilen düşey levhayla belirtilmeli ve raf veya malzeme yerleşimi işareti kapatmayacak şekilde düzenlenmelidir.",
      },
      {
        id: "fire-shift",
        title: "Vardiya erişim kontrolü",
        text:
          "Yangın ekipmanlarının erişilebilirliği vardiya veya günlük saha kontrol listesine eklenmeli; önü kapalı ekipmanlar anında açılmalı, tekrar eden uygunsuzluklar bölüm sorumlusu ve kök neden bilgisiyle takip edilmelidir.",
      },
    ],
    dof: [
      {
        id: "fire-dof-access",
        title: "Yangın ekipmanı erişimini kalıcılaştır",
        action:
          "Yangın söndürme ekipmanlarının çevresindeki malzemeler kaldırılmalı, sürekli boş tutulacak erişim alanı zeminde işaretlenmeli, görünürlük levhaları tamamlanmalı ve günlük kontrol sorumluluğu ilgili bölüm yöneticisine yazılı olarak atanmalıdır.",
        responsibleRole: "Acil Durum Koordinatörü / Bölüm Sorumlusu",
        suggestedDays: 7,
      },
    ],
  },

  "makine-koruyucu-eksik": {
    existing: [
      {
        id: "machine-guard",
        title: "Koruyucuların kullanımı",
        text:
          "Makinenin kesme, ezme, sıkıştırma ve dönen hareket noktaları uygun koruyucularla kapatılmalı; koruyucular sökülmüş, hasarlı veya devre dışı durumdayken makinenin çalıştırılmasına izin verilmemelidir.",
      },
    ],
    additional: [
      {
        id: "machine-interlock",
        title: "Kilitlemeli koruyucu sistemi",
        text:
          "Sık erişim gereken tehlikeli bölgelerde koruyucu açıldığında hareketi güvenli biçimde durduran interlock sistemi kullanılmalı; sistemin bypass edilmesini önleyecek tasarım yapılmalı ve fonksiyon testi belirlenen periyotlarda kayıt altına alınmalıdır.",
      },
      {
        id: "machine-loto",
        title: "Enerji izolasyonu",
        text:
          "Temizlik, ayar, sıkışma giderme ve bakım işlemlerinde elektrik, pnömatik, hidrolik, mekanik ve birikmiş enerji kaynakları belirlenerek kilitlenmeli; sıfır enerji durumu doğrulanmadan tehlikeli bölgeye müdahale edilmemelidir.",
      },
    ],
    dof: [
      {
        id: "machine-dof-guard",
        title: "Makine koruyucusunu standarda uygun tamamla",
        action:
          "Makinenin tüm tehlikeli hareket noktaları teknik risk analiziyle belirlenmeli, uygun sabit veya kilitlemeli koruyucu tasarlanarak monte edilmeli, acil durdurma ve interlock fonksiyonları test edilmeli ve güvenlik doğrulanmadan makine üretime alınmamalıdır.",
        responsibleRole: "Bakım Müdürü / Üretim Müdürü",
        suggestedDays: 0,
      },
    ],
  },
};

export function getRiskControlBundle(
  templateId: string
): RiskControlBundle {
  return (
    RISK_CONTROL_LIBRARY[templateId] || {
      existing: GENERAL_EXISTING,
      additional: GENERAL_ADDITIONAL,
      dof: [
        {
          id: "general-dof",
          title: "Risk azaltma planı oluştur",
          action:
            "Riskin kaynağı, mevcut kontrollerin yetersizlikleri ve uygulanabilir kontrol seçenekleri ilgili bölümle birlikte değerlendirilerek sorumlu, termin, kaynak ihtiyacı ve etkinlik doğrulama yöntemini içeren yazılı düzeltici faaliyet planı hazırlanmalıdır.",
          responsibleRole: "Bölüm Sorumlusu / İSG Uzmanı",
          suggestedDays: 30,
        },
      ],
    }
  );
}