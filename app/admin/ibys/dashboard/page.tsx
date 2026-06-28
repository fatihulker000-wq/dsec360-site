"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Timer,
} from "lucide-react";

type DashboardStats = {
  total: number;
  pending: number;
  ready: number;
  sent: number;
  retry: number;
  failed: number;
  missing: number;
  successRate: number;
  averageDuration: number;
  lastSent: string | null;
  lastToken: string | null;
  lastHeartbeat: string | null;
};

export default function IbysDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/ibys/dashboard", {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.success) {
        setStats(json.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 10000);

    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      title: "Toplam",
      value: stats?.total ?? 0,
      icon: Activity,
    },
    {
      title: "Bekleyen",
      value: stats?.pending ?? 0,
      icon: Clock,
    },
    {
      title: "Gönderilen",
      value: stats?.sent ?? 0,
      icon: CheckCircle2,
    },
    {
      title: "Retry",
      value: stats?.retry ?? 0,
      icon: RotateCcw,
    },
    {
      title: "Hatalı",
      value: stats?.failed ?? 0,
      icon: ShieldAlert,
    },
    {
      title: "Eksik Bilgi",
      value: stats?.missing ?? 0,
      icon: AlertTriangle,
    },
  ];

  return (
    <main className="p-8 bg-[#fafafa] min-h-screen">

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-black">
            İBYS Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            Bakanlık entegrasyonu canlı izleme ekranı
          </p>

        </div>

        <button
          onClick={loadDashboard}
          className="rounded-xl bg-[#5a0f1f] text-white px-5 py-3 flex items-center gap-2"
        >
          <RefreshCcw size={18} />
          Yenile
        </button>

      </div>

      {loading && (
        <div>Yükleniyor...</div>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-3 gap-5">

            {cards.map((card) => {

              const Icon = card.icon;

              return (

                <div
                  key={card.title}
                  className="bg-white rounded-3xl p-6 shadow"
                >

                  <Icon
                    className="text-[#5a0f1f]"
                    size={28}
                  />

                  <div className="text-4xl font-black mt-5">
                    {card.value}
                  </div>

                  <div className="mt-2 font-bold">
                    {card.title}
                  </div>

                </div>

              );
            })}

          </div>

          <div className="grid grid-cols-2 gap-5 mt-8">

            <div className="bg-white rounded-3xl p-6 shadow">

              <h2 className="font-black text-xl mb-4">
                Sistem Durumu
              </h2>

              <p>Başarı Oranı : %{stats.successRate}</p>

              <p className="mt-2">
                Ortalama Süre :
                {" "}
                {stats.averageDuration}
                {" "}
                ms
              </p>

            </div>

            <div className="bg-white rounded-3xl p-6 shadow">

              <h2 className="font-black text-xl mb-4">
                Son İşlemler
              </h2>

              <p>
                Son Token :
                {" "}
                {stats.lastToken ?? "-"}
              </p>

              <p className="mt-2">
                Son Gönderim :
                {" "}
                {stats.lastSent ?? "-"}
              </p>

              <p className="mt-2 flex items-center gap-2">
                <Timer size={16} />
                Heartbeat :
                {" "}
                {stats.lastHeartbeat ?? "-"}
              </p>

            </div>

          </div>
        </>
      )}

    </main>
  );
}