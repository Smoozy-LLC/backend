const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

interface SingleUseTokenResponse {
  token: string;
}

/**
 * Generate a single-use token for ElevenLabs Realtime STT
 * Token expires after 15 minutes and is consumed on first use
 */
export const generateElevenlabsToken = async (): Promise<string> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${error}`);
  }

  const data: SingleUseTokenResponse = await response.json();
  return data.token;
};
