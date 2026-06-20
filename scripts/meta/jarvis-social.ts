/**
 * Meta Graph API · métricas Instagram + Ads para JARVIS social dashboard.
 * Degradación elegante sin tokens configurados.
 */

export type JarvisSocialSnapshot = {
  source: "live" | "mock";
  fetchedAt: string;
  instagram?: {
    followers: number;
    reach7d: number;
    impressions7d: number;
    engagementRate: number;
  };
  metaAds?: {
    spend7d: number;
    impressions7d: number;
    roas: number;
    cpm: number;
  };
};

type GraphInsightRow = { name: string; values?: { value: number | string }[] };

async function graphGet<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta Graph ${path} → HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function sumInsightValues(rows: GraphInsightRow[] | undefined, name: string): number {
  const row = rows?.find((r) => r.name === name);
  if (!row?.values?.length) return 0;
  return row.values.reduce((sum, v) => sum + Number(v.value || 0), 0);
}

export async function getJarvisSocialSnapshot(): Promise<JarvisSocialSnapshot> {
  const fetchedAt = new Date().toISOString();
  const token =
    process.env.META_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_SYSTEM_USER_TOKEN;

  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const adAccountRaw = process.env.META_AD_ACCOUNT_ID;

  if (!token) {
    return { source: "mock", fetchedAt };
  }

  const snapshot: JarvisSocialSnapshot = { source: "mock", fetchedAt };

  if (igId) {
    try {
      const profile = await graphGet<{ followers_count?: number }>(token, igId, {
        fields: "followers_count",
      });
      const insights = await graphGet<{ data?: GraphInsightRow[] }>(
        token,
        `${igId}/insights`,
        {
          metric: "reach,impressions,accounts_engaged",
          period: "day",
          metric_type: "total_value",
          since: String(Math.floor(Date.now() / 1000) - 7 * 86400),
          until: String(Math.floor(Date.now() / 1000)),
        },
      );

      const reach7d = sumInsightValues(insights.data, "reach");
      const impressions7d = sumInsightValues(insights.data, "impressions");
      const engaged = sumInsightValues(insights.data, "accounts_engaged");
      const followers = profile.followers_count ?? 0;
      const engagementRate =
        reach7d > 0 ? Math.round((engaged / reach7d) * 1000) / 10 : 0;

      snapshot.instagram = { followers, reach7d, impressions7d, engagementRate };
      snapshot.source = "live";
    } catch (e) {
      console.warn("[jarvis/social] Instagram fetch failed:", e);
    }
  }

  if (adAccountRaw) {
    const adAccountId = adAccountRaw.startsWith("act_") ? adAccountRaw : `act_${adAccountRaw}`;
    try {
      const insights = await graphGet<{
        data?: {
          spend?: string;
          impressions?: string;
          purchase_roas?: { value: string }[];
          cpm?: string;
        }[];
      }>(token, `${adAccountId}/insights`, {
        fields: "spend,impressions,purchase_roas,cpm",
        date_preset: "last_7d",
      });

      const row = insights.data?.[0];
      if (row) {
        const spend7d = Number(row.spend ?? 0);
        const impressions7d = Number(row.impressions ?? 0);
        const roas = Number(row.purchase_roas?.[0]?.value ?? 0);
        const cpm = Number(row.cpm ?? 0);
        snapshot.metaAds = { spend7d, impressions7d, roas, cpm };
        snapshot.source = "live";
      }
    } catch (e) {
      console.warn("[jarvis/social] Meta Ads fetch failed:", e);
    }
  }

  return snapshot;
}
