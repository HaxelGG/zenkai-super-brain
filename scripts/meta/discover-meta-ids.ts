/**
 * Descubre INSTAGRAM_BUSINESS_ACCOUNT_ID y META_AD_ACCOUNT_ID a partir de META_ACCESS_TOKEN.
 * Uso: META_ACCESS_TOKEN=EAAG... npm run meta:discover
 * No imprime el token · solo IDs para pegar en Vercel.
 */
import "dotenv/config";

const token =
  process.env.META_ACCESS_TOKEN ||
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.META_SYSTEM_USER_TOKEN;

if (!token?.trim()) {
  console.error("Falta META_ACCESS_TOKEN (o WHATSAPP_ACCESS_TOKEN con scopes Graph).");
  console.error("Ejemplo: $env:META_ACCESS_TOKEN='EAAG...'; npm run meta:discover");
  process.exit(1);
}

async function graphGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", token!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Graph ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as T;
}

type PageRow = {
  id: string;
  name?: string;
  instagram_business_account?: { id: string };
};

type AdAccountRow = { id: string; name?: string; account_status?: number };

async function main() {
  console.log("=== Meta ID discovery · ZENKAI JARVIS ===\n");

  const me = await graphGet<{ id: string; name?: string }>("me", { fields: "id,name" });
  console.log(`Usuario/token: ${me.name ?? "—"} (${me.id})\n`);

  console.log("--- Instagram Business (INSTAGRAM_BUSINESS_ACCOUNT_ID) ---");
  const pages = await graphGet<{ data?: PageRow[] }>("me/accounts", {
    fields: "id,name,instagram_business_account",
  });

  const igAccounts = (pages.data ?? []).filter((p) => p.instagram_business_account?.id);
  if (!igAccounts.length) {
    console.log("  (ninguna) Vinculá IG Business a una página de Facebook en Meta Business Suite.");
  } else {
    for (const p of igAccounts) {
      console.log(`  Página: ${p.name ?? p.id}`);
      console.log(`  INSTAGRAM_BUSINESS_ACCOUNT_ID=${p.instagram_business_account!.id}`);
    }
  }

  console.log("\n--- Meta Ads (META_AD_ACCOUNT_ID) ---");
  const ads = await graphGet<{ data?: AdAccountRow[] }>("me/adaccounts", {
    fields: "id,name,account_status",
    limit: "20",
  });

  if (!ads.data?.length) {
    console.log("  (ninguna) Creá cuenta de anuncios en Ads Manager o pedí acceso al Business Manager.");
  } else {
    for (const a of ads.data) {
      console.log(`  ${a.name ?? "—"} → META_AD_ACCOUNT_ID=${a.id}`);
    }
  }

  console.log("\n--- Siguiente paso en Vercel (zenkaibrain) ---");
  console.log("  vercel env add META_ACCESS_TOKEN production");
  console.log("  vercel env add INSTAGRAM_BUSINESS_ACCOUNT_ID production");
  console.log("  vercel env add META_AD_ACCOUNT_ID production");
  console.log("  Luego: Redeploy en Vercel → probar: npm run jarvis:social:smoke");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
