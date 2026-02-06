import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/stt/report-usage
 * Body: { minutes: number }
 *
 * Frontend calls this when meeting ends (or periodically) to report STT minutes consumed.
 */
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser(request);

    const body = await request.json().catch(() => ({}));
    const minutes = Number(body?.minutes);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: "Invalid minutes value" },
        { status: 400 }
      );
    }

    // Cap single report to 180 minutes (3h) as sanity check
    const capped = Math.min(Math.round(minutes), 180);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        sttMinutesUsed: { increment: capped },
      },
      select: {
        sttMinutesUsed: true,
        sttMinutesLimit: true,
      },
    });

    return NextResponse.json({
      sttMinutesUsed: updated.sttMinutesUsed,
      sttMinutesLimit: updated.sttMinutesLimit,
      added: capped,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to report usage";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Account not active") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("STT report-usage error:", error);
    return NextResponse.json(
      { error: "Failed to report STT usage" },
      { status: 500 }
    );
  }
}
