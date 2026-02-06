"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "active" | "banned";
  isDeveloper: boolean;
  isAdmin: boolean;
  sttMinutesLimit: number;
  sttMinutesUsed: number;
  aiCreditsLimit: number;
  aiCreditsUsed: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const activateUser = async (userId: string) => {
    setActionLoading(userId);
    const token = localStorage.getItem("token");
    await fetch(`/api/admin/users/${userId}/activate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    setActionLoading(userId);
    const token = localStorage.getItem("token");
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Удалить этого пользователя?")) return;
    setActionLoading(userId);
    const token = localStorage.getItem("token");
    await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const statusConfig = {
    pending: { label: "Ожидание", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    active: { label: "Активен", className: "bg-green-500/15 text-green-400 border-green-500/20" },
    banned: { label: "Заблокирован", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
          Загрузка пользователей...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white/90">Пользователи</h2>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} пользователей</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Users list */}
      <div className="bg-[#1a1a1c]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_120px_140px_180px] px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Пользователь</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Статус</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Флаги</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Использование</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Действия</span>
        </div>

        {/* Rows */}
        {users.map((user) => {
          const status = statusConfig[user.status];
          const isLoading = actionLoading === user.id;

          return (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_120px_120px_140px_180px] px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center"
            >
              {/* User */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{user.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user.name || "—"} &middot; {new Date(user.createdAt).toLocaleDateString("ru")}
                </p>
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${status.className}`}>
                  {status.label}
                </span>
              </div>

              {/* Flags */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateUser(user.id, { isDeveloper: !user.isDeveloper })}
                  disabled={isLoading}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors disabled:opacity-40 ${
                    user.isDeveloper
                      ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
                      : "bg-white/[0.03] text-slate-600 border-white/[0.06] hover:text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  DEV
                </button>
                <button
                  onClick={() => updateUser(user.id, { isAdmin: !user.isAdmin })}
                  disabled={isLoading}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors disabled:opacity-40 ${
                    user.isAdmin
                      ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                      : "bg-white/[0.03] text-slate-600 border-white/[0.06] hover:text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  ADM
                </button>
              </div>

              {/* Usage */}
              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p>STT: {user.sttMinutesUsed}/{user.sttMinutesLimit} мин</p>
                <p>AI: ${user.aiCreditsUsed.toFixed(2)}/${user.aiCreditsLimit}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5">
                {user.status === "pending" && (
                  <button
                    onClick={() => activateUser(user.id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg text-[11px] font-medium hover:bg-green-500/25 transition disabled:opacity-40"
                  >
                    {isLoading ? "..." : "Активировать"}
                  </button>
                )}
                {user.status === "active" && (
                  <button
                    onClick={() => updateUser(user.id, { status: "banned" })}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    Бан
                  </button>
                )}
                {user.status === "banned" && (
                  <button
                    onClick={() => updateUser(user.id, { status: "active" })}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[11px] font-medium hover:bg-green-500/20 transition disabled:opacity-40"
                  >
                    Разбан
                  </button>
                )}
                <button
                  onClick={() => deleteUser(user.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white/[0.03] text-slate-500 border border-white/[0.06] rounded-lg text-[11px] font-medium hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition disabled:opacity-40"
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-500 text-sm">
            Пользователей пока нет
          </div>
        )}
      </div>
    </div>
  );
}
