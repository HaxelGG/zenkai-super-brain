/**
 * Verifica token de Telegram y muestra instrucciones de setup.
 */
import dotenv from "dotenv";
import { telegramApi } from "./telegram-lib.js";

dotenv.config();
dotenv.config({ path: "web/.env" });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();

async function main() {
  if (!TOKEN) {
    console.log(`
JARVIS · Telegram setup
=========================

1. Abrí Telegram y buscá @BotFather
2. /newbot → nombre «JARVIS ZENKAI» → username «zenkai_jarvis_bot» (o similar)
3. Copiá el token y agregalo a .env:

   TELEGRAM_BOT_TOKEN=123456:ABC...

4. Opcional (recomendado): restringí a tu chat:

   TELEGRAM_ALLOWED_CHAT_IDS=tu_chat_id

   Para obtener tu chat id: escribile al bot y mirá los logs del bridge,
   o usá @userinfobot en Telegram.

5. Iniciá el puente en la laptop:

   npm run jarvis:telegram

6. Abrí JARVIS en el navegador (panel.zenkai.systems/jarvis o localhost:4321/jarvis)
`);
    process.exit(1);
  }

  const me = await telegramApi<{ username?: string; first_name?: string }>(TOKEN, "getMe");
  if (!me.ok) {
    console.error("Token inválido:", me.description);
    process.exit(1);
  }

  console.log("Bot OK:", me.result?.first_name, me.result?.username ? `@${me.result.username}` : "");

  // Limpia webhook para usar long-polling local
  const wh = await telegramApi(TOKEN, "deleteWebhook", { drop_pending_updates: false });
  console.log("Webhook:", wh.ok ? "desactivado (long polling local)" : wh.description);

  console.log(`
Siguiente paso:
  npm run jarvis:telegram

Variables en .env:
  TELEGRAM_BOT_TOKEN=...
  TELEGRAM_ALLOWED_CHAT_IDS=...   # opcional
  JARVIS_BRIDGE_PORT=8765         # opcional
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
