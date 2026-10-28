import { NextRequest, NextResponse } from 'next/server';

interface DayRate { date: string; rate: number; }

// ─── Moving Averages ───

/** Simple Moving Average — returns array aligned to input */
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

/** Exponential Moving Average */
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

/** Weighted Moving Average */
function wma(data: number[], period: number): number[] {
  const result: number[] = [];
  const weightSum = (period * (period + 1)) / 2;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j] * (period - j);
    }
    result.push(sum / weightSum);
  }
  return result;
}

// ─── Volatility & Bands ───

/** Standard Deviation */
function stdDev(data: number[], period: number): number[] {
  const result: number[] = [];
  const smaArr = sma(data, period);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sumSqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSqDiff += Math.pow(data[j] - smaArr[i], 2);
    }
    result.push(Math.sqrt(sumSqDiff / period));
  }
  return result;
}

/** Bollinger Bands */
function bollingerBands(data: number[], period: number = 20, mult: number = 2) {
  const smaArr = sma(data, period);
  const sd = stdDev(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(smaArr[i]) || isNaN(sd[i])) {
      upper.push(NaN); lower.push(NaN); continue;
    }
    upper.push(smaArr[i] + mult * sd[i]);
    lower.push(smaArr[i] - mult * sd[i]);
  }
  const last = data.length - 1;
  const bandwidth = isNaN(upper[last]) ? 0 : ((upper[last] - lower[last]) / smaArr[last]) * 100;
  const percentB = isNaN(upper[last]) ? 50 : ((data[last] - lower[last]) / (upper[last] - lower[last])) * 100;
  return {
    upper: upper[last] || 0,
    middle: smaArr[last] || 0,
    lower: lower[last] || 0,
    bandwidth: Number(bandwidth.toFixed(4)),
    percentB: Number(percentB.toFixed(2)),
  };
}

/** Average True Range (approximated from close-to-close) */
function atr(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 0;
  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    // Approximate TR as absolute daily change (no OHLC data)
    trueRanges.push(Math.abs(data[i] - data[i - 1]));
  }
  const recentTR = trueRanges.slice(-period);
  const sum = recentTR.reduce((a, b) => a + b, 0);
  return sum / period;
}

// ─── Oscillators ───

/** RSI (14-period) */
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

/** Stochastic Oscillator (%K and %D) */
function stochastic(data: number[], period: number = 14, smoothK: number = 3) {
  if (data.length < period + smoothK) return { k: 50, d: 50 };
  const kValues: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const window = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...window);
    const lowestLow = Math.min(...window);
    const range = highestHigh - lowestLow || 1;
    const k = ((data[i] - lowestLow) / range) * 100;
    kValues.push(k);
  }
  const k = kValues[kValues.length - 1];
  // %D is SMA of %K
  const dArr = kValues.slice(-smoothK);
  const d = dArr.reduce((a, b) => a + b, 0) / smoothK;
  return { k: Number(k.toFixed(2)), d: Number(d.toFixed(2)) };
}

/** Williams %R */
function williamsR(data: number[], period: number = 14): number {
  if (data.length < period) return -50;
  const window = data.slice(-period);
  const highestHigh = Math.max(...window);
  const lowestLow = Math.min(...window);
  const range = highestHigh - lowestLow || 1;
  const current = data[data.length - 1];
  return Number((((highestHigh - current) / range) * -100).toFixed(2));
}

/** Commodity Channel Index (CCI) */
function cci(data: number[], period: number = 20): number {
  if (data.length < period) return 0;
  const smaArr = sma(data, period);
  const last = data.length - 1;
  // Mean deviation
  let sumDev = 0;
  for (let i = last - period + 1; i <= last; i++) {
    sumDev += Math.abs(data[i] - smaArr[last]);
  }
  const meanDev = sumDev / period;
  if (meanDev === 0) return 0;
  const cciVal = (data[last] - smaArr[last]) / (0.015 * meanDev);
  return Number(cciVal.toFixed(2));
}

/** Money Flow Index (approximated using close as typical price) */
function mfi(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  let posFlow = 0, negFlow = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    // Volume proxy = |price change|, flow = price * volume proxy
    const rawFlow = Math.abs(change) * data[i];
    if (change >= 0) posFlow += rawFlow;
    else negFlow += rawFlow;
  }
  if (negFlow === 0) return 100;
  const moneyRatio = posFlow / negFlow;
  return Number((100 - (100 / (1 + moneyRatio))).toFixed(2));
}

// ─── Trend & Momentum ───

/** MACD */
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

/** Average Directional Index (ADX) — approximated from closes */
function adx(data: number[], period: number = 14): number {
  if (data.length < period * 2) return 25;
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const upMove = data[i] - data[i - 1];
    const downMove = data[i - 1] - data[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.abs(data[i] - data[i - 1]));
  }

  // Smooth using Wilder's method (approximated with SMA)
  const smoothPlus = plusDM.slice(-period).reduce((a, b) => a + b, 0) / period;
  const smoothMinus = minusDM.slice(-period).reduce((a, b) => a + b, 0) / period;
  const smoothTR = tr.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (smoothTR === 0) return 25;
  const plusDI = (smoothPlus / smoothTR) * 100;
  const minusDI = (smoothMinus / smoothTR) * 100;
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI || 1) * 100;

  // ADX is SMA of DX — approximate with last DX
  return Number(dx.toFixed(2));
}

/** Rate of Change (ROC) — momentum */
function roc(data: number[], period: number = 12): number {
  if (data.length < period + 1) return 0;
  const current = data[data.length - 1];
  const past = data[data.length - 1 - period];
  if (past === 0) return 0;
  return Number((((current - past) / past) * 100).toFixed(2));
}

/** On-Balance Volume (OBV) — volume proxy */
function obv(data: number[]): { value: number; trend: 'up' | 'down' | 'flat' } {
  let obvValue = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] > data[i - 1]) obvValue += Math.abs(data[i] - data[i - 1]) * 10000;
    else if (data[i] < data[i - 1]) obvValue -= Math.abs(data[i] - data[i - 1]) * 10000;
  }
  // Check recent OBV trend (last 10 days)
  let recentOBV = 0;
  for (let i = data.length - 10; i < data.length; i++) {
    if (i < 1) continue;
    if (data[i] > data[i - 1]) recentOBV += Math.abs(data[i] - data[i - 1]) * 10000;
    else if (data[i] < data[i - 1]) recentOBV -= Math.abs(data[i] - data[i - 1]) * 10000;
  }
  const trend = recentOBV > 0 ? 'up' : recentOBV < 0 ? 'down' : 'flat';
  return { value: Number(obvValue.toFixed(0)), trend };
}

// ─── Support / Resistance / Pivot Points ───

/** Support and Resistance from recent data */
function supportResistance(data: number[]) {
  const recent = data.slice(-30);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const current = data[data.length - 1];
  const sorted = [...recent].sort((a, b) => a - b);
  let support = low;
  let resistance = high;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i] < current) { support = sorted[i]; break; }
  }
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] > current) { resistance = sorted[i]; break; }
  }
  return { support, resistance, periodHigh: high, periodLow: low };
}

/** Classic Pivot Points */
function pivotPoints(data: number[]) {
  const recent = data.slice(-1);
  // Use recent high/low as proxy for H/L/C (we only have closes)
  const last20 = data.slice(-20);
  const high = Math.max(...last20);
  const low = Math.min(...last20);
  const close = recent[0];
  const pivot = (high + low + close) / 3;
  return {
    pivot,
    r1: 2 * pivot - low,
    r2: pivot + (high - low),
    r3: high + 2 * (high - low) * 0.5,
    s1: 2 * pivot - high,
    s2: pivot - (high - low),
    s3: low - 2 * (high - low) * 0.5,
  };
}

/** Fibonacci Retracement Levels */
function fibonacciLevels(data: number[]) {
  const recent = data.slice(-60);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const diff = high - low;
  return {
    swingHigh: high,
    swingLow: low,
    level0: high,
    level236: high - diff * 0.236,
    level382: high - diff * 0.382,
    level500: high - diff * 0.5,
    level618: high - diff * 0.618,
    level786: high - diff * 0.786,
    level100: low,
  };
}

// ─── Volume Proxy ───

/** Volume analysis — since we don't have real volume, we use price-action-based proxies */
function volumeAnalysis(data: number[]) {
  const recent = data.slice(-20);
  const changes = recent.map((v, i) => i === 0 ? 0 : Math.abs(v - recent[i - 1]));
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const lastChange = changes[changes.length - 1];
  const volumeRatio = avgChange > 0 ? lastChange / avgChange : 1;

  // Up days vs down days in last 20
  let upDays = 0, downDays = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) upDays++;
    else if (recent[i] < recent[i - 1]) downDays++;
  }

  // Volume proxy (scaled to a 0-100 "activity index")
  const activityIndex = Math.min(100, volumeRatio * 50);

  return {
    volumeRatio: Number(volumeRatio.toFixed(2)),
    activityIndex: Number(activityIndex.toFixed(0)),
    upDays,
    downDays,
    avgDailyRange: Number(avgChange.toFixed(5)),
    lastDayRange: Number(lastChange.toFixed(5)),
    interpretation: volumeRatio > 1.5 ? 'high' : volumeRatio > 0.8 ? 'normal' : 'low',
  };
}

// ─── Market Sentiment Score ───

function sentimentScore(opts: {
  rsi: number; macdHist: number; aboveSMA20: boolean; aboveSMA50: boolean;
  stochasticK: number; williamsR: number; cci: number; mfi: number;
  roc: number; adx: number; obvTrend: string; bbPercentB: number;
}): { score: number; label: string; breakdown: { factor: string; value: string; bias: 'bullish' | 'bearish' | 'neutral' }[] } {
  let score = 50;
  const breakdown: { factor: string; value: string; bias: 'bullish' | 'bearish' | 'neutral' }[] = [];

  // RSI
  if (opts.rsi < 30) { score += 10; breakdown.push({ factor: 'RSI', value: opts.rsi.toFixed(1), bias: 'bullish' }); }
  else if (opts.rsi > 70) { score -= 10; breakdown.push({ factor: 'RSI', value: opts.rsi.toFixed(1), bias: 'bearish' }); }
  else breakdown.push({ factor: 'RSI', value: opts.rsi.toFixed(1), bias: 'neutral' });

  // MACD
  if (opts.macdHist > 0) { score += 8; breakdown.push({ factor: 'MACD', value: 'Bullish', bias: 'bullish' }); }
  else if (opts.macdHist < 0) { score -= 8; breakdown.push({ factor: 'MACD', value: 'Bearish', bias: 'bearish' }); }
  else breakdown.push({ factor: 'MACD', value: 'Neutral', bias: 'neutral' });

  // SMA trend
  if (opts.aboveSMA20 && opts.aboveSMA50) { score += 10; breakdown.push({ factor: 'SMA Trend', value: 'Above both', bias: 'bullish' }); }
  else if (!opts.aboveSMA20 && !opts.aboveSMA50) { score -= 10; breakdown.push({ factor: 'SMA Trend', value: 'Below both', bias: 'bearish' }); }
  else breakdown.push({ factor: 'SMA Trend', value: 'Mixed', bias: 'neutral' });

  // Stochastic
  if (opts.stochasticK < 20) { score += 6; breakdown.push({ factor: 'Stochastic', value: 'Oversold', bias: 'bullish' }); }
  else if (opts.stochasticK > 80) { score -= 6; breakdown.push({ factor: 'Stochastic', value: 'Overbought', bias: 'bearish' }); }
  else breakdown.push({ factor: 'Stochastic', value: 'Neutral', bias: 'neutral' });

  // Williams %R
  if (opts.williamsR < -80) { score += 5; breakdown.push({ factor: 'Williams %R', value: 'Oversold', bias: 'bullish' }); }
  else if (opts.williamsR > -20) { score -= 5; breakdown.push({ factor: 'Williams %R', value: 'Overbought', bias: 'bearish' }); }
  else breakdown.push({ factor: 'Williams %R', value: 'Neutral', bias: 'neutral' });

  // CCI
  if (opts.cci < -100) { score += 5; breakdown.push({ factor: 'CCI', value: 'Oversold', bias: 'bullish' }); }
  else if (opts.cci > 100) { score -= 5; breakdown.push({ factor: 'CCI', value: 'Overbought', bias: 'bearish' }); }
  else breakdown.push({ factor: 'CCI', value: 'Neutral', bias: 'neutral' });

  // MFI
  if (opts.mfi < 20) { score += 5; breakdown.push({ factor: 'MFI', value: 'Oversold', bias: 'bullish' }); }
  else if (opts.mfi > 80) { score -= 5; breakdown.push({ factor: 'MFI', value: 'Overbought', bias: 'bearish' }); }
  else breakdown.push({ factor: 'MFI', value: opts.mfi.toFixed(0), bias: 'neutral' });

  // ROC
  if (opts.roc > 2) { score += 5; breakdown.push({ factor: 'Momentum (ROC)', value: `+${opts.roc}%`, bias: 'bullish' }); }
  else if (opts.roc < -2) { score -= 5; breakdown.push({ factor: 'Momentum (ROC)', value: `${opts.roc}%`, bias: 'bearish' }); }
  else breakdown.push({ factor: 'Momentum (ROC)', value: `${opts.roc}%`, bias: 'neutral' });

  // OBV trend
  if (opts.obvTrend === 'up') { score += 4; breakdown.push({ factor: 'OBV', value: 'Rising', bias: 'bullish' }); }
  else if (opts.obvTrend === 'down') { score -= 4; breakdown.push({ factor: 'OBV', value: 'Falling', bias: 'bearish' }); }
  else breakdown.push({ factor: 'OBV', value: 'Flat', bias: 'neutral' });

  // Bollinger %B
  if (opts.bbPercentB < 0) { score += 4; breakdown.push({ factor: 'Bollinger %B', value: 'Below lower band', bias: 'bullish' }); }
  else if (opts.bbPercentB > 100) { score -= 4; breakdown.push({ factor: 'Bollinger %B', value: 'Above upper band', bias: 'bearish' }); }
  else breakdown.push({ factor: 'Bollinger %B', value: opts.bbPercentB.toFixed(0) + '%', bias: 'neutral' });

  score = Math.max(0, Math.min(100, score));
  const label = score >= 70 ? 'Strong Bullish' : score >= 55 ? 'Bullish' : score >= 45 ? 'Neutral' : score >= 30 ? 'Bearish' : 'Strong Bearish';
  return { score, label, breakdown };
}

// ─── Main Handler ───

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = searchParams.get('pair') || 'EUR/USD';
  const [base, quote] = pair.split('/');

  if (!base || !quote) {
    return NextResponse.json({ error: 'Invalid pair format. Use EUR/USD' }, { status: 400 });
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 120);
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

    // ─── Calculate All Indicators ───
    const rsiVal = rsi(prices, 14);
    const sma20Arr = sma(prices, 20);
    const sma50Arr = sma(prices, 50);
    const sma20 = sma20Arr[sma20Arr.length - 1];
    const sma50 = sma50Arr[sma50Arr.length - 1];
    const ema20 = ema(prices, 20)[prices.length - 1];
    const ema50 = ema(prices, 50)[prices.length - 1];
    const wma20 = wma(prices, 20)[prices.length - 1];
    const macdData = macd(prices);
    const sr = supportResistance(prices);
    const bb = bollingerBands(prices, 20, 2);
    const stoch = stochastic(prices, 14, 3);
    const wr = williamsR(prices, 14);
    const cciVal = cci(prices, 20);
    const mfiVal = mfi(prices, 14);
    const atrVal = atr(prices, 14);
    const adxVal = adx(prices, 14);
    const rocVal = roc(prices, 12);
    const obvData = obv(prices);
    const pivots = pivotPoints(prices);
    const fib = fibonacciLevels(prices);
    const volAnalysis = volumeAnalysis(prices);

    // ─── Determine Signal ───
    const aboveBoth = currentPrice > sma20 && currentPrice > sma50;
    const belowBoth = currentPrice < sma20 && currentPrice < sma50;
    const macdBullish = macdData.histogram > 0 && macdData.prevHistogram <= 0;
    const macdBearish = macdData.histogram < 0 && macdData.prevHistogram >= 0;

    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    const reasons: string[] = [];

    if (rsiVal < 30) {
      signal = 'BUY'; confidence += 20;
      reasons.push(`RSI at ${rsiVal.toFixed(1)} — oversold, potential reversal up`);
    } else if (rsiVal > 70) {
      signal = 'SELL'; confidence += 20;
      reasons.push(`RSI at ${rsiVal.toFixed(1)} — overbought, potential reversal down`);
    }

    if (macdBullish) {
      signal = signal === 'SELL' ? 'NEUTRAL' : 'BUY'; confidence += 15;
      reasons.push('MACD histogram crossed above zero — bullish momentum');
    } else if (macdBearish) {
      signal = signal === 'BUY' ? 'NEUTRAL' : 'SELL'; confidence += 15;
      reasons.push('MACD histogram crossed below zero — bearish momentum');
    }

    if (aboveBoth) {
      confidence += signal === 'BUY' ? 10 : -5;
      reasons.push('Price above both SMA20 and SMA50 — bullish trend');
    } else if (belowBoth) {
      confidence += signal === 'SELL' ? 10 : -5;
      reasons.push('Price below both SMA20 and SMA50 — bearish trend');
    } else {
      reasons.push('Price between SMA20 and SMA50 — mixed/no clear trend');
    }

    if (sma20 > sma50) {
      reasons.push('SMA20 above SMA50 — golden cross (bullish)');
    } else {
      reasons.push('SMA20 below SMA50 — death cross (bearish)');
    }

    // Stochastic signals
    if (stoch.k < 20 && stoch.k > stoch.d) {
      reasons.push(`Stochastic %K crossed above %D in oversold zone — bullish`);
    } else if (stoch.k > 80 && stoch.k < stoch.d) {
      reasons.push(`Stochastic %K crossed below %D in overbought zone — bearish`);
    }

    // Bollinger Band signals
    if (bb.percentB < 0) {
      reasons.push('Price below lower Bollinger Band — potential oversold bounce');
    } else if (bb.percentB > 100) {
      reasons.push('Price above upper Bollinger Band — potential overbought reversal');
    }

    // Volume signals
    if (volAnalysis.volumeRatio > 1.5) {
      reasons.push(`Volume activity ${volAnalysis.volumeRatio}x above average — strong conviction`);
    }

    confidence = Math.max(10, Math.min(95, confidence));

    // ─── Market Sentiment ───
    const sentiment = sentimentScore({
      rsi: rsiVal, macdHist: macdData.histogram, aboveSMA20: currentPrice > sma20,
      aboveSMA50: currentPrice > sma50, stochasticK: stoch.k, williamsR: wr,
      cci: cciVal, mfi: mfiVal, roc: rocVal, adx: adxVal, obvTrend: obvData.trend,
      bbPercentB: bb.percentB,
    });

    // ─── Build Analysis ───
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
        ema20: Math.round(ema20 * 100000) / 100000,
        ema50: Math.round(ema50 * 100000) / 100000,
        wma20: Math.round(wma20 * 100000) / 100000,
        macd: Math.round(macdData.macd * 100000) / 100000,
        macdSignal: Math.round(macdData.signal * 100000) / 100000,
        macdHistogram: Math.round(macdData.histogram * 100000) / 100000,
        stochasticK: stoch.k,
        stochasticD: stoch.d,
        williamsR: wr,
        cci: cciVal,
        mfi: mfiVal,
        atr: Math.round(atrVal * 100000) / 100000,
        adx: adxVal,
        roc: rocVal,
      },
      bollingerBands: {
        upper: Math.round(bb.upper * 100000) / 100000,
        middle: Math.round(bb.middle * 100000) / 100000,
        lower: Math.round(bb.lower * 100000) / 100000,
        bandwidth: bb.bandwidth,
        percentB: bb.percentB,
      },
      volume: volAnalysis,
      obv: obvData,
      levels: {
        support: Math.round(sr.support * 100000) / 100000,
        resistance: Math.round(sr.resistance * 100000) / 100000,
        periodHigh: Math.round(sr.periodHigh * 100000) / 100000,
        periodLow: Math.round(sr.periodLow * 100000) / 100000,
      },
      pivotPoints: {
        pivot: Math.round(pivots.pivot * 100000) / 100000,
        r1: Math.round(pivots.r1 * 100000) / 100000,
        r2: Math.round(pivots.r2 * 100000) / 100000,
        r3: Math.round(pivots.r3 * 100000) / 100000,
        s1: Math.round(pivots.s1 * 100000) / 100000,
        s2: Math.round(pivots.s2 * 100000) / 100000,
        s3: Math.round(pivots.s3 * 100000) / 100000,
      },
      fibonacci: {
        swingHigh: Math.round(fib.swingHigh * 100000) / 100000,
        swingLow: Math.round(fib.swingLow * 100000) / 100000,
        level236: Math.round(fib.level236 * 100000) / 100000,
        level382: Math.round(fib.level382 * 100000) / 100000,
        level500: Math.round(fib.level500 * 100000) / 100000,
        level618: Math.round(fib.level618 * 100000) / 100000,
        level786: Math.round(fib.level786 * 100000) / 100000,
      },
      sentiment,
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
