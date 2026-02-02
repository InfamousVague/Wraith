/**
 * Indicator Explanations
 *
 * Comprehensive explanations for each technical indicator used in the trading signals.
 * Used to populate tooltips throughout the app.
 */

export type IndicatorExplanation = {
  /** Unique identifier for the indicator */
  id: string;
  /** Full display name */
  name: string;
  /** Brief description of what the indicator measures */
  description: string;
  /** How the indicator value is calculated */
  calculation: string;
  /** How to interpret the indicator's values */
  interpretation: string;
  /** What constitutes a bullish signal */
  bullishSignal: string;
  /** What constitutes a bearish signal */
  bearishSignal: string;
};

/**
 * Explanations keyed by the indicator name as returned from the API.
 * These names must match exactly what comes from the backend.
 */
export const INDICATOR_EXPLANATIONS: Record<string, IndicatorExplanation> = {
  // ============================================
  // TREND INDICATORS
  // ============================================

  "SMA (20)": {
    id: "sma20",
    name: "Simple Moving Average (20-period)",
    description:
      "Calculates the average closing price over the last 20 periods, smoothing out short-term fluctuations to reveal the underlying trend direction.",
    calculation:
      "Sum of last 20 closing prices divided by 20. Updates with each new price bar.",
    interpretation:
      "Price above SMA indicates an uptrend; price below indicates a downtrend. The 20-period SMA is commonly used for short-term trend analysis.",
    bullishSignal: "Price crosses above the SMA from below",
    bearishSignal: "Price crosses below the SMA from above",
  },

  "SMA (50)": {
    id: "sma50",
    name: "Simple Moving Average (50-period)",
    description:
      "Calculates the average closing price over the last 50 periods, providing a medium-term view of the trend direction.",
    calculation:
      "Sum of last 50 closing prices divided by 50. Slower to react than shorter SMAs.",
    interpretation:
      "Price above SMA indicates a medium-term uptrend. Often used as dynamic support/resistance. The 50-period SMA is watched by many institutional traders.",
    bullishSignal: "Price crosses above the 50 SMA, or 20 SMA crosses above 50 SMA (golden cross)",
    bearishSignal: "Price crosses below the 50 SMA, or 20 SMA crosses below 50 SMA (death cross)",
  },

  "EMA (12)": {
    id: "ema12",
    name: "Exponential Moving Average (12-period)",
    description:
      "A weighted moving average that gives more importance to recent prices, making it more responsive to new information than simple moving averages.",
    calculation:
      "Uses a multiplier (2/(12+1) = 0.1538) to weight recent prices more heavily. EMA = Price × Multiplier + Previous EMA × (1 - Multiplier).",
    interpretation:
      "Faster than SMA to react to price changes. Used as the fast line in MACD calculation. Good for identifying short-term momentum.",
    bullishSignal: "Price crosses above EMA, or EMA is rising",
    bearishSignal: "Price crosses below EMA, or EMA is falling",
  },

  "EMA (26)": {
    id: "ema26",
    name: "Exponential Moving Average (26-period)",
    description:
      "A slower exponential moving average that provides a smoother view of price trends while still reacting faster than a simple moving average.",
    calculation:
      "Uses a multiplier (2/(26+1) = 0.074) to weight recent prices. This is the slow line used in MACD calculation.",
    interpretation:
      "Represents the medium-term trend. The difference between 12 EMA and 26 EMA forms the MACD line.",
    bullishSignal: "Price crosses above EMA, or 12 EMA crosses above 26 EMA",
    bearishSignal: "Price crosses below EMA, or 12 EMA crosses below 26 EMA",
  },

  MACD: {
    id: "macd",
    name: "Moving Average Convergence Divergence",
    description:
      "A trend-following momentum indicator showing the relationship between two exponential moving averages. It helps identify trend direction, momentum, and potential reversals.",
    calculation:
      "MACD Line = 12-period EMA minus 26-period EMA. Signal Line = 9-period EMA of MACD Line. Histogram = MACD Line minus Signal Line.",
    interpretation:
      "Positive MACD means short-term momentum exceeds long-term momentum (bullish). The histogram shows the strength and direction of momentum changes.",
    bullishSignal: "MACD crosses above the signal line, or histogram turns positive and growing",
    bearishSignal: "MACD crosses below the signal line, or histogram turns negative and shrinking",
  },

  "ADX (14)": {
    id: "adx",
    name: "Average Directional Index",
    description:
      "Measures the strength of a trend regardless of its direction. It doesn't indicate whether the trend is up or down, only how strong the trend is.",
    calculation:
      "Derived from the smoothed averages of the difference between +DI and -DI over 14 periods. Values range from 0 to 100.",
    interpretation:
      "ADX below 20 indicates a weak trend or ranging market. ADX above 25 indicates a strong trend. ADX above 50 indicates a very strong trend.",
    bullishSignal: "ADX rising above 25 while +DI is above -DI (strong uptrend forming)",
    bearishSignal: "ADX rising above 25 while -DI is above +DI (strong downtrend forming)",
  },

  // ============================================
  // MOMENTUM INDICATORS
  // ============================================

  "RSI (14)": {
    id: "rsi",
    name: "Relative Strength Index",
    description:
      "A momentum oscillator measuring the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.",
    calculation:
      "RSI = 100 - (100 / (1 + RS)), where RS = Average Gain over 14 periods / Average Loss over 14 periods. Values range 0-100.",
    interpretation:
      "RSI below 30 is considered oversold (potential buying opportunity). RSI above 70 is considered overbought (potential selling opportunity). RSI around 50 is neutral.",
    bullishSignal: "RSI drops below 30 then rises back above it (oversold bounce)",
    bearishSignal: "RSI rises above 70 then drops back below it (overbought pullback)",
  },

  Stochastic: {
    id: "stochastic",
    name: "Stochastic Oscillator",
    description:
      "Compares a closing price to its price range over a given period to identify momentum and potential reversal points.",
    calculation:
      "%K = (Current Close - Lowest Low) / (Highest High - Lowest Low) × 100. %D = 3-period SMA of %K. Default period is 14.",
    interpretation:
      "Values above 80 indicate overbought conditions. Values below 20 indicate oversold conditions. Crossovers between %K and %D generate signals.",
    bullishSignal: "%K crosses above %D in oversold territory (below 20)",
    bearishSignal: "%K crosses below %D in overbought territory (above 80)",
  },

  "CCI (20)": {
    id: "cci",
    name: "Commodity Channel Index",
    description:
      "Measures the current price level relative to an average price level over a given period. Used to identify cyclical trends and overbought/oversold conditions.",
    calculation:
      "CCI = (Typical Price - 20-period SMA of Typical Price) / (0.015 × Mean Deviation). Typical Price = (High + Low + Close) / 3.",
    interpretation:
      "CCI oscillates above and below zero. Values above +100 suggest overbought, below -100 suggest oversold. Zero line crossovers indicate momentum shifts.",
    bullishSignal: "CCI crosses above -100 from below (emerging from oversold)",
    bearishSignal: "CCI crosses below +100 from above (emerging from overbought)",
  },

  "MFI (14)": {
    id: "mfi",
    name: "Money Flow Index",
    description:
      "A volume-weighted RSI that incorporates both price and volume data to measure buying and selling pressure.",
    calculation:
      "Uses typical price × volume to calculate positive and negative money flow over 14 periods. MFI = 100 - (100 / (1 + Money Ratio)).",
    interpretation:
      "Similar interpretation to RSI but includes volume. MFI below 20 = oversold with high volume selling. MFI above 80 = overbought with high volume buying.",
    bullishSignal: "MFI drops below 20 then rises (oversold with volume confirmation)",
    bearishSignal: "MFI rises above 80 then drops (overbought with volume confirmation)",
  },

  // ============================================
  // VOLATILITY INDICATORS
  // ============================================

  "Bollinger Bands": {
    id: "bollinger",
    name: "Bollinger Bands",
    description:
      "A volatility indicator consisting of a middle band (SMA) and two outer bands set 2 standard deviations away. The bands expand and contract based on volatility.",
    calculation:
      "Middle Band = 20-period SMA. Upper Band = Middle + (2 × Standard Deviation). Lower Band = Middle - (2 × Standard Deviation).",
    interpretation:
      "Price near lower band suggests oversold conditions. Price near upper band suggests overbought. Band squeeze (narrow bands) often precedes significant price moves.",
    bullishSignal: "Price touches lower band and bounces, or breaks out above upper band after a squeeze",
    bearishSignal: "Price touches upper band and reverses, or breaks below lower band after a squeeze",
  },

  "ATR (14)": {
    id: "atr",
    name: "Average True Range",
    description:
      "Measures market volatility by calculating the average of true ranges over 14 periods. Higher ATR means higher volatility.",
    calculation:
      "True Range = Max of (High-Low, |High-Previous Close|, |Low-Previous Close|). ATR = 14-period smoothed average of True Range.",
    interpretation:
      "ATR doesn't indicate direction, only volatility. High ATR suggests larger price swings and potentially riskier conditions. Useful for setting stop-losses.",
    bullishSignal: "Rising ATR during uptrend suggests strong buying momentum",
    bearishSignal: "Rising ATR during downtrend suggests strong selling pressure",
  },

  // ============================================
  // VOLUME INDICATORS
  // ============================================

  OBV: {
    id: "obv",
    name: "On-Balance Volume",
    description:
      "A cumulative indicator that adds volume on up days and subtracts volume on down days to show buying and selling pressure.",
    calculation:
      "If close > previous close: OBV = Previous OBV + Volume. If close < previous close: OBV = Previous OBV - Volume. If close = previous close: OBV unchanged.",
    interpretation:
      "Rising OBV indicates accumulation (buying pressure). Falling OBV indicates distribution (selling pressure). OBV divergence from price can signal reversals.",
    bullishSignal: "OBV rising while price is flat or rising (accumulation confirmed)",
    bearishSignal: "OBV falling while price is flat or rising (distribution/weak rally)",
  },

  VWAP: {
    id: "vwap",
    name: "Volume Weighted Average Price",
    description:
      "The average price weighted by volume, showing the true average price at which trading occurred. Often used as a benchmark by institutional traders.",
    calculation:
      "VWAP = Cumulative (Typical Price × Volume) / Cumulative Volume. Typically calculated from the start of the trading session.",
    interpretation:
      "Price above VWAP indicates buyers are in control. Price below VWAP indicates sellers are in control. VWAP often acts as support/resistance.",
    bullishSignal: "Price crosses above VWAP and holds (buyers taking control)",
    bearishSignal: "Price crosses below VWAP and holds (sellers taking control)",
  },

  // ============================================
  // DERIVATIVE INDICATORS (Future)
  // ============================================

  "Funding Rate": {
    id: "funding_rate",
    name: "Perpetual Funding Rate",
    description:
      "The periodic payment between long and short traders in perpetual futures markets. Reflects market sentiment and leverage positioning.",
    calculation:
      "Determined by exchanges based on the difference between perpetual contract price and spot price. Positive rate means longs pay shorts; negative means shorts pay longs.",
    interpretation:
      "High positive funding indicates crowded long positions (contrarian bearish). Negative funding indicates crowded shorts (contrarian bullish). Used as a sentiment indicator.",
    bullishSignal: "Deeply negative funding rate (< -0.05%) suggests overcrowded shorts",
    bearishSignal: "Highly positive funding rate (> 0.05%) suggests overcrowded longs",
  },

  "Open Interest": {
    id: "open_interest",
    name: "Open Interest",
    description:
      "The total number of outstanding derivative contracts that have not been settled. Shows the total amount of money committed to a market.",
    calculation:
      "Sum of all open long positions (or equivalently, all open short positions) in futures/options contracts.",
    interpretation:
      "Rising OI with rising price = new money entering (bullish confirmation). Rising OI with falling price = new shorts entering (bearish). Falling OI = positions closing.",
    bullishSignal: "OI increasing while price rises (strong bullish conviction)",
    bearishSignal: "OI increasing while price falls (strong bearish conviction)",
  },

  "Long/Short Ratio": {
    id: "ls_ratio",
    name: "Long/Short Ratio",
    description:
      "The ratio of accounts holding long positions versus short positions. Indicates retail trader sentiment and positioning.",
    calculation:
      "Number of accounts with net long positions divided by accounts with net short positions. A ratio of 2.0 means twice as many longs as shorts.",
    interpretation:
      "High ratio (> 1.5) = many longs, contrarian bearish. Low ratio (< 0.7) = many shorts, contrarian bullish. Extreme positioning often precedes reversals.",
    bullishSignal: "Ratio below 0.7 (crowd is short, contrarian opportunity)",
    bearishSignal: "Ratio above 1.5 (crowd is long, contrarian opportunity)",
  },

  "Order Book Imbalance": {
    id: "ob_imbalance",
    name: "Order Book Imbalance",
    description:
      "Measures the difference between bid volume and ask volume in the order book. Shows immediate buying versus selling pressure.",
    calculation:
      "Imbalance = (Total Bid Volume - Total Ask Volume) / (Total Bid Volume + Total Ask Volume). Ranges from -1 (all asks) to +1 (all bids).",
    interpretation:
      "Positive imbalance (more bids) suggests buying pressure and potential price increases. Negative imbalance (more asks) suggests selling pressure.",
    bullishSignal: "Strong positive imbalance (> 0.3) with price holding support",
    bearishSignal: "Strong negative imbalance (< -0.3) with price failing resistance",
  },
};

/**
 * Get explanation for an indicator by name.
 * Returns undefined if indicator is not found.
 */
export function getIndicatorExplanation(
  indicatorName: string
): IndicatorExplanation | undefined {
  return INDICATOR_EXPLANATIONS[indicatorName];
}

/**
 * Check if an indicator has an explanation available.
 */
export function hasIndicatorExplanation(indicatorName: string): boolean {
  return indicatorName in INDICATOR_EXPLANATIONS;
}
