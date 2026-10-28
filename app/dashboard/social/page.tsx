"use client";

import { useState, useEffect } from "react";
import {
  Share2, Copy, Check, Trash2, Plus, FileText, TrendingUp,
  AlertTriangle, GraduationCap, Newspaper, Clock, Sparkles,
  Bird, Send, Users, SquarePen, Hash, Lightbulb, ChevronDown,
} from "lucide-react";

// ─── Types ───
type PostType = "Trade Idea" | "Market Update" | "Educational" | "Breaking News";
type Platform = "Twitter" | "Telegram" | "Facebook";

interface SocialPost {
  id: string;
  timestamp: number;
  type: PostType;
  pair?: string;
  content: string;
  platforms: Platform[];
}

// ─── Constants ───
const STORAGE_KEY = "forex_social_posts";
const MAX_CHARS = 280;
const WARN_THRESHOLD = 240;

const POST_TYPES: PostType[] = ["Trade Idea", "Market Update", "Educational", "Breaking News"];
const ALL_PLATFORMS: Platform[] = ["Twitter", "Telegram", "Facebook"];

// Post type visual config — Trade Idea=green, Market Update=blue, Educational=purple, Breaking News=red
const TYPE_CONFIG: Record<
  PostType,
  { color: string; bg: string; border: string; icon: typeof TrendingUp; label: string }
> = {
  "Trade Idea": {
    color: "#26A69A",
    bg: "rgba(38,166,154,0.15)",
    border: "rgba(38,166,154,0.35)",
    icon: TrendingUp,
    label: "Trade Idea",
  },
  "Market Update": {
    color: "#4FC3F7",
    bg: "rgba(79,195,247,0.15)",
    border: "rgba(79,195,247,0.35)",
    icon: Newspaper,
    label: "Market Update",
  },
  "Educational": {
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.35)",
    icon: GraduationCap,
    label: "Educational",
  },
  "Breaking News": {
    color: "#EF5350",
    bg: "rgba(239,83,80,0.15)",
    border: "rgba(239,83,80,0.35)",
    icon: AlertTriangle,
    label: "Breaking News",
  },
};

const PLATFORM_CONFIG: Record<Platform, { icon: typeof Bird; color: string }> = {
  Twitter: { icon: Bird, color: "#4FC3F7" },
  Telegram: { icon: Send, color: "#4FC3F7" },
  Facebook: { icon: Users, color: "#4FC3F7" },
};

// ─── Templates ───
const TEMPLATES: { name: string; type: PostType; pair?: string; content: string }[] = [
  {
    name: "EUR/USD Bullish Setup",
    type: "Trade Idea",
    pair: "EUR/USD",
    content: `🟢 LONG EUR/USD

📊 Setup: Bullish breakout above key resistance
Entry: [ENTRY_PRICE]
Stop Loss: [SL_PRICE]
Take Profit: [TP_PRICE]
Risk/Reward: 1:2

Reasoning: Price broke above the descending trendline with strong momentum. RSI showing room to run. Looking for a retest of broken resistance as new support.

#Forex #EURUSD #TradingIdeas`,
  },
  {
    name: "Market Session Preview",
    type: "Educational",
    content: `🕐 Trading Sessions Today

🇦🇺 Asian: 00:00 - 09:00 UTC
🇬🇧 London: 08:00 - 17:00 UTC
🇺🇸 New York: 13:00 - 22:00 UTC

Best overlap: London + NY (13:00 - 17:00 UTC) — highest liquidity & volatility.

Plan your trades around peak hours for better fills and tighter spreads.

#ForexEducation #TradingSessions`,
  },
  {
    name: "Nonfarm Payrolls Reaction",
    type: "Breaking News",
    pair: "USD",
    content: `🚨 NFP Report Released!

Actual: [ACTUAL]K
Forecast: [FORECAST]K
Previous: [PREVIOUS]K

Markets reacting: USD strengthening across the board. Expect heightened volatility in USD pairs for the next 2-3 hours.

⚠️ If you're in a trade, manage your risk. If not, wait for the dust to settle.

#NFP #ForexNews #USD`,
  },
  {
    name: "Risk Management Reminder",
    type: "Educational",
    content: `🛡️ Risk Management Checklist

✅ Risk max 1% per trade
✅ Always set a stop loss
✅ Know your R:R before entering
✅ Don't move your stop loss wider
✅ Journal every trade
✅ Walk away after 3 consecutive losses

Your capital is your ammunition. Protect it at all costs.

#RiskManagement #ForexTips #TradingPsychology`,
  },
  {
    name: "Weekly Market Outlook",
    type: "Market Update",
    content: `📅 Week Ahead: Forex Outlook

Key events to watch:
🔹 [DAY]: Central bank rate decision
🔹 [DAY]: CPI inflation data
🔹 [DAY]: GDP release

Pairs in focus: EUR/USD, GBP/USD, USD/JPY

Bias: USD strength continues if data supports. Watch for reversals at key technical levels.

#ForexOutlook #MarketAnalysis #TradingPlan`,
  },
  {
    name: "Trade Result Share",
    type: "Market Update",
    pair: "[PAIR]",
    content: `📈 Trade Result: [PAIR]

Direction: [LONG/SHORT]
Entry: [ENTRY_PRICE]
Exit: [EXIT_PRICE]
Result: +[X] pips ✅

What went right: Followed the plan, waited for confirmation entry.
Lesson: Patience paid off. Could have sized better but happy with the execution.

#ForexResults #TradingJournal #Consistency`,
  },
];

// ─── Helpers ───
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Component ───
export default function SocialMediaPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Compose form state
  const [type, setType] = useState<PostType>("Trade Idea");
  const [pair, setPair] = useState("");
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["Twitter"]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Copy feedback state
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [copiedCompose, setCopiedCompose] = useState(false);

  // ─── Load from localStorage ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPosts(parsed);
      }
    } catch {
      /* ignore corrupt data */
    }
    setLoaded(true);
  }, []);

  // ─── Persist helper ───
  const persistPosts = (newPosts: SocialPost[]) => {
    setPosts(newPosts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
    } catch {
      /* storage might be full or unavailable */
    }
  };

  // ─── Apply template ───
  const applyTemplate = (templateName: string) => {
    const tpl = TEMPLATES.find((t) => t.name === templateName);
    if (!tpl) return;
    setType(tpl.type);
    setPair(tpl.pair || "");
    setContent(tpl.content);
    setSelectedTemplate(templateName);
  };

  // ─── Toggle platform ───
  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // ─── Save post ───
  const savePost = () => {
    if (!content.trim()) return;
    const post: SocialPost = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      pair: pair.trim() || undefined,
      content: content.trim(),
      platforms: platforms.length > 0 ? platforms : ["Twitter"],
    };
    persistPosts([post, ...posts]);
    // Reset form
    setContent("");
    setPair("");
    setType("Trade Idea");
    setPlatforms(["Twitter"]);
    setSelectedTemplate("");
  };

  // ─── Delete post ───
  const deletePost = (id: string) => {
    persistPosts(posts.filter((p) => p.id !== id));
  };

  // ─── Copy compose content ───
  const copyCompose = async () => {
    if (!content.trim()) return;
    const ok = await copyText(content);
    if (ok) {
      setCopiedCompose(true);
      setTimeout(() => setCopiedCompose(false), 2000);
    }
  };

  // ─── Copy a feed post ───
  const copyPost = async (post: SocialPost) => {
    const ok = await copyText(post.content);
    if (ok) {
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  // ─── Derived ───
  const charCount = content.length;
  const charColor =
    charCount > MAX_CHARS
      ? "text-sell"
      : charCount > WARN_THRESHOLD
        ? "text-warn"
        : "text-text-muted";

  const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-info" />
          <h1 className="text-lg font-bold text-text-bright">Social Media Hub</h1>
          {loaded && posts.length > 0 && (
            <span className="badge badge-neutral">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          )}
        </div>
      </div>

      {/* ─── Compose Card ─── */}
      <div className="card overflow-hidden fade-in">
        {/* Gradient top border */}
        <div className="h-1 w-full bg-gradient-to-r from-buy via-info to-[#A78BFA]" />

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <SquarePen className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-bold text-text-bright">Compose Post</h2>
          </div>

          {/* Type selector + Pair input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type selector */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Post Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PostType)}
                  className="input-field cursor-pointer appearance-none pr-9"
                  style={{ colorScheme: "dark", borderLeftColor: TYPE_CONFIG[type].border, borderLeftWidth: 3 }}
                >
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Pair input */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Pair (optional)
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  placeholder="EUR/USD, GBP/JPY..."
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>

          {/* Content textarea with character count */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Content
              </label>
              <span className={`font-mono text-[10px] ${charColor}`}>
                {charCount} / {MAX_CHARS}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write your social media post..."
              className="input-field min-h-[120px] resize-y font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Platform tags */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Platform Tags
            </label>
            <div className="flex gap-2">
              {ALL_PLATFORMS.map((p) => {
                const cfg = PLATFORM_CONFIG[p];
                const Icon = cfg.icon;
                const selected = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "border-info/40 bg-info/10 text-info"
                        : "border-border bg-bg text-text-muted hover:border-border-light hover:text-text"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template dropdown */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <div className="relative flex-1">
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                className="input-field cursor-pointer appearance-none py-2 text-xs pr-9"
                style={{ colorScheme: "dark" }}
              >
                <option value="">Generate from Template...</option>
                {TEMPLATES.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={savePost}
              disabled={!content.trim()}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Save Post
            </button>
            <button
              onClick={copyCompose}
              disabled={!content.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-text-muted transition hover:border-border-light hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copiedCompose ? (
                <>
                  <Check className="h-4 w-4 text-buy" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Templates Grid ─── */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warn" />
          <h2 className="text-sm font-bold text-text-bright">Quick Templates</h2>
          <span className="ml-auto text-[10px] text-text-muted">Click to use</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tpl) => {
            const cfg = TYPE_CONFIG[tpl.type];
            const Icon = cfg.icon;
            return (
              <button
                key={tpl.name}
                onClick={() => applyTemplate(tpl.name)}
                className="group rounded-lg border border-border bg-bg/50 p-3 text-left transition hover:border-border-light hover:bg-bg-hover"
                style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                  <span className="text-xs font-bold text-text-bright">{tpl.name}</span>
                </div>
                <p className="line-clamp-2 text-[10px] text-text-muted">{tpl.content}</p>
                <span className="mt-1.5 inline-block text-[10px] font-semibold" style={{ color: cfg.color }}>
                  {tpl.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Feed ─── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-bold text-text-bright">Saved Posts</h2>
          {loaded && posts.length > 0 && (
            <span className="text-[10px] text-text-muted">{posts.length} total</span>
          )}
        </div>

        {/* Loading state */}
        {!loaded ? (
          <div className="card p-8 text-center">
            <p className="text-xs text-text-muted">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty state */
          <div className="card p-8 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted">
              No posts saved yet. Use a template or write your own to create engaging social media content.
            </p>
          </div>
        ) : (
          /* Post list */
          <div className="space-y-3">
            {sortedPosts.map((post) => {
              const cfg = TYPE_CONFIG[post.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={post.id}
                  className="card p-4 transition fade-in hover:border-border-light"
                  style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
                >
                  {/* Header row */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="badge inline-flex items-center gap-1"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        <Icon className="h-3 w-3" />
                        {post.type}
                      </span>
                      {post.pair && (
                        <span className="badge badge-neutral">
                          <Hash className="h-3 w-3" />
                          {post.pair}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyPost(post)}
                        className="rounded-md p-1.5 text-text-muted transition hover:bg-info/10 hover:text-info"
                        title="Copy to clipboard"
                      >
                        {copiedPostId === post.id ? (
                          <Check className="h-3.5 w-3.5 text-buy" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="rounded-md p-1.5 text-text-muted transition hover:bg-sell/10 hover:text-sell"
                        title="Delete post"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                    {post.content}
                  </p>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(post.timestamp)}
                      </span>
                      {post.platforms.map((p) => {
                        const pCfg = PLATFORM_CONFIG[p];
                        const PIcon = pCfg.icon;
                        return (
                          <span
                            key={p}
                            className="flex items-center gap-0.5 text-[10px] text-text-muted"
                          >
                            <PIcon className="h-3 w-3" />
                            {p}
                          </span>
                        );
                      })}
                    </div>
                    {copiedPostId === post.id && (
                      <span className="flex items-center gap-1 text-[10px] text-buy">
                        <Check className="h-3 w-3" />
                        Copied!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
