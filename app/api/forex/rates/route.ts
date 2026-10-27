import { NextRequest, NextResponse } from "next/server";
import { cacheLife } from "next/cache";

/**
 * Rates API Route
 *
 * Fetches live FX rates from the free frankfurter.app API (no API key required).
 * For each EUR-based pair, today's rate is compared against yesterday's rate
 * to compute the daily change.
 *
 * Server-side caching is handled via the `use cache` directive + `cacheLife`
 * (revalidate every 5 minutes), and an HTTP `Cache-Control` header is set on
 * the response for CDN/browser caching.
 *
 * NOTE: This project has `cacheComponents: true` enabled in next.config.ts.
 * The `export const dynamic = "force-dynamic"` route-segment config is NOT
 * compatible with Cache Components in Next.js 16 (it throws a 500 error:
 * "Route segment config 'dynamic' is not compatible with cacheComponents").
 * Routes that perform a `fetch()` are dynamic by default under Cache Components,
 * so no opt-in is required.
 */

/** Quote currencies tracked against the EUR base. */
const QUOTE_CURRENCIES = ["USD", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];
const QUOTE_PARAM = QUOTE_CURRENCIES.join(",");

/** Format a Date as a YYYY-MM-DD string (frankfurter.app expects this format). */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Cached data-fetcher for live FX rates.
 *
 * `use cache` cannot be used directly inside a Route Handler body, so the
 * fetching logic is extracted into this helper. The `yesterdayDate` argument
 * becomes part of the cache key, so the entry naturally rolls over each day.
 */
async function fetchFxRates(yesterdayDate: string): Promise<{
  rates: Record<string, { rate: number; change: number }>;
  timestamp: string;
}> {
  "use cache";
  // Revalidate on the server every 5 minutes; allow stale serving up to 30 min.
  cacheLife({ revalidate: 300, stale: 300, expire: 1800 });

  const todayUrl = `https://api.frankfurter.app/latest?from=EUR&to=${QUOTE_PARAM}`;
  const yesterdayUrl = `https://api.frankfurter.app/${yesterdayDate}?from=EUR&to=${QUOTE_PARAM}`;

  const [todayRes, yesterdayRes] = await Promise.all([
    fetch(todayUrl),
    fetch(yesterdayUrl),
  ]);

  if (!todayRes.ok) {
    throw new Error(
      `Frankfurter API returned ${todayRes.status} ${todayRes.statusText} for latest rates`
    );
  }

  const todayData: { rates: Record<string, number>; date?: string } =
    await todayRes.json();

  // Yesterday's request may fail (e.g. holiday/weekend with no data). Degrade
  // gracefully by treating the previous rate as equal to today's (change = 0).
  let yesterdayRates: Record<string, number> = {};
  if (yesterdayRes.ok) {
    const yesterdayData: { rates?: Record<string, number> } =
      await yesterdayRes.json();
    yesterdayRates = yesterdayData.rates ?? {};
  }

  const rates: Record<string, { rate: number; change: number }> = {};
  for (const quote of QUOTE_CURRENCIES) {
    const rate = todayData.rates[quote];
    if (rate === undefined) continue;
    const previousRate = yesterdayRates[quote] ?? rate;
    rates[`EUR/${quote}`] = {
      rate: Number(rate.toFixed(6)),
      change: Number((rate - previousRate).toFixed(6)),
    };
  }

  return {
    rates,
    timestamp: todayData.date ?? new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Compute "yesterday" at request time and pass it into the cached helper
    // so it becomes part of the cache key (rolls over daily).
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = formatDate(yesterday);

    const result = await fetchFxRates(yesterdayDate);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch FX rates", details: message },
      { status: 500 }
    );
  }
}
