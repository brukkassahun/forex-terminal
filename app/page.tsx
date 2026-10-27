'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';

const TRADING_QUOTES: string[] = [
  'Discipline is the bridge between goals and accomplishment. In trading, it separates the professionals from the rest.',
  'The market rewards the patient and punishes the impulsive. Wait for your setup, then execute without hesitation.',
  'Risk management is not optional. Protect your capital first — the profits will follow.',
  'Plan the trade, trade the plan. Never let emotion override your strategy.',
  'Every trade is a lesson. Learn from your losses, stay humble in your wins, and keep improving.',
  'Patience in trading is not about waiting — it is about waiting for the right opportunity.',
];

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rotate the motivational quote on every page load (client-side random pick).
  // Starts with index 0 to stay SSR/hydration-safe, then randomizes on mount.
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * TRADING_QUOTES.length));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      const validPassword = process.env.TRADING_PASSWORD || 'forex2026';

      // Brief delay for tactile UX feedback on submit.
      window.setTimeout(() => {
        if (password === validPassword) {
          sessionStorage.setItem('forex_authed', 'true');
          router.push('/dashboard');
        } else {
          setError('Incorrect password. Please try again.');
          setIsLoading(false);
        }
      }, 280);
    },
    [password, router],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Subtle gradient / glow backdrop behind the card */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(38,166,154,0.13) 0%, rgba(38,166,154,0.05) 22%, transparent 52%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 82%, rgba(79,195,247,0.07) 0%, transparent 46%)',
        }}
        aria-hidden="true"
      />
      {/* Faint top vignette for depth */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-40"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Login card */}
      <div className="card fade-in relative z-10 w-full max-w-md p-8 shadow-2xl sm:p-10">
        {/* Brand + greeting */}
        <div className="mb-7 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#26A69A]" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#8B949E]">
              Forex Terminal
            </span>
          </div>
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <span
              className="pulse-dot inline-block h-2.5 w-2.5 rounded-full bg-[#26A69A]"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
              Welcome back, Trader
            </h1>
          </div>
        </div>

        {/* Rotating motivational quote */}
        <blockquote
          key={quoteIndex}
          className="fade-in mb-7 border-l-2 border-[#30363D] pl-4 text-sm italic leading-relaxed text-[#8B949E]"
        >
          &ldquo;{TRADING_QUOTES[quoteIndex]}&rdquo;
        </blockquote>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8B949E]"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8B949E]"
                aria-hidden="true"
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your access code"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="input-field pl-11"
                autoFocus
                disabled={isLoading}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'password-error' : undefined}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              id="password-error"
              className="flex items-center gap-1.5 text-sm text-[#EF5350]"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Entering…' : 'Enter Terminal'}
            {!isLoading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center text-xs text-[#8B949E]">
        Forex Terminal v1.0 · Educational use only
      </footer>
    </div>
  );
}
