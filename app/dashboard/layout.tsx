"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Brain, BookOpen, Share2, Coins,
  Activity, LogOut, RefreshCw, HelpCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/strategies", label: "Strategies", icon: Brain },
  { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
  { href: "/dashboard/crypto", label: "Crypto", icon: Coins },
  { href: "/dashboard/live", label: "Live Charts", icon: Activity },
  { href: "/dashboard/glossary", label: "Glossary", icon: HelpCircle },
];

const MOTIVATIONS = [
  "Discipline over emotion. Rules over feelings.",
  "Cut losses fast. Let winners run.",
  "The trend is your friend. Trade with it, not against it.",
  "Risk 1%. Always. No exceptions.",
  "Patience pays. Wait for A+ setups.",
  "Capital preservation is rule #1.",
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [motivation] = useState(() => MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);

  useEffect(() => {
    const auth = sessionStorage.getItem("forex_authed");
    if (!auth) {
      window.location.href = "/";
      return;
    }
    setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading terminal...</span>
        </div>
      </div>
    );
  }

  const logout = () => {
    sessionStorage.removeItem("forex_authed");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-50 border-b border-border bg-bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-buy pulse-dot flex-shrink-0" />
              <span className="font-bold text-text-bright text-sm sm:text-base truncate">Forex Terminal</span>
              <span className="hidden sm:inline text-xs text-text-muted">·</span>
              <span className="hidden sm:inline text-xs text-text-muted truncate">{motivation}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-sell/50 hover:text-sell transition flex-shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-buy/10 text-buy border border-buy/30"
                      : "text-text-muted hover:text-text hover:bg-bg-hover border border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-4">{children}</main>
    </div>
  );
}
