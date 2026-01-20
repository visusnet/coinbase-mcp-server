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
} from '@server/services';
import type { TechnicalIndicatorsService } from '@server/TechnicalIndicatorsService';
import type { TechnicalAnalysisService } from '@server/TechnicalAnalysisService';
import { jest } from '@jest/globals';

// Type helper for creating properly typed mocks with flexible return values

type MockedService<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: jest.MockedFunction<(...args: any[]) => any>;
};

// Mock the wrapper services to avoid real API calls
export const mockAccountsService = {
  listAccounts: jest.fn(),
  getAccount: jest.fn(),
} as MockedService<AccountsService>;

export const mockOrdersService = {
  listOrders: jest.fn(),
  getOrder: jest.fn(),
  createOrder: jest.fn(),
  createOrderPreview: jest.fn(),
  cancelOrders: jest.fn(),
  listFills: jest.fn(),
  editOrder: jest.fn(),
  editOrderPreview: jest.fn(),
  closePosition: jest.fn(),
} as MockedService<OrdersService>;

export const mockProductsService = {
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  getProductBook: jest.fn(),
  getProductCandles: jest.fn(),
  getProductCandlesBatch: jest.fn(),
  getProductMarketTrades: jest.fn(),
  getBestBidAsk: jest.fn(),
  getMarketSnapshot: jest.fn(),
} as MockedService<ProductsService>;

export const mockConvertsService = {
  createConvertQuote: jest.fn(),
  commitConvertTrade: jest.fn(),
  GetConvertTrade: jest.fn(),
} as MockedService<ConvertsService>;

export const mockFeesService = {
  getTransactionSummary: jest.fn(),
} as MockedService<FeesService>;

export const mockPaymentMethodsService = {
  listPaymentMethods: jest.fn(),
  getPaymentMethod: jest.fn(),
} as MockedService<PaymentMethodsService>;

export const mockPortfoliosService = {
  listPortfolios: jest.fn(),
  createPortfolio: jest.fn(),
  getPortfolio: jest.fn(),
  editPortfolio: jest.fn(),
  deletePortfolio: jest.fn(),
  movePortfolioFunds: jest.fn(),
} as MockedService<PortfoliosService>;

export const mockFuturesService = {
  listPositions: jest.fn(),
  getPosition: jest.fn(),
  getBalanceSummary: jest.fn(),
  listSweeps: jest.fn(),
} as MockedService<FuturesService>;

export const mockPerpetualsService = {
  listPositions: jest.fn(),
  getPosition: jest.fn(),
  getPortfolioSummary: jest.fn(),
  getPortfolioBalance: jest.fn(),
} as MockedService<PerpetualsService>;

export const mockPublicService = {
  getServerTime: jest.fn(),
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  getProductBook: jest.fn(),
  getProductCandles: jest.fn(),
  getProductMarketTrades: jest.fn(),
} as MockedService<PublicService>;

export const mockDataService = {
  getAPIKeyPermissions: jest.fn(),
} as MockedService<DataService>;

export const mockTechnicalIndicatorsService = {
  calculateRsi: jest.fn(),
  calculateMacd: jest.fn(),
  calculateSma: jest.fn(),
  calculateEma: jest.fn(),
  calculateBollingerBands: jest.fn(),
  calculateAtr: jest.fn(),
  calculateStochastic: jest.fn(),
  calculateAdx: jest.fn(),
  calculateObv: jest.fn(),
  calculateVwap: jest.fn(),
  calculateCci: jest.fn(),
  calculateWilliamsR: jest.fn(),
  calculateRoc: jest.fn(),
  calculateMfi: jest.fn(),
  calculatePsar: jest.fn(),
  calculateIchimokuCloud: jest.fn(),
  calculateKeltnerChannels: jest.fn(),
  calculateFibonacciRetracement: jest.fn(),
  detectCandlestickPatterns: jest.fn(),
  calculateVolumeProfile: jest.fn(),
  calculatePivotPoints: jest.fn(),
  detectRsiDivergence: jest.fn(),
  detectChartPatterns: jest.fn(),
  detectSwingPoints: jest.fn(),
} as MockedService<TechnicalIndicatorsService>;

export const mockTechnicalAnalysisService = {
  analyzeTechnicalIndicators: jest.fn(),
} as MockedService<TechnicalAnalysisService>;

export function mockServices(): void {
  jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => {
    return {
      CoinbaseAdvTradeClient: jest.fn().mockImplementation(() => ({})),
      CoinbaseAdvTradeCredentials: jest.fn().mockImplementation(() => ({})),
    };
  });

  jest.mock('@server/services', () => {
    return {
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
    };
  });

  jest.mock('@server/TechnicalIndicatorsService', () => {
    return {
      TechnicalIndicatorsService: jest
        .fn()
        .mockImplementation(() => mockTechnicalIndicatorsService),
    };
  });

  jest.mock('@server/TechnicalAnalysisService', () => {
    return {
      TechnicalAnalysisService: jest
        .fn()
        .mockImplementation(() => mockTechnicalAnalysisService),
    };
  });
}
