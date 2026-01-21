// Conversion functions for common types shared across multiple services
import type {
  SdkAmount,
  SdkCandle,
  SdkL2Level,
  SdkPriceBook,
  SdkHistoricalMarketTrade,
  SdkProduct,
  Amount,
  Candle,
  L2Level,
  PriceBook,
  HistoricalMarketTrade,
  Product,
} from './common.types';
import { toNumber, toNumberRequired } from './numberConversion';

/**
 * Convert SDK Amount to our Amount type with number value.
 */
export function toAmount(sdkAmount: SdkAmount | undefined): Amount | undefined {
  if (!sdkAmount) {
    return undefined;
  }
  const { value, ...unchanged } = sdkAmount;
  return { ...unchanged, value: toNumber(value) };
}

/**
 * Convert SDK Candle to our Candle type with numbers.
 */
export function toCandle(sdkCandle: SdkCandle): Candle {
  const { start, low, high, open, close, volume } = sdkCandle;
  return {
    start: toNumber(start),
    low: toNumber(low),
    high: toNumber(high),
    open: toNumber(open),
    close: toNumber(close),
    volume: toNumber(volume),
  };
}

/**
 * Convert SDK L2Level to our L2Level type with numbers.
 */
function toL2Level(sdkLevel: SdkL2Level): L2Level {
  const { price, size } = sdkLevel;
  return {
    price: toNumber(price),
    size: toNumber(size),
  };
}

/**
 * Convert SDK PriceBook to our PriceBook type with numbers.
 */
export function toPriceBook(sdkPriceBook: SdkPriceBook): PriceBook {
  const { bids, asks, ...unchanged } = sdkPriceBook;
  return {
    ...unchanged,
    bids: bids.map(toL2Level),
    asks: asks.map(toL2Level),
  };
}

/**
 * Convert SDK HistoricalMarketTrade to our type with numbers.
 */
export function toHistoricalMarketTrade(
  sdkTrade: SdkHistoricalMarketTrade,
): HistoricalMarketTrade {
  const { price, size, ...unchanged } = sdkTrade;
  return {
    ...unchanged,
    price: toNumber(price),
    size: toNumber(size),
  };
}

/**
 * Convert SDK Product to our Product type with numbers.
 */
export function toProduct(sdkProduct: SdkProduct): Product {
  const {
    price,
    pricePercentageChange24h,
    volume24h,
    volumePercentageChange24h,
    baseIncrement,
    quoteIncrement,
    quoteMinSize,
    quoteMaxSize,
    baseMinSize,
    baseMaxSize,
    midMarketPrice,
    priceIncrement,
    approximateQuote24hVolume,
    ...unchanged
  } = sdkProduct;
  return {
    ...unchanged,
    price: toNumberRequired(price),
    pricePercentageChange24h: toNumberRequired(pricePercentageChange24h),
    volume24h: toNumberRequired(volume24h),
    volumePercentageChange24h: toNumberRequired(volumePercentageChange24h),
    baseIncrement: toNumberRequired(baseIncrement),
    quoteIncrement: toNumberRequired(quoteIncrement),
    quoteMinSize: toNumberRequired(quoteMinSize),
    quoteMaxSize: toNumberRequired(quoteMaxSize),
    baseMinSize: toNumberRequired(baseMinSize),
    baseMaxSize: toNumberRequired(baseMaxSize),
    midMarketPrice: toNumber(midMarketPrice),
    priceIncrement: toNumber(priceIncrement),
    approximateQuote24hVolume: toNumber(approximateQuote24hVolume),
  };
}
