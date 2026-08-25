/**
 * Smoke test local/prod de getJarvisSocialSnapshot.
 * Local: cargar .env.vercel.local o exportar vars.
 * Prod: curl https://panel.zenkai.systems/api/jarvis/social
 */
import "dotenv/config";
import { getJarvisSocialSnapshot } from "./jarvis-social.js";

const snapshot = await getJarvisSocialSnapshot();
console.log(JSON.stringify(snapshot, null, 2));

if (snapshot.source !== "live") {
  console.error("\n❌ source=mock — faltan META_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID (+ META_AD_ACCOUNT_ID para ROAS)");
  process.exit(1);
}

console.log("\n✅ Social live OK");
