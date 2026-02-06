const OPENROUTER_PROVISION_KEY = process.env.OPENROUTER_PROVISION_KEY;

interface CreateKeyResponse {
  data: {
    key: string;
    name: string;
    label: string;
    limit: number | null;
    usage: number;
    created_at: string;
  };
}

/**
 * Generate a new OpenRouter API key for a user
 */
export const generateOpenrouterKey = async (
  userName: string,
  limitUsd: number = 10
): Promise<string> => {
  if (!OPENROUTER_PROVISION_KEY) {
    throw new Error("OPENROUTER_PROVISION_KEY not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/keys", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_PROVISION_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `smoozy-${userName}-${Date.now()}`,
      limit: limitUsd,
      limit_reset: "monthly",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  const data: CreateKeyResponse = await response.json();
  return data.data.key;
};

/**
 * Delete an OpenRouter API key
 */
export const deleteOpenrouterKey = async (keyHash: string): Promise<void> => {
  if (!OPENROUTER_PROVISION_KEY) {
    throw new Error("OPENROUTER_PROVISION_KEY not configured");
  }

  const response = await fetch(`https://openrouter.ai/api/v1/keys/${keyHash}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${OPENROUTER_PROVISION_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }
};
