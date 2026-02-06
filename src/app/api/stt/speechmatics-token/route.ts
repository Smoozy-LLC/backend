import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { generateSpeechmaticsToken } from "@/lib/speechmatics";

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

    console.error("Speechmatics token error:", error);
    return NextResponse.json(
      { error: "Failed to generate Speechmatics token" },
      { status: 500 }
    );
  }
}
