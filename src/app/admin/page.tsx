"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  users: { total: number; active: number; pending: number; banned: number; newToday: number; newThisWeek: number };
  sessions: { active: number };
  usage: { totalSttMinutes: number; totalAiCredits: number };
  costs: { last30dUsd: number };
  errors: { lastWeek: number };
  logins: { today: number };
}

const StatCard = ({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/15 text-blue-400",
    green: "bg-green-500/10 border-green-500/15 text-green-400",
    amber: "bg-amber-500/10 border-amber-500/15 text-amber-400",
    red: "bg-red-500/10 border-red-500/15 text-red-400",
    purple: "bg-purple-500/10 border-purple-500/15 text-purple-400",
    slate: "bg-white/[0.04] border-white/[0.08] text-slate-300",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] mt-0.5 opacity-60">{sub}</p>}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500 text-sm">Не удалось загрузить данные</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Дашборд</h1>
          <p className="text-xs text-slate-500 mt-0.5">Обзор системы</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* User stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Пользователи</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Всего" value={data.users.total} color="slate" />
          <StatCard label="Активных" value={data.users.active} color="green" />
          <StatCard label="Ожидают" value={data.users.pending} color="amber" />
          <StatCard label="Забанены" value={data.users.banned} color="red" />
          <StatCard label="Новые сегодня" value={data.users.newToday} color="blue" />
          <StatCard label="За неделю" value={data.users.newThisWeek} color="blue" />
        </div>
      </div>

      {/* Activity */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Активность</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Активные сессии" value={data.sessions.active} sub="прямо сейчас" color="green" />
          <StatCard label="Логинов сегодня" value={data.logins.today} color="blue" />
          <StatCard label="Ошибок за неделю" value={data.errors.lastWeek} color={data.errors.lastWeek > 0 ? "red" : "green"} />
          <StatCard label="Затраты 30д" value={`$${data.costs.last30dUsd.toFixed(2)}`} color="purple" />
        </div>
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Использование (всего)</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="STT минут" value={data.usage.totalSttMinutes} sub="по всем юзерам" color="blue" />
          <StatCard label="AI кредитов" value={`$${data.usage.totalAiCredits < 0.01 ? data.usage.totalAiCredits.toFixed(4) : data.usage.totalAiCredits.toFixed(2)}`} sub="по всем юзерам" color="purple" />
        </div>
      </div>
    </div>
  );
}
