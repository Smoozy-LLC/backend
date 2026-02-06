"use client";

import { useEffect, useState, useCallback } from "react";

interface CostData {
  days: number;
  totalCost: number;
  totalUnits: number;
  byProvider: Array<{
    provider: string;
    _sum: { units: number | null; costUsd: number | null };
    _count: number;
  }>;
  byProviderType: Array<{
    provider: string;
    type: string;
    _sum: { units: number | null; costUsd: number | null };
    _count: number;
  }>;
  topUsers: Array<{
    userId: string;
    _sum: { units: number | null; costUsd: number | null };
    _count: number;
    user: { email: string; name?: string };
  }>;
}

const PROVIDER_NAMES: Record<string, string> = {
  speechmatics: "Speechmatics",
  elevenlabs: "ElevenLabs",
  openrouter: "OpenRouter",
};

const PROVIDER_COLORS: Record<string, string> = {
  speechmatics: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  elevenlabs: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  openrouter: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/costs?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Затраты на провайдеров</h1>
          <p className="text-xs text-slate-500 mt-0.5">Расчётная стоимость использования API</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                days === d
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-white/[0.05] border-white/[0.08] text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}д
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <p className="text-slate-500 text-sm">Нет данных</p>
      ) : (
        <>
          {/* Total */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500/10 border border-green-500/15 rounded-xl p-4">
              <p className="text-[11px] font-medium text-green-400/70 uppercase tracking-wider">Итого за {data.days}д</p>
              <p className="text-2xl font-bold text-green-400 mt-1">${data.totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/15 rounded-xl p-4">
              <p className="text-[11px] font-medium text-blue-400/70 uppercase tracking-wider">Единиц (мин/1k tok)</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{data.totalUnits.toFixed(1)}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400/70 uppercase tracking-wider">Запросов</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">
                {data.byProvider.reduce((s, p) => s + p._count, 0)}
              </p>
            </div>
          </div>

          {/* By provider */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3">По провайдерам</h2>
            <div className="bg-[#1a1a1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
              {data.byProvider.length === 0 ? (
                <p className="px-5 py-8 text-center text-slate-500 text-sm">Нет данных за этот период</p>
              ) : (
                data.byProvider.map((p) => (
                  <div key={p.provider} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${PROVIDER_COLORS[p.provider] || "bg-white/[0.05] text-slate-400 border-white/[0.08]"}`}>
                        {PROVIDER_NAMES[p.provider] || p.provider}
                      </span>
                      <span className="text-sm text-slate-400">{p._count} запросов</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white/90">${(p._sum.costUsd ?? 0).toFixed(4)}</p>
                      <p className="text-[11px] text-slate-500">{(p._sum.units ?? 0).toFixed(1)} единиц</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top users */}
          {data.topUsers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3">Топ пользователей по расходам</h2>
              <div className="bg-[#1a1a1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
                {data.topUsers.map((u, i) => (
                  <div key={u.userId} className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-600 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white/90">{u.user.email}</p>
                        <p className="text-[11px] text-slate-500">{u._count} запросов</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-white/90">${(u._sum.costUsd ?? 0).toFixed(4)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
