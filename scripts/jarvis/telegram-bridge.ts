/**
 * Puente Telegram ↔ JARVIS en la laptop.
 * Long-polling de Telegram + inbox HTTP local para el panel (voz + UI).
 *
 * Uso:
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_ALLOWED_CHAT_IDS=123456 npm run jarvis:telegram
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import dotenv from "dotenv";
import { executeJarvisInstruction, type JarvisRunResult } from "./orchestrator.js";
import {
  parseAllowedChatIds,
  sendTelegramMessage,
  telegramApi,
  type TelegramUpdate,
} from "./telegram-lib.js";

dotenv.config();
dotenv.config({ path: "web/.env" });
dotenv.config({ path: ".env.local" });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const ALLOWED = parseAllowedChatIds(process.env.TELEGRAM_ALLOWED_CHAT_IDS);
const PORT = Number(process.env.JARVIS_BRIDGE_PORT || 8765);
const HOST = process.env.JARVIS_BRIDGE_HOST || "127.0.0.1";

if (!TOKEN) {
  console.error("Falta TELEGRAM_BOT_TOKEN. Creá un bot con @BotFather y exportá el token.");
  process.exit(1);
}

type InboxItem = JarvisRunResult & {
  sourceChannel: "telegram";
  chatId: number;
  delivered: boolean;
};

const inbox: InboxItem[] = [];
let pollOffset = 0;
let polling = true;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function trimInbox() {
  while (inbox.length > 50) inbox.shift();
}

function pushInbox(item: InboxItem) {
  inbox.push(item);
  trimInbox();
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    return null;
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function handleTelegramMessage(chatId: number, text: string) {
  const instruction = text.trim();

  if (instruction === "/start") {
    await sendTelegramMessage(
      TOKEN!,
      chatId,
      "JARVIS en línea.\n\nEscribí un comando (ej. «abre finanzas», «recap», «estado del pipeline») y te respondo aquí y en el Command Center de tu laptop.",
    );
    return;
  }

  if (instruction === "/help") {
    await sendTelegramMessage(
      TOKEN!,
      chatId,
      "Comandos:\n• /start — conectar\n• /help — ayuda\n• Texto libre — JARVIS clasifica y responde\n\nEjemplos: «recap», «abre pipeline», «estado de la agencia»",
    );
    return;
  }

  console.log(`[telegram] ${chatId}: ${instruction}`);
  const result = await executeJarvisInstruction(instruction);

  pushInbox({
    ...result,
    sourceChannel: "telegram",
    chatId,
    delivered: false,
  });

  await sendTelegramMessage(TOKEN!, chatId, result.reply);
  console.log(`[jarvis] ${result.speech}`);
}

async function handleUpdate(update: TelegramUpdate) {
  const msg = update.message;
  if (!msg?.text) return;

  const chatId = String(msg.chat.id);
  if (ALLOWED.size > 0 && !ALLOWED.has(chatId)) {
    console.warn(`[telegram] chat no autorizado: ${chatId}`);
    await sendTelegramMessage(TOKEN!, msg.chat.id, "Chat no autorizado para JARVIS.");
    return;
  }

  await handleTelegramMessage(msg.chat.id, msg.text);
}

async function pollTelegramLoop() {
  console.log("[telegram] long polling activo…");
  while (polling) {
    try {
      const res = await telegramApi<TelegramUpdate[]>(TOKEN!, "getUpdates", {
        offset: pollOffset,
        timeout: 25,
        allowed_updates: ["message"],
      });

      if (!res.ok) {
        console.error("[telegram]", res.description || "getUpdates failed");
        await sleep(5000);
        continue;
      }

      for (const update of res.result ?? []) {
        pollOffset = update.update_id + 1;
        try {
          await handleUpdate(update);
        } catch (e) {
          console.error("[telegram] handleUpdate", e);
        }
      }
    } catch (e) {
      console.error("[telegram] poll error", e);
      await sleep(4000);
    }
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true, service: "jarvis-telegram-bridge", port: PORT });
    return;
  }

  if (req.method === "GET" && url.pathname === "/inbox") {
    const pending = inbox.filter((i) => !i.delivered);
    json(res, 200, { connected: true, pending, total: inbox.length });
    return;
  }

  if (req.method === "POST" && url.pathname === "/inbox/ack") {
    const body = await readJsonBody<{ id?: string; ids?: string[] }>(req);
    const ids = new Set<string>();
    if (body?.id) ids.add(body.id);
    for (const id of body?.ids ?? []) ids.add(id);
    for (const item of inbox) {
      if (ids.has(item.id)) item.delivered = true;
    }
    json(res, 200, { ok: true, acked: ids.size });
    return;
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`JARVIS Telegram bridge · http://${HOST}:${PORT}`);
  console.log(`Inbox: GET /inbox · ACK: POST /inbox/ack`);
  if (ALLOWED.size) {
    console.log(`Chats autorizados: ${[...ALLOWED].join(", ")}`);
  } else {
    console.warn("TELEGRAM_ALLOWED_CHAT_IDS vacío — cualquier chat puede usar el bot.");
  }
  void pollTelegramLoop();
});

process.on("SIGINT", () => {
  polling = false;
  server.close(() => process.exit(0));
});
