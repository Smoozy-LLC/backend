import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/dashboard
 * Overview stats for admin dashboard
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      bannedUsers,
      newToday,
      newThisWeek,
      activeSessions,
      totalSttMinutes,
      totalAiCredits,
      recentErrors,
      recentLogins,
      costLast30d,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "pending" } }),
      db.user.count({ where: { status: "banned" } }),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.activeSession.count({ where: { endedAt: null, lastSeenAt: { gte: fiveMinAgo } } }),
      db.user.aggregate({ _sum: { sttMinutesUsed: true } }),
      db.user.aggregate({ _sum: { aiCreditsUsed: true } }),
      db.errorLog.count({ where: { createdAt: { gte: weekAgo } } }),
      db.authLog.count({ where: { createdAt: { gte: todayStart }, action: "login_ok" } }),
      db.providerUsage.aggregate({
        where: { createdAt: { gte: monthAgo } },
        _sum: { costUsd: true },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        banned: bannedUsers,
        newToday,
        newThisWeek,
      },
      sessions: {
        active: activeSessions,
      },
      usage: {
        totalSttMinutes: totalSttMinutes._sum.sttMinutesUsed ?? 0,
        totalAiCredits: totalAiCredits._sum.aiCreditsUsed ?? 0,
      },
      costs: {
        last30dUsd: costLast30d._sum.costUsd ?? 0,
      },
      errors: {
        lastWeek: recentErrors,
      },
      logins: {
        today: recentLogins,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Failed to get dashboard" }, { status: 500 });
  }
}
