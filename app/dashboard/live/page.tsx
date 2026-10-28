"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, BarChart3, CandlestickChart, Globe, TrendingUp } from "lucide-react";

const FOREX_PAIRS = [
  { symbol: "FX:EURUSD", label: "EUR/USD" },
  { symbol: "FX:GBPUSD", label: "GBP/USD" },
  { symbol: "FX:USDJPY", label: "USD/JPY" },
  { symbol: "FX:AUDUSD", label: "AUD/USD" },
  { symbol: "FX:USDCAD", label: "USD/CAD" },
  { symbol: "FX:USDCHF", label: "USD/CHF" },
  { symbol: "FX:NZDUSD", label: "NZD/USD" },
];

const CRYPTO_PAIRS = [
  { symbol: "BINANCE:BTCUSDT", label: "BTC/USDT" },
  { symbol: "BINANCE:ETHUSDT", label: "ETH/USDT" },
  { symbol: "BINANCE:SOLUSDT", label: "SOL/USDT" },
];

const ALL_PAIRS = [...FOREX_PAIRS, ...CRYPTO_PAIRS];

declare global {
  interface Window {
    TradingView?: any;
  }
}

function useTradingViewWidget(containerId: string, config: Record<string, any>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const createWidget = () => {
      if (cancelled || !containerRef.current || !window.TradingView) return;
      containerRef.current.innerHTML = "";
      const widgetConfig = {
        ...config,
        container_id: containerId,
        autosize: true,
      };
      new window.TradingView.widget(widgetConfig);
      setLoaded(true);
    };

    if (window.TradingView) {
      createWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, JSON.stringify(config)]);

  return { containerRef, loaded };
}

function AdvancedChart({ symbol }: { symbol: string }) {
  const { containerRef } = useTradingViewWidget(`tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "")}`, {
    symbol,
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#161B22",
    enable_publishing: false,
    allow_symbol_change: true,
    hide_side_toolbar: false,
    studies: ["STD;RSI", "STD;MACD"],
    interval: "60",
  });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <CandlestickChart className="h-4 w-4 text-info" />
          <span className="text-sm font-bold text-text-bright">
            {ALL_PAIRS.find((p) => p.symbol === symbol)?.label ?? symbol}
          </span>
        </div>
        <span className="text-[10px] text-text-muted">TradingView · Live</span>
      </div>
      <div
        ref={containerRef}
        id={`tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "")}`}
        className="w-full h-[400px] sm:h-[500px]"
      />
    </div>
  );
}

function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FX:EURUSD", title: "EUR/USD" },
        { proName: "FX:GBPUSD", title: "GBP/USD" },
        { proName: "FX:USDJPY", title: "USD/JPY" },
        { proName: "BINANCE:BTCUSDT", title: "BTC" },
        { proName: "BINANCE:ETHUSDT", title: "ETH" },
        { proName: "FX:XAUUSD", title: "Gold" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="card overflow-hidden">
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}

function MarketOverviewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "400",
      tabs: [
        {
          title: "Forex",
          symbols: [
            { s: "FX:EURUSD", d: "EUR/USD" },
            { s: "FX:GBPUSD", d: "GBP/USD" },
            { s: "FX:USDJPY", d: "USD/JPY" },
            { s: "FX:AUDUSD", d: "AUD/USD" },
            { s: "FX:USDCAD", d: "USD/CAD" },
            { s: "FX:USDCHF", d: "USD/CHF" },
          ],
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
            { s: "BINANCE:ETHUSDT", d: "Ethereum" },
            { s: "BINANCE:SOLUSDT", d: "Solana" },
            { s: "BINANCE:BNBUSDT", d: "BNB" },
            { s: "BINANCE:XRPUSDT", d: "XRP" },
          ],
        },
        {
          title: "Commodities",
          symbols: [
            { s: "TVC:GOLD", d: "Gold" },
            { s: "TVC:SILVER", d: "Silver" },
            { s: "TVC:USOIL", d: "Crude Oil" },
            { s: "TVC:UKOIL", d: "Brent Oil" },
          ],
        },
      ],
    });
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Globe className="h-4 w-4 text-info" />
        <span className="text-sm font-bold text-text-bright">Market Overview</span>
      </div>
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}

function TechnicalAnalysisWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1h",
      width: "100%",
      height: "400",
      isTransparent: true,
      symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    });
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <BarChart3 className="h-4 w-4 text-info" />
        <span className="text-sm font-bold text-text-bright">
          Technical Analysis — {ALL_PAIRS.find((p) => p.symbol === symbol)?.label ?? symbol}
        </span>
      </div>
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}

export default function LiveChartsPage() {
  const [selectedPair, setSelectedPair] = useState("FX:EURUSD");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-info" />
          <h1 className="text-lg font-bold text-text-bright">Live Charts</h1>
          <span className="badge badge-neutral">TradingView</span>
        </div>
      </div>

      {/* Ticker Tape */}
      <TickerTape />

      {/* Pair Selector */}
      <div className="card p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-buy" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Select Chart Symbol</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PAIRS.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair.symbol)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                selectedPair === pair.symbol
                  ? "border-buy bg-buy/10 text-buy"
                  : "border-border bg-bg text-text-muted hover:border-border-light hover:text-text"
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Chart */}
      <AdvancedChart symbol={selectedPair} />

      {/* Technical Analysis + Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TechnicalAnalysisWidget symbol={selectedPair} />
        <MarketOverviewWidget />
      </div>

      {/* Info */}
      <div className="text-center text-[10px] text-text-muted">
        Charts powered by TradingView · Real-time data · For educational purposes only
      </div>
    </div>
  );
}
