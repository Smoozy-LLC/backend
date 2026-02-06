import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logProviderUsage } from "@/lib/loggers";

// Speechmatics Enhanced cost: ~$0.0053/min (based on $0.32/hr enhanced)
const SPEECHMATICS_COST_PER_MIN = 0.0053;
const ELEVENLABS_COST_PER_MIN = 0.005; // approximate

/**
 * POST /api/stt/report-usage
 * Body: { minutes: number, provider?: string }
 */
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser(request);

    const body = await request.json().catch(() => ({}));
    const minutes = Number(body?.minutes);
    const provider = String(body?.provider || "speechmatics");

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { error: "Invalid minutes value" },
        { status: 400 }
      );
    }

    // Cap single report to 180 minutes (3h) as sanity check
    const capped = Math.min(Math.round(minutes), 180);

    // Calculate estimated cost
    const costPerMin = provider === "elevenlabs" ? ELEVENLABS_COST_PER_MIN : SPEECHMATICS_COST_PER_MIN;
    const estimatedCost = capped * costPerMin;

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

    // Log provider usage for cost tracking
    logProviderUsage({
      userId: user.id,
      provider,
      type: "stt",
      units: capped,
      costUsd: estimatedCost,
    });

    // Mark session as ended
    await db.activeSession.updateMany({
      where: { userId: user.id, type: "stt", endedAt: null },
      data: { endedAt: new Date() },
    }).catch(() => {});

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
