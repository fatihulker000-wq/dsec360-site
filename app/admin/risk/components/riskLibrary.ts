import type { RiskMethod } from "../types";

export type RiskLibraryItem = {
  id: string;
  sector: string;
  category: string;
  title: string;
  keywords: string[];
  method: RiskMethod;
  activity: string;
  process: string;
  hazard: string;
  consequence: string;
  existingControl: string;
  proposedControl: string;
  responsibleRole: string;
  probability: number;
  frequency: number;
  severity: number;
  suggestedDays: number;
  legislation: string[];
};

export const RISK_LIBRARY: RiskLibraryItem[] = [
  {
    id: "forklift-yaya-trafigi",
    sector: "Lojistik / Depo",
    category: "İş Ekipmanı",
    title: "Forklift ve yaya trafiğinin aynı alanda bulunması",
    keywords: ["forklift", "depo", "yükleme", "yaya", "çarpma", "ezilme"],
    method: "FINE_KINNEY",
    activity:
      "Depo, sevkiyat ve yükleme alanlarında forklift ile malzeme taşıma, palet istifleme ve araç yükleme-boşaltma faaliyetleri.",
    process:
      "Depo koridorları, yükleme rampaları, sevkiyat alanları ve forklift-yaya trafik güzergâhları",
    hazard:
      "Forkliftlerin çalışanlarla aynı güzergâhları kullanması, operatör görüş alanının yük nedeniyle kısıtlanması, geri manevra sırasında kör noktaların oluşması, hız limitlerine uyulmaması ve yaya yollarının fiziksel olarak ayrılmaması nedeniyle çarpma, sıkışma, ezilme veya forklift devrilmesi riski oluşmaktadır.",
    consequence:
      "Forklift ile çalışanın çarpışması; ağır ezilme, uzuv kaybı, kalıcı iş göremezlik veya ölümle sonuçlanabilir. Devrilen yükler çalışanların üzerine düşebilir, raf sistemleri ve ürünler zarar görebilir, sevkiyat faaliyetleri durabilir ve işletme önemli maddi ve operasyonel kayıplarla karşılaşabilir.",
    existingControl:
      "Forkliftlerin yalnızca yetkilendirilmiş ve eğitimli operatörler tarafından kullanılması, araçların periyodik kontrollerinin yapılması, çalışma alanlarında hız limitlerinin belirlenmesi, geri manevra alarmı ve ikaz lambalarının çalışır durumda tutulması, operatörlerin vardiya öncesi günlük kontrol yapması ve çalışanlara depo trafik kuralları hakkında eğitim verilmesi sağlanmalıdır. Bu kontrollerin saha denetimleriyle düzenli olarak doğrulanması gerekir.",
    proposedControl:
      "Forklift yolları ile yaya yolları mümkün olan tüm alanlarda sabit ve dayanıklı fiziksel bariyerlerle ayrılmalıdır. Kavşak ve kör noktalara geniş açılı aynalar, sesli-ışıklı uyarı sistemleri ve yaya geçiş kontrol noktaları kurulmalıdır. Hız sınırları saha risklerine göre belirlenmeli ve elektronik hız sınırlayıcılarla desteklenmelidir. Geri manevra sırasında görüşü artıran kamera, mavi ikaz lambası ve yaklaşım sensörleri kullanılmalıdır. Yükleme alanlarına yetkisiz yaya girişleri sınırlandırılmalı, trafik planı zeminde ve düşey levhalarla açıkça gösterilmeli ve uygulamanın etkinliği düzenli gözlem ve kayıtlarla takip edilmelidir.",
    responsibleRole: "Depo Müdürü / Lojistik Sorumlusu",
    probability: 6,
    frequency: 6,
    severity: 40,
    suggestedDays: 7,
    legislation: [
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik",
      "Sağlık ve Güvenlik İşaretleri Yönetmeliği",
    ],
  },
  {
    id: "elektrik-panosu-acik",
    sector: "Tüm Sektörler",
    category: "Elektrik",
    title: "Elektrik panosunun açık veya korumasız bulunması",
    keywords: ["elektrik", "pano", "çarpılma", "ark", "yangın"],
    method: "FINE_KINNEY",
    activity:
      "Elektrik dağıtım panolarının işletilmesi, kontrolü, bakım ve arıza müdahalesi.",
    process:
      "Ana dağıtım panosu, tali panolar, makine panoları ve elektrik odaları",
    hazard:
      "Elektrik panosu kapağının açık bırakılması, pano içi canlı bölümlere erişimin engellenmemesi, uygun kilitleme sisteminin bulunmaması, pano önünün malzemelerle kapatılması ve yetkisiz kişilerin panoya müdahale edebilmesi nedeniyle elektrik çarpması, ark flaşı, kısa devre ve yangın riski oluşmaktadır.",
    consequence:
      "Canlı iletkenlere temas veya ark oluşması; ağır elektrik yanığı, kalp ritim bozukluğu, düşme, kalıcı yaralanma ya da ölümle sonuçlanabilir. Kısa devre ve aşırı ısınma yangına, üretim kaybına, kritik ekipmanların devre dışı kalmasına ve işletme genelinde enerji kesintisine neden olabilir.",
    existingControl:
      "Panoların kapaklı ve kilitli tutulması, yalnızca yetkili elektrik personelinin müdahale etmesi, pano ve devrelerin tanımlanması, kaçak akım koruma sistemlerinin kullanılması, termal kontrollerin ve periyodik elektrik tesisatı ölçümlerinin yapılması, pano önünde yeterli çalışma mesafesinin korunması ve uygun uyarı levhalarının bulundurulması sağlanmalıdır.",
    proposedControl:
      "Tüm panoların erişim kontrolü gözden geçirilmeli ve kilit sistemleri standartlaştırılmalıdır. Pano içindeki açıkta kalan canlı kısımlar uygun bariyer ve kapaklarla korunmalı, tek hat şemaları güncel tutulmalı ve devre etiketleri okunabilir hale getirilmelidir. Bakım çalışmalarında enerji izolasyonu ve kilitleme-etiketleme prosedürü zorunlu uygulanmalıdır. Termal kamera ile periyodik sıcaklık kontrolü yapılmalı, gevşek bağlantılar ve aşırı yüklenen devreler kayıt altına alınarak giderilmelidir. Pano önündeki alan sarı güvenlik çizgileriyle belirlenmeli ve bu alanda malzeme depolanması engellenmelidir.",
    responsibleRole: "Elektrik Bakım Sorumlusu",
    probability: 3,
    frequency: 3,
    severity: 40,
    suggestedDays: 7,
    legislation: [
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
      "Elektrik İç Tesisleri Yönetmeliği",
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği",
    ],
  },
  {
    id: "kaygan-zemin",
    sector: "Tüm Sektörler",
    category: "İşyeri Düzeni",
    title: "Islak, yağlı veya kaygan zeminde düşme",
    keywords: ["kaygan", "zemin", "ıslak", "düşme", "temizlik"],
    method: "MATRIX_5X5",
    activity:
      "Üretim, depo, market, mutfak, koridor ve ortak alanlarda yürüme ve malzeme taşıma.",
    process:
      "Yaya yolları, giriş alanları, ıslak hacimler, üretim ve temizlik bölgeleri",
    hazard:
      "Zeminde su, yağ, ürün döküntüsü veya temizlik kimyasalı bulunması; yüzeyin aşınmış, kırık veya uygun olmayan malzemeden yapılmış olması ve döküntülere zamanında müdahale edilmemesi nedeniyle kayma, takılma ve düşme riski oluşmaktadır.",
    consequence:
      "Çalışanların kayarak düşmesi; burkulma, kırık, kafa travması, bel ve eklem yaralanmaları ile iş günü kaybına neden olabilir. Malzeme taşıyan çalışanın düşmesi sonucunda ürün devrilmesi, çevredeki kişilerin yaralanması ve ekipman hasarı da meydana gelebilir.",
    existingControl:
      "Döküntülere hızlı müdahale prosedürü uygulanmalı, temizlik sırasında uyarı levhaları kullanılmalı, zeminler düzenli kontrol edilmeli, yürüyüş yollarında malzeme bırakılmamalı ve çalışanlara uygun kaymaz tabanlı iş ayakkabısı sağlanmalıdır.",
    proposedControl:
      "Sürekli ıslanan veya yağlanan bölgelerde kaymaz yüzey kaplaması uygulanmalı ve drenaj sistemi iyileştirilmelidir. Döküntülerin anında bildirilmesi için kolay erişilebilir bildirim yöntemi kurulmalı ve temizlik ekiplerinin müdahale süresi takip edilmelidir. Yaya yolları belirgin şekilde işaretlenmeli, zemin bozuklukları bakım planına alınmalı ve tekrarlayan kayma olaylarının kök neden analizi yapılmalıdır. Temizlik yöntemleri, kullanılan kimyasalların yüzeyde kalıntı bırakmayacağı şekilde yeniden değerlendirilmelidir.",
    responsibleRole: "İdari İşler / Saha Sorumlusu",
    probability: 4,
    frequency: 5,
    severity: 3,
    suggestedDays: 30,
    legislation: [
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
      "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik",
    ],
  },
  {
    id: "elle-tasima",
    sector: "Lojistik / Market / Üretim",
    category: "Ergonomi",
    title: "Elle kaldırma ve taşıma sırasında kas-iskelet zorlanması",
    keywords: ["elle taşıma", "kaldırma", "ergonomi", "bel", "yük"],
    method: "FINE_KINNEY",
    activity:
      "Koli, çuval, parça, ekipman ve ürünlerin elle kaldırılması, taşınması, itilmesi veya çekilmesi.",
    process:
      "Depo, raf yerleştirme, sevkiyat, üretim besleme ve mal kabul alanları",
    hazard:
      "Yükün ağırlığının, boyutunun veya tutma noktalarının uygunsuz olması; yanlış kaldırma tekniği, tekrarlı hareket, eğilerek çalışma, dönerek kaldırma ve yetersiz dinlenme nedeniyle kas-iskelet sistemi üzerinde aşırı yük oluşmaktadır.",
    consequence:
      "Bel incinmesi, disk problemleri, omuz ve diz yaralanmaları, kas zorlanmaları, kronik ağrı ve uzun süreli iş göremezlik gelişebilir. Tekrarlayan maruziyet çalışan performansını düşürebilir ve meslek hastalığına dönüşebilir.",
    existingControl:
      "Çalışanlara güvenli kaldırma ve taşıma eğitimi verilmeli, ağır ve hacimli yüklerde ekip çalışması uygulanmalı, taşıma arabaları ve transpaletler kullanılmalı, raf yerleşimleri ergonomik erişim yüksekliğine göre düzenlenmeli ve tekrarlı işlerde görev rotasyonu yapılmalıdır.",
    proposedControl:
      "Elle taşıma işleri ergonomik risk değerlendirmesine tabi tutulmalı ve yükün ağırlığı, taşıma mesafesi, tutuş koşulları ve çalışma sıklığı birlikte değerlendirilmelidir. Kaldırma yardımcıları, konveyörler, vakumlu kaldırıcılar veya ayarlanabilir platformlar kullanılarak manuel yük azaltılmalıdır. Ağır ürünlerin paket ağırlıkları düşürülmeli, sık kullanılan malzemeler diz ile omuz yüksekliği arasına yerleştirilmeli ve çalışanların fiziksel kapasitesine uygun iş dağılımı yapılmalıdır. Kas-iskelet şikâyetleri düzenli takip edilmeli ve erken bildirim teşvik edilmelidir.",
    responsibleRole: "Bölüm Sorumlusu / İnsan Kaynakları",
    probability: 6,
    frequency: 6,
    severity: 7,
    suggestedDays: 30,
    legislation: [
      "Elle Taşıma İşleri Yönetmeliği",
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    ],
  },
  {
    id: "yangin-tupu-onu-kapali",
    sector: "Tüm Sektörler",
    category: "Yangın",
    title: "Yangın söndürme ekipmanına erişimin engellenmesi",
    keywords: ["yangın", "tüp", "erişim", "önü kapalı", "acil durum"],
    method: "MATRIX_5X5",
    activity:
      "İşyerinde depolama, raf yerleşimi, üretim ve günlük operasyonların yürütülmesi.",
    process:
      "Yangın söndürücülerin, yangın dolaplarının ve acil müdahale ekipmanlarının bulunduğu alanlar",
    hazard:
      "Yangın söndürücülerin veya yangın dolaplarının önüne palet, koli, ekipman ya da ürün yerleştirilmesi; ekipmanın yerinin görünür olmaması ve erişim yolunun daraltılması nedeniyle acil durumda ilk müdahalenin gecikmesi riski bulunmaktadır.",
    consequence:
      "Yangının başlangıç aşamasında kontrol altına alınamaması, alev ve dumanın hızla yayılması, çalışanların tahliyesinin zorlaşması, ağır yaralanma veya ölüm, bina ve ekipmanlarda büyük hasar ve işletmenin uzun süre faaliyet dışı kalması söz konusu olabilir.",
    existingControl:
      "Yangın ekipmanlarının periyodik kontrolleri yapılmalı, yerleri işaretlenmeli, erişim alanları boş tutulmalı ve çalışanlara ilk müdahale ekipmanlarının kullanımı hakkında eğitim verilmelidir.",
    proposedControl:
      "Yangın söndürücü ve dolaplarının önünde sürekli boş tutulacak güvenlik alanları zeminde belirgin çizgilerle işaretlenmelidir. Bu alanlara malzeme bırakılmasını önlemek için raf ve depo yerleşimi yeniden düzenlenmeli, vardiya kontrollerine yangın ekipmanı erişim maddesi eklenmeli ve uygunsuzluklar anında kayıt altına alınmalıdır. Ekipmanın görünürlüğü düşey işaretlerle artırılmalı, yangın dolaplarının kapak açılımı test edilmeli ve acil durum tatbikatlarında erişim süresi gözlemlenmelidir.",
    responsibleRole: "Acil Durum Koordinatörü / Saha Sorumlusu",
    probability: 3,
    frequency: 3,
    severity: 5,
    suggestedDays: 7,
    legislation: [
      "Binaların Yangından Korunması Hakkında Yönetmelik",
      "İşyerlerinde Acil Durumlar Hakkında Yönetmelik",
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    ],
  },
  {
    id: "makine-koruyucu-eksik",
    sector: "Üretim",
    category: "Makine Güvenliği",
    title: "Hareketli makine parçalarına erişim",
    keywords: ["makine", "koruyucu", "sıkışma", "kesilme", "dönen parça"],
    method: "FINE_KINNEY",
    activity:
      "Üretim makinelerinin çalıştırılması, malzeme besleme, ayar, temizlik ve bakım işlemleri.",
    process:
      "Pres, konveyör, karıştırıcı, kesme, paketleme ve döner ekipman alanları",
    hazard:
      "Dönen, kesen, ezme veya sıkıştırma hareketi yapan makine parçalarının koruyucusuz olması, koruyucuların devre dışı bırakılması veya çalışma sırasında tehlikeli bölgeye erişilebilmesi nedeniyle uzuv kaptırma, sıkışma ve kesilme riski oluşmaktadır.",
    consequence:
      "El, kol veya diğer uzuvların makineye kaptırılması ağır kesilme, ezilme, amputasyon, kalıcı iş göremezlik veya ölümle sonuçlanabilir. Olay ayrıca üretimin durmasına, makine hasarına ve ciddi hukuki sonuçlara neden olabilir.",
    existingControl:
      "Makine koruyucuları takılı ve sağlam tutulmalı, emniyet switchleri devre dışı bırakılmamalı, acil durdurma butonları erişilebilir olmalı, operatörler yetkilendirilmeli ve bakım-temizlik işlemlerinde enerji izolasyonu uygulanmalıdır.",
    proposedControl:
      "Makinenin tüm tehlikeli hareket noktaları risk analizine göre sabit, ayarlanabilir veya kilitlemeli koruyucularla kapatılmalıdır. Koruyucu açıldığında makineyi güvenli şekilde durduran interlock sistemleri kullanılmalı ve bu sistemlerin fonksiyon testleri kayıt altına alınmalıdır. Ayar, temizlik ve sıkışma giderme işlemleri için yazılı kilitleme-etiketleme prosedürü hazırlanmalı, enerji kaynakları izole edilmeden müdahale kesin olarak engellenmelidir. Operatörlerin yetkinliği doğrulanmalı ve koruyucu sökme veya bypass girişimleri disiplinli saha denetimleriyle izlenmelidir.",
    responsibleRole: "Üretim Müdürü / Bakım Sorumlusu",
    probability: 3,
    frequency: 6,
    severity: 40,
    suggestedDays: 0,
    legislation: [
      "Makine Emniyeti Yönetmeliği",
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
    ],
  },
];

export const RISK_LIBRARY_SECTORS = Array.from(
  new Set(RISK_LIBRARY.map((item) => item.sector))
).sort((a, b) => a.localeCompare(b, "tr"));