"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Activity, Newspaper, CalendarDays,
  Signal as SignalIcon, RefreshCw, LogOut, ChevronRight, Clock,
  DollarSign, BarChart3, Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ─── Types ───
interface RateItem { pair: string; rate: number; change: number; changePct: number; }
interface SignalData {
  pair: string; signal: "BUY" | "SELL" | "NEUTRAL"; confidence: number;
  currentPrice: number;
  indicators: { rsi: number; sma20: number; sma50: number; macd: number; macdSignal: number; macdHistogram: number; };
  levels: { support: number; resistance: number; };
  reasons: string[]; analysis: string; trend: string;
  lastUpdate: string;
  dataPoints: number;
}
interface NewsItem { title: string; summary: string; url: string; source: string; publishedAt: string; relatedPairs?: string[]; }
interface CalendarEvent { country: string; event: string; impact: string; date: string; time: string; forecast: string; previous: string; }

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"];

const MOTIVATIONS = [
  "Discipline over emotion. Rules over feelings.",
  "Cut losses fast. Let winners run.",
  "The trend is your friend. Trade with it, not against it.",
  "Risk 1%. Always. No exceptions.",
  "Patience pays. Wait for A+ setups.",
  "Capital preservation is rule #1.",
];

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [rates, setRates] = useState<RateItem[]>([]);
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState({ rates: true, signal: true, news: true, calendar: true });
  const [error, setError] = useState({ rates: "", signal: "", news: "", calendar: "" });
  const [motivation, setMotivation] = useState(MOTIVATIONS[0]);

  // Auth check
  useEffect(() => {
    setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    const auth = sessionStorage.getItem("forex_authed");
    if (!auth) {
      window.location.href = "/";
      return;
    }
    setAuthed(true);
  }, []);

  // Fetch rates
  const fetchRates = useCallback(async () => {
    setLoading(p => ({ ...p, rates: true }));
    try {
      const res = await fetch("/api/forex/rates");
      const data = await res.json();
      if (data.rates && Array.isArray(data.rates)) {
        setRates(data.rates);
        setError(p => ({ ...p, rates: "" }));
      } else {
        setError(p => ({ ...p, rates: data.error || "Failed to load rates" }));
      }
    } catch { setError(p => ({ ...p, rates: "Network error" })); }
    setLoading(p => ({ ...p, rates: false }));
  }, []);

  // Fetch signal
  const fetchSignal = useCallback(async (pair: string) => {
    setLoading(p => ({ ...p, signal: true }));
    try {
      const res = await fetch(`/api/forex/signals?pair=${pair}`);
      const data = await res.json();
      if (data.signal) {
        setSignal(data);
        setError(p => ({ ...p, signal: "" }));
      } else {
        setError(p => ({ ...p, signal: data.error || "Failed" }));
      }
    } catch { setError(p => ({ ...p, signal: "Network error" })); }
    setLoading(p => ({ ...p, signal: false }));
  }, []);

  // Fetch news
  const fetchNews = useCallback(async () => {
    setLoading(p => ({ ...p, news: true }));
    try {
      const res = await fetch("/api/forex/news");
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        setNews(data.news);
        setError(p => ({ ...p, news: "" }));
      } else {
        setError(p => ({ ...p, news: data.error || "Failed to load news" }));
      }
    } catch { setError(p => ({ ...p, news: "Network error" })); }
    setLoading(p => ({ ...p, news: false }));
  }, []);

  // Fetch calendar
  const fetchCalendar = useCallback(async () => {
    setLoading(p => ({ ...p, calendar: true }));
    try {
      const res = await fetch("/api/forex/calendar");
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setCalendar(data.events);
        setError(p => ({ ...p, calendar: "" }));
      } else {
        setError(p => ({ ...p, calendar: data.error || "Failed to load calendar" }));
      }
    } catch { setError(p => ({ ...p, calendar: "Network error" })); }
    setLoading(p => ({ ...p, calendar: false }));
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchRates();
    fetchNews();
    fetchCalendar();
  }, [authed, fetchRates, fetchNews, fetchCalendar]);

  useEffect(() => {
    if (!authed) return;
    fetchSignal(selectedPair);
  }, [authed, selectedPair, fetchSignal]);

  // Auto-refresh rates every 2 min
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => fetchRates(), 120000);
    return () => clearInterval(interval);
  }, [authed, fetchRates]);

  if (!authed) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>;
  }

  const refreshAll = () => { fetchRates(); fetchSignal(selectedPair); fetchNews(); fetchCalendar(); };
  const logout = () => { sessionStorage.removeItem("forex_authed"); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-buy pulse-dot" />
              <span className="font-bold text-text-bright text-sm sm:text-base">Forex Terminal</span>
            </div>
            <span className="hidden sm:inline text-xs text-text-muted">·</span>
            <span className="hidden sm:inline text-xs text-text-muted">{motivation}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-border-light hover:text-text transition">
              <RefreshCw className={`h-3.5 w-3.5 ${loading.rates || loading.signal ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-sell/50 hover:text-sell transition">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4 space-y-4">
        {/* ─── Live Rates Ticker ─── */}
        <div className="card p-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-info" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Live Rates</span>
            <span className="text-[10px] text-text-muted ml-auto">ECB · updates every 2 min</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {loading.rates ? (
              <span className="text-xs text-text-muted px-2">Loading rates...</span>
            ) : error.rates ? (
              <span className="text-xs text-sell px-2">{error.rates}</span>
            ) : (
              rates.map((r) => (
                <button
                  key={r.pair}
                  onClick={() => setSelectedPair(r.pair)}
                  className={`flex-shrink-0 rounded-lg border px-3 py-2 transition ${
                    selectedPair === r.pair
                      ? "border-buy/40 bg-buy/10"
                      : "border-border bg-bg hover:border-border-light"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-bright">{r.pair}</span>
                    <span className={`text-xs font-mono ${r.change >= 0 ? "text-buy" : "text-sell"}`}>
                      {r.rate.toFixed(4)}
                    </span>
                    <span className={`text-[10px] flex items-center gap-0.5 ${r.change >= 0 ? "text-buy" : "text-sell"}`}>
                      {r.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(r.changePct).toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ─── Left: Signal + Technical ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Trading Signal Card */}
            <div className="card p-5 fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SignalIcon className="h-5 w-5 text-buy" />
                  <h2 className="text-sm font-bold text-text-bright">Trading Signal</h2>
                  <span className="badge badge-neutral">{selectedPair}</span>
                </div>
                {loading.signal ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-text-muted" />
                ) : null}
              </div>

              {loading.signal ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-text-muted mx-auto mb-2" />
                    <p className="text-xs text-text-muted">Analyzing {selectedPair}...</p>
                  </div>
                </div>
              ) : error.signal ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-warn mx-auto mb-2" />
                  <p className="text-sm text-sell">{error.signal}</p>
                </div>
              ) : signal ? (
                <div className="space-y-4">
                  {/* Signal Header */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${
                      signal.signal === "BUY" ? "bg-buy/15" :
                      signal.signal === "SELL" ? "bg-sell/15" : "bg-text-muted/10"
                    }`}>
                      {signal.signal === "BUY" ? <TrendingUp className="h-8 w-8 text-buy" /> :
                       signal.signal === "SELL" ? <TrendingDown className="h-8 w-8 text-sell" /> :
                       <Activity className="h-8 w-8 text-text-muted" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black ${
                          signal.signal === "BUY" ? "text-buy" :
                          signal.signal === "SELL" ? "text-sell" : "text-text-muted"
                        }`}>{signal.signal}</span>
                        <span className={`badge ${
                          signal.confidence >= 70 ? "badge-buy" :
                          signal.confidence >= 50 ? "badge-warn" : "badge-neutral"
                        }`}>
                          {signal.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        Price: <span className="font-mono text-text-bright">{signal.currentPrice.toFixed(5)}</span>
                        {" · "}Trend: <span className="text-text-bright capitalize">{signal.trend}</span>
                      </p>
                    </div>
                  </div>

                  {/* Analysis Text */}
                  <p className="text-sm text-text leading-relaxed bg-bg/50 rounded-lg p-3 border border-border">
                    {signal.analysis}
                  </p>

                  {/* Reasons */}
                  <div className="space-y-1.5">
                    {Array.isArray(signal.reasons) && signal.reasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
                        <ChevronRight className="h-3.5 w-3.5 text-info flex-shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Key Levels */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg border border-sell/20 bg-sell/5 p-3">
                      <p className="text-[10px] font-semibold text-text-muted uppercase">Support</p>
                      <p className="text-lg font-mono font-bold text-sell mt-1">{signal.levels.support.toFixed(5)}</p>
                    </div>
                    <div className="rounded-lg border border-buy/20 bg-buy/5 p-3">
                      <p className="text-[10px] font-semibold text-text-muted uppercase">Resistance</p>
                      <p className="text-lg font-mono font-bold text-buy mt-1">{signal.levels.resistance.toFixed(5)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Technical Indicators */}
            {signal && !loading.signal && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-info" />
                  <h2 className="text-sm font-bold text-text-bright">Technical Indicators</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* RSI */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">RSI (14)</p>
                    <p className={`text-xl font-mono font-bold mt-1 ${
                      signal.indicators.rsi > 70 ? "text-sell" :
                      signal.indicators.rsi < 30 ? "text-buy" : "text-text-bright"
                    }`}>{signal.indicators.rsi}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {signal.indicators.rsi > 70 ? "Overbought" : signal.indicators.rsi < 30 ? "Oversold" : "Neutral"}
                    </p>
                  </div>
                  {/* SMA 20 */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">SMA 20</p>
                    <p className="text-xl font-mono font-bold text-text-bright mt-1">{signal.indicators.sma20.toFixed(4)}</p>
                    <p className="text-[10px] mt-0.5">
                      <span className={signal.currentPrice > signal.indicators.sma20 ? "text-buy" : "text-sell"}>
                        {signal.currentPrice > signal.indicators.sma20 ? "Above" : "Below"}
                      </span>
                    </p>
                  </div>
                  {/* SMA 50 */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">SMA 50</p>
                    <p className="text-xl font-mono font-bold text-text-bright mt-1">{signal.indicators.sma50.toFixed(4)}</p>
                    <p className="text-[10px] mt-0.5">
                      <span className={signal.currentPrice > signal.indicators.sma50 ? "text-buy" : "text-sell"}>
                        {signal.currentPrice > signal.indicators.sma50 ? "Above" : "Below"}
                      </span>
                    </p>
                  </div>
                  {/* MACD */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">MACD</p>
                    <p className="text-xl font-mono font-bold text-text-bright mt-1">{signal.indicators.macd.toFixed(5)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Signal: {signal.indicators.macdSignal.toFixed(5)}</p>
                  </div>
                  {/* MACD Histogram */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">MACD Hist</p>
                    <p className={`text-xl font-mono font-bold mt-1 ${
                      signal.indicators.macdHistogram > 0 ? "text-buy" : "text-sell"
                    }`}>{signal.indicators.macdHistogram > 0 ? "+" : ""}{signal.indicators.macdHistogram.toFixed(5)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {signal.indicators.macdHistogram > 0 ? "Bullish" : "Bearish"}
                    </p>
                  </div>
                  {/* SMA Cross */}
                  <div className="rounded-lg border border-border bg-bg/50 p-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">SMA Cross</p>
                    <p className={`text-sm font-bold mt-1 ${
                      signal.indicators.sma20 > signal.indicators.sma50 ? "text-buy" : "text-sell"
                    }`}>
                      {signal.indicators.sma20 > signal.indicators.sma50 ? "Golden Cross" : "Death Cross"}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {signal.indicators.sma20 > signal.indicators.sma50 ? "Bullish alignment" : "Bearish alignment"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pair Selector */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-warn" />
                <h2 className="text-sm font-bold text-text-bright">Select Trading Pair</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {PAIRS.map(pair => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`rounded-lg border py-2.5 text-xs font-bold transition ${
                      selectedPair === pair
                        ? "border-buy bg-buy/10 text-buy"
                        : "border-border bg-bg text-text-muted hover:border-border-light hover:text-text"
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right: News + Calendar ─── */}
          <div className="space-y-4">
            {/* Economic Calendar */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-info" />
                <h2 className="text-sm font-bold text-text-bright">Economic Calendar</h2>
              </div>
              {loading.calendar ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : error.calendar ? (
                <p className="text-xs text-sell py-4">{error.calendar}</p>
              ) : calendar.length === 0 ? (
                <p className="text-xs text-text-muted py-4">No events found.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {calendar.slice(0, 10).map((evt, i) => (
                    <div key={i} className="rounded-lg border border-border bg-bg/50 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-text-muted">{evt.country}</span>
                        <span className={`badge ${
                          evt.impact === "high" ? "badge-sell" :
                          evt.impact === "medium" ? "badge-warn" : "badge-neutral"
                        }`}>{evt.impact}</span>
                      </div>
                      <p className="text-xs text-text mt-1">{evt.event}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{evt.time}</span>
                        {evt.forecast && <span>Forecast: {evt.forecast}</span>}
                        {evt.previous && <span>Prev: {evt.previous}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Forex News */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="h-4 w-4 text-info" />
                <h2 className="text-sm font-bold text-text-bright">Market News</h2>
              </div>
              {loading.news ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : error.news ? (
                <p className="text-xs text-sell py-4">{error.news}</p>
              ) : news.length === 0 ? (
                <p className="text-xs text-text-muted py-4">No news available.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {news.map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-border bg-bg/50 p-3 hover:border-border-light transition group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-info">{item.source}</span>
                        <span className="text-[10px] text-text-muted">· {item.publishedAt}</span>
                      </div>
                      <p className="text-xs font-medium text-text group-hover:text-text-bright transition leading-relaxed">
                        {item.title}
                      </p>
                      {item.summary && (
                        <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{item.summary}</p>
                      )}
                      {item.relatedPairs && item.relatedPairs.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.relatedPairs.map(p => (
                            <span key={p} className="badge badge-neutral">{p}</span>
                          ))}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {signal && !loading.signal && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-buy" />
                  <h2 className="text-sm font-bold text-text-bright">Quick Stats</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Current Price</span>
                    <span className="font-mono text-text-bright">{signal.currentPrice.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Data Points</span>
                    <span className="font-mono text-text-bright">{signal.dataPoints}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Last Update</span>
                    <span className="font-mono text-text-bright">{signal.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Spread (S-R)</span>
                    <span className="font-mono text-text-bright">
                      {(signal.levels.resistance - signal.levels.support).toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Risk Reminder ─── */}
        <div className="card p-3 border-warn/20 bg-warn/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warn flex-shrink-0" />
            <p className="text-xs text-text-muted">
              <span className="text-warn font-semibold">Risk Reminder:</span> Always use a stop loss. Risk maximum 1% per trade. This tool provides analysis, not financial advice. Trade at your own risk.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
