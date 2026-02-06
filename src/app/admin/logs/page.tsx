"use client";

import { useEffect, useState, useCallback } from "react";

interface AuthLogItem {
  id: string;
  email: string;
  action: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
}

interface ErrorLogItem {
  id: string;
  type: string;
  provider: string | null;
  message: string;
  metadata: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
}

type Tab = "auth" | "error";

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  login_ok: { label: "Вход", cls: "bg-green-500/15 text-green-400 border-green-500/20" },
  login_fail: { label: "Неудача", cls: "bg-red-500/15 text-red-400 border-red-500/20" },
  register: { label: "Регистрация", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  stt_token_fail: "STT Token",
  ai_request_fail: "AI Request",
  provider_error: "Provider",
  system: "Система",
};

export default function LogsPage() {
  const [tab, setTab] = useState<Tab>("auth");
  const [authLogs, setAuthLogs] = useState<AuthLogItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [authTotal, setAuthTotal] = useState(0);
  const [errorTotal, setErrorTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/logs?type=${tab}&limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (tab === "auth") {
      setAuthLogs(data.logs || []);
      setAuthTotal(data.total || 0);
    } else {
      setErrorLogs(data.logs || []);
      setErrorTotal(data.total || 0);
    }
    setLoading(false);
  }, [tab, offset]);

  useEffect(() => { setOffset(0); }, [tab]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.toLocaleDateString("ru")} ${date.toLocaleTimeString("ru")}`;
  };

  const currentTotal = tab === "auth" ? authTotal : errorTotal;
  const hasMore = offset + limit < currentTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Логи</h1>
          <p className="text-xs text-slate-500 mt-0.5">Авторизации и ошибки</p>
        </div>
        <button onClick={fetchLogs}
          className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors">
          Обновить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1a1c]/80 border border-white/[0.08] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("auth")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "auth" ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          Авторизации ({authTotal || "—"})
        </button>
        <button
          onClick={() => setTab("error")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "error" ? "bg-red-500/15 text-red-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          Ошибки ({errorTotal || "—"})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a1a1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden">
          {tab === "auth" ? (
            <>
              <div className="grid grid-cols-[140px_1fr_90px_140px_1fr] px-5 py-3 border-b border-white/[0.06]">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Время</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Действие</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">IP</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">User-Agent</span>
              </div>
              {authLogs.length === 0 ? (
                <p className="px-5 py-12 text-center text-slate-500 text-sm">Нет записей</p>
              ) : (
                authLogs.map((log) => {
                  const act = ACTION_LABELS[log.action] || { label: log.action, cls: "bg-white/[0.05] text-slate-400 border-white/[0.08]" };
                  return (
                    <div key={log.id} className="grid grid-cols-[140px_1fr_90px_140px_1fr] px-5 py-2.5 border-b border-white/[0.04] last:border-0 items-center text-[12px]">
                      <span className="text-slate-500">{formatDate(log.createdAt)}</span>
                      <span className="text-white/80 truncate">{log.email}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border w-fit ${act.cls}`}>{act.label}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{log.ip || "—"}</span>
                      <span className="text-slate-600 truncate text-[11px]">{log.userAgent?.slice(0, 60) || "—"}</span>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-[140px_100px_100px_1fr] px-5 py-3 border-b border-white/[0.06]">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Время</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Тип</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Провайдер</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Сообщение</span>
              </div>
              {errorLogs.length === 0 ? (
                <p className="px-5 py-12 text-center text-slate-500 text-sm">Нет ошибок — отлично!</p>
              ) : (
                errorLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[140px_100px_100px_1fr] px-5 py-2.5 border-b border-white/[0.04] last:border-0 items-start text-[12px]">
                    <span className="text-slate-500">{formatDate(log.createdAt)}</span>
                    <span className="text-red-400/80 text-[11px]">{ERROR_TYPE_LABELS[log.type] || log.type}</span>
                    <span className="text-slate-400 text-[11px]">{log.provider || "—"}</span>
                    <div>
                      <p className="text-white/80 break-all">{log.message}</p>
                      {log.user && <p className="text-slate-500 text-[11px] mt-0.5">user: {log.user.email}</p>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Pagination */}
          {currentTotal > limit && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-slate-500">
                {offset + 1}–{Math.min(offset + limit, currentTotal)} из {currentTotal}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}
                  className="px-3 py-1 text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] text-slate-400 rounded-lg disabled:opacity-30 hover:bg-white/[0.08] transition">
                  Назад
                </button>
                <button onClick={() => setOffset(offset + limit)} disabled={!hasMore}
                  className="px-3 py-1 text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] text-slate-400 rounded-lg disabled:opacity-30 hover:bg-white/[0.08] transition">
                  Далее
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
