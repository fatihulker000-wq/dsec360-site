export type EmergencyScenario = {
  title: string;
  riskDescription: string;
  alarmMethod: string;
  firstResponse: string;
  evacuationMethod: string;
  responsibleTeams: string;
  equipment: string;
  externalInstitutions: string;
};

export type EmergencyPlanContent = {
  purpose: string;
  scope: string;
  responsibilities: string;
  alarmAndCommunication: string;
  evacuationPrinciples: string;
  specialGroups: string;
  postEmergencyActions: string;
  scenarios: EmergencyScenario[];
  contacts: Array<{ title: string; phone: string; note: string }>;
  assemblyAreas: Array<{
    name: string;
    location: string;
    capacity: number;
    responsible: string;
    note: string;
  }>;
  equipment: Array<{
    name: string;
    location: string;
    quantity: number;
    lastControlDate: string;
    nextControlDate: string;
    status: string;
  }>;
  approvals: {
    preparedBy: string;
    checkedBy: string;
    occupationalSafetyExpert: string;
    workplacePhysician: string;
    approvedBy: string;
  };
};

export const DEFAULT_EMERGENCY_PLAN_CONTENT: EmergencyPlanContent = {
  purpose:
    "İşyerinde meydana gelebilecek acil durumların önceden değerlendirilmesi, çalışanların korunması, olayın etkilerinin sınırlandırılması ve tahliye süreçlerinin düzenli yürütülmesidir.",
  scope:
    "Plan; tüm çalışanları, alt işveren çalışanlarını, stajyerleri, ziyaretçileri ve işyerinde geçici olarak bulunan kişileri kapsar.",
  responsibilities:
    "İşveren kaynakları sağlar. Acil durum koordinatörü olay yönetimini yürütür. Destek ekipleri görev tanımlarına uygun hareket eder.",
  alarmAndCommunication:
    "Alarm; siren, anons sistemi ve telefon zinciri ile verilir. Haberleşme ekibi 112 ve gerekli dış kurumlarla iletişimi sağlar.",
  evacuationPrinciples:
    "Asansör kullanılmaz, kişisel eşya alınmaz, en yakın güvenli çıkış kullanılır ve toplanma alanında sayım yapılır.",
  specialGroups:
    "Engelli, hamile, yaşlı ve geçici hareket kısıtlılığı bulunan kişiler için refakatçi görevlendirilir.",
  postEmergencyActions:
    "Sayım yapılır, eksik kişiler bildirilir, hasar tespiti yapılır, DÖF kayıtları açılır ve plan revizyon ihtiyacı değerlendirilir.",
  scenarios: [
    {
      title: "Yangın",
      riskDescription: "Yanıcı maddelerin tutuşması, elektrik arızası veya ekipman kaynaklı yangın.",
      alarmMethod: "Yangın alarmı, siren ve sözlü anons.",
      firstResponse: "Enerji kaynakları kesilir ve uygun söndürücüyle güvenli ilk müdahale yapılır.",
      evacuationMethod: "En yakın güvenli çıkıştan tahliye ve toplanma alanında sayım.",
      responsibleTeams: "Yangın, tahliye, arama-kurtarma ve ilk yardım ekipleri.",
      equipment: "Yangın söndürücü, dolap, hidrant, alarm ve acil aydınlatma.",
      externalInstitutions: "112 ve itfaiye.",
    },
    {
      title: "Deprem",
      riskDescription: "Yapısal hasar, devrilme, düşme, yangın ve panik riski.",
      alarmMethod: "Sarsıntı sonrası anons ve koordinatör talimatı.",
      firstResponse: "Çök-kapan-tutun uygulanır.",
      evacuationMethod: "Sarsıntı bittikten sonra güvenli çıkışlardan tahliye.",
      responsibleTeams: "Tahliye, arama-kurtarma, ilk yardım ve haberleşme.",
      equipment: "Acil durum çantası, fener, sedye ve ilk yardım malzemesi.",
      externalInstitutions: "AFAD ve 112.",
    },
    {
      title: "Kimyasal Sızıntı",
      riskDescription: "Kimyasal dökülme, sızıntı, gaz veya buhar yayılımı.",
      alarmMethod: "Bölgesel alarm, anons ve alan izolasyonu.",
      firstResponse: "Kaynak güvenli ise durdurulur, alan izole edilir ve SDS talimatları uygulanır.",
      evacuationMethod: "Rüzgar yönü dikkate alınarak güvenli alana tahliye.",
      responsibleTeams: "Tahliye, ilk yardım ve haberleşme ekipleri.",
      equipment: "Döküntü kiti, göz duşu, uygun KKD ve solunum koruyucu.",
      externalInstitutions: "112, itfaiye ve çevre birimleri.",
    },
    {
      title: "Ciddi İş Kazası",
      riskDescription: "Ağır yaralanma, sıkışma, yüksekten düşme veya ölümcül olay.",
      alarmMethod: "112 bildirimi ve iç acil çağrı.",
      firstResponse: "Alan güvenliği sağlanır ve eğitimli ilkyardımcı müdahale eder.",
      evacuationMethod: "Gerekli ise olay bölgesi boşaltılır.",
      responsibleTeams: "İlk yardım, koruma ve haberleşme ekipleri.",
      equipment: "İlk yardım çantası, sedye ve kurtarma ekipmanı.",
      externalInstitutions: "112 ve kolluk.",
    },
    {
      title: "Genel Tahliye",
      riskDescription: "İşyerinin tamamının veya bir bölümünün boşaltılmasını gerektiren olay.",
      alarmMethod: "Kesintisiz tahliye alarmı ve anons.",
      firstResponse: "Faaliyetler güvenli şekilde durdurulur.",
      evacuationMethod: "Bölüm sorumlularının yönlendirmesiyle toplanma alanına geçilir.",
      responsibleTeams: "Tahliye, arama-kurtarma, koruma ve haberleşme.",
      equipment: "Acil aydınlatma, yönlendirme levhaları, megafon ve yoklama listesi.",
      externalInstitutions: "Olay türüne göre 112 ve ilgili kurumlar.",
    },
  ],
  contacts: [
    { title: "Acil Çağrı Merkezi", phone: "112", note: "" },
    { title: "AFAD", phone: "122", note: "" },
    { title: "Acil Durum Koordinatörü", phone: "", note: "" },
  ],
  assemblyAreas: [
    {
      name: "Ana Toplanma Alanı",
      location: "",
      capacity: 0,
      responsible: "",
      note: "",
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
  ],
  approvals: {
    preparedBy: "",
    checkedBy: "",
    occupationalSafetyExpert: "",
    workplacePhysician: "",
    approvedBy: "",
  },
};
