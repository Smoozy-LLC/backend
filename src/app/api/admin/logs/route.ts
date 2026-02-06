import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/admin/logs?type=auth|error&limit=50&offset=0
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "auth";
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const offset = Number(url.searchParams.get("offset")) || 0;

    if (type === "auth") {
      const [logs, total] = await Promise.all([
        db.authLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        }),
        db.authLog.count(),
      ]);
      return NextResponse.json({ logs, total, type: "auth" });
    }

    if (type === "error") {
      const [logs, total] = await Promise.all([
        db.errorLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          include: {
            user: { select: { id: true, email: true, name: true } },
          },
        }),
        db.errorLog.count(),
      ]);
      return NextResponse.json({ logs, total, type: "error" });
    }

    return NextResponse.json({ error: "Invalid log type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin logs error:", error);
    return NextResponse.json({ error: "Failed to get logs" }, { status: 500 });
  }
}
