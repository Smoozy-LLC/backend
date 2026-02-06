import { requireActiveUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError, logProviderUsage } from "@/lib/loggers";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "mistralai/ministral-8b-2512";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser(request);

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      systemPrompt,
      messages,
      userMessage,
      imagesBase64,
    } = body as {
      systemPrompt?: string;
      messages?: ChatMessage[];
      userMessage?: string;
      imagesBase64?: string[];
    };

    if (!userMessage && (!messages || messages.length === 0)) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build messages array for OpenRouter
    const openrouterMessages: ChatMessage[] = [];

    // System prompt
    if (systemPrompt) {
      openrouterMessages.push({ role: "system", content: systemPrompt });
    }

    // History messages
    if (messages && messages.length > 0) {
      openrouterMessages.push(...messages);
    }

    // User message (if sent separately)
    if (userMessage) {
      if (imagesBase64 && imagesBase64.length > 0) {
        // Build multimodal content
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "text", text: userMessage },
        ];
        for (const img of imagesBase64) {
          content.push({
            type: "image_url",
            image_url: { url: `data:image/png;base64,${img}` },
          });
        }
        openrouterMessages.push({ role: "user", content });
      } else {
        openrouterMessages.push({ role: "user", content: userMessage });
      }
    }

    // Call OpenRouter with streaming
    const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://smoozy.app",
        "X-Title": "Smoozy",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: openrouterMessages,
        stream: true,
      }),
    });

    if (!orResponse.ok) {
      const errorText = await orResponse.text().catch(() => "");
      console.error("[AI] OpenRouter error:", orResponse.status, errorText);
      logError({ userId: user.id, type: "ai_request_fail", provider: "openrouter", message: `HTTP ${orResponse.status}: ${errorText.slice(0, 200)}` });
      return new Response(
        JSON.stringify({ error: `AI provider error: ${orResponse.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!orResponse.body) {
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream SSE back to client
    const reader = orResponse.body.getReader();
    const decoder = new TextDecoder();
    let totalResponseTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const trimmed = line.substring(5).trim();
              if (!trimmed || trimmed === "[DONE]") {
                if (trimmed === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
                continue;
              }

              try {
                const parsed = JSON.parse(trimmed);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (delta) {
                  totalResponseTokens += Math.ceil(delta.length / 4);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                  );
                }

                // Check for usage info in final chunk
                if (parsed?.usage) {
                  totalResponseTokens = parsed.usage.total_tokens || totalResponseTokens;
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
        } catch (err) {
          console.error("[AI] Stream error:", err);
        } finally {
          controller.close();

          // Update usage in DB (best-effort, don't block response)
          try {
            const estimatedTokens = totalResponseTokens || 500;
            // Rough cost estimate: $0.0001 per 1k tokens (very approximate)
            const costEstimate = (estimatedTokens / 1000) * 0.001;
            await db.user.update({
              where: { id: user.id },
              data: {
                aiCreditsUsed: { increment: costEstimate },
              },
            });
            logProviderUsage({
              userId: user.id,
              provider: "openrouter",
              type: "ai_chat",
              units: estimatedTokens / 1000, // in thousands
              costUsd: costEstimate,
              metadata: { model: OPENROUTER_MODEL },
            });
          } catch (e) {
            console.error("[AI] Failed to update usage:", e);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";

    if (message === "Unauthorized") {
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (message === "Account not active") {
      return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("[AI] Chat error:", error);
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
