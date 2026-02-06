import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser(request);

    return NextResponse.json({
      sttMinutesUsed: user.sttMinutesUsed,
      sttMinutesLimit: user.sttMinutesLimit,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: user.aiCreditsLimit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Account not active") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}
