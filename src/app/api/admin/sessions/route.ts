import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/sessions?active=true
 * Returns active sessions (endedAt is null and lastSeenAt within last 5 min)
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") !== "false";

    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);

    const where = activeOnly
      ? { endedAt: null, lastSeenAt: { gte: fiveMinAgo } }
      : {};

    const sessions = await db.activeSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin sessions error:", error);
    return NextResponse.json({ error: "Failed to get sessions" }, { status: 500 });
  }
}
