import YahooFinance from 'yahoo-finance2';
import Sentiment from 'sentiment';
import type { GetNewsSentimentRequest } from './NewsService.request';
import type { GetNewsSentimentResponse } from './NewsService.response';
import { GetNewsSentimentResponseSchema } from './NewsService.response';
import { CRYPTO_SENTIMENT_WORDS } from './NewsService.crypto-wordlist';

/**
 * Service for fetching crypto news with sentiment analysis.
 * Uses Yahoo Finance for news and AFINN-165 with crypto extensions for sentiment.
 */
export class NewsService {
  private readonly analyzer: Sentiment;
  private readonly yahooFinance: InstanceType<typeof YahooFinance>;

  constructor() {
    this.analyzer = new Sentiment();
    this.yahooFinance = new YahooFinance();
  }

  /**
   * Get news articles with sentiment analysis for a trading pair.
   */
  public async getNewsSentiment(
    request: GetNewsSentimentRequest,
  ): Promise<GetNewsSentimentResponse> {
    const searchResult = await this.yahooFinance.search(request.productId, {
      newsCount: request.limit,
    });

    const articles = searchResult.news.map((article) => {
      const sentimentResult = this.analyzer.analyze(article.title, {
        extras: CRYPTO_SENTIMENT_WORDS,
      });

      return {
        title: article.title,
        link: article.link,
        publisher: article.publisher,
        publishedAt: article.providerPublishTime.toISOString(),
        sentiment: {
          score: sentimentResult.score,
          comparative: sentimentResult.comparative,
          direction: this.getDirection(sentimentResult.comparative),
        },
      };
    });

    const totalScore = articles.reduce((sum, a) => sum + a.sentiment.score, 0);
    const avgComparative =
      articles.length > 0
        ? articles.reduce((sum, a) => sum + a.sentiment.comparative, 0) /
          articles.length
        : 0;

    return GetNewsSentimentResponseSchema.parse({
      productId: request.productId,
      articles,
      aggregateSentiment: {
        score: totalScore,
        comparative: avgComparative,
        direction: this.getDirection(avgComparative),
      },
    });
  }

  private getDirection(comparative: number): 'bullish' | 'bearish' | 'neutral' {
    if (comparative > 0.05) {
      return 'bullish';
    }
    if (comparative < -0.05) {
      return 'bearish';
    }
    return 'neutral';
  }
}
