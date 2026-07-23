import type {
  EmergencyPlanContent,
  EmergencyScenario,
} from "../../../../lib/emergency/types";

const SCENARIOS: EmergencyScenario[] = [
  {
    title: "Yangın",
    riskDescription:
      "Yanıcı maddelerin tutuşması, elektrik arızası, sıcak çalışma veya ekipman kaynaklı yangın.",
    alarmMethod:
      "Yangın alarmı, siren, anons sistemi ve sözlü uyarı.",
    firstResponse:
      "Enerji kaynakları güvenli şekilde kesilir. Eğitimli ekip uygun tip söndürücü ile ilk müdahaleyi yapar.",
    evacuationMethod:
      "En yakın güvenli çıkıştan tahliye edilir. Asansör kullanılmaz. Toplanma alanında sayım yapılır.",
    responsibleTeams:
      "Yangınla mücadele, tahliye, arama-kurtarma, ilk yardım ve haberleşme ekipleri.",
    equipment:
      "Yangın söndürücü, yangın dolabı, hidrant, alarm, acil aydınlatma ve megafon.",
    externalInstitutions:
      "112 Acil Çağrı Merkezi, itfaiye ve gerekli kolluk birimleri.",
  },
  {
    title: "Deprem",
    riskDescription:
      "Yapısal hasar, devrilme, düşme, yangın, gaz kaçağı ve panik riski.",
    alarmMethod:
      "Sarsıntı sonrası anons ve acil durum koordinatörü talimatı.",
    firstResponse:
      "Çök-kapan-tutun uygulanır. Sarsıntı sırasında tahliye yapılmaz.",
    evacuationMethod:
      "Sarsıntı bittikten sonra kontrollü tahliye yapılır.",
    responsibleTeams:
      "Tahliye, arama-kurtarma, ilk yardım ve haberleşme ekipleri.",
    equipment:
      "Acil durum çantası, fener, sedye, ilk yardım malzemesi ve el telsizi.",
    externalInstitutions:
      "AFAD, 112 Acil Çağrı Merkezi ve belediye birimleri.",
  },
  {
    title: "Sel / Su Baskını",
    riskDescription:
      "Yoğun yağış, tesisat arızası, drenaj yetersizliği veya çevresel taşkın.",
    alarmMethod:
      "Anons sistemi ve telefon zinciri.",
    firstResponse:
      "Elektrik enerjisi güvenli şekilde kesilir, alt kotlar boşaltılır.",
    evacuationMethod:
      "Yüksek ve güvenli bölgelere tahliye yapılır.",
    responsibleTeams:
      "Tahliye, koruma ve haberleşme ekipleri.",
    equipment:
      "Drenaj pompası, bariyer, fener ve kişisel koruyucu donanım.",
    externalInstitutions:
      "112, belediye ve su-kanalizasyon idaresi.",
  },
  {
    title: "Kimyasal Sızıntı",
    riskDescription:
      "Kimyasal dökülme, sızıntı, gaz veya buhar yayılımı.",
    alarmMethod:
      "Bölgesel alarm, anons ve alan izolasyonu.",
    firstResponse:
      "Kaynak güvenli ise durdurulur, alan izole edilir ve SDS talimatları uygulanır.",
    evacuationMethod:
      "Rüzgâr yönü dikkate alınarak güvenli alana tahliye yapılır.",
    responsibleTeams:
      "Kimyasal müdahale, tahliye, ilk yardım ve haberleşme ekipleri.",
    equipment:
      "Döküntü kiti, göz duşu, uygun KKD ve solunum koruyucu.",
    externalInstitutions:
      "112, itfaiye ve çevre birimleri.",
  },
  {
    title: "Gaz Kaçağı",
    riskDescription:
      "Doğalgaz, LPG veya proses gazı kaçağı.",
    alarmMethod:
      "Gaz alarmı, sözlü uyarı ve anons.",
    firstResponse:
      "Kıvılcım oluşturacak işlemler durdurulur ve vana güvenli şekilde kapatılır.",
    evacuationMethod:
      "Kapalı alan hızla boşaltılır ve güvenli mesafe oluşturulur.",
    responsibleTeams:
      "Tahliye, yangınla mücadele ve haberleşme ekipleri.",
    equipment:
      "Gaz dedektörü, uygun söndürücü ve havalandırma sistemi.",
    externalInstitutions:
      "112, itfaiye ve doğalgaz dağıtım şirketi.",
  },
  {
    title: "Patlama",
    riskDescription:
      "Basınçlı kap, yanıcı gaz, toz patlaması veya proses kaynaklı patlama.",
    alarmMethod:
      "Acil durum alarmı ve kesintisiz anons.",
    firstResponse:
      "Alan boşaltılır, enerji kaynakları kesilir, ikincil patlama riski değerlendirilir.",
    evacuationMethod:
      "Güvenli mesafeye hızlı ve kontrollü tahliye.",
    responsibleTeams:
      "Tahliye, arama-kurtarma, yangınla mücadele ve ilk yardım ekipleri.",
    equipment:
      "Patlamadan korunmalı ekipman, yangın ekipmanı, sedye ve ilk yardım seti.",
    externalInstitutions:
      "112, itfaiye, kolluk ve ilgili teknik kurumlar.",
  },
  {
    title: "Elektrik Kesintisi",
    riskDescription:
      "Şebeke kesintisi, pano arızası veya kritik sistemlerin devre dışı kalması.",
    alarmMethod:
      "Anons ve teknik ekip bildirimi.",
    firstResponse:
      "Kritik makineler güvenli duruma alınır, jeneratör veya UPS devreye alınır.",
    evacuationMethod:
      "Acil aydınlatma yetersizse kontrollü tahliye yapılır.",
    responsibleTeams:
      "Teknik ekip, tahliye ve haberleşme ekipleri.",
    equipment:
      "Jeneratör, UPS, acil aydınlatma ve el fenerleri.",
    externalInstitutions:
      "Elektrik dağıtım şirketi ve yetkili servis.",
  },
  {
    title: "Elektrik Çarpması",
    riskDescription:
      "Enerji altında çalışma, izolasyon bozukluğu veya kaçak akım.",
    alarmMethod:
      "Sözlü acil çağrı ve 112 bildirimi.",
    firstResponse:
      "Enerji kesilmeden kazazedeye temas edilmez. Eğitimli ilkyardımcı müdahale eder.",
    evacuationMethod:
      "Olay bölgesi izole edilir ve gerekiyorsa tahliye edilir.",
    responsibleTeams:
      "İlk yardım, koruma ve haberleşme ekipleri.",
    equipment:
      "Yalıtkan ekipman, ilk yardım çantası ve AED.",
    externalInstitutions:
      "112 ve elektrik dağıtım şirketi.",
  },
  {
    title: "Ciddi İş Kazası",
    riskDescription:
      "Ağır yaralanma, sıkışma, yüksekten düşme, uzuv kaybı veya ölümcül olay.",
    alarmMethod:
      "112 bildirimi ve iç acil çağrı.",
    firstResponse:
      "Alan güvenliği sağlanır ve eğitimli ilkyardımcı müdahale eder.",
    evacuationMethod:
      "Gerekli ise olay bölgesi boşaltılır ve erişim sınırlandırılır.",
    responsibleTeams:
      "İlk yardım, koruma ve haberleşme ekipleri.",
    equipment:
      "İlk yardım çantası, sedye, AED ve kurtarma ekipmanı.",
    externalInstitutions:
      "112 ve gerekli kolluk birimleri.",
  },
  {
    title: "Yüksekten Düşme",
    riskDescription:
      "Çatı, platform, iskele, merdiven veya boşluktan düşme.",
    alarmMethod:
      "İç acil çağrı ve 112 bildirimi.",
    firstResponse:
      "Kazazede hareket ettirilmez, düşme alanı güvenli hale getirilir.",
    evacuationMethod:
      "Kurtarma ekibi tarafından kontrollü tahliye.",
    responsibleTeams:
      "Arama-kurtarma, ilk yardım ve haberleşme ekipleri.",
    equipment:
      "Kurtarma seti, sedye, yaşam hattı ve ilk yardım ekipmanı.",
    externalInstitutions:
      "112 ve itfaiye kurtarma ekipleri.",
  },
  {
    title: "Sabotaj / Şüpheli Paket",
    riskDescription:
      "Şüpheli paket, sabotaj, tehdit veya kasıtlı zarar verme olayı.",
    alarmMethod:
      "Gizli kodlu bildirim, güvenlik çağrısı ve kolluk bildirimi.",
    firstResponse:
      "Şüpheli cisme dokunulmaz, alan izole edilir.",
    evacuationMethod:
      "Güvenlik birimlerinin yönlendirmesiyle tahliye yapılır.",
    responsibleTeams:
      "Koruma, tahliye ve haberleşme ekipleri.",
    equipment:
      "Bariyer, kamera sistemi, haberleşme araçları.",
    externalInstitutions:
      "Polis, jandarma ve 112.",
  },
  {
    title: "Şiddet / Güvenlik Olayı",
    riskDescription:
      "Çalışan, ziyaretçi veya üçüncü kişi kaynaklı şiddet ve tehdit.",
    alarmMethod:
      "Güvenlik çağrısı, gizli alarm veya telefon zinciri.",
    firstResponse:
      "Çatışmaya girilmez, güvenli alan oluşturulur ve kolluk çağrılır.",
    evacuationMethod:
      "Riskli bölge kontrollü şekilde boşaltılır.",
    responsibleTeams:
      "Koruma, tahliye ve haberleşme ekipleri.",
    equipment:
      "Kamera, alarm, erişim kontrol sistemi ve haberleşme araçları.",
    externalInstitutions:
      "Polis veya jandarma.",
  },
  {
    title: "Salgın Hastalık",
    riskDescription:
      "Bulaşıcı hastalık yayılımı ve toplu etkilenme.",
    alarmMethod:
      "İşyeri sağlık birimi bildirimi ve yönetim duyurusu.",
    firstResponse:
      "Şüpheli kişi izole edilir, temaslılar belirlenir ve hijyen tedbirleri artırılır.",
    evacuationMethod:
      "Gerekli ise bölüm veya işyeri kontrollü şekilde boşaltılır.",
    responsibleTeams:
      "İşyeri sağlık birimi, koruma ve haberleşme ekipleri.",
    equipment:
      "Maske, eldiven, dezenfektan ve izolasyon alanı.",
    externalInstitutions:
      "112 ve sağlık müdürlüğü.",
  },
  {
    title: "Gıda Zehirlenmesi",
    riskDescription:
      "Toplu yemek veya içme suyu kaynaklı zehirlenme.",
    alarmMethod:
      "Sağlık birimi bildirimi ve 112 çağrısı.",
    firstResponse:
      "Etkilenen kişiler belirlenir, numuneler korunur ve tıbbi yardım sağlanır.",
    evacuationMethod:
      "Gerekli ise yemekhane veya ilgili bölüm kapatılır.",
    responsibleTeams:
      "İlk yardım, koruma ve haberleşme ekipleri.",
    equipment:
      "İlk yardım malzemesi, numune kabı ve kayıt formları.",
    externalInstitutions:
      "112, sağlık müdürlüğü ve gıda denetim birimleri.",
  },
  {
    title: "Araç Kazası / Lojistik Olayı",
    riskDescription:
      "İşyeri sahasında veya sevkiyat sırasında araç çarpışması, devrilme veya yük düşmesi.",
    alarmMethod:
      "İç acil çağrı, telsiz ve 112 bildirimi.",
    firstResponse:
      "Trafik durdurulur, alan izole edilir ve ilk yardım uygulanır.",
    evacuationMethod:
      "Riskli bölge boşaltılır ve güvenli geçiş hattı oluşturulur.",
    responsibleTeams:
      "İlk yardım, koruma, arama-kurtarma ve haberleşme ekipleri.",
    equipment:
      "Trafik konisi, bariyer, yangın söndürücü ve ilk yardım seti.",
    externalInstitutions:
      "112, trafik polisi veya jandarma.",
  },
  {
    title: "Genel Tahliye",
    riskDescription:
      "İşyerinin tamamının veya bir bölümünün boşaltılmasını gerektiren olay.",
    alarmMethod:
      "Kesintisiz tahliye alarmı ve anons.",
    firstResponse:
      "Faaliyetler güvenli şekilde durdurulur ve çıkış yolları kontrol edilir.",
    evacuationMethod:
      "Bölüm sorumlularının yönlendirmesiyle toplanma alanına geçilir.",
    responsibleTeams:
      "Tahliye, arama-kurtarma, koruma ve haberleşme ekipleri.",
    equipment:
      "Acil aydınlatma, yönlendirme levhaları, megafon ve yoklama listesi.",
    externalInstitutions:
      "Olay türüne göre 112 ve ilgili kurumlar.",
  },
];

export const DEFAULT_EMERGENCY_PLAN_CONTENT: EmergencyPlanContent = {
  purpose:
    "Bu planın amacı; işyerinde meydana gelebilecek acil durumların önceden değerlendirilmesi, çalışanların ve ziyaretçilerin korunması, olayın etkilerinin sınırlandırılması, ilk müdahale ve tahliye süreçlerinin düzenli şekilde yürütülmesidir.",

  scope:
    "Plan; işyerinin tüm bölümlerini, çalışanları, alt işveren çalışanlarını, stajyerleri, ziyaretçileri ve işyerinde geçici olarak bulunan kişileri kapsar.",

  legalBasis:
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu, İşyerlerinde Acil Durumlar Hakkında Yönetmelik, Binaların Yangından Korunması Hakkında Yönetmelik ve işyerinin faaliyet alanıyla ilgili diğer mevzuat hükümleri.",

  definitions:
    "Acil durum; işyerinin tamamında veya bir kısmında meydana gelebilecek yangın, patlama, doğal afet, kimyasal yayılım, ciddi iş kazası ve benzeri olayları ifade eder.",

  responsibilities:
    "İşveren planın hazırlanması, uygulanması, ekiplerin görevlendirilmesi, eğitim ve tatbikatların yapılması için gerekli kaynakları sağlar. Acil durum koordinatörü olay yönetimini yürütür. Destek ekipleri görev tanımlarına uygun hareket eder.",

  alarmAndCommunication:
    "Acil durum alarmı siren, anons sistemi, telefon zinciri veya belirlenen diğer yöntemlerle verilir. Haberleşme ekibi 112 Acil Çağrı Merkezi ve gerekli dış kurumlarla iletişimi sağlar.",

  evacuationPrinciples:
    "Tahliye sırasında panik yapılmaz, asansör kullanılmaz, kişisel eşya alınmaz, en yakın güvenli çıkış kullanılır ve doğrudan belirlenmiş toplanma alanına gidilir.",

  specialGroups:
    "Engelli, hamile, yaşlı, geçici hareket kısıtlılığı bulunan çalışanlar ve ziyaretçiler için refakatçi görevlendirilir ve özel tahliye düzeni uygulanır.",

  postEmergencyActions:
    "Toplanma alanında sayım yapılır, eksik kişiler bildirilir, olay yeri güvenliği sağlanır, hasar tespiti yapılır, gerekli DÖF kayıtları açılır ve planın revizyon ihtiyacı değerlendirilir.",

  scenarios: SCENARIOS,

  contacts: [
    {
      title: "Acil Çağrı Merkezi",
      phone: "112",
      note: "Sağlık, itfaiye ve kolluk",
    },
    {
      title: "AFAD",
      phone: "122",
      note: "Afet ve acil durum",
    },
    {
      title: "Acil Durum Koordinatörü",
      phone: "",
      note: "",
    },
    {
      title: "İşveren / Yönetici",
      phone: "",
      note: "",
    },
  ],

  assemblyAreas: [
    {
      name: "Ana Toplanma Alanı",
      location: "",
      capacity: 0,
      responsible: "",
      note:
        "Araç trafiğinden, bina cephelerinden ve ikincil tehlikelerden uzak olmalıdır.",
    },
  ],

  equipment: [
    {
      name: "Yangın Söndürücü",
      location: "",
      quantity: 0,
      lastControlDate: "",
      nextControlDate: "",
      status: "UYGUN",
    },
    {
      name: "İlk Yardım Çantası",
      location: "",
      quantity: 0,
      lastControlDate: "",
      nextControlDate: "",
      status: "UYGUN",
    },
    {
      name: "Acil Aydınlatma",
      location: "",
      quantity: 0,
      lastControlDate: "",
      nextControlDate: "",
      status: "UYGUN",
    },
  ],

  evacuationSketchUrl: "",
  assemblyAreaSketchUrl: "",

  revisionHistory: [
    {
      revisionNo: "R0",
      revisionDate: "",
      changeReason: "İlk yayın",
      preparedBy: "",
      approvedBy: "",
    },
  ],

  approvals: {
    preparedBy: "",
    checkedBy: "",
    occupationalSafetyExpert: "",
    workplacePhysician: "",
    approvedBy: "",
  },
};