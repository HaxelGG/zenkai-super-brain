/**
 * Router LLM unificado · DeepSeek · Sonnet · Haiku · Opus
 */
import type { LlmTier } from "./types.js";

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmResult =
  | { ok: true; text: string; provider: "deepseek" | "anthropic"; model: string }
  | { ok: false; error: string; detail?: unknown };

const MODEL_MAP: Record<LlmTier, { anthropic: string; deepseek?: string }> = {
  opus: { anthropic: process.env.CLAUDE_MODEL_OPUS?.trim() || "claude-opus-4-7" },
  sonnet: { anthropic: process.env.CLAUDE_MODEL_SONNET?.trim() || "claude-sonnet-4-6" },
  haiku: { anthropic: process.env.CLAUDE_MODEL_HAIKU?.trim() || "claude-haiku-4-5-20251001" },
  deepseek: { anthropic: "claude-sonnet-4-6", deepseek: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat" },
};

function preferDeepSeek(): boolean {
  const explicit = (process.env.AGENCY_LLM_PROVIDER || process.env.JARVIS_LLM_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" || explicit === "off") return false;
  return !!process.env.DEEPSEEK_API_KEY?.trim();
}

async function callDeepSeek(model: string, messages: LlmMessage[]): Promise<LlmResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "DEEPSEEK_API_KEY missing" };

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: 1200, temperature: 0.65, messages }),
  });

  if (!res.ok) {
    return { ok: false, error: "deepseek failed", detail: (await res.text()).slice(0, 200) };
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: "deepseek empty" };
  return { ok: true, text, provider: "deepseek", model };
}

async function callAnthropic(model: string, messages: LlmMessage[]): Promise<LlmResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY missing" };

  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    return { ok: false, error: "anthropic failed", detail: (await res.text()).slice(0, 200) };
  }

  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = body.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) return { ok: false, error: "anthropic empty" };
  return { ok: true, text, provider: "anthropic", model };
}

export async function callAgencyLlm(tier: LlmTier, messages: LlmMessage[]): Promise<LlmResult> {
  const models = MODEL_MAP[tier];

  if (tier === "deepseek" || (preferDeepSeek() && tier !== "opus" && tier !== "haiku")) {
    const ds = await callDeepSeek(models.deepseek || "deepseek-chat", messages);
    if (ds.ok) return ds;
  }

  const anthropicModel =
    tier === "haiku" ? models.anthropic : tier === "opus" ? models.anthropic : models.anthropic;
  return callAnthropic(anthropicModel, messages);
}
