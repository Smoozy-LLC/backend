"use client";

import { useEffect, useState, useCallback } from "react";

interface Session {
  id: string;
  userId: string;
  type: string;
  provider: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  user: { id: string; email: string; name: string | null };
}

const PROVIDER_COLORS: Record<string, string> = {
  speechmatics: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  elevenlabs: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  openrouter: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const formatDuration = (startedAt: string) => {
  const ms = Date.now() - new Date(startedAt).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "< 1 мин";
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)}ч ${min % 60}м`;
};

const formatTimeAgo = (date: string) => {
  const ms = Date.now() - new Date(date).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}с назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}м назад`;
  return `${Math.floor(min / 60)}ч назад`;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/sessions?active=${!showAll}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }, [showAll]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(fetchSessions, 15_000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Активные сессии</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {sessions.length} {showAll ? "всего" : "активных"} &middot; авто-обновление каждые 15с
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 text-xs font-medium border rounded-xl transition-colors ${
              showAll
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-white/[0.05] border-white/[0.08] text-slate-300"
            }`}
          >
            {showAll ? "Все сессии" : "Только активные"}
          </button>
          <button onClick={fetchSessions}
            className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors">
            Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-[#1a1a1c]/80 border border-white/[0.08] rounded-2xl p-12 text-center">
          <p className="text-slate-500 text-sm">
            {showAll ? "Сессий пока нет" : "Нет активных сессий прямо сейчас"}
          </p>
        </div>
      ) : (
        <div className="bg-[#1a1a1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_120px_120px] px-5 py-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Пользователь</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Тип</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Провайдер</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Длительность</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Последний пинг</span>
          </div>

          {sessions.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_100px_100px_120px_120px] px-5 py-3 border-b border-white/[0.04] last:border-0 items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{s.user.email}</p>
                <p className="text-[11px] text-slate-500">{s.user.name || "—"}</p>
              </div>
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${
                  s.type === "stt" ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                }`}>
                  {s.type.toUpperCase()}
                </span>
              </div>
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${PROVIDER_COLORS[s.provider] || "bg-white/[0.05] text-slate-400 border-white/[0.08]"}`}>
                  {s.provider}
                </span>
              </div>
              <div className="text-[12px] text-slate-400">
                {s.endedAt ? (
                  <span className="text-slate-600">завершена</span>
                ) : (
                  <span className="text-green-400">{formatDuration(s.startedAt)}</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {formatTimeAgo(s.lastSeenAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
