"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Coins, TrendingUp, TrendingDown, RefreshCw, Flame,
  ArrowUpRight, ArrowDownRight, DollarSign, ExternalLink,
} from "lucide-react";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  rank: number;
  volume: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePct: number;
  circulatingSupply: number;
  totalSupply: number | null;
  sparkline: number[];
}

interface CryptoData {
  coins: Coin[];
  gainers: Coin[];
  losers: Coin[];
  trending: Coin[];
  timestamp: string;
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = positive ? "#26A69A" : "#EF5350";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function CryptoPage() {
  const [data, setData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"all" | "gainers" | "losers" | "trending">("all");

  const fetchCrypto = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/forex/crypto");
      const json = await res.json();
      if (json.coins && Array.isArray(json.coins)) {
        setData(json);
        setError("");
      } else {
        setError(json.error || "Failed to load crypto data");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCrypto();
    const interval = setInterval(() => fetchCrypto(), 60000);
    return () => clearInterval(interval);
  }, [fetchCrypto]);

  const displayCoins = data
    ? view === "gainers" ? data.gainers
      : view === "losers" ? data.losers
      : view === "trending" ? data.trending
      : data.coins
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-info" />
          <h1 className="text-lg font-bold text-text-bright">Crypto Markets</h1>
          <span className="badge badge-neutral">{data?.coins.length ?? 0} coins</span>
        </div>
        <button
          onClick={fetchCrypto}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-border-light hover:text-text transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading crypto market data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-sell mb-3">{error}</p>
          <button onClick={fetchCrypto} className="btn-primary">Try Again</button>
        </div>
      ) : data ? (
        <>
          {/* Opportunity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top Gainer */}
            <div className="card p-4 border-buy/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-buy/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-buy" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase">Top Gainer 24h</p>
                  <p className="text-sm font-bold text-text-bright">{data.gainers[0]?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-text-bright">
                  ${formatPrice(data.gainers[0]?.price ?? 0)}
                </span>
                <span className="text-sm font-bold text-buy flex items-center gap-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                  {data.gainers[0]?.change24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Top Loser */}
            <div className="card p-4 border-sell/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-sell/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-sell" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase">Top Loser 24h</p>
                  <p className="text-sm font-bold text-text-bright">{data.losers[0]?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-text-bright">
                  ${formatPrice(data.losers[0]?.price ?? 0)}
                </span>
                <span className="text-sm font-bold text-sell flex items-center gap-0.5">
                  <ArrowDownRight className="h-4 w-4" />
                  {Math.abs(data.losers[0]?.change24h ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Trending */}
            <div className="card p-4 border-warn/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-warn/10 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-warn" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase">Trending 7d</p>
                  <p className="text-sm font-bold text-text-bright">{data.trending[0]?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-text-bright">
                  ${formatPrice(data.trending[0]?.price ?? 0)}
                </span>
                <span className="text-sm font-bold text-buy flex items-center gap-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                  {data.trending[0]?.change7d.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {([
              { key: "all", label: "All Coins", icon: Coins },
              { key: "gainers", label: "Top Gainers", icon: TrendingUp },
              { key: "losers", label: "Top Losers", icon: TrendingDown },
              { key: "trending", label: "Trending", icon: Flame },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = view === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-info/10 text-info border border-info/30"
                      : "text-text-muted hover:text-text hover:bg-bg-hover border border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Coin Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-3 font-semibold text-xs uppercase">#</th>
                    <th className="text-left p-3 font-semibold text-xs uppercase">Coin</th>
                    <th className="text-right p-3 font-semibold text-xs uppercase">Price</th>
                    <th className="text-right p-3 font-semibold text-xs uppercase hidden sm:table-cell">24h</th>
                    <th className="text-right p-3 font-semibold text-xs uppercase hidden sm:table-cell">7d</th>
                    <th className="text-right p-3 font-semibold text-xs uppercase hidden md:table-cell">Market Cap</th>
                    <th className="text-right p-3 font-semibold text-xs uppercase hidden lg:table-cell">Volume</th>
                    <th className="text-center p-3 font-semibold text-xs uppercase hidden md:table-cell">7d Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCoins.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b border-border/50 hover:bg-bg-hover/50 transition"
                    >
                      <td className="p-3 text-text-muted font-mono text-xs">{coin.rank}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {coin.image && (
                            <img
                              src={coin.image}
                              alt={coin.symbol}
                              className="h-5 w-5 rounded-full flex-shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-text-bright text-sm block truncate">{coin.name}</span>
                            <span className="text-[10px] text-text-muted">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-text-bright">
                        ${formatPrice(coin.price)}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        <span className={`font-mono text-xs font-medium ${coin.change24h >= 0 ? "text-buy" : "text-sell"}`}>
                          {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        <span className={`font-mono text-xs font-medium ${coin.change7d >= 0 ? "text-buy" : "text-sell"}`}>
                          {coin.change7d >= 0 ? "+" : ""}{coin.change7d.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-text-muted hidden md:table-cell">
                        {formatLargeNum(coin.marketCap)}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-text-muted hidden lg:table-cell">
                        {formatLargeNum(coin.volume)}
                      </td>
                      <td className="p-3 hidden md:table-cell w-24">
                        <Sparkline data={coin.sparkline} positive={coin.change7d >= 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Crypto Opportunities Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gainers Detail */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-buy" />
                <h2 className="text-sm font-bold text-text-bright">Hot Opportunities — Gainers</h2>
              </div>
              <div className="space-y-2">
                {data.gainers.map((coin) => (
                  <div key={coin.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg/50 p-2.5 hover:border-border-light transition">
                    <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-text-bright">{coin.name}</span>
                      <span className="text-[10px] text-text-muted ml-1">{coin.symbol}</span>
                    </div>
                    <span className="text-xs font-mono text-text-bright">${formatPrice(coin.price)}</span>
                    <span className="text-xs font-bold text-buy">+{coin.change24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Losers Detail */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-sell" />
                <h2 className="text-sm font-bold text-text-bright">Buying Opportunities — Oversold</h2>
              </div>
              <div className="space-y-2">
                {data.losers.map((coin) => (
                  <div key={coin.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg/50 p-2.5 hover:border-border-light transition">
                    <img src={coin.image} alt={coin.symbol} className="h-6 w-6 rounded-full flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-text-bright">{coin.name}</span>
                      <span className="text-[10px] text-text-muted ml-1">{coin.symbol}</span>
                    </div>
                    <span className="text-xs font-mono text-text-bright">${formatPrice(coin.price)}</span>
                    <span className="text-xs font-bold text-sell">{coin.change24h.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Last updated */}
          <div className="text-center text-[10px] text-text-muted">
            Data from CoinGecko · Updates every 60s · Last: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </>
      ) : null}
    </div>
  );
}
