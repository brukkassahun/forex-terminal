import { NextRequest, NextResponse } from "next/server";

/**
 * News API Route
 *
 * Fetches forex-related news from the Finnhub free API when
 * `FINNHUB_API_KEY` is set. When no key is available (or the request fails),
 * falls back to a curated list of realistic forex news items so the terminal
 * always has content.
 *
 * Under Cache Components, the `fetch()` and `process.env` access make this
 * route dynamic by default — no `export const dynamic` opt-in is needed.
 */

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedPairs: string[];
}

/** Common currency codes used to detect related pairs in news text. */
const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "NZD",
] as const;

/**
 * Scans free-text for ISO currency codes and returns the related trading
 * pairs (paired against USD, or the two detected currencies).
 */
function extractRelatedPairs(text: string): string[] {
  const upper = text.toUpperCase();
  const found = CURRENCY_CODES.filter((code) =>
    new RegExp(`\\b${code}\\b`).test(upper)
  );

  if (found.length >= 2) {
    // Pair the first two distinct currencies found.
    return [`${found[0]}/${found[1]}`];
  }
  if (found.length === 1) {
    // Single currency → pair against USD (or EUR if the currency is USD).
    return found[0] === "USD" ? ["EUR/USD"] : [`${found[0]}/USD`];
  }
  return ["EUR/USD"];
}

/** Curated fallback news items (used when no Finnhub API key is available). */
function getCuratedNews(): NewsItem[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

  return [
    {
      title:
        "ECB Signals Potential Rate Cut as Eurozone Inflation Eases Below Target",
      summary:
        "The European Central Bank hinted at a possible interest rate cut in the coming months after core inflation data came in below expectations, putting downward pressure on the EUR against major peers.",
      url: "https://www.ecb.europa.eu/press/html/index.en.html",
      source: "ECB Press Release",
      publishedAt: hoursAgo(2),
      relatedPairs: ["EUR/USD", "EUR/GBP", "EUR/JPY"],
    },
    {
      title:
        "US Nonfarm Payrolls Beat Expectations, Strengthening the Dollar",
      summary:
        "The US economy added more jobs than forecast last month, according to the latest Labor Department report, reigniting speculation of a hawkish Federal Reserve stance and lifting the USD across the board.",
      url: "https://www.bls.gov/news.release/empsit.htm",
      source: "US Bureau of Labor Statistics",
      publishedAt: hoursAgo(5),
      relatedPairs: ["EUR/USD", "GBP/USD", "USD/JPY"],
    },
    {
      title:
        "Bank of Japan Maintains Ultra-Low Rates, Yen Weakens Against Majors",
      summary:
        "The BoJ kept its benchmark interest rate unchanged and signaled patience on policy normalization, causing the JPY to slide versus the USD and EUR as yield differentials remain wide.",
      url: "https://www.boj.or.jp/en/index.htm",
      source: "Bank of Japan",
      publishedAt: hoursAgo(8),
      relatedPairs: ["USD/JPY", "EUR/JPY"],
    },
    {
      title:
        "GBP Rises as UK CPI Rebounds, Raising BoE Rate-Hike Bets",
      summary:
        "Sterling gained ground after UK consumer price inflation surprised to the upside, prompting markets to price in a longer hold by the Bank of England at elevated interest rates.",
      url: "https://www.ons.gov.uk/economy/inflationandpriceindices",
      source: "ONS Inflation Report",
      publishedAt: hoursAgo(12),
      relatedPairs: ["GBP/USD", "EUR/GBP"],
    },
    {
      title:
        "Swiss Franc Steady as SNB Reaffirms Intervention Readiness",
      summary:
        "The Swiss National Bank reiterated its willingness to intervene in FX markets if necessary, keeping CHF volatility muted despite broader risk-off sentiment in global markets.",
      url: "https://www.snb.ch/en/",
      source: "Swiss National Bank",
      publishedAt: hoursAgo(18),
      relatedPairs: ["USD/CHF", "EUR/CHF"],
    },
    {
      title:
        "Risk-On Mood Lifts AUD and NZD as China Trade Data Improves",
      summary:
        "Better-than-expected Chinese export figures boosted commodity-linked currencies, with the AUD and NZD rallying against the USD as global risk appetite improved.",
      url: "https://www.stats.gov.cn/",
      source: "Global Trade Wire",
      publishedAt: hoursAgo(24),
      relatedPairs: ["AUD/USD", "NZD/USD"],
    },
  ];
}

/** Normalises a raw Finnhub news item into the terminal's NewsItem shape. */
interface FinnhubNewsItem {
  headline?: string;
  summary?: string;
  url?: string;
  source?: string;
  datetime?: number;
}

function normalizeFinnhubItem(item: FinnhubNewsItem): NewsItem {
  const text = `${item.headline ?? ""} ${item.summary ?? ""}`;
  return {
    title: item.headline ?? "Untitled",
    summary: item.summary ?? "",
    url: item.url ?? "",
    source: item.source ?? "Finnhub",
    publishedAt: item.datetime
      ? new Date(item.datetime * 1000).toISOString()
      : new Date().toISOString(),
    relatedPairs: extractRelatedPairs(text),
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (apiKey) {
      const res = await fetch(
        `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`
      );

      if (res.ok) {
        const raw = (await res.json()) as FinnhubNewsItem[];
        if (Array.isArray(raw) && raw.length > 0) {
          const news = raw.slice(0, 25).map(normalizeFinnhubItem);
          return NextResponse.json(
            { news, source: "finnhub" as const },
            {
              headers: {
                "Cache-Control":
                  "public, s-maxage=600, stale-while-revalidate=1200",
              },
            }
          );
        }
      }
      // If Finnhub returns an error or empty list, fall through to curated.
    }

    const news = getCuratedNews();
    return NextResponse.json(
      { news, source: "curated" as const },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch forex news", details: message },
      { status: 500 }
    );
  }
}
