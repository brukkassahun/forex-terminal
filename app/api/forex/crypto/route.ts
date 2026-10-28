import { NextResponse } from "next/server";

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: { price: number[] };
}

export async function GET() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=30&page=1" +
      "&sparkline=true&price_change_percentage=24h,7d";

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API returned ${res.status}`);
    }

    const data = (await res.json()) as CoinMarket[];

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No crypto data returned");
    }

    // Transform into a clean shape for the frontend
    const coins = data.map((c) => ({
      id: c.id,
      symbol: c.symbol?.toUpperCase() ?? "",
      name: c.name,
      image: c.image,
      price: c.current_price,
      marketCap: c.market_cap,
      rank: c.market_cap_rank,
      volume: c.total_volume,
      change24h: c.price_change_percentage_24h ?? 0,
      change7d: c.price_change_percentage_7d ?? 0,
      high24h: c.high_24h,
      low24h: c.low_24h,
      ath: c.ath,
      athChangePct: c.ath_change_percentage,
      circulatingSupply: c.circulating_supply,
      totalSupply: c.total_supply,
      sparkline: c.sparkline_in_7d?.price ?? [],
    }));

    // Top gainers and losers (by 24h change)
    const sorted24h = [...coins].sort(
      (a, b) => b.change24h - a.change24h
    );
    const gainers = sorted24h.slice(0, 5);
    const losers = sorted24h.slice(-5).reverse();

    // Trending coins (highest 7d change, positive only)
    const trending = [...coins]
      .filter((c) => c.change7d > 0)
      .sort((a, b) => b.change7d - a.change7d)
      .slice(0, 5);

    return NextResponse.json(
      { coins, gainers, losers, trending, timestamp: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch crypto data: ${message}` },
      { status: 500 }
    );
  }
}
