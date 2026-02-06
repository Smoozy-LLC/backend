import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createToken = async (payload: JWTPayload): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
};

export const getTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
};

export const getCurrentUser = async (request: Request) => {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
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
    },
  });

  return user;
};

export const requireAuth = async (request: Request) => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};

export const requireAdmin = async (request: Request) => {
  const user = await requireAuth(request);
  if (!user.isAdmin) {
    throw new Error("Forbidden");
  }
  return user;
};

export const requireActiveUser = async (request: Request) => {
  const user = await requireAuth(request);
  if (user.status !== "active") {
    throw new Error("Account not active");
  }
  return user;
};
