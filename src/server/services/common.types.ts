// Common types shared across multiple services
import type { OrderSide } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/OrderSide';
import type { FcmTradingSessionDetails } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FcmTradingSessionDetails';
import type { FutureProductDetails } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/FutureProductDetails';
import type { ProductType } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductType';
import type { ProductVenue } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/enums/ProductVenue';

// =============================================================================
// SDK Types (for conversion)
// =============================================================================

export type { Amount as SdkAmount } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Amount';
export type { Candle as SdkCandle } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Candle';
export type { L2Level as SdkL2Level } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/L2Level';
export type { PriceBook as SdkPriceBook } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/PriceBook';
export type { HistoricalMarketTrade as SdkHistoricalMarketTrade } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/HistoricalMarketTrade';
export type { Product as SdkProduct } from '@coinbase-sample/advanced-trade-sdk-ts/dist/model/Product';

// =============================================================================
// Amount Type (used by Accounts, Perpetuals, Futures, Portfolios, Converts)
// =============================================================================

export interface Amount {
  readonly value?: number;
  readonly currency?: string;
}

// =============================================================================
// Market Data Types (used by Products, Public)
// =============================================================================

// L2Level with number fields for order book
export interface L2Level {
  readonly price?: number;
  readonly size?: number;
}

// PriceBook with L2Level arrays
export interface PriceBook {
  readonly productId: string;
  readonly bids: ReadonlyArray<L2Level>;
  readonly asks: ReadonlyArray<L2Level>;
  readonly time?: string;
}

// Candle with number fields
export interface Candle {
  readonly start?: number;
  readonly low?: number;
  readonly high?: number;
  readonly open?: number;
  readonly close?: number;
  readonly volume?: number;
}

// HistoricalMarketTrade with number fields
export interface HistoricalMarketTrade {
  readonly tradeId?: string;
  readonly productId?: string;
  readonly price?: number;
  readonly size?: number;
  readonly time?: string;
  readonly side?: OrderSide;
  readonly exchange?: string;
}

// =============================================================================
// Product Type (used by Products, Public)
// =============================================================================

export interface Product {
  readonly productId: string;
  readonly price: number;
  readonly pricePercentageChange24h: number;
  readonly volume24h: number;
  readonly volumePercentageChange24h: number;
  readonly baseIncrement: number;
  readonly quoteIncrement: number;
  readonly quoteMinSize: number;
  readonly quoteMaxSize: number;
  readonly baseMinSize: number;
  readonly baseMaxSize: number;
  readonly baseName: string;
  readonly quoteName: string;
  readonly watched: boolean;
  readonly isDisabled: boolean;
  readonly _new: boolean;
  readonly status: string;
  readonly cancelOnly: boolean;
  readonly limitOnly: boolean;
  readonly postOnly: boolean;
  readonly tradingDisabled: boolean;
  readonly auctionMode: boolean;
  readonly productType?: ProductType;
  readonly quoteCurrencyId?: string;
  readonly baseCurrencyId?: string;
  readonly fcmTradingSessionDetails?: FcmTradingSessionDetails;
  readonly midMarketPrice?: number;
  readonly alias?: string;
  readonly aliasTo?: Array<string>;
  readonly baseDisplaySymbol: string;
  readonly quoteDisplaySymbol: string;
  readonly viewOnly?: boolean;
  readonly priceIncrement?: number;
  readonly displayName?: string;
  readonly productVenue?: ProductVenue;
  readonly approximateQuote24hVolume?: number;
  readonly futureProductDetails?: FutureProductDetails;
}
