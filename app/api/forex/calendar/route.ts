import { NextRequest, NextResponse } from "next/server";

/**
 * Economic Calendar API Route
 *
 * Fetches the economic calendar from Finnhub when `FINNHUB_API_KEY` is set.
 * Otherwise, returns a static list of major upcoming economic events
 * (NFP, FOMC, ECB, CPI, etc.) for the current week.
 *
 * Under Cache Components, the `fetch()` / `process.env` / `new Date()` usage
 * makes this route dynamic by default — no `export const dynamic` opt-in.
 */

type Impact = "high" | "medium" | "low";

interface EconomicEvent {
  country: string;
  event: string;
  impact: Impact;
  date: string;
  time: string;
  forecast: string;
  previous: string;
}

interface FinnhubEconomicEvent {
  country?: string;
  event?: string;
  impact?: string;
  time?: string;
  estimate?: string | number | null;
  prev?: string | number | null;
  actual?: string | number | null;
}

/** Format a Date as YYYY-MM-DD. */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Returns the Monday (00:00 local) of the week containing `ref`. */
function getMondayOfWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** Build a static calendar of major events for the current week. */
function getStaticCalendar(): EconomicEvent[] {
  const monday = getMondayOfWeek(new Date());
  const dayOffset = (n: number) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + n);
    return formatDate(d);
  };

  return [
    {
      country: "US",
      event: "ISM Manufacturing PMI",
      impact: "medium",
      date: dayOffset(0),
      time: "14:00",
      forecast: "48.5",
      previous: "47.2",
    },
    {
      country: "AU",
      event: "RBA Interest Rate Decision",
      impact: "high",
      date: dayOffset(1),
      time: "03:30",
      forecast: "4.35%",
      previous: "4.35%",
    },
    {
      country: "US",
      event: "JOLTs Job Openings",
      impact: "medium",
      date: dayOffset(1),
      time: "14:00",
      forecast: "8.10M",
      previous: "8.04M",
    },
    {
      country: "US",
      event: "ADP Nonfarm Employment Change",
      impact: "medium",
      date: dayOffset(2),
      time: "12:15",
      forecast: "150K",
      previous: "143K",
    },
    {
      country: "US",
      event: "Crude Oil Inventories",
      impact: "low",
      date: dayOffset(2),
      time: "14:30",
      forecast: "-1.2M",
      previous: "3.9M",
    },
    {
      country: "UK",
      event: "BoE Interest Rate Decision",
      impact: "high",
      date: dayOffset(3),
      time: "12:00",
      forecast: "5.00%",
      previous: "5.00%",
    },
    {
      country: "US",
      event: "Consumer Price Index (CPI) m/m",
      impact: "high",
      date: dayOffset(3),
      time: "12:30",
      forecast: "0.3%",
      previous: "0.4%",
    },
    {
      country: "US",
      event: "Core CPI m/m",
      impact: "high",
      date: dayOffset(3),
      time: "12:30",
      forecast: "0.3%",
      previous: "0.4%",
    },
    {
      country: "EU",
      event: "ECB Interest Rate Decision",
      impact: "high",
      date: dayOffset(3),
      time: "13:15",
      forecast: "3.25%",
      previous: "3.40%",
    },
    {
      country: "US",
      event: "Unemployment Claims",
      impact: "medium",
      date: dayOffset(3),
      time: "12:30",
      forecast: "230K",
      previous: "225K",
    },
    {
      country: "JP",
      event: "BoJ Summary of Opinions",
      impact: "medium",
      date: dayOffset(4),
      time: "23:50",
      forecast: "—",
      previous: "—",
    },
    {
      country: "CA",
      event: "Employment Change",
      impact: "high",
      date: dayOffset(4),
      time: "12:30",
      forecast: "27K",
      previous: "22.1K",
    },
    {
      country: "US",
      event: "Nonfarm Payrolls (NFP)",
      impact: "high",
      date: dayOffset(4),
      time: "12:30",
      forecast: "180K",
      previous: "175K",
    },
    {
      country: "US",
      event: "Average Hourly Earnings m/m",
      impact: "medium",
      date: dayOffset(4),
      time: "12:30",
      forecast: "0.3%",
      previous: "0.4%",
    },
    {
      country: "US",
      event: "FOMC Member Speech",
      impact: "medium",
      date: dayOffset(4),
      time: "15:30",
      forecast: "—",
      previous: "—",
    },
  ];
}

/** Normalises a Finnhub economic-calendar item into the terminal's shape. */
function normalizeFinnhubEvent(item: FinnhubEconomicEvent): EconomicEvent {
  // Finnhub's `time` looks like "2024-01-05 13:30:00 US/Eastern".
  const rawTime = item.time ?? "";
  const datePart = rawTime.slice(0, 10);
  const timePart = rawTime.slice(11, 16) || "All Day";

  let impact: Impact = "low";
  const rawImpact = (item.impact ?? "").toLowerCase();
  if (rawImpact === "high") impact = "high";
  else if (rawImpact === "medium") impact = "medium";
  else if (rawImpact === "low") impact = "low";

  const fmt = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };

  return {
    country: (item.country ?? "—").toUpperCase(),
    event: item.event ?? "Unknown Event",
    impact,
    date: datePart,
    time: timePart,
    forecast: fmt(item.estimate),
    previous: fmt(item.prev),
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (apiKey) {
      const res = await fetch(
        `https://finnhub.io/api/v1/calendar/economic?token=${apiKey}`
      );

      if (res.ok) {
        const data = (await res.json()) as {
          economicCalendar?: FinnhubEconomicEvent[];
        };
        const raw = data.economicCalendar;
        if (Array.isArray(raw) && raw.length > 0) {
          // Keep the most market-moving events up front.
          const events = raw
            .slice(0, 50)
            .map(normalizeFinnhubEvent)
            .sort((a, b) => {
              const order: Record<Impact, number> = {
                high: 0,
                medium: 1,
                low: 2,
              };
              if (order[a.impact] !== order[b.impact]) {
                return order[a.impact] - order[b.impact];
              }
              return a.date.localeCompare(b.date);
            });

          return NextResponse.json(
            { events },
            {
              headers: {
                "Cache-Control":
                  "public, s-maxage=600, stale-while-revalidate=1200",
              },
            }
          );
        }
      }
      // Finnhub error / empty → fall through to static calendar.
    }

    const events = getStaticCalendar();
    return NextResponse.json(
      { events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch economic calendar", details: message },
      { status: 500 }
    );
  }
}
