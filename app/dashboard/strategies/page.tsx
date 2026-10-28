"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Brain, Plus, Search, Trash2, Check, X, Target,
  AlertTriangle, BookOpen, Layers,
} from "lucide-react";

// ─── Types ───
type Category =
  | "Scalping"
  | "Day Trading"
  | "Swing Trading"
  | "Position Trading"
  | "Price Action";

interface Strategy {
  id: string;
  name: string;
  category: Category;
  description: string;
  rules: string[];
  indicators: string;
  risk: string;
}

// ─── Constants ───
const STORAGE_KEY = "forex_strategies";

const CATEGORIES: Category[] = [
  "Scalping",
  "Day Trading",
  "Swing Trading",
  "Position Trading",
  "Price Action",
];

const CATEGORY_COLORS: Record<Category, { color: string; bg: string; border: string }> = {
  "Scalping":          { color: "#EF5350", bg: "rgba(239,83,80,0.12)",  border: "rgba(239,83,80,0.35)" },
  "Day Trading":       { color: "#4FC3F7", bg: "rgba(79,195,247,0.12)", border: "rgba(79,195,247,0.35)" },
  "Swing Trading":     { color: "#26A69A", bg: "rgba(38,166,154,0.12)", border: "rgba(38,166,154,0.35)" },
  "Position Trading":  { color: "#FFB74D", bg: "rgba(255,183,77,0.12)", border: "rgba(255,183,77,0.35)" },
  "Price Action":      { color: "#BB86FC", bg: "rgba(187,134,252,0.12)", border: "rgba(187,134,252,0.35)" },
};

const SEED_STRATEGIES: Strategy[] = [
  {
    id: "seed-london-breakout",
    name: "London Breakout",
    category: "Scalping",
    description: "Trade the London open breakout with volume confirmation.",
    rules: [
      "Enter on break of Asian session high/low",
      "Stop loss 15 pips",
      "Take profit 30 pips",
      "Only trade 7-8am London time",
    ],
    indicators: "Volume, Session highs/lows",
    risk: "1% per trade",
  },
  {
    id: "seed-ma-crossover",
    name: "Moving Average Crossover",
    category: "Day Trading",
    description: "Trade SMA 20/50 crossovers with trend confirmation.",
    rules: [
      "Buy when SMA20 crosses above SMA50",
      "Sell when opposite",
      "Confirm with RSI > 50 for buys",
      "Stop loss below SMA50",
    ],
    indicators: "SMA20, SMA50, RSI",
    risk: "1.5% per trade",
  },
  {
    id: "seed-fibonacci",
    name: "Fibonacci Retracement",
    category: "Swing Trading",
    description: "Trade pullbacks to Fibonacci levels in trending markets.",
    rules: [
      "Identify trend on H4",
      "Enter at 61.8% retracement",
      "Stop loss beyond 78.6%",
      "Target 161.8% extension",
    ],
    indicators: "Fibonacci, Trend lines, MACD",
    risk: "2% per trade",
  },
  {
    id: "seed-carry-trade",
    name: "Carry Trade",
    category: "Position Trading",
    description:
      "Hold high-yield currencies against low-yield ones to collect rollover interest.",
    rules: [
      "Buy currency with higher interest rate",
      "Hold for weeks/months",
      "Monitor central bank policy changes",
      "Exit on rate shift signals",
    ],
    indicators: "Interest rate differentials, Central bank calendars",
    risk: "3% per trade",
  },
];

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const EMPTY_FORM = {
  name: "",
  category: "Scalping" as Category,
  description: "",
  rules: "",
  indicators: "",
  risk: "",
};

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // ─── Load from localStorage on mount (seed if absent) ───
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setStrategies(parsed);
        } else {
          setStrategies(SEED_STRATEGIES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STRATEGIES));
        }
      } else {
        setStrategies(SEED_STRATEGIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STRATEGIES));
      }
    } catch {
      setStrategies(SEED_STRATEGIES);
    }
    setMounted(true);
  }, []);

  // ─── Persist on change ───
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    } catch {
      /* ignore quota errors */
    }
  }, [strategies, mounted]);

  // ─── Filtered strategies ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return strategies.filter((s) => {
      if (activeCategory !== "All" && s.category !== activeCategory) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.indicators.toLowerCase().includes(q)
      );
    });
  }, [strategies, activeCategory, search]);

  // ─── Actions ───
  const addStrategy = () => {
    if (!form.name.trim()) {
      setFormError("Strategy name is required");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Description is required");
      return;
    }
    const rules = form.rules
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    const newStrategy: Strategy = {
      id: genId(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      rules: rules.length ? rules : ["No rules specified"],
      indicators: form.indicators.trim() || "—",
      risk: form.risk.trim() || "—",
    };
    setStrategies((prev) => [newStrategy, ...prev]);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(false);
  };

  const deleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    setConfirmingId(null);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(false);
  };

  // ─── Hydration guard ───
  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <Brain className="h-6 w-6 animate-pulse" />
        <span className="ml-2 text-sm">Loading strategies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 text-info" />
          <h1 className="text-lg font-bold text-text-bright">Trading Strategies</h1>
          <span className="badge badge-neutral">{strategies.length}</span>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormError("");
          }}
          className="btn-primary text-sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">{showForm ? "Cancel" : "Add Strategy"}</span>
        </button>
      </div>

      {/* ─── Add Strategy Form ─── */}
      {showForm && (
        <div className="card p-5 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-buy" />
            <h2 className="text-sm font-bold text-text-bright">New Strategy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Name
              </label>
              <input
                className="input-field text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. London Breakout"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Category
              </label>
              <select
                className="input-field text-sm"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as Category }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Description
              </label>
              <textarea
                className="input-field text-sm min-h-[60px] resize-y"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of the strategy..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Rules <span className="text-text-muted/70">(one per line)</span>
              </label>
              <textarea
                className="input-field text-xs min-h-[110px] resize-y font-mono leading-relaxed"
                value={form.rules}
                onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
                placeholder={
                  "Enter on break of Asian session high/low\nStop loss 15 pips\nTake profit 30 pips"
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Indicators
              </label>
              <input
                className="input-field text-sm"
                value={form.indicators}
                onChange={(e) =>
                  setForm((f) => ({ ...f, indicators: e.target.value }))
                }
                placeholder="SMA20, SMA50, RSI"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Risk Management
              </label>
              <input
                className="input-field text-sm"
                value={form.risk}
                onChange={(e) => setForm((f) => ({ ...f, risk: e.target.value }))}
                placeholder="1% per trade"
              />
            </div>
          </div>
          {formError && (
            <p className="text-xs text-sell mt-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted hover:border-border-light hover:text-text transition"
            >
              Cancel
            </button>
            <button onClick={addStrategy} className="btn-primary text-sm">
              <Check className="h-4 w-4" />
              Save Strategy
            </button>
          </div>
        </div>
      )}

      {/* ─── Search + Category Filter ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            className="input-field text-sm pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search strategies by name, description, or indicators..."
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {(["All", ...CATEGORIES] as const).map((cat) => {
            const colors = cat === "All" ? null : CATEGORY_COLORS[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? colors
                      ? ""
                      : "border-buy/30 bg-buy/10 text-buy"
                    : "border-border text-text-muted hover:border-border-light hover:text-text"
                }`}
                style={
                  active && colors
                    ? {
                        borderColor: colors.border,
                        background: colors.bg,
                        color: colors.color,
                      }
                    : undefined
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Strategy Grid ─── */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center fade-in">
          <Layers className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">
            {strategies.length === 0
              ? "No strategies yet. Add your first strategy to get started."
              : "No strategies match your current filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const c = CATEGORY_COLORS[s.category];
            return (
              <div
                key={s.id}
                className="card overflow-hidden hover:border-border-light transition fade-in flex flex-col"
              >
                {/* Category accent bar */}
                <div style={{ background: c.color, height: 3 }} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-text-bright truncate">
                        {s.name}
                      </h3>
                      <span
                        className="badge mt-1"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {s.category}
                      </span>
                    </div>
                    {confirmingId === s.id ? (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => deleteStrategy(s.id)}
                          className="rounded-md bg-sell/15 p-1.5 text-sell hover:bg-sell/25 transition"
                          title="Confirm delete"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md bg-text-muted/10 p-1.5 text-text-muted hover:text-text transition"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(s.id)}
                        className="rounded-md p-1.5 text-text-muted hover:text-sell hover:bg-sell/10 transition flex-shrink-0"
                        title="Delete strategy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-muted leading-relaxed mb-3">
                    {s.description}
                  </p>

                  {/* Rules */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="h-3 w-3 text-info" />
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        Rules
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {s.rules.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-text"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
                            style={{ background: c.color }}
                          />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Indicators + Risk (pinned to bottom) */}
                  <div className="mt-auto space-y-2 pt-3 border-t border-border">
                    <div className="flex items-start gap-2">
                      <Target className="h-3.5 w-3.5 text-warn flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          Indicators
                        </span>
                        <p className="text-xs text-text">{s.indicators}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-sell flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          Risk Management
                        </span>
                        <p className="text-xs text-text">{s.risk}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
