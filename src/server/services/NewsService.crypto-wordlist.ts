/**
 * Crypto-specific sentiment words extending AFINN-165.
 * Scores range from -5 (most bearish) to +5 (most bullish).
 */
export const CRYPTO_SENTIMENT_WORDS: Record<string, number> = {
  // Bullish terms (+1 to +4)
  moon: 3,
  mooning: 3,
  bullish: 2,
  hodl: 1,
  hodling: 1,
  accumulate: 1,
  accumulating: 1,
  breakout: 2,
  rally: 2,
  ath: 2,
  bullrun: 3,
  lambo: 2,
  wagmi: 2,

  // Bearish terms (-1 to -4)
  rekt: -3,
  dump: -2,
  dumping: -2,
  bearish: -2,
  crash: -3,
  crashing: -3,
  fud: -2,
  scam: -3,
  rug: -4,
  rugpull: -4,
  ponzi: -4,
  ngmi: -2,
  capitulation: -3,
  bloodbath: -3,

  // Neutral but contextually important (0)
  whale: 0,
  whales: 0,
  dyor: 0,
  nfa: 0,
  dip: 0,
  airdrop: 0,
};
