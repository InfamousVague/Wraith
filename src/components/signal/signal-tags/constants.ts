/**
 * Constants for signal tags
 */

/** Descriptions for each tag type */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  "Strong Buy Signal": "Multiple indicators strongly suggest price increase",
  "Strong Sell Signal": "Multiple indicators strongly suggest price decrease",
  "Buy Signal": "Indicators lean toward potential price increase",
  "Sell Signal": "Indicators lean toward potential price decrease",
  "Falling Knife": "Rapid decline - catching the bottom is risky",
  "Oversold": "Price may have dropped too far, potential bounce ahead",
  "Overbought": "Price may have risen too fast, potential pullback ahead",
  "Strong Uptrend": "Clear upward price movement with momentum",
  "Strong Downtrend": "Clear downward price movement with momentum",
  "Consolidating": "Price is ranging with low volatility, breakout may follow",
  "High Volatility": "Large price swings - higher risk and opportunity",
  "Volume Surge": "Unusual trading activity - watch for significant moves",
  "Bullish Divergence": "Price falling but momentum improving - potential reversal",
  "Bearish Divergence": "Price rising but momentum weakening - potential reversal",
};

/** Maximum number of tags to display */
export const MAX_TAGS = 5;
