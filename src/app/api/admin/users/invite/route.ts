import { NextResponse } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/admin/users/invite
 * Body: { email: string, name?: string, password?: string }
 * Creates user with status "active" immediately (auto-activate).
 */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Generate a random password if not provided
    const rawPassword = body.password || Math.random().toString(36).slice(-10);
    const hashed = await hashPassword(rawPassword);

    const user = await db.user.create({
      data: {
        email,
        password: hashed,
        name: body.name || null,
        status: "active",
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        sttMinutesLimit: true,
        aiCreditsLimit: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user,
      generatedPassword: body.password ? undefined : rawPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin invite error:", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
