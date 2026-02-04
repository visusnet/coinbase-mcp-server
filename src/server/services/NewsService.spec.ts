import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GetNewsSentimentResponseSchema } from './NewsService.response';
import { NewsService } from './NewsService';
import type YahooFinance from 'yahoo-finance2';

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => {
  const mockSearch = jest.fn();
  const MockYahooFinance = jest.fn().mockImplementation(() => ({
    search: mockSearch,
  }));
  return {
    __esModule: true,
    default: MockYahooFinance,
    mockSearch,
  };
});

describe('NewsService', () => {
  let service: NewsService;
  let mockSearch: jest.MockedFunction<
    InstanceType<typeof YahooFinance>['search']
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Get the mocked search function
    const yahooFinanceMock = await import('yahoo-finance2');
    mockSearch = (
      yahooFinanceMock as unknown as { mockSearch: typeof mockSearch }
    ).mockSearch;
    service = new NewsService();
  });

  describe('getNewsSentiment', () => {
    it('should return news articles with sentiment analysis', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'Bitcoin price surges to new highs in bullish rally',
            link: 'https://example.com/article1',
            publisher: 'CryptoNews',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
          {
            uuid: '2',
            title: 'Market crash fears as bearish sentiment spreads',
            link: 'https://example.com/article2',
            publisher: 'FinanceDaily',
            providerPublishTime: new Date('2024-01-02T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 2,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      expect(mockSearch).toHaveBeenCalledWith('BTC-USD', {
        newsCount: 10,
      });
      expect(result.productId).toBe('BTC-USD');
      expect(result.articles).toHaveLength(2);
      expect(result.articles[0].title).toBe(
        'Bitcoin price surges to new highs in bullish rally',
      );
      expect(result.articles[0].link).toBe('https://example.com/article1');
      expect(result.articles[0].publisher).toBe('CryptoNews');
      expect(result.articles[0].publishedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.articles[0].sentiment.score).toBeGreaterThan(0); // Bullish words
      expect(result.articles[0].sentiment.direction).toBe('bullish');

      expect(result.articles[1].sentiment.score).toBeLessThan(0); // Bearish words
      expect(result.articles[1].sentiment.direction).toBe('bearish');

      // Aggregate sentiment: mix of bullish and bearish articles
      expect(typeof result.aggregateSentiment.score).toBe('number');
      expect(typeof result.aggregateSentiment.comparative).toBe('number');
      expect(['bullish', 'bearish', 'neutral']).toContain(
        result.aggregateSentiment.direction,
      );
    });

    it('should handle empty news array', async () => {
      const mockSearchResult = {
        news: [],
        quotes: [],
        explains: [],
        count: 0,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'ETH-USD',
        limit: 5,
      });

      expect(result.productId).toBe('ETH-USD');
      expect(result.articles).toHaveLength(0);
      expect(result.aggregateSentiment.score).toBe(0);
      expect(result.aggregateSentiment.comparative).toBe(0);
      expect(result.aggregateSentiment.direction).toBe('neutral');
    });

    it('should apply crypto-specific sentiment words', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'HODL! Bitcoin mooning as bulls take control',
            link: 'https://example.com/moon',
            publisher: 'CryptoDaily',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 1,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      // 'mooning' (+3) + 'hodl' (+1) + 'bulls' (not in wordlist but positive) should give positive score
      expect(result.articles[0].sentiment.score).toBeGreaterThan(0);
      expect(result.articles[0].sentiment.direction).toBe('bullish');
    });

    it('should detect bearish crypto sentiment', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'Crypto crash! Investors rekt as FUD spreads',
            link: 'https://example.com/crash',
            publisher: 'FinanceNews',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 1,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      // 'crash' (-3) + 'rekt' (-3) + 'fud' (-2) should give negative score
      expect(result.articles[0].sentiment.score).toBeLessThan(0);
      expect(result.articles[0].sentiment.direction).toBe('bearish');
    });

    it('should detect neutral sentiment', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'Bitcoin price unchanged today',
            link: 'https://example.com/neutral',
            publisher: 'NewsDaily',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 1,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      // Neutral headline should have comparative close to 0
      expect(result.articles[0].sentiment.direction).toBe('neutral');
    });

    it('should calculate aggregate sentiment across multiple articles', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'Great bullish rally continues',
            link: 'https://example.com/1',
            publisher: 'News1',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
          {
            uuid: '2',
            title: 'Excellent gains for investors',
            link: 'https://example.com/2',
            publisher: 'News2',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
          {
            uuid: '3',
            title: 'Market looking positive',
            link: 'https://example.com/3',
            publisher: 'News3',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 3,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      // Aggregate should reflect overall positive sentiment
      expect(result.aggregateSentiment.score).toBeGreaterThan(0);
      expect(result.aggregateSentiment.direction).toBe('bullish');
    });

    it('should parse response through schema validation', async () => {
      const mockSearchResult = {
        news: [
          {
            uuid: '1',
            title: 'Test news article',
            link: 'https://example.com/test',
            publisher: 'TestPub',
            providerPublishTime: new Date('2024-01-01T00:00:00Z'),
            type: 'story',
          },
        ],
        quotes: [],
        explains: [],
        count: 1,
        nav: [],
        lists: [],
        researchReports: [],
        totalTime: 100,
        timeTakenForQuotes: 50,
        timeTakenForNews: 40,
        timeTakenForAlgowatchlist: 0,
        timeTakenForPredefinedScreener: 0,
        timeTakenForCrunchbase: 0,
        timeTakenForNav: 0,
        timeTakenForResearchReports: 0,
        timeTakenForScreenerField: 0,
        timeTakenForCulturalAssets: 0,
        timeTakenForSearchLists: 0,
      };

      mockSearch.mockResolvedValue(
        mockSearchResult as Awaited<
          ReturnType<InstanceType<typeof YahooFinance>['search']>
        >,
      );

      const result = await service.getNewsSentiment({
        productId: 'BTC-USD',
        limit: 10,
      });

      // Result should be valid according to schema
      const validated = GetNewsSentimentResponseSchema.safeParse(result);
      expect(validated.success).toBe(true);
    });
  });
});
