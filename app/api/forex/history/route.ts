import { NextRequest, NextResponse } from "next/server";

/**
 * History API Route
 *
 * Accepts `?pair=EUR/USD&days=90` and returns daily historical rates for the
 * given currency pair, sourced from the free frankfurter.app API.
 *
 * Under Cache Components (enabled in this project), a GET handler that reads
 * `request.nextUrl` and performs a `fetch()` is dynamic by default, so no
 * `export const dynamic` opt-in is needed (and would in fact cause a 500).
 */

interface HistoryPoint {
  date: string;
  rate: number;
}

/** Format a Date as a YYYY-MM-DD string. */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Parse a "BASE/QUOTE" pair string into its components, upper-cased. */
function parsePair(pair: string): { base: string; quote: string } | null {
  const parts = pair.trim().toUpperCase().split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  if (parts[0] === parts[1]) return null;
  return { base: parts[0], quote: parts[1] };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pairParam = searchParams.get("pair") || "EUR/USD";
    const daysParam = searchParams.get("days") || "90";

    const parsed = parsePair(pairParam);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid pair format. Use BASE/QUOTE (e.g. EUR/USD). Base and quote must differ.",
        },
        { status: 400 }
      );
    }

    const days = Math.max(1, Math.min(365, parseInt(daysParam, 10) || 90));
    const { base, quote } = parsed;
    const pair = `${base}/${quote}`;

    // Build the frankfurter time-series date range.
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const url = `https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(
      endDate
    )}?from=${base}&to=${quote}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Frankfurter API returned ${res.status} ${res.statusText}`
      );
    }

    const data: {
      rates?: Record<string, Record<string, number>>;
    } = await res.json();

    const series = data.rates ?? {};
    const history: HistoryPoint[] = Object.entries(series)
      .map(([date, rates]) => ({ date, rate: rates[quote] }))
      .filter((point): point is HistoryPoint => point.rate !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(
      { pair, data: history },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch historical rates", details: message },
      { status: 500 }
    );
  }
}
