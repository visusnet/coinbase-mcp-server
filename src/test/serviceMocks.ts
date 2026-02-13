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
  EventService,
  NewsService,
} from '@server/services';
import { jest } from '@jest/globals';

// =============================================================================
// Mock Response Helper
// =============================================================================

/**
 * Helper to create a mock response for client.request() calls.
 * Wraps the data in a CoinbaseResponse-like structure.
 */
export function mockResponse<T>(data: T): {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
} {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
  };
}

// Type helper for creating properly typed mocks
// Uses conditional types to extract function signatures for Jest 29+
export type MockedService<T> = {
  [K in keyof T]: T[K] extends (...args: infer _A) => infer _R
    ? jest.MockedFunction<T[K]>
    : never;
};

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
  analyzeTechnicalIndicatorsBatch:
    jest.fn<TechnicalAnalysisService['analyzeTechnicalIndicatorsBatch']>(),
} as MockedService<TechnicalAnalysisService>;

export const mockEventService = {
  waitForEvent: jest.fn<EventService['waitForEvent']>(),
} as MockedService<EventService>;

const mockNewsService = {
  getNewsSentiment: jest.fn<NewsService['getNewsSentiment']>(),
} as MockedService<NewsService>;

export function mockServices(): void {
  jest.mock('@client/CoinbaseClient', () => {
    return {
      CoinbaseClient: jest.fn().mockImplementation(() => ({
        request: jest.fn(),
      })),
      HttpMethod: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE',
      },
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
      EventService: jest.fn().mockImplementation(() => mockEventService),
      NewsService: jest.fn().mockImplementation(() => mockNewsService),
    };
  });

  jest.mock('@server/services/MarketDataPool', () => {
    return {
      MarketDataPool: jest.fn().mockImplementation(() => ({
        close: jest.fn(),
      })),
    };
  });

  jest.mock('@server/services/OrderDataPool', () => {
    return {
      OrderDataPool: jest.fn().mockImplementation(() => ({
        close: jest.fn(),
      })),
    };
  });

  jest.mock('@client/CoinbaseCredentials', () => {
    return {
      CoinbaseCredentials: jest.fn().mockImplementation(() => ({
        generateAuthHeaders: jest.fn().mockReturnValue({}),
        generateWebSocketJwt: jest.fn().mockReturnValue('mock-jwt-token'),
      })),
    };
  });
}
