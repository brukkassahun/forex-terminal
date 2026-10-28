import { NextRequest, NextResponse } from 'next/server';

interface DayRate { date: string; rate: number; }

/** Calculate Simple Moving Average */
function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

/** Calculate Exponential Moving Average */
function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prev = data[0];
  result.push(prev);
  for (let i = 1; i < data.length; i++) {
    const val = data[i] * k + prev * (1 - k);
    result.push(val);
    prev = val;
  }
  return result;
}

/** Calculate RSI (14-period) */
function rsi(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/** Calculate MACD */
function macd(data: number[]) {
  const ema12 = ema(data, 12);
  const ema26 = ema(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[signalLine.length - 1],
    histogram: histogram[histogram.length - 1],
    prevHistogram: histogram[histogram.length - 2] || 0,
  };
}

/** Find support and resistance from recent data */
function supportResistance(data: number[]) {
  const recent = data.slice(-30);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const current = data[data.length - 1];
  // Find nearest support (below price) and resistance (above price)
  const sorted = [...recent].sort((a, b) => a - b);
  let support = low;
  let resistance = high;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i] < current) { support = sorted[i]; break; }
  }
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] > current) { resistance = sorted[i]; break; }
  }
  return { support, resistance };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = searchParams.get('pair') || 'EUR/USD';
  const [base, quote] = pair.split('/');

  if (!base || !quote) {
    return NextResponse.json({ error: 'Invalid pair format. Use EUR/USD' }, { status: 400 });
  }

  try {
    // Fetch 90 days of historical data from frankfurter.app (free, no key)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 95);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=${base}&to=${quote}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const json = await res.json();
    const rates: DayRate[] = Object.entries(json.rates)
      .map(([date, ratesObj]) => ({
        date,
        rate: (ratesObj as Record<string, number>)[quote],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (rates.length < 30) {
      return NextResponse.json({ error: 'Insufficient historical data' }, { status: 500 });
    }

    const prices = rates.map(r => r.rate);
    const currentPrice = prices[prices.length - 1];

    // Calculate indicators
    const rsiVal = rsi(prices, 14);
    const sma20Arr = sma(prices, 20);
    const sma50Arr = sma(prices, 50);
    const sma20 = sma20Arr[sma20Arr.length - 1];
    const sma50 = sma50Arr[sma50Arr.length - 1];
    const macdData = macd(prices);
    const sr = supportResistance(prices);

    // Determine trend
    const aboveBoth = currentPrice > sma20 && currentPrice > sma50;
    const belowBoth = currentPrice < sma20 && currentPrice < sma50;
    const macdBullish = macdData.histogram > 0 && macdData.prevHistogram <= 0;
    const macdBearish = macdData.histogram < 0 && macdData.prevHistogram >= 0;

    // Generate signal
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    const reasons: string[] = [];

    // RSI signals
    if (rsiVal < 30) {
      signal = 'BUY';
      confidence += 20;
      reasons.push(`RSI at ${rsiVal.toFixed(1)} — oversold, potential reversal up`);
    } else if (rsiVal > 70) {
      signal = 'SELL';
      confidence += 20;
      reasons.push(`RSI at ${rsiVal.toFixed(1)} — overbought, potential reversal down`);
    }

    // MACD signals
    if (macdBullish) {
      signal = signal === 'SELL' ? 'NEUTRAL' : 'BUY';
      confidence += 15;
      reasons.push('MACD histogram crossed above zero — bullish momentum');
    } else if (macdBearish) {
      signal = signal === 'BUY' ? 'NEUTRAL' : 'SELL';
      confidence += 15;
      reasons.push('MACD histogram crossed below zero — bearish momentum');
    }

    // Trend signals
    if (aboveBoth) {
      confidence += signal === 'BUY' ? 10 : -5;
      reasons.push('Price above both SMA20 and SMA50 — bullish trend');
    } else if (belowBoth) {
      confidence += signal === 'SELL' ? 10 : -5;
      reasons.push('Price below both SMA20 and SMA50 — bearish trend');
    } else {
      reasons.push('Price between SMA20 and SMA50 — mixed/no clear trend');
    }

    // SMA crossover
    if (sma20 > sma50) {
      reasons.push('SMA20 above SMA50 — golden cross (bullish)');
    } else {
      reasons.push('SMA20 below SMA50 — death cross (bearish)');
    }

    // Clamp confidence
    confidence = Math.max(10, Math.min(95, confidence));

    // Build analysis text
    const trendDir = aboveBoth ? 'bullish' : belowBoth ? 'bearish' : 'neutral';
    const analysis = `Current price ${currentPrice.toFixed(5)} for ${pair}. ${trendDir.charAt(0).toUpperCase() + trendDir.slice(1)} bias with RSI at ${rsiVal.toFixed(1)}. ${signal === 'BUY' ? 'Look for long entries on pullbacks to support.' : signal === 'SELL' ? 'Look for short entries on rallies to resistance.' : 'Wait for clearer signals before entering.'} Key levels: support at ${sr.support.toFixed(5)}, resistance at ${sr.resistance.toFixed(5)}.`;

    return NextResponse.json({
      pair,
      signal,
      confidence,
      currentPrice,
      indicators: {
        rsi: Math.round(rsiVal * 10) / 10,
        sma20: Math.round(sma20 * 100000) / 100000,
        sma50: Math.round(sma50 * 100000) / 100000,
        macd: Math.round(macdData.macd * 100000) / 100000,
        macdSignal: Math.round(macdData.signal * 100000) / 100000,
        macdHistogram: Math.round(macdData.histogram * 100000) / 100000,
      },
      levels: {
        support: Math.round(sr.support * 100000) / 100000,
        resistance: Math.round(sr.resistance * 100000) / 100000,
      },
      reasons,
      analysis,
      trend: trendDir,
      dataPoints: rates.length,
      lastUpdate: rates[rates.length - 1].date,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate signal: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
