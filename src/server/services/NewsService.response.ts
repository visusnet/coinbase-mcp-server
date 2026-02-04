import { z } from 'zod';

// =============================================================================
// Response Schemas
// =============================================================================

const SentimentResultSchema = z
  .object({
    score: z.number().describe('Raw sentiment score'),
    comparative: z.number().describe('Score normalized by word count'),
    direction: z
      .enum(['bullish', 'bearish', 'neutral'])
      .describe('Overall sentiment direction'),
  })
  .describe('Sentiment analysis result');

const ArticleWithSentimentSchema = z
  .object({
    title: z.string().describe('Article headline'),
    link: z.string().describe('URL to full article'),
    publisher: z.string().describe('News source name'),
    publishedAt: z.string().describe('Publication timestamp (ISO 8601)'),
    sentiment: SentimentResultSchema.describe('Sentiment of this headline'),
  })
  .describe('News article with sentiment');

export const GetNewsSentimentResponseSchema = z
  .object({
    productId: z.string().describe('Requested trading pair'),
    articles: z
      .array(ArticleWithSentimentSchema)
      .describe('News articles with individual sentiment'),
    aggregateSentiment: SentimentResultSchema.describe(
      'Overall sentiment across all headlines',
    ),
  })
  .describe('Response with news and sentiment analysis');

// =============================================================================
// Response Types (derived from schemas)
// =============================================================================

export type GetNewsSentimentResponse = z.output<
  typeof GetNewsSentimentResponseSchema
>;
