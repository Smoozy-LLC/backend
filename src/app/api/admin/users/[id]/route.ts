import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// Get single user
export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isDeveloper: true,
        isAdmin: true,
        openrouterKey: true,
        sttMinutesLimit: true,
        sttMinutesUsed: true,
        aiCreditsLimit: true,
        aiCreditsUsed: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Admin get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

// Update user
export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name",
      "status",
      "isDeveloper",
      "isAdmin",
      "sttMinutesLimit",
      "sttMinutesUsed",
      "aiCreditsLimit",
      "aiCreditsUsed",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isDeveloper: true,
        isAdmin: true,
        sttMinutesLimit: true,
        aiCreditsLimit: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// Delete user
export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
