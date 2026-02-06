"use client";

import { useEffect, useState, useCallback } from "react";

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

const STATUS_CONFIG = {
  pending: { label: "Ожидание", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  active: { label: "Активен", cls: "bg-green-500/15 text-green-400 border-green-500/20" },
  banned: { label: "Бан", cls: "bg-red-500/15 text-red-400 border-red-500/20" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ sttMinutesLimit: 0, aiCreditsLimit: 0 });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteResult, setInviteResult] = useState<{ email: string; password?: string } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const apiCall = async (url: string, method: string, body?: object) => {
    return fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    setActionLoading(userId);
    await apiCall(`/api/admin/users/${userId}`, "PATCH", data);
    await fetchUsers();
    setActionLoading(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Удалить этого пользователя?")) return;
    setActionLoading(userId);
    await apiCall(`/api/admin/users/${userId}`, "DELETE");
    await fetchUsers();
    setActionLoading(null);
  };

  const handleActivateUser = async (userId: string) => {
    setActionLoading(userId);
    await apiCall(`/api/admin/users/${userId}/activate`, "POST");
    await fetchUsers();
    setActionLoading(null);
  };

  const handleResetCounters = async (userId: string) => {
    if (!confirm("Обнулить счётчики использования?")) return;
    setActionLoading(userId);
    await apiCall(`/api/admin/users/${userId}`, "PATCH", { sttMinutesUsed: 0, aiCreditsUsed: 0 });
    await fetchUsers();
    setActionLoading(null);
  };

  const handleSaveLimits = async (userId: string) => {
    setActionLoading(userId);
    await apiCall(`/api/admin/users/${userId}`, "PATCH", {
      sttMinutesLimit: editValues.sttMinutesLimit,
      aiCreditsLimit: editValues.aiCreditsLimit,
    });
    setEditingUser(null);
    await fetchUsers();
    setActionLoading(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setActionLoading("invite");
    const res = await apiCall("/api/admin/users/invite", "POST", { email: inviteEmail, name: inviteName || undefined });
    const data = await res.json();
    if (data.user) {
      setInviteResult({ email: data.user.email, password: data.generatedPassword });
      setInviteEmail("");
      setInviteName("");
      await fetchUsers();
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.name?.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">Пользователи</h1>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} пользователей</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors"
          >
            + Пригласить
          </button>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-[#1a1a1c]/80 border border-blue-500/20 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-blue-400">Приглашение пользователя</h3>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <input
              type="text"
              placeholder="Имя (опционально)"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-48 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <button
              onClick={handleInvite}
              disabled={!inviteEmail || actionLoading === "invite"}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {actionLoading === "invite" ? "..." : "Создать"}
            </button>
          </div>
          {inviteResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
              <p className="text-green-400">Создан: <strong>{inviteResult.email}</strong></p>
              {inviteResult.password && (
                <p className="text-green-300 mt-1">Пароль: <code className="bg-white/10 px-2 py-0.5 rounded">{inviteResult.password}</code></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Поиск по email или имени..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      />

      {/* Table */}
      <div className="bg-[#1a1a1c]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_90px_90px_180px_200px] px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Пользователь</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Статус</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Флаги</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Использование</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Действия</span>
        </div>

        {filteredUsers.map((user) => {
          const status = STATUS_CONFIG[user.status];
          const isLoading = actionLoading === user.id;
          const isEditing = editingUser === user.id;

          return (
            <div key={user.id} className="grid grid-cols-[1fr_90px_90px_180px_200px] px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
              {/* User */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{user.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {user.name || "—"} &middot; {new Date(user.createdAt).toLocaleDateString("ru")}
                  {user.lastLoginAt && (
                    <span className="ml-2 text-slate-600">
                      вход: {new Date(user.lastLoginAt).toLocaleDateString("ru")}
                    </span>
                  )}
                </p>
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${status.cls}`}>
                  {status.label}
                </span>
              </div>

              {/* Flags */}
              <div className="flex gap-1">
                <button onClick={() => handleUpdateUser(user.id, { isDeveloper: !user.isDeveloper })} disabled={isLoading}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition disabled:opacity-40 ${user.isDeveloper ? "bg-purple-500/15 text-purple-400 border-purple-500/20" : "bg-white/[0.03] text-slate-600 border-white/[0.06]"}`}>
                  DEV
                </button>
                <button onClick={() => handleUpdateUser(user.id, { isAdmin: !user.isAdmin })} disabled={isLoading}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition disabled:opacity-40 ${user.isAdmin ? "bg-blue-500/15 text-blue-400 border-blue-500/20" : "bg-white/[0.03] text-slate-600 border-white/[0.06]"}`}>
                  ADM
                </button>
              </div>

              {/* Usage */}
              <div>
                {isEditing ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 w-7">STT:</span>
                      <input type="number" value={editValues.sttMinutesLimit} onChange={(e) => setEditValues((v) => ({ ...v, sttMinutesLimit: Number(e.target.value) }))}
                        className="w-16 px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-[11px] text-white" />
                      <span className="text-[10px] text-slate-600">мин</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 w-7">AI:</span>
                      <input type="number" step="0.01" value={editValues.aiCreditsLimit} onChange={(e) => setEditValues((v) => ({ ...v, aiCreditsLimit: Number(e.target.value) }))}
                        className="w-16 px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-[11px] text-white" />
                      <span className="text-[10px] text-slate-600">$</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => handleSaveLimits(user.id)} disabled={isLoading}
                        className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded text-[10px] font-medium">
                        Сохранить
                      </button>
                      <button onClick={() => setEditingUser(null)}
                        className="px-2 py-0.5 bg-white/[0.04] text-slate-500 border border-white/[0.08] rounded text-[10px]">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p>STT: {user.sttMinutesUsed}/{user.sttMinutesLimit} мин</p>
                    <p>AI: ${user.aiCreditsUsed < 0.01 ? user.aiCreditsUsed.toFixed(4) : user.aiCreditsUsed.toFixed(2)}/${user.aiCreditsLimit}</p>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => { setEditingUser(user.id); setEditValues({ sttMinutesLimit: user.sttMinutesLimit, aiCreditsLimit: user.aiCreditsLimit }); }}
                        className="text-[10px] text-blue-400/60 hover:text-blue-400 transition">
                        [лимиты]
                      </button>
                      <button onClick={() => handleResetCounters(user.id)} disabled={isLoading}
                        className="text-[10px] text-amber-400/60 hover:text-amber-400 transition disabled:opacity-40">
                        [сброс]
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-wrap">
                {user.status === "pending" && (
                  <button onClick={() => handleActivateUser(user.id)} disabled={isLoading}
                    className="px-2.5 py-1 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg text-[11px] font-medium hover:bg-green-500/25 transition disabled:opacity-40">
                    {isLoading ? "..." : "Активировать"}
                  </button>
                )}
                {user.status === "active" && (
                  <button onClick={() => handleUpdateUser(user.id, { status: "banned" })} disabled={isLoading}
                    className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition disabled:opacity-40">
                    Бан
                  </button>
                )}
                {user.status === "banned" && (
                  <button onClick={() => handleUpdateUser(user.id, { status: "active" })} disabled={isLoading}
                    className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[11px] font-medium hover:bg-green-500/20 transition disabled:opacity-40">
                    Разбан
                  </button>
                )}
                <button onClick={() => handleDeleteUser(user.id)} disabled={isLoading}
                  className="px-2.5 py-1 bg-white/[0.03] text-slate-500 border border-white/[0.06] rounded-lg text-[11px] font-medium hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition disabled:opacity-40">
                  Удалить
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-500 text-sm">
            {search ? "Ничего не найдено" : "Пользователей пока нет"}
          </div>
        )}
      </div>
    </div>
  );
}
