import { z } from 'zod';
import { stringToNumber, stringToNumberRequired } from './schema.helpers';

// =============================================================================
// Shared Enums
// =============================================================================

/** Portfolio type for portfolios and API key permissions */
export enum PortfolioType {
  Undefined = 'UNDEFINED',
  Default = 'DEFAULT',
  Consumer = 'CONSUMER',
  Intx = 'INTX',
}

// =============================================================================
// Shared Response Schemas
// =============================================================================

/**
 * Amount schema with string→number conversion for value field.
 */
export const AmountSchema = z
  .object({
    value: stringToNumber.describe('Numeric value'),
    currency: z.string().optional().describe('Currency code'),
  })
  .describe('Monetary amount with currency');

export type Amount = z.output<typeof AmountSchema>;

/**
 * Candle schema for OHLCV data with string→number conversion.
 */
export const CandleSchema = z
  .object({
    start: stringToNumber.describe('Candle start timestamp'),
    low: stringToNumber.describe('Low price'),
    high: stringToNumber.describe('High price'),
    open: stringToNumber.describe('Open price'),
    close: stringToNumber.describe('Close price'),
    volume: stringToNumber.describe('Volume'),
  })
  .describe('OHLCV candle data');

export type Candle = z.output<typeof CandleSchema>;

/**
 * Schema for candle input to technical indicators.
 * Converts optional numbers to required numbers (defaulting undefined to 0).
 * Used for indicator calculations that require all numeric fields.
 * Note: Excludes 'start' timestamp as indicator calculations only need OHLCV.
 */
export const CandleInputSchema = z
  .object({
    open: z
      .preprocess((v) => Number(v) || 0, z.number())
      .describe('Open price'),
    high: z
      .preprocess((v) => Number(v) || 0, z.number())
      .describe('High price'),
    low: z.preprocess((v) => Number(v) || 0, z.number()).describe('Low price'),
    close: z
      .preprocess((v) => Number(v) || 0, z.number())
      .describe('Close price'),
    volume: z.preprocess((v) => Number(v) || 0, z.number()).describe('Volume'),
  })
  .describe('Candle input for technical indicators');

export type CandleInput = z.output<typeof CandleInputSchema>;

/**
 * Schema for array of candle inputs.
 * Parses an array of candles with optional numbers to required numbers.
 */
export const CandleInputArraySchema = z
  .array(CandleInputSchema)
  .describe('Array of candle inputs for technical indicators');

/**
 * L2 Level schema for order book data.
 */
const L2LevelSchema = z
  .object({
    price: stringToNumber.describe('Price level'),
    size: stringToNumber.describe('Size at price level'),
  })
  .describe('Order book level with price and size');

export type L2Level = z.output<typeof L2LevelSchema>;

/**
 * PriceBook schema for order book data.
 */
export const PriceBookSchema = z
  .object({
    productId: z.string().describe('Product ID'),
    bids: z.array(L2LevelSchema).describe('Bid levels'),
    asks: z.array(L2LevelSchema).describe('Ask levels'),
    time: z.string().optional().describe('Timestamp'),
  })
  .describe('Order book data with bids and asks');

export type PriceBook = z.output<typeof PriceBookSchema>;

/**
 * Historical market trade schema.
 */
export const HistoricalMarketTradeSchema = z
  .object({
    tradeId: z.string().optional().describe('Trade ID'),
    productId: z.string().optional().describe('Product ID'),
    price: stringToNumber.describe('Trade price'),
    size: stringToNumber.describe('Trade size'),
    time: z.string().optional().describe('Trade timestamp'),
    side: z.string().optional().describe('Trade side'),
    bid: stringToNumber.describe('Bid price at time of trade'),
    ask: stringToNumber.describe('Ask price at time of trade'),
  })
  .describe('Historical market trade data');

/**
 * Product schema with string→number conversion for numeric fields.
 */
export const ProductSchema = z
  .object({
    productId: z.string().describe('Product ID'),
    price: stringToNumberRequired.describe('Current price'),
    pricePercentageChange24h: stringToNumber.describe('24h price change %'),
    volume24h: stringToNumber.describe('24h volume'),
    volumePercentageChange24h: stringToNumber.describe('24h volume change %'),
    baseIncrement: stringToNumberRequired.describe('Base increment'),
    quoteIncrement: stringToNumberRequired.describe('Quote increment'),
    quoteMinSize: stringToNumberRequired.describe('Quote minimum size'),
    quoteMaxSize: stringToNumberRequired.describe('Quote maximum size'),
    baseMinSize: stringToNumberRequired.describe('Base minimum size'),
    baseMaxSize: stringToNumberRequired.describe('Base maximum size'),
    midMarketPrice: stringToNumber.describe('Mid-market price'),
    priceIncrement: stringToNumber.describe('Price increment'),
    approximateQuote24hVolume: stringToNumber.describe(
      'Approximate 24h quote volume',
    ),
    baseName: z.string().optional().describe('Base currency name'),
    quoteName: z.string().optional().describe('Quote currency name'),
    watched: z.boolean().optional().describe('Whether product is watched'),
    isDisabled: z.boolean().optional().describe('Whether trading is disabled'),
    new: z.boolean().optional().describe('Whether product is new'),
    status: z.string().optional().describe('Product status'),
    cancelOnly: z.boolean().optional().describe('Cancel only mode'),
    limitOnly: z.boolean().optional().describe('Limit only mode'),
    postOnly: z.boolean().optional().describe('Post only mode'),
    tradingDisabled: z.boolean().optional().describe('Trading disabled'),
    auctionMode: z.boolean().optional().describe('Auction mode'),
    productType: z.string().optional().describe('Product type'),
    quoteCurrencyId: z.string().optional().describe('Quote currency ID'),
    baseCurrencyId: z.string().optional().describe('Base currency ID'),
    baseDisplaySymbol: z.string().optional().describe('Base display symbol'),
    quoteDisplaySymbol: z.string().optional().describe('Quote display symbol'),
    viewOnly: z.boolean().optional().describe('View only mode'),
    alias: z.string().optional().describe('Product alias'),
    aliasTo: z.array(z.string()).optional().describe('Alias targets'),
    displayName: z.string().optional().describe('Display name'),
  })
  .describe('Trading product with market data');

export type Product = z.output<typeof ProductSchema>;

/**
 * Array of products, filtering out products with missing price data.
 * Some newly listed products on Coinbase return empty price strings before trading begins.
 */
export const ProductListSchema = z
  .preprocess(
    (val) =>
      Array.isArray(val)
        ? val.filter(
            (p: Record<string, unknown>) =>
              p.price !== undefined && p.price !== '',
          )
        : val,
    z.array(ProductSchema),
  )
  .describe('List of products');
