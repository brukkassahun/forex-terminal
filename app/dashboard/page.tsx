"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Activity, Newspaper, CalendarDays,
  Signal as SignalIcon, RefreshCw, ChevronRight, Clock,
  DollarSign, BarChart3, Zap, AlertTriangle, Layers, Gauge,
  BarChart2, Target, Flame,
} from "lucide-react";

// ─── Types ───
interface RateItem { pair: string; rate: number; change: number; changePct: number; }
interface SignalData {
  pair: string; signal: "BUY" | "SELL" | "NEUTRAL"; confidence: number;
  currentPrice: number;
  indicators: {
    rsi: number; sma20: number; sma50: number; ema20: number; ema50: number; wma20: number;
    macd: number; macdSignal: number; macdHistogram: number;
    stochasticK: number; stochasticD: number; williamsR: number;
    cci: number; mfi: number; atr: number; adx: number; roc: number;
  };
  bollingerBands: { upper: number; middle: number; lower: number; bandwidth: number; percentB: number; };
  volume: {
    volumeRatio: number; activityIndex: number; upDays: number; downDays: number;
    avgDailyRange: number; lastDayRange: number; interpretation: string;
  };
  obv: { value: number; trend: string };
  levels: { support: number; resistance: number; periodHigh: number; periodLow: number; };
  pivotPoints: { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number; };
  fibonacci: {
    swingHigh: number; swingLow: number; level236: number; level382: number;
    level500: number; level618: number; level786: number;
  };
  sentiment: {
    score: number; label: string;
    breakdown: { factor: string; value: string; bias: "bullish" | "bearish" | "neutral" }[];
  };
  reasons: string[]; analysis: string; trend: string;
  lastUpdate: string; dataPoints: number;
}
interface NewsItem { title: string; summary: string; url: string; source: string; publishedAt: string; relatedPairs?: string[]; }
interface CalendarEvent { country: string; event: string; impact: string; date: string; time: string; forecast: string; previous: string; }

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"];

export default function Dashboard() {
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [rates, setRates] = useState<RateItem[]>([]);
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState({ rates: true, signal: true, news: true, calendar: true });
  const [error, setError] = useState({ rates: "", signal: "", news: "", calendar: "" });

  // Auth check removed — handled by dashboard layout

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
    fetchRates();
    fetchNews();
    fetchCalendar();
  }, [fetchRates, fetchNews, fetchCalendar]);

  useEffect(() => {
    fetchSignal(selectedPair);
  }, [selectedPair, fetchSignal]);

  // Auto-refresh rates every 2 min
  useEffect(() => {
    const interval = setInterval(() => fetchRates(), 120000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const refreshAll = () => { fetchRates(); fetchSignal(selectedPair); fetchNews(); fetchCalendar(); };

  return (
    <div className="space-y-4">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-text-bright">Market Overview</h1>
        <button onClick={refreshAll} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-border-light hover:text-text transition">
          <RefreshCw className={`h-3.5 w-3.5 ${loading.rates || loading.signal ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
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
                  <span className="text-[10px] text-text-muted ml-auto">{signal.dataPoints} data points</span>
                </div>

                {/* Oscillators Row */}
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Oscillators</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {/* RSI */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">RSI (14)</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.rsi > 70 ? "text-sell" : signal.indicators.rsi < 30 ? "text-buy" : "text-text-bright"}`}>{signal.indicators.rsi}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.rsi > 70 ? "Overbought" : signal.indicators.rsi < 30 ? "Oversold" : "Neutral"}</p>
                  </div>
                  {/* Stochastic */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Stochastic %K</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.stochasticK > 80 ? "text-sell" : signal.indicators.stochasticK < 20 ? "text-buy" : "text-text-bright"}`}>{signal.indicators.stochasticK}</p>
                    <p className="text-[9px] text-text-muted">D: {signal.indicators.stochasticD}</p>
                  </div>
                  {/* Williams %R */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Williams %R</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.williamsR < -80 ? "text-buy" : signal.indicators.williamsR > -20 ? "text-sell" : "text-text-bright"}`}>{signal.indicators.williamsR}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.williamsR < -80 ? "Oversold" : signal.indicators.williamsR > -20 ? "Overbought" : "Neutral"}</p>
                  </div>
                  {/* CCI */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">CCI (20)</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.cci < -100 ? "text-buy" : signal.indicators.cci > 100 ? "text-sell" : "text-text-bright"}`}>{signal.indicators.cci}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.cci < -100 ? "Oversold" : signal.indicators.cci > 100 ? "Overbought" : "Neutral"}</p>
                  </div>
                  {/* MFI */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">MFI (14)</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.mfi < 20 ? "text-buy" : signal.indicators.mfi > 80 ? "text-sell" : "text-text-bright"}`}>{signal.indicators.mfi}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.mfi < 20 ? "Oversold" : signal.indicators.mfi > 80 ? "Overbought" : "Neutral"}</p>
                  </div>
                  {/* MACD Hist */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">MACD Hist</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.macdHistogram > 0 ? "text-buy" : "text-sell"}`}>{signal.indicators.macdHistogram > 0 ? "+" : ""}{signal.indicators.macdHistogram.toFixed(5)}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.macdHistogram > 0 ? "Bullish" : "Bearish"}</p>
                  </div>
                  {/* ROC */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">ROC (12)</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.roc > 0 ? "text-buy" : "text-sell"}`}>{signal.indicators.roc > 0 ? "+" : ""}{signal.indicators.roc}%</p>
                    <p className="text-[9px] text-text-muted">Momentum</p>
                  </div>
                  {/* ADX */}
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">ADX (14)</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.indicators.adx > 50 ? "text-warn" : signal.indicators.adx > 25 ? "text-info" : "text-text-muted"}`}>{signal.indicators.adx}</p>
                    <p className="text-[9px] text-text-muted">{signal.indicators.adx > 50 ? "Very strong" : signal.indicators.adx > 25 ? "Trending" : "Weak/Range"}</p>
                  </div>
                </div>

                {/* Moving Averages Row */}
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Moving Averages</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "SMA 20", value: signal.indicators.sma20 },
                    { label: "SMA 50", value: signal.indicators.sma50 },
                    { label: "EMA 20", value: signal.indicators.ema20 },
                    { label: "EMA 50", value: signal.indicators.ema50 },
                    { label: "WMA 20", value: signal.indicators.wma20 },
                    { label: "MACD", value: signal.indicators.macd },
                    { label: "MACD Signal", value: signal.indicators.macdSignal },
                    { label: "ATR (14)", value: signal.indicators.atr },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-bg/50 p-2.5">
                      <p className="text-[10px] font-semibold text-text-muted uppercase">{item.label}</p>
                      <p className="text-sm font-mono font-bold text-text-bright mt-0.5">{item.value.toFixed(5)}</p>
                      <p className="text-[9px] mt-0.5">
                        <span className={signal.currentPrice > item.value ? "text-buy" : "text-sell"}>
                          {signal.currentPrice > item.value ? "↑ Above" : "↓ Below"}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* SMA Cross */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">SMA Cross (20/50)</p>
                    <p className={`text-sm font-bold mt-0.5 ${signal.indicators.sma20 > signal.indicators.sma50 ? "text-buy" : "text-sell"}`}>
                      {signal.indicators.sma20 > signal.indicators.sma50 ? "Golden Cross ↑" : "Death Cross ↓"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">ATR Volatility</p>
                    <p className="text-sm font-bold text-text-bright mt-0.5">
                      {signal.indicators.atr > signal.currentPrice * 0.01 ? "High volatility" : "Low volatility"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Volume & Activity Analysis ─── */}
            {signal && !loading.signal && signal.volume && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-5 w-5 text-info" />
                  <h2 className="text-sm font-bold text-text-bright">Volume & Activity Analysis</h2>
                  <span className={`badge ${signal.volume.interpretation === "high" ? "badge-buy" : signal.volume.interpretation === "low" ? "badge-sell" : "badge-neutral"}`}>
                    {signal.volume.interpretation} activity
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Volume Ratio</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${signal.volume.volumeRatio > 1.5 ? "text-buy" : signal.volume.volumeRatio < 0.5 ? "text-sell" : "text-text-bright"}`}>{signal.volume.volumeRatio}x</p>
                    <p className="text-[9px] text-text-muted">vs avg</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Activity Index</p>
                    <p className="text-lg font-mono font-bold text-text-bright mt-0.5">{signal.volume.activityIndex}/100</p>
                    <p className="text-[9px] text-text-muted">price-action based</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Up Days (20)</p>
                    <p className="text-lg font-mono font-bold text-buy mt-0.5">{signal.volume.upDays}</p>
                    <p className="text-[9px] text-text-muted">bullish sessions</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Down Days (20)</p>
                    <p className="text-lg font-mono font-bold text-sell mt-0.5">{signal.volume.downDays}</p>
                    <p className="text-[9px] text-text-muted">bearish sessions</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Avg Daily Range</p>
                    <p className="text-sm font-mono font-bold text-text-bright mt-0.5">{signal.volume.avgDailyRange.toFixed(5)}</p>
                    <p className="text-[9px] text-text-muted">20-day average</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Last Day Range</p>
                    <p className={`text-sm font-mono font-bold mt-0.5 ${signal.volume.lastDayRange > signal.volume.avgDailyRange ? "text-buy" : "text-sell"}`}>{signal.volume.lastDayRange.toFixed(5)}</p>
                    <p className="text-[9px] text-text-muted">{signal.volume.lastDayRange > signal.volume.avgDailyRange ? "Above avg" : "Below avg"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">OBV Trend</p>
                    <p className={`text-sm font-bold mt-0.5 ${signal.obv?.trend === "up" ? "text-buy" : signal.obv?.trend === "down" ? "text-sell" : "text-text-muted"}`}>
                      {signal.obv?.trend === "up" ? "↑ Rising" : signal.obv?.trend === "down" ? "↓ Falling" : "→ Flat"}
                    </p>
                    <p className="text-[9px] text-text-muted">On-Balance Volume</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">ATR (Volatility)</p>
                    <p className="text-sm font-mono font-bold text-text-bright mt-0.5">{signal.indicators.atr.toFixed(5)}</p>
                    <p className="text-[9px] text-text-muted">14-day avg range</p>
                  </div>
                </div>
                {/* Activity Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-muted">Volume Activity</span>
                    <span className="text-[10px] font-mono text-text-bright">{signal.volume.activityIndex}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${signal.volume.activityIndex > 60 ? "bg-buy" : signal.volume.activityIndex > 30 ? "bg-warn" : "bg-sell"}`}
                      style={{ width: `${signal.volume.activityIndex}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Bollinger Bands ─── */}
            {signal && !loading.signal && signal.bollingerBands && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-5 w-5 text-info" />
                  <h2 className="text-sm font-bold text-text-bright">Bollinger Bands</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg border border-sell/20 bg-sell/5 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Upper Band</p>
                    <p className="text-sm font-mono font-bold text-sell mt-0.5">{signal.bollingerBands.upper.toFixed(5)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Middle (SMA20)</p>
                    <p className="text-sm font-mono font-bold text-text-bright mt-0.5">{signal.bollingerBands.middle.toFixed(5)}</p>
                  </div>
                  <div className="rounded-lg border border-buy/20 bg-buy/5 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Lower Band</p>
                    <p className="text-sm font-mono font-bold text-buy mt-0.5">{signal.bollingerBands.lower.toFixed(5)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Bandwidth</p>
                    <p className="text-sm font-mono font-bold text-text-bright mt-0.5">{signal.bollingerBands.bandwidth}%</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">%B Position</p>
                    <p className={`text-sm font-mono font-bold mt-0.5 ${signal.bollingerBands.percentB > 100 ? "text-sell" : signal.bollingerBands.percentB < 0 ? "text-buy" : "text-text-bright"}`}>{signal.bollingerBands.percentB}%</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg/50 p-2.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase">Position</p>
                    <p className={`text-sm font-bold mt-0.5 ${signal.bollingerBands.percentB > 100 ? "text-sell" : signal.bollingerBands.percentB < 0 ? "text-buy" : "text-text-muted"}`}>
                      {signal.bollingerBands.percentB > 100 ? "Above upper" : signal.bollingerBands.percentB < 0 ? "Below lower" : "Inside bands"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Pivot Points & Fibonacci ─── */}
            {signal && !loading.signal && signal.pivotPoints && signal.fibonacci && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pivot Points */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-info" />
                    <h2 className="text-sm font-bold text-text-bright">Pivot Points</h2>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-sell font-semibold">R3</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.r3.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-sell/80 font-semibold">R2</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.r2.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-sell/60 font-semibold">R1</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.r1.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 bg-info/5 -mx-2 px-2 rounded">
                      <span className="text-info font-bold">Pivot</span>
                      <span className="font-mono font-bold text-info">{signal.pivotPoints.pivot.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-buy/60 font-semibold">S1</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.s1.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-buy/80 font-semibold">S2</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.s2.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-buy font-semibold">S3</span>
                      <span className="font-mono text-text-bright">{signal.pivotPoints.s3.toFixed(5)}</span>
                    </div>
                  </div>
                </div>

                {/* Fibonacci */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4 text-warn" />
                    <h2 className="text-sm font-bold text-text-bright">Fibonacci Levels</h2>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-text-muted font-semibold">Swing High (0%)</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.swingHigh.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-sell/70 font-semibold">23.6%</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.level236.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-warn font-semibold">38.2%</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.level382.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 bg-warn/5 -mx-2 px-2 rounded">
                      <span className="text-warn font-bold">50.0%</span>
                      <span className="font-mono font-bold text-warn">{signal.fibonacci.level500.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-buy font-semibold">61.8% (Golden)</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.level618.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-buy/70 font-semibold">78.6%</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.level786.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-text-muted font-semibold">Swing Low (100%)</span>
                      <span className="font-mono text-text-bright">{signal.fibonacci.swingLow.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Market Sentiment ─── */}
            {signal && !loading.signal && signal.sentiment && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="h-5 w-5 text-info" />
                  <h2 className="text-sm font-bold text-text-bright">Market Sentiment</h2>
                </div>
                {/* Sentiment Score Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">Overall Sentiment Score</span>
                    <span className={`text-lg font-black ${signal.sentiment.score >= 55 ? "text-buy" : signal.sentiment.score <= 45 ? "text-sell" : "text-text-muted"}`}>
                      {signal.sentiment.score}/100 · {signal.sentiment.label}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-bg overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        signal.sentiment.score >= 70 ? "bg-buy" :
                        signal.sentiment.score >= 55 ? "bg-buy/70" :
                        signal.sentiment.score >= 45 ? "bg-warn" :
                        signal.sentiment.score >= 30 ? "bg-sell/70" : "bg-sell"
                      }`}
                      style={{ width: `${signal.sentiment.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-text-muted">
                    <span>Strong Bearish</span>
                    <span>Neutral</span>
                    <span>Strong Bullish</span>
                  </div>
                </div>
                {/* Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {Array.isArray(signal.sentiment.breakdown) && signal.sentiment.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-bg/50 px-3 py-2">
                      <span className="text-[10px] text-text-muted">{item.factor}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-text-bright">{item.value}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.bias === "bullish" ? "bg-buy/15 text-buy" :
                          item.bias === "bearish" ? "bg-sell/15 text-sell" :
                          "bg-text-muted/10 text-text-muted"
                        }`}>
                          {item.bias === "bullish" ? "↑" : item.bias === "bearish" ? "↓" : "→"}
                        </span>
                      </div>
                    </div>
                  ))}
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
                    <span className="text-text-muted">Period High (30d)</span>
                    <span className="font-mono text-buy">{signal.levels.periodHigh?.toFixed(5) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Period Low (30d)</span>
                    <span className="font-mono text-sell">{signal.levels.periodLow?.toFixed(5) ?? "—"}</span>
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
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">ATR Volatility</span>
                    <span className="font-mono text-warn">{signal.indicators.atr?.toFixed(5) ?? "—"}</span>
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
    </div>
  );
}
