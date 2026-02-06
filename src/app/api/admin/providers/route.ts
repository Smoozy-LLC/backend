import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

type ProviderStatus = {
  name: string;
  id: string;
  status: "ok" | "error" | "unknown";
  latencyMs: number | null;
  error?: string;
  keyConfigured: boolean;
};

const checkProvider = async (
  name: string,
  id: string,
  url: string,
  headers: Record<string, string>,
  envKey: string
): Promise<ProviderStatus> => {
  const keyConfigured = Boolean(process.env[envKey]);
  if (!keyConfigured) {
    return { name, id, status: "error", latencyMs: null, error: "API key not configured", keyConfigured };
  }

  const start = Date.now();
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Date.now() - start;

    if (resp.ok || resp.status === 401 || resp.status === 403) {
      // 401/403 means the endpoint exists and responds — key might be wrong but service is up
      return {
        name,
        id,
        status: resp.ok ? "ok" : "ok",
        latencyMs,
        keyConfigured,
        error: resp.ok ? undefined : `HTTP ${resp.status} (service alive, check key)`,
      };
    }

    return {
      name,
      id,
      status: "error",
      latencyMs,
      error: `HTTP ${resp.status}`,
      keyConfigured,
    };
  } catch (err) {
    return {
      name,
      id,
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
      keyConfigured,
    };
  }
};

/**
 * GET /api/admin/providers
 * Health check for all configured providers
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const checks = await Promise.all([
      checkProvider(
        "Speechmatics",
        "speechmatics",
        "https://mp.speechmatics.com/v1/api_keys",
        { Authorization: `Bearer ${process.env.SPEECHMATICS_API_KEY || ""}` },
        "SPEECHMATICS_API_KEY"
      ),
      checkProvider(
        "ElevenLabs",
        "elevenlabs",
        "https://api.elevenlabs.io/v1/user",
        { "xi-api-key": process.env.ELEVENLABS_API_KEY || "" },
        "ELEVENLABS_API_KEY"
      ),
      checkProvider(
        "OpenRouter",
        "openrouter",
        "https://openrouter.ai/api/v1/auth/key",
        { Authorization: `Bearer ${process.env.OPENROUTER_PROVISION_KEY || ""}` },
        "OPENROUTER_PROVISION_KEY"
      ),
    ]);

    const allOk = checks.every((c) => c.status === "ok");

    return NextResponse.json({ providers: checks, allOk });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: message }, { status: 403 });
    console.error("Admin providers error:", error);
    return NextResponse.json({ error: "Failed to check providers" }, { status: 500 });
  }
}
