"use client";

import { useEffect, useState } from "react";
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
  const [apiUrl, setApiUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [autoSend, setAutoSend] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [retryCount, setRetryCount] = useState(3);
  const [retryDelaySeconds, setRetryDelaySeconds] = useState(60);
  const [queueLimit, setQueueLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/ibys/settings", { cache: "no-store" });
        const json = await res.json();

        if (!json.success) {
          setMessage(json.error || "Ayarlar yüklenemedi.");
          return;
        }

        const data = json.data;
        if (!data) return;

        setEnvironment(data.environment || "TEST");
        setApiUrl(data.api_url || "");
        setTokenUrl(data.token_url || "");
        setClientId(data.client_id || "");
        setClientSecret(data.client_secret_encrypted || "");
        setAutoSend(Boolean(data.auto_send_enabled));
        setDebugMode(Boolean(data.debug_mode));
        setRetryCount(Number(data.retry_count || 3));
        setRetryDelaySeconds(Number(data.retry_delay_seconds || 60));
        setQueueLimit(Number(data.queue_limit || 100));
      } catch {
        setMessage("Ayarlar yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/ibys/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environment,
          apiUrl,
          tokenUrl,
          clientId,
          clientSecret,
          autoSendEnabled: autoSend,
          debugMode,
          retryCount,
          retryDelaySeconds,
          queueLimit,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setMessage(json.error || "Ayarlar kaydedilemedi.");
        return;
      }

      setMessage("✅ İBYS ayarları başarıyla kaydedildi.");
    } catch {
      setMessage("Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/ibys/test-connection", {
        method: "POST",
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.success) {
        setMessage(json.error || "API bağlantı testi başarısız.");
        return;
      }

      setMessage(
        `✅ ${json.message} | Durum: ${json.status} | Süre: ${json.durationMs} ms`
      );
    } catch {
      setMessage("API bağlantı testi sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const createToken = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/ibys/token", {
        method: "POST",
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.success) {
        setMessage(json.error || "Token alınamadı.");
        return;
      }

      setMessage(`✅ Token oluşturuldu. Süre: ${json.durationMs} ms`);
    } catch {
      setMessage("Token oluşturulurken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

const heartbeat = async () => {
  setSaving(true);
  setMessage("");

  try {
    const res = await fetch("/api/ibys/heartbeat", {
      method: "POST",
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.error || "Heartbeat başarısız.");
      return;
    }

    setMessage(
      `💓 ${json.message} | HTTP: ${json.httpStatus} | Süre: ${json.durationMs} ms`
    );
  } catch {
    setMessage("Heartbeat sırasında hata oluştu.");
  } finally {
    setSaving(false);
  }
};

const testSend = async () => {
  setSaving(true);
  setMessage("");

  try {
    const res = await fetch("/api/ibys/test-send", {
      method: "POST",
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.error || "Test gönderimi başarısız.");
      return;
    }

    setMessage(
      `✅ ${json.message} | Queue ID: ${json.data?.queueId} | Süre: ${json.durationMs} ms`
    );
  } catch {
    setMessage("Test gönderimi sırasında hata oluştu.");
  } finally {
    setSaving(false);
  }
};

  return (
    <main className="min-h-screen bg-[#fafafa] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#4a0d1a] to-[#7f1d1d] p-8 text-white">
          <div className="flex items-center gap-3">
            <Settings size={28} />
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

        {message && (
          <section className="rounded-2xl border bg-white p-4 font-bold text-[#5a0f1f] shadow">
            {message}
          </section>
        )}

        {loading ? (
          <section className="rounded-3xl bg-white p-6 shadow">
            Ayarlar yükleniyor...
          </section>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
                  <Server size={20} />
                  Ortam Ayarları
                </h2>

                <label className="mb-2 block font-bold">Ortam</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option>TEST</option>
                  <option>PILOT</option>
                  <option>CANLI</option>
                </select>

                <label className="mt-6 mb-2 block font-bold">API URL</label>
                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="https://....."
                />

                <label className="mt-5 mb-2 block font-bold">Token URL</label>
                <input
                  value={tokenUrl}
                  onChange={(e) => setTokenUrl(e.target.value)}
                  className="w-full rounded-xl border p-3"
                />

                <label className="mt-5 mb-2 block font-bold">Client ID</label>
                <input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border p-3"
                />

                <label className="mt-5 mb-2 block font-bold">
                  Client Secret
                </label>
                <input
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border p-3"
                />
              </section>

              <section className="rounded-3xl bg-white p-6 shadow">
                <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
                  <ShieldCheck size={20} />
                  Güvenlik
                </h2>

                <label className="mb-4 flex items-center justify-between rounded-xl border p-4">
                  <span>Otomatik Gönderim</span>
                  <input
                    type="checkbox"
                    checked={autoSend}
                    onChange={() => setAutoSend(!autoSend)}
                  />
                </label>

                <label className="mb-4 flex items-center justify-between rounded-xl border p-4">
                  <span>Debug Modu</span>
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={() => setDebugMode(!debugMode)}
                  />
                </label>

                <label className="mt-4 mb-2 block font-bold">
                  Retry Sayısı
                </label>
                <input
                  type="number"
                  value={retryCount}
                  onChange={(e) => setRetryCount(Number(e.target.value))}
                  className="w-full rounded-xl border p-3"
                />

                <label className="mt-5 mb-2 block font-bold">
                  Retry Süresi (sn)
                </label>
                <input
                  type="number"
                  value={retryDelaySeconds}
                  onChange={(e) =>
                    setRetryDelaySeconds(Number(e.target.value))
                  }
                  className="w-full rounded-xl border p-3"
                />

                <label className="mt-5 mb-2 block font-bold">
                  Queue Limiti
                </label>
                <input
                  type="number"
                  value={queueLimit}
                  onChange={(e) => setQueueLimit(Number(e.target.value))}
                  className="w-full rounded-xl border p-3"
                />
              </section>
            </div>

            <section className="rounded-3xl bg-white p-6 shadow">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-black">
                <Bell size={20} />
                Test İşlemleri
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={testApiConnection}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#5a0f1f] p-4 font-black text-white disabled:opacity-60"
                >
                  <Globe size={18} />
                  API Testi
                </button>

                <button
                  type="button"
                  onClick={createToken}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 font-black text-white disabled:opacity-60"
                >
                  <KeyRound size={18} />
                  Token Oluştur
                </button>

                <button
  type="button"
  onClick={heartbeat}
  disabled={saving}
  className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 p-4 font-black text-white disabled:opacity-60"
>
  <RefreshCcw size={18} />
  Heartbeat
</button>

                <button
  type="button"
  onClick={testSend}
  disabled={saving}
  className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 p-4 font-black text-white disabled:opacity-60"
>
  <Send size={18} />
  Test Gönderimi
</button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 p-4 font-black text-white"
                >
                  <TestTube2 size={18} />
                  Retry Testi
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 p-4 font-black text-white disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "İşlem yapılıyor..." : "Ayarları Kaydet"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
