import {
  AccountsService,
  OrdersService,
  ProductsService,
  ConvertsService,
  FeesService,
  PaymentMethodsService,
  PortfoliosService,
  FuturesService,
  PerpetualsService,
  PublicService,
  DataService,
} from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import { jest } from '@jest/globals';

// Mock the SDK services to avoid real API calls
export const mockAccountsService: Record<
  keyof AccountsService,
  jest.MockedFunction<AccountsService[keyof AccountsService]>
> = {
  listAccounts: jest
    .fn<typeof mockAccountsService.listAccounts>()
    .mockRejectedValue(new Error('Not implemented')),
  getAccount: jest
    .fn<typeof mockAccountsService.getAccount>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockOrdersService: Record<
  keyof OrdersService,
  jest.MockedFunction<OrdersService[keyof OrdersService]>
> = {
  listOrders: jest
    .fn<typeof mockOrdersService.listOrders>()
    .mockRejectedValue(new Error('Not implemented')),
  getOrder: jest
    .fn<typeof mockOrdersService.getOrder>()
    .mockRejectedValue(new Error('Not implemented')),
  createOrder: jest
    .fn<typeof mockOrdersService.createOrder>()
    .mockRejectedValue(new Error('Not implemented')),
  createOrderPreview: jest
    .fn<typeof mockOrdersService.createOrderPreview>()
    .mockRejectedValue(new Error('Not implemented')),
  cancelOrders: jest
    .fn<typeof mockOrdersService.cancelOrders>()
    .mockRejectedValue(new Error('Not implemented')),
  listFills: jest
    .fn<typeof mockOrdersService.listFills>()
    .mockRejectedValue(new Error('Not implemented')),
  editOrder: jest
    .fn<typeof mockOrdersService.editOrder>()
    .mockRejectedValue(new Error('Not implemented')),
  editOrderPreview: jest
    .fn<typeof mockOrdersService.editOrderPreview>()
    .mockRejectedValue(new Error('Not implemented')),
  closePosition: jest
    .fn<typeof mockOrdersService.closePosition>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockProductsService: Record<
  keyof ProductsService,
  jest.MockedFunction<ProductsService[keyof ProductsService]>
> = {
  listProducts: jest
    .fn<typeof mockProductsService.listProducts>()
    .mockRejectedValue(new Error('Not implemented')),
  getProduct: jest
    .fn<typeof mockProductsService.getProduct>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductBook: jest
    .fn<typeof mockProductsService.getProductBook>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductCandles: jest
    .fn<typeof mockProductsService.getProductCandles>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductMarketTrades: jest
    .fn<typeof mockProductsService.getProductMarketTrades>()
    .mockRejectedValue(new Error('Not implemented')),
  getBestBidAsk: jest
    .fn<typeof mockProductsService.getBestBidAsk>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockConvertsService: Record<
  keyof ConvertsService,
  jest.MockedFunction<ConvertsService[keyof ConvertsService]>
> = {
  createConvertQuote: jest
    .fn<typeof mockConvertsService.createConvertQuote>()
    .mockRejectedValue(new Error('Not implemented')),
  commitConvertTrade: jest
    .fn<typeof mockConvertsService.commitConvertTrade>()
    .mockRejectedValue(new Error('Not implemented')),
  GetConvertTrade: jest
    .fn<typeof mockConvertsService.GetConvertTrade>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockFeesService: Record<
  keyof FeesService,
  jest.MockedFunction<FeesService[keyof FeesService]>
> = {
  getTransactionSummary: jest
    .fn<typeof mockFeesService.getTransactionSummary>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockPaymentMethodsService: Record<
  keyof PaymentMethodsService,
  jest.MockedFunction<PaymentMethodsService[keyof PaymentMethodsService]>
> = {
  listPaymentMethods: jest
    .fn<typeof mockPaymentMethodsService.listPaymentMethods>()
    .mockRejectedValue(new Error('Not implemented')),
  getPaymentMethod: jest
    .fn<typeof mockPaymentMethodsService.getPaymentMethod>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockPortfoliosService: Record<
  keyof PortfoliosService,
  jest.MockedFunction<PortfoliosService[keyof PortfoliosService]>
> = {
  listPortfolios: jest
    .fn<typeof mockPortfoliosService.listPortfolios>()
    .mockRejectedValue(new Error('Not implemented')),
  createPortfolio: jest
    .fn<typeof mockPortfoliosService.createPortfolio>()
    .mockRejectedValue(new Error('Not implemented')),
  getPortfolio: jest
    .fn<typeof mockPortfoliosService.getPortfolio>()
    .mockRejectedValue(new Error('Not implemented')),
  editPortfolio: jest
    .fn<typeof mockPortfoliosService.editPortfolio>()
    .mockRejectedValue(new Error('Not implemented')),
  deletePortfolio: jest
    .fn<typeof mockPortfoliosService.deletePortfolio>()
    .mockRejectedValue(new Error('Not implemented')),
  movePortfolioFunds: jest
    .fn<typeof mockPortfoliosService.movePortfolioFunds>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockFuturesService: Record<
  keyof FuturesService,
  jest.MockedFunction<FuturesService[keyof FuturesService]>
> = {
  listPositions: jest
    .fn<typeof mockFuturesService.listPositions>()
    .mockRejectedValue(new Error('Not implemented')),
  getPosition: jest
    .fn<typeof mockFuturesService.getPosition>()
    .mockRejectedValue(new Error('Not implemented')),
  getBalanceSummary: jest
    .fn<typeof mockFuturesService.getBalanceSummary>()
    .mockRejectedValue(new Error('Not implemented')),
  listSweeps: jest
    .fn<typeof mockFuturesService.listSweeps>()
    .mockRejectedValue(new Error('Not implemented')),
  getIntradayMarginSetting: jest
    .fn<typeof mockFuturesService.getIntradayMarginSetting>()
    .mockRejectedValue(new Error('Not implemented')),
  getCurrentMarginWindow: jest
    .fn<typeof mockFuturesService.getCurrentMarginWindow>()
    .mockRejectedValue(new Error('Not implemented')),
  updateIntradayMarginSetting: jest
    .fn<typeof mockFuturesService.updateIntradayMarginSetting>()
    .mockRejectedValue(new Error('Not implemented')),
  scheduleSweep: jest
    .fn<typeof mockFuturesService.scheduleSweep>()
    .mockRejectedValue(new Error('Not implemented')),
  cancelPendingSweep: jest
    .fn<typeof mockFuturesService.cancelPendingSweep>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockPerpetualsService: Record<
  keyof PerpetualsService,
  jest.MockedFunction<PerpetualsService[keyof PerpetualsService]>
> = {
  listPositions: jest
    .fn<typeof mockPerpetualsService.listPositions>()
    .mockRejectedValue(new Error('Not implemented')),
  getPosition: jest
    .fn<typeof mockPerpetualsService.getPosition>()
    .mockRejectedValue(new Error('Not implemented')),
  getPortfolioSummary: jest
    .fn<typeof mockPerpetualsService.getPortfolioSummary>()
    .mockRejectedValue(new Error('Not implemented')),
  getPortfolioBalance: jest
    .fn<typeof mockPerpetualsService.getPortfolioBalance>()
    .mockRejectedValue(new Error('Not implemented')),
  createAllocatePortfolio: jest
    .fn<typeof mockPerpetualsService.createAllocatePortfolio>()
    .mockRejectedValue(new Error('Not implemented')),
  updateMultiAssetCollateral: jest
    .fn<typeof mockPerpetualsService.updateMultiAssetCollateral>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockPublicService: Record<
  keyof PublicService,
  jest.MockedFunction<PublicService[keyof PublicService]>
> = {
  getServerTime: jest
    .fn<typeof mockPublicService.getServerTime>()
    .mockRejectedValue(new Error('Not implemented')),
  listProducts: jest
    .fn<typeof mockPublicService.listProducts>()
    .mockRejectedValue(new Error('Not implemented')),
  getProduct: jest
    .fn<typeof mockPublicService.getProduct>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductBook: jest
    .fn<typeof mockPublicService.getProductBook>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductCandles: jest
    .fn<typeof mockPublicService.getProductCandles>()
    .mockRejectedValue(new Error('Not implemented')),
  getProductMarketTrades: jest
    .fn<typeof mockPublicService.getProductMarketTrades>()
    .mockRejectedValue(new Error('Not implemented')),
};

export const mockDataService: Record<
  keyof DataService,
  jest.MockedFunction<DataService[keyof DataService]>
> = {
  getAPIKeyPermissions: jest
    .fn<typeof mockDataService.getAPIKeyPermissions>()
    .mockRejectedValue(new Error('Not implemented')),
};

export function mockServices() {
  jest.mock('@coinbase-sample/advanced-trade-sdk-ts/dist/index.js', () => {
    return {
      CoinbaseAdvTradeClient: jest.fn().mockImplementation(() => ({})),
      CoinbaseAdvTradeCredentials: jest.fn().mockImplementation(() => ({})),
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
}
