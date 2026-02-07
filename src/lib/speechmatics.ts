const SPEECHMATICS_API_KEY = process.env.SPEECHMATICS_API_KEY;

interface TempKeyResponse {
  key_value: string;
}

type SpeechmaticsRegion = "eu" | "us";

/**
 * Generate a temporary JWT for Speechmatics real-time WebSocket connection.
 * Uses the master API key to create a short-lived token (TTL seconds).
 * The temp key is used by the frontend to connect directly to Speechmatics WS.
 *
 * @param region - "eu" or "us" (default: "eu")
 * @param ttl - Token time-to-live in seconds (default: 120)
 */
export const generateSpeechmaticsToken = async (
  region: SpeechmaticsRegion = "eu",
  ttl: number = 120
): Promise<string> => {
  if (!SPEECHMATICS_API_KEY) {
    throw new Error("SPEECHMATICS_API_KEY not configured");
  }

  const response = await fetch(
    "https://mp.speechmatics.com/v1/api_keys?type=rt",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
      },
      // IMPORTANT: region must match WS host (eu.rt... vs us.rt...)
      body: JSON.stringify({ ttl, region }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Speechmatics API error: ${response.status} ${error}`);
  }

  const data: TempKeyResponse = await response.json();
  const keyValue = (data.key_value ?? "").trim();

  if (!keyValue) {
    throw new Error("Speechmatics API returned empty key_value");
  }

  return keyValue;
};
