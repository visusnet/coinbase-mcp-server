import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NewsService } from '../services';
import { GetNewsSentimentRequestSchema } from '../services/NewsService.request';
import { VIEW_API } from './annotations';
import { ToolRegistry } from './ToolRegistry';

/**
 * Registry for news and sentiment MCP tools.
 */
export class NewsToolRegistry extends ToolRegistry {
  constructor(
    server: McpServer,
    private readonly newsService: NewsService,
  ) {
    super(server);
  }

  public register(): void {
    this.registerTool(
      'get_news_sentiment',
      {
        title: 'Get News with Sentiment',
        description:
          'Fetch recent news articles for a trading pair and analyze their sentiment. ' +
          'Returns headlines with individual sentiment scores and an aggregate sentiment direction.',
        inputSchema: GetNewsSentimentRequestSchema.shape,
        annotations: VIEW_API,
      },
      this.newsService.getNewsSentiment.bind(this.newsService),
    );
  }
}
