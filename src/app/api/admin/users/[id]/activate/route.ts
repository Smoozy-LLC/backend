import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOpenrouterKey } from "@/lib/openrouter";

interface Params {
  params: Promise<{ id: string }>;
}

// Activate user and generate API keys
export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Get user
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status === "active") {
      return NextResponse.json({ error: "User already active" }, { status: 400 });
    }

    // Generate OpenRouter key
    let openrouterKey = user.openrouterKey;
    if (!openrouterKey) {
      try {
        openrouterKey = await generateOpenrouterKey(
          user.email.split("@")[0],
          user.aiCreditsLimit
        );
      } catch (err) {
        console.error("Failed to generate OpenRouter key:", err);
        // Continue without OpenRouter key - admin can add manually later
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        status: "active",
        openrouterKey,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isDeveloper: true,
        openrouterKey: true,
      },
    });

    return NextResponse.json({
      message: "User activated successfully",
      user: updatedUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Admin activate user error:", error);
    return NextResponse.json(
      { error: "Failed to activate user" },
      { status: 500 }
    );
  }
}
