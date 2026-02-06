import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { generateSpeechmaticsToken } from "@/lib/speechmatics";
import { logError } from "@/lib/loggers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser(request);

    // Check STT limits (shared with ElevenLabs)
    if (user.sttMinutesUsed >= user.sttMinutesLimit) {
      return NextResponse.json(
        { error: "STT minutes limit exceeded" },
        { status: 403 }
      );
    }

    // Generate temporary WebSocket token (120s TTL)
    const token = await generateSpeechmaticsToken("eu", 120);

    // Track active session (upsert — one STT session per user)
    await db.activeSession.upsert({
      where: { id: `stt-${user.id}` },
      create: {
        id: `stt-${user.id}`,
        userId: user.id,
        type: "stt",
        provider: "speechmatics",
      },
      update: {
        lastSeenAt: new Date(),
        endedAt: null,
        provider: "speechmatics",
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate token";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Account not active") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    logError({ type: "stt_token_fail", provider: "speechmatics", message });
    console.error("Speechmatics token error:", error);
    return NextResponse.json(
      { error: "Failed to generate Speechmatics token" },
      { status: 500 }
    );
  }
}
