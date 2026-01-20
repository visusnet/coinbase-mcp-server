import type {
  AccountsService,
  OrdersService,
  ConvertsService,
  FeesService,
  PaymentMethodsService,
  PortfoliosService,
  FuturesService,
  PerpetualsService,
  DataService,
  ProductsService,
  PublicService,
  TechnicalIndicatorsService,
  TechnicalAnalysisService,
} from '@server/services';
import type { AccountsService as SdkAccountsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { OrdersService as SdkOrdersService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { ProductsService as SdkProductsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { ConvertsService as SdkConvertsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { FeesService as SdkFeesService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { PaymentMethodsService as SdkPaymentMethodsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { PortfoliosService as SdkPortfoliosService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { FuturesService as SdkFuturesService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { PerpetualsService as SdkPerpetualsService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { DataService as SdkDataService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import type { PublicService as SdkPublicService } from '@coinbase-sample/advanced-trade-sdk-ts/dist/rest/public/index.js';
import { jest } from '@jest/globals';

// Type helper for creating properly typed mocks
// Uses conditional types to extract function signatures for Jest 29+
type MockedService<T> = {
  [K in keyof T]: T[K] extends (...args: infer _A) => infer _R
    ? jest.MockedFunction<T[K]>
    : never;
};

// =============================================================================
// SDK Service Mocks - for testing wrapper services
// =============================================================================

export const createSdkAccountsServiceMock = () => ({
  listAccounts: jest.fn<SdkAccountsService['listAccounts']>(),
  getAccount: jest.fn<SdkAccountsService['getAccount']>(),
});

export const createSdkOrdersServiceMock = () => ({
  listOrders: jest.fn<SdkOrdersService['listOrders']>(),
  getOrder: jest.fn<SdkOrdersService['getOrder']>(),
  createOrder: jest.fn<SdkOrdersService['createOrder']>(),
  cancelOrders: jest.fn<SdkOrdersService['cancelOrders']>(),
  listFills: jest.fn<SdkOrdersService['listFills']>(),
  editOrder: jest.fn<SdkOrdersService['editOrder']>(),
  editOrderPreview: jest.fn<SdkOrdersService['editOrderPreview']>(),
  createOrderPreview: jest.fn<SdkOrdersService['createOrderPreview']>(),
  closePosition: jest.fn<SdkOrdersService['closePosition']>(),
});

export const createSdkProductsServiceMock = () => ({
  listProducts: jest.fn<SdkProductsService['listProducts']>(),
  getProduct: jest.fn<SdkProductsService['getProduct']>(),
  getProductCandles: jest.fn<SdkProductsService['getProductCandles']>(),
  getProductBook: jest.fn<SdkProductsService['getProductBook']>(),
  getBestBidAsk: jest.fn<SdkProductsService['getBestBidAsk']>(),
  getProductMarketTrades:
    jest.fn<SdkProductsService['getProductMarketTrades']>(),
});

export const createSdkConvertsServiceMock = () => ({
  createConvertQuote: jest.fn<SdkConvertsService['createConvertQuote']>(),
  commitConvertTrade: jest.fn<SdkConvertsService['commitConvertTrade']>(),
  GetConvertTrade: jest.fn<SdkConvertsService['GetConvertTrade']>(),
});

export const createSdkFeesServiceMock = () => ({
  getTransactionSummary: jest.fn<SdkFeesService['getTransactionSummary']>(),
});

export const createSdkPaymentMethodsServiceMock = () => ({
  listPaymentMethods: jest.fn<SdkPaymentMethodsService['listPaymentMethods']>(),
  getPaymentMethod: jest.fn<SdkPaymentMethodsService['getPaymentMethod']>(),
});

export const createSdkPortfoliosServiceMock = () => ({
  listPortfolios: jest.fn<SdkPortfoliosService['listPortfolios']>(),
  createPortfolio: jest.fn<SdkPortfoliosService['createPortfolio']>(),
  getPortfolio: jest.fn<SdkPortfoliosService['getPortfolio']>(),
  editPortfolio: jest.fn<SdkPortfoliosService['editPortfolio']>(),
  deletePortfolio: jest.fn<SdkPortfoliosService['deletePortfolio']>(),
  movePortfolioFunds: jest.fn<SdkPortfoliosService['movePortfolioFunds']>(),
});

export const createSdkFuturesServiceMock = () => ({
  listPositions: jest.fn<SdkFuturesService['listPositions']>(),
  getPosition: jest.fn<SdkFuturesService['getPosition']>(),
  getBalanceSummary: jest.fn<SdkFuturesService['getBalanceSummary']>(),
  listSweeps: jest.fn<SdkFuturesService['listSweeps']>(),
});

export const createSdkPerpetualsServiceMock = () => ({
  listPositions: jest.fn<SdkPerpetualsService['listPositions']>(),
  getPosition: jest.fn<SdkPerpetualsService['getPosition']>(),
  getPortfolioSummary: jest.fn<SdkPerpetualsService['getPortfolioSummary']>(),
  getPortfolioBalance: jest.fn<SdkPerpetualsService['getPortfolioBalance']>(),
});

export const createSdkPublicServiceMock = () => ({
  getServerTime: jest.fn<SdkPublicService['getServerTime']>(),
  getProduct: jest.fn<SdkPublicService['getProduct']>(),
  listProducts: jest.fn<SdkPublicService['listProducts']>(),
  getProductBook: jest.fn<SdkPublicService['getProductBook']>(),
  getProductMarketTrades: jest.fn<SdkPublicService['getProductMarketTrades']>(),
  getProductCandles: jest.fn<SdkPublicService['getProductCandles']>(),
});

export const createSdkDataServiceMock = () => ({
  getAPIKeyPermissions: jest.fn<SdkDataService['getAPIKeyPermissions']>(),
});

// =============================================================================
// Wrapper Service Mocks - for testing MCP server and other consumers
// =============================================================================

// Mock the wrapper services to avoid real API calls
export const mockAccountsService = {
  listAccounts: jest.fn<AccountsService['listAccounts']>(),
  getAccount: jest.fn<AccountsService['getAccount']>(),
} as MockedService<AccountsService>;

export const mockOrdersService = {
  listOrders: jest.fn<OrdersService['listOrders']>(),
  getOrder: jest.fn<OrdersService['getOrder']>(),
  createOrder: jest.fn<OrdersService['createOrder']>(),
  createOrderPreview: jest.fn<OrdersService['createOrderPreview']>(),
  cancelOrders: jest.fn<OrdersService['cancelOrders']>(),
  listFills: jest.fn<OrdersService['listFills']>(),
  editOrder: jest.fn<OrdersService['editOrder']>(),
  editOrderPreview: jest.fn<OrdersService['editOrderPreview']>(),
  closePosition: jest.fn<OrdersService['closePosition']>(),
} as MockedService<OrdersService>;

export const mockProductsService = {
  listProducts: jest.fn<ProductsService['listProducts']>(),
  getProduct: jest.fn<ProductsService['getProduct']>(),
  getProductBook: jest.fn<ProductsService['getProductBook']>(),
  getProductCandles: jest.fn<ProductsService['getProductCandles']>(),
  getProductCandlesBatch: jest.fn<ProductsService['getProductCandlesBatch']>(),
  getProductMarketTrades: jest.fn<ProductsService['getProductMarketTrades']>(),
  getBestBidAsk: jest.fn<ProductsService['getBestBidAsk']>(),
  getMarketSnapshot: jest.fn<ProductsService['getMarketSnapshot']>(),
} as MockedService<ProductsService>;

export const mockConvertsService = {
  createConvertQuote: jest.fn<ConvertsService['createConvertQuote']>(),
  commitConvertTrade: jest.fn<ConvertsService['commitConvertTrade']>(),
  getConvertTrade: jest.fn<ConvertsService['getConvertTrade']>(),
} as MockedService<ConvertsService>;

export const mockFeesService = {
  getTransactionSummary: jest.fn<FeesService['getTransactionSummary']>(),
} as MockedService<FeesService>;

export const mockPaymentMethodsService = {
  listPaymentMethods: jest.fn<PaymentMethodsService['listPaymentMethods']>(),
  getPaymentMethod: jest.fn<PaymentMethodsService['getPaymentMethod']>(),
} as MockedService<PaymentMethodsService>;

export const mockPortfoliosService = {
  listPortfolios: jest.fn<PortfoliosService['listPortfolios']>(),
  createPortfolio: jest.fn<PortfoliosService['createPortfolio']>(),
  getPortfolio: jest.fn<PortfoliosService['getPortfolio']>(),
  editPortfolio: jest.fn<PortfoliosService['editPortfolio']>(),
  deletePortfolio: jest.fn<PortfoliosService['deletePortfolio']>(),
  movePortfolioFunds: jest.fn<PortfoliosService['movePortfolioFunds']>(),
} as MockedService<PortfoliosService>;

export const mockFuturesService = {
  listPositions: jest.fn<FuturesService['listPositions']>(),
  getPosition: jest.fn<FuturesService['getPosition']>(),
  getBalanceSummary: jest.fn<FuturesService['getBalanceSummary']>(),
  listSweeps: jest.fn<FuturesService['listSweeps']>(),
} as MockedService<FuturesService>;

export const mockPerpetualsService = {
  listPositions: jest.fn<PerpetualsService['listPositions']>(),
  getPosition: jest.fn<PerpetualsService['getPosition']>(),
  getPortfolioSummary: jest.fn<PerpetualsService['getPortfolioSummary']>(),
  getPortfolioBalance: jest.fn<PerpetualsService['getPortfolioBalance']>(),
} as MockedService<PerpetualsService>;

export const mockPublicService = {
  getServerTime: jest.fn<PublicService['getServerTime']>(),
  listProducts: jest.fn<PublicService['listProducts']>(),
  getProduct: jest.fn<PublicService['getProduct']>(),
  getProductBook: jest.fn<PublicService['getProductBook']>(),
  getProductCandles: jest.fn<PublicService['getProductCandles']>(),
  getProductMarketTrades: jest.fn<PublicService['getProductMarketTrades']>(),
} as MockedService<PublicService>;

export const mockDataService = {
  getAPIKeyPermissions: jest.fn<DataService['getAPIKeyPermissions']>(),
} as MockedService<DataService>;

export const mockTechnicalIndicatorsService = {
  calculateRsi: jest.fn<TechnicalIndicatorsService['calculateRsi']>(),
  calculateMacd: jest.fn<TechnicalIndicatorsService['calculateMacd']>(),
  calculateSma: jest.fn<TechnicalIndicatorsService['calculateSma']>(),
  calculateEma: jest.fn<TechnicalIndicatorsService['calculateEma']>(),
  calculateBollingerBands:
    jest.fn<TechnicalIndicatorsService['calculateBollingerBands']>(),
  calculateAtr: jest.fn<TechnicalIndicatorsService['calculateAtr']>(),
  calculateStochastic:
    jest.fn<TechnicalIndicatorsService['calculateStochastic']>(),
  calculateAdx: jest.fn<TechnicalIndicatorsService['calculateAdx']>(),
  calculateObv: jest.fn<TechnicalIndicatorsService['calculateObv']>(),
  calculateVwap: jest.fn<TechnicalIndicatorsService['calculateVwap']>(),
  calculateCci: jest.fn<TechnicalIndicatorsService['calculateCci']>(),
  calculateWilliamsR:
    jest.fn<TechnicalIndicatorsService['calculateWilliamsR']>(),
  calculateRoc: jest.fn<TechnicalIndicatorsService['calculateRoc']>(),
  calculateMfi: jest.fn<TechnicalIndicatorsService['calculateMfi']>(),
  calculatePsar: jest.fn<TechnicalIndicatorsService['calculatePsar']>(),
  calculateIchimokuCloud:
    jest.fn<TechnicalIndicatorsService['calculateIchimokuCloud']>(),
  calculateKeltnerChannels:
    jest.fn<TechnicalIndicatorsService['calculateKeltnerChannels']>(),
  calculateFibonacciRetracement:
    jest.fn<TechnicalIndicatorsService['calculateFibonacciRetracement']>(),
  detectCandlestickPatterns:
    jest.fn<TechnicalIndicatorsService['detectCandlestickPatterns']>(),
  calculateVolumeProfile:
    jest.fn<TechnicalIndicatorsService['calculateVolumeProfile']>(),
  calculatePivotPoints:
    jest.fn<TechnicalIndicatorsService['calculatePivotPoints']>(),
  detectRsiDivergence:
    jest.fn<TechnicalIndicatorsService['detectRsiDivergence']>(),
  detectChartPatterns:
    jest.fn<TechnicalIndicatorsService['detectChartPatterns']>(),
  detectSwingPoints: jest.fn<TechnicalIndicatorsService['detectSwingPoints']>(),
} as MockedService<TechnicalIndicatorsService>;

export const mockTechnicalAnalysisService = {
  analyzeTechnicalIndicators:
    jest.fn<TechnicalAnalysisService['analyzeTechnicalIndicators']>(),
} as MockedService<TechnicalAnalysisService>;

export function mockServices(): void {
  jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => {
    return {
      CoinbaseAdvTradeClient: jest.fn().mockImplementation(() => ({})),
      CoinbaseAdvTradeCredentials: jest.fn().mockImplementation(() => ({})),
    };
  });

  jest.mock('@server/services', () => {
    const actual =
      jest.requireActual<typeof import('@server/services')>('@server/services');
    return {
      ...actual,
      AccountsService: jest.fn().mockImplementation(() => mockAccountsService),
      OrdersService: jest.fn().mockImplementation(() => mockOrdersService),
      ProductsService: jest.fn().mockImplementation(() => mockProductsService),
      ConvertsService: jest.fn().mockImplementation(() => mockConvertsService),
      FeesService: jest.fn().mockImplementation(() => mockFeesService),
      PaymentMethodsService: jest
        .fn()
        .mockImplementation(() => mockPaymentMethodsService),
      PortfoliosService: jest
        .fn()
        .mockImplementation(() => mockPortfoliosService),
      FuturesService: jest.fn().mockImplementation(() => mockFuturesService),
      PerpetualsService: jest
        .fn()
        .mockImplementation(() => mockPerpetualsService),
      PublicService: jest.fn().mockImplementation(() => mockPublicService),
      DataService: jest.fn().mockImplementation(() => mockDataService),
      TechnicalIndicatorsService: jest
        .fn()
        .mockImplementation(() => mockTechnicalIndicatorsService),
      TechnicalAnalysisService: jest
        .fn()
        .mockImplementation(() => mockTechnicalAnalysisService),
    };
  });
}
