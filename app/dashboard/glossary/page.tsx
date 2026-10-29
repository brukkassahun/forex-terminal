"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp, Hash } from "lucide-react";

interface GlossaryTerm {
  term: string;
  category: "Trend & Momentum" | "Oscillators" | "Moving Averages" | "Volume & Activity" | "Price Levels" | "Trading Basics" | "Risk Management" | "Forex Specific";
  shortDef: string;
  fullDef: string;
  example?: string;
  bullBear?: "bullish" | "bearish" | "neutral";
}

const CATEGORIES = [
  "All",
  "Trading Basics",
  "Trend & Momentum",
  "Oscillators",
  "Moving Averages",
  "Volume & Activity",
  "Price Levels",
  "Risk Management",
  "Forex Specific",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Trading Basics": "#4FC3F7",
  "Trend & Momentum": "#26A69A",
  "Oscillators": "#FFB74D",
  "Moving Averages": "#A78BFA",
  "Volume & Activity": "#26A69A",
  "Price Levels": "#EF5350",
  "Risk Management": "#FFB74D",
  "Forex Specific": "#4FC3F7",
};

const TERMS: GlossaryTerm[] = [
  // ─── Trading Basics ───
  {
    term: "Bullish",
    category: "Trading Basics",
    shortDef: "Expectation that prices will rise.",
    fullDef: "A bullish market or sentiment means traders expect prices to go up. A bullish trader buys (goes long) expecting to sell at a higher price later. The term comes from how a bull attacks — thrusting its horns upward.",
    example: "If RSI is oversold and MACD crosses up, the signal is bullish — price may rise.",
    bullBear: "bullish",
  },
  {
    term: "Bearish",
    category: "Trading Basics",
    shortDef: "Expectation that prices will fall.",
    fullDef: "A bearish market or sentiment means traders expect prices to go down. A bearish trader sells (goes short) expecting to buy back at a lower price. The term comes from how a bear attacks — swiping its paws downward.",
    example: "If price is below both SMA20 and SMA50, the trend is bearish — price may fall further.",
    bullBear: "bearish",
  },
  {
    term: "Long (Buy)",
    category: "Trading Basics",
    shortDef: "Buying a currency pair to profit from a price increase.",
    fullDef: "Going long means buying a currency pair with the expectation that its value will rise. You buy at a lower price and sell at a higher price to make a profit. In forex, going long on EUR/USD means buying EUR and selling USD.",
    example: "BUY signal on EUR/USD at 1.0850, target 1.0900 — going long expecting price to rise.",
    bullBear: "bullish",
  },
  {
    term: "Short (Sell)",
    category: "Trading Basics",
    shortDef: "Selling a currency pair to profit from a price decrease.",
    fullDef: "Going short means selling a currency pair with the expectation that its value will fall. You sell at a higher price and buy back at a lower price to make a profit. In forex, going short on EUR/USD means selling EUR and buying USD.",
    example: "SELL signal on GBP/USD at 1.2720, target 1.2650 — going short expecting price to drop.",
    bullBear: "bearish",
  },
  {
    term: "Pip",
    category: "Trading Basics",
    shortDef: "Smallest price move in a forex pair (usually 0.0001).",
    fullDef: "A pip (Percentage in Point) is the smallest standard price increment in forex. For most currency pairs, it's the fourth decimal place (0.0001). For JPY pairs, it's the second decimal place (0.01). Pips are used to measure price movements and calculate profits/losses.",
    example: "EUR/USD moves from 1.0850 to 1.0855 — that's a 5-pip increase.",
  },
  {
    term: "Spread",
    category: "Trading Basics",
    shortDef: "Difference between bid (sell) and ask (buy) price.",
    fullDef: "The spread is the gap between the price at which you can sell (bid) and the price at which you can buy (ask) a currency pair. It's essentially the broker's fee for executing your trade. Tighter spreads mean lower trading costs.",
    example: "EUR/USD bid: 1.0850, ask: 1.0852 — spread is 2 pips.",
  },
  {
    term: "Volatility",
    category: "Trading Basics",
    shortDef: "How much and how fast prices move over a period.",
    fullDef: "Volatility measures the degree of price variation over time. High volatility means prices swing widely (bigger profit potential but higher risk). Low volatility means prices move in a narrow range. ATR (Average True Range) is a common volatility measure.",
    example: "ATR of 0.0080 on EUR/USD means the pair typically moves 80 pips per day — moderate volatility.",
  },
  {
    term: "Momentum",
    category: "Trading Basics",
    shortDef: "The speed and strength of price movement in a direction.",
    fullDef: "Momentum describes how fast prices are moving and in which direction. Strong momentum means price is moving quickly in one direction. Indicators like ROC (Rate of Change) and MACD histogram measure momentum. Rising momentum confirms a trend; falling momentum may signal a reversal.",
    example: "ROC of +3.5% means the pair gained 3.5% over the last 12 days — strong bullish momentum.",
    bullBear: "bullish",
  },
  {
    term: "Trend",
    category: "Trading Basics",
    shortDef: "The general direction prices are moving over time.",
    fullDef: "A trend is the overall direction of price movement. An uptrend has higher highs and higher lows. A downtrend has lower highs and lower lows. A sideways trend (range) has relatively flat highs and lows. Trading with the trend ('the trend is your friend') is a core principle of profitable trading.",
    example: "Price above both SMA20 and SMA50 with SMA20 above SMA50 — confirmed uptrend.",
    bullBear: "bullish",
  },
  {
    term: "Breakout",
    category: "Trading Basics",
    shortDef: "Price moves beyond a support or resistance level with volume.",
    fullDef: "A breakout occurs when price moves above resistance (bullish breakout) or below support (bearish breakout) with increased volume. Breakouts signal a potential new trend direction. False breakouts (fakeouts) occur when price briefly breaks the level then reverses.",
    example: "EUR/USD breaks above resistance at 1.0900 with 2x volume — bullish breakout, target 1.0950.",
    bullBear: "bullish",
  },
  {
    term: "Candlestick",
    category: "Trading Basics",
    shortDef: "A chart showing open, high, low, and close prices for a period.",
    fullDef: "A candlestick is a visual representation of price movement over a time period. The body shows the open-to-close range (green/red for up/down). The wicks (shadows) show the high and low. Patterns like doji, hammer, and engulfing help predict price direction.",
    example: "A green candlestick with long body and short wicks — strong bullish pressure during that period.",
  },

  // ─── Oscillators ───
  {
    term: "RSI (Relative Strength Index)",
    category: "Oscillators",
    shortDef: "Momentum oscillator measuring 0-100, overbought above 70, oversold below 30.",
    fullDef: "RSI compares the magnitude of recent gains to recent losses to measure the speed and change of price movements. Values range from 0 to 100. RSI above 70 suggests the pair is overbought (potential sell signal). RSI below 30 suggests oversold (potential buy signal). RSI between 30-70 is neutral.",
    example: "RSI at 28 — oversold. Price may bounce up. Consider a BUY entry.",
    bullBear: "bullish",
  },
  {
    term: "Stochastic Oscillator (%K / %D)",
    category: "Oscillators",
    shortDef: "Compares closing price to its price range over a period (0-100).",
    fullDef: "The Stochastic Oscillator measures where the current close is relative to the high-low range over a set period (usually 14). %K is the main line, %D is the 3-period SMA of %K (signal line). Above 80 = overbought, below 20 = oversold. A buy signal occurs when %K crosses above %D in the oversold zone.",
    example: "%K at 18 crossing above %D at 15 — bullish signal in oversold zone.",
    bullBear: "bullish",
  },
  {
    term: "Williams %R",
    category: "Oscillators",
    shortDef: "Momentum indicator measuring overbought/oversold on a -100 to 0 scale.",
    fullDef: "Williams %R compares the current close to the highest high over a lookback period (usually 14). Values range from -100 to 0. Readings above -20 indicate overbought (potential sell). Readings below -80 indicate oversold (potential buy). It's similar to the Stochastic but inverted.",
    example: "Williams %R at -85 — oversold. Price may reverse upward.",
    bullBear: "bullish",
  },
  {
    term: "CCI (Commodity Channel Index)",
    category: "Oscillators",
    shortDef: "Measures deviation from average price; above +100 overbought, below -100 oversold.",
    fullDef: "CCI calculates how far the current price is from its average, normalized by mean deviation. Values above +100 indicate overbought conditions (price is unusually high). Values below -100 indicate oversold conditions (price is unusually low). CCI can also signal trend changes when it crosses zero.",
    example: "CCI at -145 — deeply oversold. Potential reversal upward expected.",
    bullBear: "bullish",
  },
  {
    term: "MFI (Money Flow Index)",
    category: "Oscillators",
    shortDef: "Volume-weighted RSI; above 80 overbought, below 20 oversold.",
    fullDef: "MFI is like RSI but incorporates volume (or a volume proxy). It measures the flow of money into and out of a currency pair. MFI above 80 suggests overbought with strong money inflow (potential top). MFI below 20 suggests oversold with money outflow (potential bottom). Divergences between MFI and price can signal reversals.",
    example: "MFI at 15 — oversold with strong selling pressure exhaustion. Buy signal.",
    bullBear: "bullish",
  },
  {
    term: "MACD (Moving Average Convergence Divergence)",
    category: "Oscillators",
    shortDef: "Shows relationship between two EMAs; histogram above zero = bullish.",
    fullDef: "MACD is calculated by subtracting the 26-period EMA from the 12-period EMA. The signal line is the 9-period EMA of the MACD. The histogram shows the difference between MACD and signal. When MACD crosses above signal (histogram turns positive), it's a buy signal. When it crosses below, it's a sell signal.",
    example: "MACD histogram crosses from negative to positive — bullish momentum shift, BUY signal.",
    bullBear: "bullish",
  },
  {
    term: "ADX (Average Directional Index)",
    category: "Oscillators",
    shortDef: "Measures trend strength (not direction); above 25 = trending.",
    fullDef: "ADX measures the strength of a trend regardless of direction. ADX below 20-25 indicates a weak or ranging market (no clear trend). ADX above 25 indicates a trending market. ADX above 50 indicates a very strong trend. Use ADX with +DI and -DI to determine trend direction. High ADX + price above SMA = strong uptrend.",
    example: "ADX at 42 with price above SMA20 — strong uptrend confirmed, safe to go long.",
  },
  {
    term: "ROC (Rate of Change)",
    category: "Oscillators",
    shortDef: "Percentage price change over a period; positive = rising momentum.",
    fullDef: "ROC measures the percentage change in price over a specified period (usually 12). Positive ROC means price has increased over the period (bullish momentum). Negative ROC means price has decreased (bearish momentum). ROC crossing zero can signal a trend change. Extreme ROC values may indicate overbought/oversold.",
    example: "ROC at +4.2% — strong positive momentum, price has risen 4.2% over 12 days.",
    bullBear: "bullish",
  },
  {
    term: "Overbought",
    category: "Oscillators",
    shortDef: "Price has risen too fast; potential reversal down.",
    fullDef: "Overbought describes a condition where price has risen too quickly and may be due for a pullback or reversal. Oscillators like RSI above 70, Stochastic above 80, or Williams %R above -20 signal overbought conditions. It doesn't mean you should immediately sell — it means be cautious about buying and watch for reversal signals.",
    example: "RSI at 78 — overbought. Consider taking profits or waiting for a pullback before buying.",
    bullBear: "bearish",
  },
  {
    term: "Oversold",
    category: "Oscillators",
    shortDef: "Price has fallen too fast; potential reversal up.",
    fullDef: "Oversold describes a condition where price has dropped too quickly and may be due for a bounce. Oscillators like RSI below 30, Stochastic below 20, or Williams %R below -80 signal oversold conditions. It doesn't mean you should immediately buy — it means watch for reversal confirmation (like MACD cross or candlestick pattern).",
    example: "RSI at 24 with Stochastic crossing up — oversold with reversal signal, potential BUY.",
    bullBear: "bullish",
  },

  // ─── Moving Averages ───
  {
    term: "SMA (Simple Moving Average)",
    category: "Moving Averages",
    shortDef: "Average of closing prices over a set number of periods.",
    fullDef: "SMA calculates the arithmetic mean of prices over a specified period (e.g., SMA20 = average of last 20 closes). It smooths out price noise to show the trend direction. Price above SMA = uptrend, below = downtrend. Common periods: 20 (short-term), 50 (medium), 200 (long-term). SMA gives equal weight to all periods.",
    example: "EUR/USD at 1.0855, SMA20 at 1.0830 — price above SMA20, short-term uptrend.",
    bullBear: "bullish",
  },
  {
    term: "EMA (Exponential Moving Average)",
    category: "Moving Averages",
    shortDef: "Moving average that weighs recent prices more heavily.",
    fullDef: "EMA is similar to SMA but gives more weight to recent prices, making it more responsive to current price action. Traders prefer EMA when they want faster signals. EMA20 reacts quicker than SMA20. When EMA20 crosses above EMA50, it's a bullish signal; when it crosses below, it's bearish.",
    example: "EMA20 at 1.0848, EMA50 at 1.0820 — EMA20 above EMA50, bullish alignment.",
    bullBear: "bullish",
  },
  {
    term: "WMA (Weighted Moving Average)",
    category: "Moving Averages",
    shortDef: "Moving average with linearly decreasing weights for older prices.",
    fullDef: "WMA assigns higher weights to more recent prices and lower weights to older prices. The weight decreases linearly (not exponentially like EMA). WMA20 gives the most recent price 20x weight, the second most recent 19x, and so on. WMA reacts faster than SMA but slower than EMA.",
    example: "WMA20 at 1.0845, SMA20 at 1.0830 — WMA is higher because it weighs recent upward moves more.",
    bullBear: "bullish",
  },
  {
    term: "Golden Cross",
    category: "Moving Averages",
    shortDef: "SMA20 crosses above SMA50 — bullish trend signal.",
    fullDef: "A Golden Cross occurs when a shorter-term moving average (typically SMA20) crosses above a longer-term moving average (SMA50). This signals that short-term momentum is turning bullish relative to the longer-term trend. It's considered a strong buy signal, especially when accompanied by high volume.",
    example: "SMA20 at 1.0852 crosses above SMA50 at 1.0840 — Golden Cross, bullish trend confirmed.",
    bullBear: "bullish",
  },
  {
    term: "Death Cross",
    category: "Moving Averages",
    shortDef: "SMA20 crosses below SMA50 — bearish trend signal.",
    fullDef: "A Death Cross occurs when a shorter-term moving average (SMA20) crosses below a longer-term moving average (SMA50). This signals that short-term momentum is turning bearish. It's considered a sell signal, especially when confirmed by other indicators like declining volume or negative MACD.",
    example: "SMA20 at 1.0838 crosses below SMA50 at 1.0845 — Death Cross, bearish trend ahead.",
    bullBear: "bearish",
  },

  // ─── Volume & Activity ───
  {
    term: "Volume",
    category: "Volume & Activity",
    shortDef: "Number of units traded in a period; confirms price moves.",
    fullDef: "Volume represents the total amount of trading activity in a given period. High volume confirms a price move (strong conviction). Low volume suggests weak conviction (price may reverse). Since forex has no centralized exchange, this terminal uses a volume proxy based on price-action (daily range relative to average).",
    example: "Volume ratio 1.8x — current activity is 80% above 20-day average. Strong conviction behind the move.",
    bullBear: "bullish",
  },
  {
    term: "OBV (On-Balance Volume)",
    category: "Volume & Activity",
    shortDef: "Cumulative volume that rises on up days, falls on down days.",
    fullDef: "OBV adds the day's volume when price closes up and subtracts it when price closes down. Rising OBV indicates accumulation (buyers in control). Falling OBV indicates distribution (sellers in control). OBV diverging from price (e.g., price flat but OBV rising) can signal an upcoming breakout.",
    example: "OBV trend rising while price is flat — accumulation phase, potential bullish breakout soon.",
    bullBear: "bullish",
  },
  {
    term: "ATR (Average True Range)",
    category: "Volume & Activity",
    shortDef: "Average price range over 14 periods; measures volatility.",
    fullDef: "ATR calculates the average of true ranges over a period (usually 14). True range is the greatest of: current high-low, current high-previous close, or current low-previous close. High ATR = high volatility (wider stops needed). Low ATR = low volatility (tighter stops). ATR is commonly used to set stop-loss distances.",
    example: "ATR 0.0072 on EUR/USD — average daily range of 72 pips. Set stop loss 72+ pips away.",
  },
  {
    term: "Volume Ratio",
    category: "Volume & Activity",
    shortDef: "Current day's range vs 20-day average range.",
    fullDef: "Volume Ratio compares the latest day's price movement to the 20-day average. A ratio above 1.5x means today's activity is significantly above normal — strong conviction behind the move. Below 0.5x means below-normal activity — weak or consolidating market. This terminal uses price-based volume proxy since forex lacks centralized volume data.",
    example: "Volume ratio 2.1x — today's move is more than double the average. Strong institutional activity.",
    bullBear: "bullish",
  },
  {
    term: "Activity Index",
    category: "Volume & Activity",
    shortDef: "0-100 score of current market activity level.",
    fullDef: "Activity Index is a normalized score (0-100) that measures how active the market is based on recent price movements relative to historical averages. An index above 60 indicates high activity (good for trading). 30-60 is normal. Below 30 is quiet (range-bound, fewer opportunities). Use this to gauge if the market is worth trading.",
    example: "Activity Index at 72 — high activity, good conditions for trend-following strategies.",
  },

  // ─── Price Levels ───
  {
    term: "Support",
    category: "Price Levels",
    shortDef: "Price level where buying tends to stop declines.",
    fullDef: "Support is a price level where a currency pair tends to find buying pressure strong enough to stop further declines. Think of it as a 'floor' that price bounces off. When price approaches support, buyers step in. If price breaks below support, it often becomes new resistance (role reversal). Support is identified from recent lows.",
    example: "EUR/USD support at 1.0800 — price has bounced here 3 times. Strong support level.",
    bullBear: "bullish",
  },
  {
    term: "Resistance",
    category: "Price Levels",
    shortDef: "Price level where selling tends to stop advances.",
    fullDef: "Resistance is a price level where a currency pair tends to find selling pressure strong enough to stop further advances. Think of it as a 'ceiling' that price struggles to break through. When price approaches resistance, sellers step in. If price breaks above resistance, it often becomes new support (role reversal).",
    example: "EUR/USD resistance at 1.0900 — price has been rejected here twice. Sell near resistance.",
    bullBear: "bearish",
  },
  {
    term: "Pivot Points",
    category: "Price Levels",
    shortDef: "Calculated support/resistance levels based on previous high, low, close.",
    fullDef: "Pivot Points are calculated levels used to identify potential support and resistance. The main pivot (P) is the average of previous high, low, and close. Above P are resistance levels (R1, R2, R3). Below P are support levels (S1, S2, S3). Price above pivot suggests bullish bias; below pivot suggests bearish. Day traders use pivots for intraday entries and exits.",
    example: "Pivot at 1.0850, R1 at 1.0880, S1 at 1.0820. Price at 1.0865 — above pivot, bullish bias.",
    bullBear: "bullish",
  },
  {
    term: "Fibonacci Retracement",
    category: "Price Levels",
    shortDef: "Support/resistance levels at 23.6%, 38.2%, 50%, 61.8%, 78.6% of a swing.",
    fullDef: "Fibonacci retracement levels are horizontal lines based on the Fibonacci sequence. After a significant price move, price often retraces (pulls back) to one of these levels before continuing. The 61.8% level (Golden Ratio) is the most watched — it's where price often reverses. Traders enter positions at Fib levels in the direction of the main trend.",
    example: "EUR/USD swung from 1.0700 to 1.0900. 61.8% retracement is at 1.0776 — potential buy zone in uptrend.",
    bullBear: "bullish",
  },
  {
    term: "Bollinger Bands",
    category: "Price Levels",
    shortDef: "SMA with upper/lower bands based on standard deviation.",
    fullDef: "Bollinger Bands consist of a middle band (SMA20) and two outer bands set 2 standard deviations above and below. When bands narrow (low bandwidth = squeeze), a breakout is imminent. When bands widen, volatility is increasing. Price touching the upper band may be overbought; touching the lower band may be oversold. %B shows where price is within the bands (0-100%).",
    example: "Price below lower Bollinger Band, %B at -5% — oversold, potential bounce to middle band.",
    bullBear: "bullish",
  },
  {
    term: "Retracement (Pullback)",
    category: "Price Levels",
    shortDef: "Temporary price reversal against the main trend.",
    fullDef: "A retracement (or pullback) is a temporary price movement against the prevailing trend. In an uptrend, a retracement is a brief decline before price continues up. Retracements are normal and healthy — they allow traders to enter at better prices. Fibonacci levels help identify where retracements may end. A retracement that exceeds 100% becomes a reversal.",
    example: "EUR/USD in uptrend, pulls back from 1.0900 to 1.0850 (50% Fib) — retracement, then continues to 1.0950.",
    bullBear: "neutral",
  },

  // ─── Risk Management ───
  {
    term: "Stop Loss",
    category: "Risk Management",
    shortDef: "Order to close a trade at a set loss to limit downside.",
    fullDef: "A stop loss is a pre-set order that automatically closes your trade if price moves against you by a specified amount. It limits your maximum loss per trade. Common practice: set stop loss at 1-2% of account balance, or at a technical level (below support for longs, above resistance for shorts). Never trade without a stop loss.",
    example: "Buy EUR/USD at 1.0850, stop loss at 1.0820 — maximum loss is 30 pips if price falls.",
  },
  {
    term: "Take Profit",
    category: "Risk Management",
    shortDef: "Order to close a trade at a set profit to lock in gains.",
    fullDef: "A take profit order automatically closes your trade when price reaches your profit target. It ensures you don't give back gains by holding too long. A common risk-reward ratio is 1:2 — if your stop loss is 30 pips, your take profit should be at least 60 pips. Always set take profit before entering a trade.",
    example: "Buy EUR/USD at 1.0850, take profit at 1.0910 — 60 pip target with 30 pip stop = 1:2 risk-reward.",
    bullBear: "bullish",
  },
  {
    term: "Risk-Reward Ratio",
    category: "Risk Management",
    shortDef: "Ratio of potential loss to potential profit on a trade.",
    fullDef: "Risk-reward ratio compares how much you risk to how much you can gain. A 1:2 ratio means you risk 1 unit to potentially gain 2. Even with a 40% win rate, a 1:2 ratio is profitable. A 1:3 ratio is excellent. Always aim for at least 1:1.5. Calculate: (Take Profit - Entry) / (Entry - Stop Loss).",
    example: "Entry 1.0850, SL 1.0820, TP 1.0910. Risk = 30 pips, reward = 60 pips. Ratio = 1:2.",
  },
  {
    term: "Position Sizing",
    category: "Risk Management",
    shortDef: "Calculating trade size based on risk percentage and stop distance.",
    fullDef: "Position sizing determines how many units to trade based on your account size, risk percentage (usually 1%), and stop loss distance. Formula: Position Size = (Account Balance × Risk%) / (Stop Loss in Pips × Pip Value). Proper position sizing ensures no single trade can destroy your account.",
    example: "$10,000 account, 1% risk, 30-pip stop. Risk $100. Position size = $100 / (30 × $10/pip) = 0.33 lots.",
  },

  // ─── Forex Specific ───
  {
    term: "Currency Pair",
    category: "Forex Specific",
    shortDef: "Two currencies quoted together, e.g., EUR/USD.",
    fullDef: "A currency pair represents the value of one currency relative to another. The first currency is the base, the second is the quote. EUR/USD = how many USD to buy 1 EUR. When you buy EUR/USD, you're buying EUR and selling USD simultaneously. The 7 major pairs all include USD.",
    example: "EUR/USD at 1.0850 means 1 Euro costs 1.0850 US Dollars.",
  },
  {
    term: "Base Currency",
    category: "Forex Specific",
    shortDef: "First currency in a pair; the one you buy or sell.",
    fullDef: "The base currency is the first currency in a pair. In EUR/USD, EUR is the base. When you go long (buy), you're buying the base currency. When you go short (sell), you're selling the base currency. The base currency is always equal to 1 — the quote currency's value fluctuates against it.",
    example: "In GBP/USD, GBP is the base. Buying GBP/USD means buying British Pounds with US Dollars.",
  },
  {
    term: "Quote Currency",
    category: "Forex Specific",
    shortDef: "Second currency in a pair; the price denominator.",
    fullDef: "The quote currency is the second currency in a pair. In EUR/USD, USD is the quote. The exchange rate tells you how much of the quote currency is needed to buy one unit of the base. When you go long, you're selling the quote currency. Profit and loss is typically realized in the quote currency.",
    example: "In EUR/USD at 1.0850, USD is the quote — 1.0850 USD buys 1 EUR.",
  },
  {
    term: "Major Pairs",
    category: "Forex Specific",
    shortDef: "The 7 most traded pairs, all including USD.",
    fullDef: "Major pairs are the most liquid and widely traded currency pairs. They all include the US Dollar as either base or quote. The 7 majors are: EUR/USD, GBP/USD, USD/JPY, USD/CAD, AUD/USD, USD/CHF, and NZD/USD. They have the tightest spreads and highest volume, making them ideal for beginners.",
    example: "EUR/USD is the most traded pair globally — over 20% of daily forex volume.",
  },
  {
    term: "Lot Size",
    category: "Forex Specific",
    shortDef: "Standard trade unit; 1 standard lot = 100,000 units.",
    fullDef: "Lot size defines the volume of a forex trade. A standard lot is 100,000 units of the base currency. A mini lot is 10,000 units. A micro lot is 1,000 units. For EUR/USD, 1 standard lot means each pip is worth $10. Choose lot size based on your risk management plan — never trade more than your position sizing allows.",
    example: "0.1 lots (mini) on EUR/USD — each pip is worth $1. With 30-pip stop, max loss = $30.",
  },
  {
    term: "Leverage",
    category: "Forex Specific",
    shortDef: "Borrowed capital to control larger positions with less money.",
    fullDef: "Leverage allows you to control a large position with a small deposit (margin). 100:1 leverage means $1,000 controls $100,000. While leverage amplifies profits, it equally amplifies losses. High leverage without proper risk management is the #1 reason traders lose their accounts. Use leverage cautiously — 10:1 to 50:1 is reasonable for beginners.",
    example: "100:1 leverage, $1,000 margin lets you trade 1 standard lot ($100,000). A 100-pip loss = $1,000 (entire margin).",
  },
  {
    term: "Session (London/New York/Asian)",
    category: "Forex Specific",
    shortDef: "Trading hours of major financial centers; affects volatility.",
    fullDef: "Forex trades 24/5 across global sessions. Asian session (Tokyo, 00:00-09:00 UTC) — lower volatility, good for range strategies. London session (08:00-17:00 UTC) — highest volume, major moves start here. New York session (13:00-22:00 UTC) — high volatility, overlaps with London (13:00-17:00 UTC) creating the best trading window. The London-NY overlap has the tightest spreads and biggest moves.",
    example: "London Breakout strategy trades the 07:00-08:00 London open when Asian range breaks — high momentum.",
  },
  {
    term: "Sentiment Score",
    category: "Forex Specific",
    shortDef: "0-100 composite score of overall market bias.",
    fullDef: "The sentiment score combines 10+ indicators (RSI, MACD, SMA trend, Stochastic, Williams %R, CCI, MFI, ROC, OBV, Bollinger %B) into a single 0-100 score. Above 70 = Strong Bullish. 55-69 = Bullish. 45-54 = Neutral. 30-44 = Bearish. Below 30 = Strong Bearish. Each factor contributes a bullish (+), bearish (-), or neutral vote.",
    example: "Sentiment score 72 — Strong Bullish. 8 of 10 indicators are bullish. Safe to look for long entries.",
    bullBear: "bullish",
  },
];

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return TERMS.filter((t) => {
      const matchesSearch =
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.shortDef.toLowerCase().includes(search.toLowerCase()) ||
        t.fullDef.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || t.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-info" />
        <h1 className="text-lg font-bold text-text-bright">Trading Glossary</h1>
        <span className="badge badge-neutral">{filtered.length} terms</span>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search terms, definitions, concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition border ${
                category === cat
                  ? "bg-info/10 text-info border-info/30"
                  : "text-text-muted hover:text-text hover:bg-bg-hover border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-text-muted">No terms found matching "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const isExpanded = expanded === item.term;
            const catColor = CATEGORY_COLORS[item.category] || "#8B949E";
            return (
              <div
                key={item.term}
                className="card overflow-hidden transition hover:border-border-light fade-in"
              >
                {/* Top accent bar */}
                <div className="h-0.5" style={{ background: catColor }} />

                <button
                  onClick={() => setExpanded(isExpanded ? null : item.term)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {item.bullBear === "bullish" ? (
                        <TrendingUp className="h-4 w-4 text-buy flex-shrink-0 mt-0.5" />
                      ) : item.bullBear === "bearish" ? (
                        <TrendingDown className="h-4 w-4 text-sell flex-shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-text-bright">{item.term}</h3>
                        <p className="text-xs text-text-muted mt-0.5">{item.shortDef}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: `${catColor}20`, color: catColor }}
                    >
                      {item.category}
                    </span>
                    {item.bullBear && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        item.bullBear === "bullish" ? "bg-buy/15 text-buy" :
                        item.bullBear === "bearish" ? "bg-sell/15 text-sell" :
                        "bg-text-muted/10 text-text-muted"
                      }`}>
                        {item.bullBear === "bullish" ? "↑ Bullish signal" : item.bullBear === "bearish" ? "↓ Bearish signal" : "→ Neutral"}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    <p className="text-xs text-text leading-relaxed">{item.fullDef}</p>
                    {item.example && (
                      <div className="rounded-lg border border-border bg-bg/50 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Hash className="h-3 w-3 text-info" />
                          <span className="text-[10px] font-semibold text-info uppercase tracking-wider">Example</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed italic">{item.example}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-text-muted py-2">
        {TERMS.length} terms across {CATEGORIES.length - 1} categories · Click any term to expand the full explanation
      </div>
    </div>
  );
}
