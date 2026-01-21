import { describe, it, expect } from '@jest/globals';
import {
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
} from './index';

describe('services barrel exports', () => {
  it('should export AccountsService', () => {
    expect(AccountsService).toBeDefined();
  });

  it('should export OrdersService', () => {
    expect(OrdersService).toBeDefined();
  });

  it('should export ConvertsService', () => {
    expect(ConvertsService).toBeDefined();
  });

  it('should export FeesService', () => {
    expect(FeesService).toBeDefined();
  });

  it('should export PaymentMethodsService', () => {
    expect(PaymentMethodsService).toBeDefined();
  });

  it('should export PortfoliosService', () => {
    expect(PortfoliosService).toBeDefined();
  });

  it('should export FuturesService', () => {
    expect(FuturesService).toBeDefined();
  });

  it('should export PerpetualsService', () => {
    expect(PerpetualsService).toBeDefined();
  });

  it('should export DataService', () => {
    expect(DataService).toBeDefined();
  });

  it('should export ProductsService', () => {
    expect(ProductsService).toBeDefined();
  });

  it('should export PublicService', () => {
    expect(PublicService).toBeDefined();
  });
});
