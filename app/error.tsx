"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-[#EF5350]/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-[#EF5350]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#F0F6FC] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[#8B949E] mb-6">
          The dashboard encountered an error while loading. This is usually
          temporary — try refreshing. If the problem persists, contact support.
        </p>
        {error?.message && (
          <p className="text-xs font-mono text-[#EF5350] bg-[#EF5350]/5 rounded-lg p-2 mb-4 border border-[#EF5350]/10">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#30363D] px-5 py-2.5 text-sm font-medium text-[#8B949E] hover:border-[#484F58] hover:text-[#C9D1D9] transition"
          >
            <Home className="h-4 w-4" />
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
