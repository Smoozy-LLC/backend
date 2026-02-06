import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/costs?days=30
 * Returns aggregated provider costs
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const days = Math.min(Number(url.searchParams.get("days")) || 30, 365);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate by provider
    const byProvider = await db.providerUsage.groupBy({
      by: ["provider"],
      where: { createdAt: { gte: since } },
      _sum: { units: true, costUsd: true },
      _count: true,
    });

    // Aggregate by day (raw SQL for date grouping)
    const byDay = await db.providerUsage.groupBy({
      by: ["provider", "type"],
      where: { createdAt: { gte: since } },
      _sum: { units: true, costUsd: true },
      _count: true,
    });

    // Top users by cost
    const topUsers = await db.providerUsage.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _sum: { units: true, costUsd: true },
      _count: true,
      orderBy: { _sum: { costUsd: "desc" } },
      take: 10,
    });

    // Enrich top users with email
    const userIds = topUsers.map((u) => u.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const topUsersEnriched = topUsers.map((u) => ({
      ...u,
      user: userMap[u.userId] || { email: "unknown" },
    }));

    // Total
    const totalCost = byProvider.reduce((s, p) => s + (p._sum.costUsd ?? 0), 0);
    const totalUnits = byProvider.reduce((s, p) => s + (p._sum.units ?? 0), 0);

    return NextResponse.json({
      days,
      totalCost,
      totalUnits,
      byProvider,
      byProviderType: byDay,
      topUsers: topUsersEnriched,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin costs error:", error);
    return NextResponse.json({ error: "Failed to get costs" }, { status: 500 });
  }
}
