"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, Plus, TrendingUp, TrendingDown, Activity, Trash2,
  ChevronDown, ChevronUp, X, Target, Percent, DollarSign, Scale,
} from "lucide-react";

// ─── Types ───
type Direction = "Long" | "Short";
type Outcome = "Win" | "Loss" | "Breakeven";

interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  direction: Direction;
  outcome: Outcome;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  emotions: string;
  lessons: string;
  notes: string;
}

interface FormState {
  date: string;
  pair: string;
  direction: Direction;
  outcome: Outcome;
  entryPrice: string;
  exitPrice: string;
  pnl: string;
  emotions: string;
  lessons: string;
  notes: string;
}

// ─── Constants ───
const STORAGE_KEY = "forex_journal";
const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"];

const todayISO = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM: FormState = {
  date: todayISO(),
  pair: "EUR/USD",
  direction: "Long",
  outcome: "Win",
  entryPrice: "",
  exitPrice: "",
  pnl: "",
  emotions: "",
  lessons: "",
  notes: "",
};

// ─── Helpers ───
const formatPnl = (n: number) => {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const excerpt = (text: string, max = 80) =>
  text.length > max ? text.slice(0, max).trim() + "…" : text;

const outcomeBorder = (o: Outcome) =>
  o === "Win" ? "border-l-buy" : o === "Loss" ? "border-l-sell" : "border-l-warn";

const outcomeBadge = (o: Outcome) =>
  o === "Win" ? "badge-buy" : o === "Loss" ? "badge-sell" : "badge-warn";

// ─── Stat Card ───
function StatCard({
  icon: Icon, label, value, accent, gradient,
}: {
  icon: React.ElementType; label: string; value: string;
  accent: string; gradient: string;
}) {
  return (
    <div className={`card p-4 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono text-text-bright">{value}</p>
    </div>
  );
}

// ─── Field wrapper for the form ───
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ───
export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterPair, setFilterPair] = useState("All");
  const [filterOutcome, setFilterOutcome] = useState<"All" | Outcome>("All");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setMounted(true);
  }, []);

  // Persist to localStorage whenever entries change (after mount)
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // storage may be unavailable
    }
  }, [entries, mounted]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const total = entries.length;
    const wins = entries.filter(e => e.outcome === "Win").length;
    const losses = entries.filter(e => e.outcome === "Loss").length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0);
    const avgWin = wins > 0
      ? entries.filter(e => e.outcome === "Win").reduce((s, e) => s + (Number(e.pnl) || 0), 0) / wins
      : 0;
    const avgLoss = losses > 0
      ? entries.filter(e => e.outcome === "Loss").reduce((s, e) => s + (Number(e.pnl) || 0), 0) / losses
      : 0;
    return { total, wins, losses, winRate, totalPnl, avgWin, avgLoss };
  }, [entries]);

  // ─── Unique pairs for filter dropdown ───
  const availablePairs = useMemo(() => {
    const set = new Set(entries.map(e => e.pair));
    return ["All", ...Array.from(set).sort()];
  }, [entries]);

  // ─── Filtered + sorted entries (newest first) ───
  const visibleEntries = useMemo(() => {
    return entries
      .filter(e => (filterPair === "All" || e.pair === filterPair))
      .filter(e => (filterOutcome === "All" || e.outcome === filterOutcome))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [entries, filterPair, filterOutcome]);

  // ─── Handlers ───
  const updateForm = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setFormError("");
  }, []);

  const handleAdd = () => {
    if (!form.date || !form.pair) {
      setFormError("Date and pair are required.");
      return;
    }
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: form.date,
      pair: form.pair,
      direction: form.direction,
      outcome: form.outcome,
      entryPrice: parseFloat(form.entryPrice) || 0,
      exitPrice: parseFloat(form.exitPrice) || 0,
      pnl: parseFloat(form.pnl) || 0,
      emotions: form.emotions.trim(),
      lessons: form.lessons.trim(),
      notes: form.notes.trim(),
    };
    setEntries(prev => [entry, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    setConfirmDeleteId(null);
  };

  const pnlColor = (n: number) => (n > 0 ? "text-buy" : n < 0 ? "text-sell" : "text-text-muted");

  // ─── Render ───
  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-text-muted">
          <Activity className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading journal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-info" />
          <h1 className="text-lg font-bold text-text-bright">Trading Journal</h1>
          <span className="badge badge-neutral">{stats.total} {stats.total === 1 ? "entry" : "entries"}</span>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); resetForm(); }}
          className="btn-primary text-xs"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Entry"}
        </button>
      </div>

      {/* ─── Stats Grid ─── */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in">
          <StatCard
            icon={Target} label="Total Trades" value={String(stats.total)}
            accent="bg-info/15 text-info" gradient="from-info/10 to-transparent"
          />
          <StatCard
            icon={Percent} label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            accent="bg-buy/15 text-buy" gradient="from-buy/10 to-transparent"
          />
          <StatCard
            icon={DollarSign} label="Total P&L"
            value={formatPnl(stats.totalPnl)}
            accent={stats.totalPnl >= 0 ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell"}
            gradient={stats.totalPnl >= 0 ? "from-buy/10 to-transparent" : "from-sell/10 to-transparent"}
          />
          <StatCard
            icon={Scale} label="Avg Win / Loss"
            value={`${stats.avgWin > 0 ? "+" : ""}${stats.avgWin.toFixed(2)} / ${stats.avgLoss.toFixed(2)}`}
            accent="bg-warn/15 text-warn" gradient="from-warn/10 to-transparent"
          />
        </div>
      )}

      {/* ─── Inline Form ─── */}
      {showForm && (
        <div className="card p-5 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-buy" />
            <h2 className="text-sm font-bold text-text-bright">New Journal Entry</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Date">
              <input type="date" value={form.date} onChange={e => updateForm("date", e.target.value)} className="input-field text-sm" />
            </Field>
            <Field label="Pair">
              <select value={form.pair} onChange={e => updateForm("pair", e.target.value)} className="input-field text-sm">
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <select value={form.direction} onChange={e => updateForm("direction", e.target.value as Direction)} className="input-field text-sm">
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </Field>
            <Field label="Outcome">
              <select value={form.outcome} onChange={e => updateForm("outcome", e.target.value as Outcome)} className="input-field text-sm">
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Breakeven">Breakeven</option>
              </select>
            </Field>
            <Field label="Entry Price">
              <input type="number" step="any" placeholder="0.00000" value={form.entryPrice} onChange={e => updateForm("entryPrice", e.target.value)} className="input-field text-sm font-mono" />
            </Field>
            <Field label="Exit Price">
              <input type="number" step="any" placeholder="0.00000" value={form.exitPrice} onChange={e => updateForm("exitPrice", e.target.value)} className="input-field text-sm font-mono" />
            </Field>
            <Field label="P&L ($)">
              <input type="number" step="any" placeholder="0.00" value={form.pnl} onChange={e => updateForm("pnl", e.target.value)} className="input-field text-sm font-mono" />
            </Field>
            <Field label="Emotions">
              <input type="text" placeholder="How did you feel?" value={form.emotions} onChange={e => updateForm("emotions", e.target.value)} className="input-field text-sm" />
            </Field>
            <Field label="Lessons">
              <input type="text" placeholder="What did you learn?" value={form.lessons} onChange={e => updateForm("lessons", e.target.value)} className="input-field text-sm" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Notes">
                <textarea rows={3} placeholder="Additional notes, setup details, market context..." value={form.notes} onChange={e => updateForm("notes", e.target.value)} className="input-field text-sm resize-none" />
              </Field>
            </div>
          </div>
          {formError && <p className="text-xs text-sell mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted hover:text-text hover:border-border-light transition">
              Cancel
            </button>
            <button onClick={handleAdd} className="btn-primary text-xs">
              <Plus className="h-4 w-4" /> Add Entry
            </button>
          </div>
        </div>
      )}

      {/* ─── Filters ─── */}
      {stats.total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Pair</span>
            <select
              value={filterPair}
              onChange={e => setFilterPair(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text outline-none focus:border-buy transition"
            >
              {availablePairs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Outcome</span>
            <div className="flex gap-1">
              {(["All", "Win", "Loss", "Breakeven"] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setFilterOutcome(o)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                    filterOutcome === o
                      ? "border-buy/40 bg-buy/10 text-buy"
                      : "border-border text-text-muted hover:text-text hover:border-border-light"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          {(filterPair !== "All" || filterOutcome !== "All") && (
            <button
              onClick={() => { setFilterPair("All"); setFilterOutcome("All"); }}
              className="text-[11px] text-text-muted hover:text-text transition underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ─── Entry List / Empty State ─── */}
      {stats.total === 0 ? (
        <div className="card p-12 text-center fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">
            No journal entries yet. Start documenting your trades to improve your performance.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs mt-4">
            <Plus className="h-4 w-4" /> Add First Entry
          </button>
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="card p-8 text-center fade-in">
          <p className="text-sm text-text-muted">No entries match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEntries.map(entry => {
            const isExpanded = expandedId === entry.id;
            const isConfirming = confirmDeleteId === entry.id;
            return (
              <div
                key={entry.id}
                className={`card overflow-hidden border-l-4 ${outcomeBorder(entry.outcome)} transition fade-in`}
              >
                {/* Collapsed summary row */}
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-hover/40 transition"
                >
                  {/* Date */}
                  <div className="flex-shrink-0 w-16 sm:w-20">
                    <p className="text-xs font-semibold text-text-bright">{formatDate(entry.date).split(",")[0]}</p>
                    <p className="text-[10px] text-text-muted">{formatDate(entry.date).split(",")[1]}</p>
                  </div>

                  {/* Pair + direction */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge badge-neutral">{entry.pair}</span>
                    <span className={`badge ${entry.direction === "Long" ? "badge-buy" : "badge-sell"}`}>
                      {entry.direction === "Long" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {entry.direction}
                    </span>
                  </div>

                  {/* Outcome badge */}
                  <span className={`badge ${outcomeBadge(entry.outcome)} flex-shrink-0 hidden sm:inline-flex`}>
                    {entry.outcome}
                  </span>

                  {/* P&L */}
                  <span className={`text-sm font-mono font-bold flex-shrink-0 ${pnlColor(entry.pnl)}`}>
                    {formatPnl(entry.pnl)}
                  </span>

                  {/* Excerpts — hidden on small screens */}
                  <div className="hidden md:flex flex-col flex-1 min-w-0 gap-0.5">
                    {entry.emotions && (
                      <p className="text-[11px] text-text-muted truncate">
                        <span className="text-text-muted/70">Emotions:</span> {excerpt(entry.emotions, 50)}
                      </p>
                    )}
                    {entry.lessons && (
                      <p className="text-[11px] text-text-muted truncate">
                        <span className="text-text-muted/70">Lessons:</span> {excerpt(entry.lessons, 50)}
                      </p>
                    )}
                  </div>

                  {/* Expand chevron */}
                  <span className="ml-auto flex-shrink-0 text-text-muted">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {/* Expandable detail */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 border-t border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase">Outcome</p>
                          <span className={`badge ${outcomeBadge(entry.outcome)} mt-1`}>{entry.outcome}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase">Entry Price</p>
                          <p className="text-sm font-mono text-text-bright mt-1">{entry.entryPrice.toFixed(5)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase">Exit Price</p>
                          <p className="text-sm font-mono text-text-bright mt-1">{entry.exitPrice.toFixed(5)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-text-muted uppercase">P&L</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${pnlColor(entry.pnl)}`}>
                            {formatPnl(entry.pnl)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {entry.emotions && (
                          <div className="rounded-lg border border-border bg-bg/50 p-3">
                            <p className="text-[10px] font-semibold text-info uppercase tracking-wider mb-1">Emotions</p>
                            <p className="text-xs text-text leading-relaxed">{entry.emotions}</p>
                          </div>
                        )}
                        {entry.lessons && (
                          <div className="rounded-lg border border-border bg-bg/50 p-3">
                            <p className="text-[10px] font-semibold text-warn uppercase tracking-wider mb-1">Lessons</p>
                            <p className="text-xs text-text leading-relaxed">{entry.lessons}</p>
                          </div>
                        )}
                      </div>

                      {entry.notes && (
                        <div className="rounded-lg border border-border bg-bg/50 p-3 mt-3">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                      )}

                      {/* Delete */}
                      <div className="flex justify-end mt-4">
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Delete this entry?</span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-sell/40 bg-sell/10 px-3 py-1.5 text-xs font-semibold text-sell hover:bg-sell/20 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-sell/50 hover:text-sell transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
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
