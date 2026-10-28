import { NextRequest, NextResponse } from "next/server";

const QUOTE_CURRENCIES = ["USD", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const quoteParam = QUOTE_CURRENCIES.join(",");
    const todayUrl = `https://api.frankfurter.app/latest?from=EUR&to=${quoteParam}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = formatDate(yesterday);
    const yesterdayUrl = `https://api.frankfurter.app/${yesterdayDate}?from=EUR&to=${quoteParam}`;

    const [todayRes, yesterdayRes] = await Promise.all([
      fetch(todayUrl),
      fetch(yesterdayUrl),
    ]);

    if (!todayRes.ok) {
      throw new Error(`Frankfurter API returned ${todayRes.status}`);
    }

    const todayData: { rates: Record<string, number>; date?: string } = await todayRes.json();

    let yesterdayRates: Record<string, number> = {};
    if (yesterdayRes.ok) {
      const yesterdayData: { rates?: Record<string, number> } = await yesterdayRes.json();
      yesterdayRates = yesterdayData.rates ?? {};
    }

    const rates: Record<string, { rate: number; change: number; changePct: number }> = {};
    for (const quote of QUOTE_CURRENCIES) {
      const rate = todayData.rates[quote];
      if (rate === undefined) continue;
      const previousRate = yesterdayRates[quote] ?? rate;
      const change = rate - previousRate;
      rates[`EUR/${quote}`] = {
        rate: Number(rate.toFixed(5)),
        change: Number(change.toFixed(5)),
        changePct: Number(((change / previousRate) * 100).toFixed(2)),
      };
    }

    return NextResponse.json(
      { rates, timestamp: todayData.date ?? new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
