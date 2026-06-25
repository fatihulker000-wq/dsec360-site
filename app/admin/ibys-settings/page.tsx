"use client";

import { useState } from "react";
import {
  Settings,
  Server,
  ShieldCheck,
  Bell,
  RefreshCcw,
  KeyRound,
  Save,
  TestTube2,
  Globe,
  Send,
} from "lucide-react";

export default function IbysSettingsPage() {
  const [environment, setEnvironment] = useState("TEST");
  const [autoSend, setAutoSend] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  return (
    <main className="min-h-screen bg-[#fafafa] p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-[#4a0d1a] to-[#7f1d1d] p-8 text-white">
          <div className="flex items-center gap-3">
            <Settings size={28}/>
            <div>
              <h1 className="text-3xl font-black">
                İBYS Entegrasyon Ayarları
              </h1>

              <p className="mt-2 text-white/80">
                Bakanlık servis bağlantıları, güvenlik, otomatik gönderim ve
                sistem ayarlarını buradan yönetebilirsiniz.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">

          <section className="rounded-3xl bg-white p-6 shadow">

            <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
              <Server size={20}/>
              Ortam Ayarları
            </h2>

            <label className="block mb-4 font-bold">
              Ortam
            </label>

            <select
              value={environment}
              onChange={(e)=>setEnvironment(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option>TEST</option>
              <option>PILOT</option>
              <option>CANLI</option>
            </select>

            <label className="block mt-6 mb-2 font-bold">
              API URL
            </label>

            <input
              className="w-full rounded-xl border p-3"
              placeholder="https://....."
            />

            <label className="block mt-5 mb-2 font-bold">
              Token URL
            </label>

            <input
              className="w-full rounded-xl border p-3"
            />

            <label className="block mt-5 mb-2 font-bold">
              Client ID
            </label>

            <input
              className="w-full rounded-xl border p-3"
            />

            <label className="block mt-5 mb-2 font-bold">
              Client Secret
            </label>

            <input
              type="password"
              className="w-full rounded-xl border p-3"
            />

          </section>

          <section className="rounded-3xl bg-white p-6 shadow">

            <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
              <ShieldCheck size={20}/>
              Güvenlik
            </h2>

            <label className="flex items-center justify-between border rounded-xl p-4 mb-4">
              <span>Otomatik Gönderim</span>

              <input
                type="checkbox"
                checked={autoSend}
                onChange={()=>setAutoSend(!autoSend)}
              />
            </label>

            <label className="flex items-center justify-between border rounded-xl p-4 mb-4">
              <span>Debug Modu</span>

              <input
                type="checkbox"
                checked={debugMode}
                onChange={()=>setDebugMode(!debugMode)}
              />
            </label>

            <label className="block mt-4 mb-2 font-bold">
              Retry Sayısı
            </label>

            <input
              type="number"
              defaultValue={3}
              className="w-full rounded-xl border p-3"
            />

            <label className="block mt-5 mb-2 font-bold">
              Retry Süresi (sn)
            </label>

            <input
              type="number"
              defaultValue={60}
              className="w-full rounded-xl border p-3"
            />

            <label className="block mt-5 mb-2 font-bold">
              Queue Limiti
            </label>

            <input
              type="number"
              defaultValue={100}
              className="w-full rounded-xl border p-3"
            />

          </section>

        </div>

        <section className="rounded-3xl bg-white p-6 shadow">

          <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
            <Bell size={20}/>
            Test İşlemleri
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <button className="rounded-2xl bg-[#5a0f1f] text-white p-4 font-black flex items-center justify-center gap-2">
              <Globe size={18}/>
              API Testi
            </button>

            <button className="rounded-2xl bg-blue-600 text-white p-4 font-black flex items-center justify-center gap-2">
              <KeyRound size={18}/>
              Token Oluştur
            </button>

            <button className="rounded-2xl bg-green-600 text-white p-4 font-black flex items-center justify-center gap-2">
              <RefreshCcw size={18}/>
              Heartbeat
            </button>

            <button className="rounded-2xl bg-orange-500 text-white p-4 font-black flex items-center justify-center gap-2">
              <Send size={18}/>
              Test Gönderimi
            </button>

            <button className="rounded-2xl bg-purple-600 text-white p-4 font-black flex items-center justify-center gap-2">
              <TestTube2 size={18}/>
              Retry Testi
            </button>

            <button className="rounded-2xl bg-slate-800 text-white p-4 font-black flex items-center justify-center gap-2">
              <Save size={18}/>
              Ayarları Kaydet
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}