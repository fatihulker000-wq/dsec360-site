"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileWarning,
  RefreshCcw,
  Send,
  Server,
  Settings,
  ShieldCheck,
  XCircle,
  Activity,
} from "lucide-react";

const stats = [
  { title: "Bekleyen Kayıt", value: "0", desc: "Kuyrukta bekleyen", icon: Clock },
  { title: "Başarılı Gönderim", value: "0", desc: "İBYS’e iletilen", icon: CheckCircle2 },
  { title: "Hatalı Kayıt", value: "0", desc: "Kontrol gerekli", icon: XCircle },
  { title: "Eksik Bilgi", value: "0", desc: "Gönderime hazır değil", icon: AlertTriangle },
  { title: "Tekrar Denenecek", value: "0", desc: "Retry kuyruğu", icon: RefreshCcw },
  { title: "Başarı Oranı", value: "%0", desc: "Genel gönderim başarısı", icon: Activity },
];

const serviceStatus = [
  "Kimlik Doğrulama Servisi",
  "Firma Bilgileri Servisi",
  "Çalışan Bilgileri Servisi",
  "Eğitim Kayıtları Servisi",
  "Sağlık Muayeneleri Servisi",
  "İş Kazası / Olay Servisi",
];

const missingChecks = [
  "TC kimlik no kontrolü",
  "Firma SGK sicil no kontrolü",
  "Eğitim süresi kontrolü",
  "Uzman / hekim eşleştirme kontrolü",
  "Firma İBYS eşleştirme kontrolü",
];

export default function IbysPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#4a0d1a] to-[#7f1d1d] p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-bold">
                <ShieldCheck size={16} />
                D-SEC360 Resmi Entegrasyon Merkezi
              </div>

              <h1 className="text-3xl font-black">
                İBYS Entegrasyon Paneli
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                Firma, çalışan, eğitim, sağlık, risk ve olay kayıtlarının İBYS
                gönderim sürecini takip etmek, hataları yönetmek ve resmi servis
                bağlantılarını kontrol etmek için merkezi yönetim ekranı.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#5a0f1f]">
                <Settings size={17} />
                İBYS Ayarları
              </button>

              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white">
                <Send size={17} />
                Test Gönderimi
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Server size={22} />
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                TEST
              </span>
            </div>
            <h3 className="mt-4 font-black text-slate-900">Bağlantı Durumu</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Test ortamı hazırlanıyor
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 w-fit">
              <Database size={22} />
            </div>
            <h3 className="mt-4 font-black text-slate-900">Veri Kaynağı</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              D-SEC Supabase / Backend
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 w-fit">
              <Clock size={22} />
            </div>
            <h3 className="mt-4 font-black text-slate-900">Son Senkronizasyon</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Henüz yapılmadı
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 w-fit">
              <ShieldCheck size={22} />
            </div>
            <h3 className="mt-4 font-black text-slate-900">Canlı Durum</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Canlı entegrasyon kapalı
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <Icon size={20} className="text-[#5a0f1f]" />
                  </div>
                  <strong className="text-2xl font-black text-slate-900">
                    {item.value}
                  </strong>
                </div>
                <h3 className="font-black text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  İBYS Gönderim Kuyruğu
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Gönderilecek, gönderilen ve hatalı kayıtlar burada listelenecek.
                </p>
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                <RefreshCcw size={16} />
                Yenile
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-black">Tür</th>
                    <th className="p-4 font-black">Firma</th>
                    <th className="p-4 font-black">Kayıt</th>
                    <th className="p-4 font-black">Durum</th>
                    <th className="p-4 font-black">Tarih</th>
                    <th className="p-4 font-black">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <Clock className="mx-auto mb-3 text-slate-400" size={34} />
                      <strong className="block text-slate-800">
                        Henüz gönderim kaydı yok
                      </strong>
                      <span className="mt-1 block text-sm font-semibold text-slate-500">
                        Backend queue bağlandığında kayıtlar burada görünecek.
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Eksik Bilgi Merkezi
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                İBYS gönderimi öncesi zorunlu alan kontrolü.
              </p>

              <div className="mt-4 space-y-3">
                {missingChecks.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-700">
                      {item}
                    </span>
                    <FileWarning size={18} className="text-amber-600" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Hızlı İşlemler
              </h2>

              <div className="mt-4 grid gap-3">
                <button className="rounded-2xl bg-[#5a0f1f] px-4 py-3 text-sm font-black text-white">
                  Bekleyenleri Gönder
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Hatalıları Tekrar Gönder
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Entegrasyon Logları
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  Firma Eşleştirme
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            Bakanlık Servis Durumu
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Test/canlı servis bağlantıları sonraki aşamada backend üzerinden kontrol edilecek.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceStatus.map((service) => (
              <div
                key={service}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <strong className="block text-sm font-black text-slate-800">
                    {service}
                  </strong>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    Bağlantı hazırlanacak
                  </span>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                  Hazır değil
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}