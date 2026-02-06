import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { generateElevenlabsToken } from "@/lib/elevenlabs";
import { logError } from "@/lib/loggers";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser(request);

    // Check STT limits
    if (user.sttMinutesUsed >= user.sttMinutesLimit) {
      return NextResponse.json(
        { error: "STT minutes limit exceeded" },
        { status: 403 }
      );
    }

    // Generate single-use token
    const token = await generateElevenlabsToken();

    // Track active session
    await db.activeSession.upsert({
      where: { id: `stt-${user.id}` },
      create: {
        id: `stt-${user.id}`,
        userId: user.id,
        type: "stt",
        provider: "elevenlabs",
      },
      update: {
        lastSeenAt: new Date(),
        endedAt: null,
        provider: "elevenlabs",
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Account not active") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    logError({ type: "stt_token_fail", provider: "elevenlabs", message });
    console.error("STT token error:", error);
    return NextResponse.json(
      { error: "Failed to generate STT token" },
      { status: 500 }
    );
  }
}
