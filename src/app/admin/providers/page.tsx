"use client";

import { useEffect, useState, useCallback } from "react";

interface ProviderStatus {
  name: string;
  id: string;
  status: "ok" | "error" | "unknown";
  latencyMs: number | null;
  error?: string;
  keyConfigured: boolean;
}

const STATUS_CONFIGS = {
  ok: { label: "Online", dot: "bg-green-400", border: "border-green-500/20", bg: "bg-green-500/5" },
  error: { label: "Error", dot: "bg-red-400", border: "border-red-500/20", bg: "bg-red-500/5" },
  unknown: { label: "Unknown", dot: "bg-slate-400", border: "border-white/[0.08]", bg: "bg-white/[0.02]" },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/admin/providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProviders(data.providers || []);
      setLastCheck(new Date());
    } catch (err) {
      console.error("Providers fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Статус провайдеров</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Health check API ключей
            {lastCheck && ` · проверено в ${lastCheck.toLocaleTimeString("ru")}`}
          </p>
        </div>
        <button
          onClick={fetchProviders}
          disabled={loading}
          className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors disabled:opacity-40"
        >
          {loading ? "Проверка..." : "Проверить"}
        </button>
      </div>

      {loading && providers.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            Проверка провайдеров...
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((p) => {
            const cfg = STATUS_CONFIGS[p.status];
            return (
              <div key={p.id} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`size-3 rounded-full ${cfg.dot} ${p.status === "ok" ? "animate-pulse" : ""}`} />
                    <div>
                      <h3 className="text-base font-semibold text-white/90">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{p.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium border ${
                    p.status === "ok"
                      ? "bg-green-500/15 text-green-400 border-green-500/20"
                      : p.status === "error"
                      ? "bg-red-500/15 text-red-400 border-red-500/20"
                      : "bg-white/[0.05] text-slate-400 border-white/[0.08]"
                  }`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  {/* API Key */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">API Key</p>
                    <p className={`text-sm font-medium mt-1 ${p.keyConfigured ? "text-green-400" : "text-red-400"}`}>
                      {p.keyConfigured ? "Настроен" : "Не настроен"}
                    </p>
                  </div>

                  {/* Latency */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Задержка</p>
                    <p className="text-sm font-medium mt-1 text-white/80">
                      {p.latencyMs !== null ? `${p.latencyMs}ms` : "—"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Статус</p>
                    <p className="text-sm font-medium mt-1 text-white/80">
                      {p.status === "ok" ? "Работает" : p.status === "error" ? "Ошибка" : "Неизвестно"}
                    </p>
                  </div>
                </div>

                {p.error && (
                  <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/15 rounded-lg">
                    <p className="text-xs text-red-400 break-all">{p.error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
