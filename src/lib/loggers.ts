import { db } from "./db";

/**
 * Log an authentication event (login success/fail, register, etc.)
 */
export const logAuth = async (params: {
  userId?: string;
  email: string;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
}) => {
  try {
    await db.authLog.create({
      data: {
        userId: params.userId ?? null,
        email: params.email,
        action: params.action,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[logAuth] Failed:", err);
  }
};

/**
 * Log an error event (STT token fail, AI request fail, etc.)
 */
export const logError = async (params: {
  userId?: string;
  type: string;
  provider?: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    await db.errorLog.create({
      data: {
        userId: params.userId ?? null,
        type: params.type,
        provider: params.provider ?? null,
        message: params.message,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("[logError] Failed:", err);
  }
};

/**
 * Log provider usage (STT minutes, AI tokens)
 */
export const logProviderUsage = async (params: {
  userId: string;
  provider: string;
  type: string;
  units: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}) => {
  try {
    await db.providerUsage.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        type: params.type,
        units: params.units,
        costUsd: params.costUsd ?? 0,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("[logProviderUsage] Failed:", err);
  }
};

/**
 * Extract IP from request headers
 */
export const getRequestIp = (request: Request): string | null => {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
};

/**
 * Extract User-Agent from request
 */
export const getRequestUserAgent = (request: Request): string | null => {
  return request.headers.get("user-agent");
};
