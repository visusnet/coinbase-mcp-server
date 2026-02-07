import { ConditionEvaluator } from './ConditionEvaluator';
import type { WaitForMarketEventRequest } from './MarketEventService.request';
import {
  WaitForMarketEventResponseSchema,
  type WaitForMarketEventResponse,
} from './MarketEventService.response';
import { MarketEventSession } from './MarketEventSession';
import type { RealTimeData } from './RealTimeData';
import type { TechnicalIndicatorsService } from './TechnicalIndicatorsService';

/**
 * Service for monitoring market events via WebSocket.
 */
export class MarketEventService {
  private readonly conditionEvaluator: ConditionEvaluator;

  constructor(
    private readonly realTimeData: RealTimeData,
    indicatorsService: TechnicalIndicatorsService,
  ) {
    this.conditionEvaluator = new ConditionEvaluator(indicatorsService);
  }

  /**
   * Waits for market conditions to be met or timeout.
   */
  public async waitForEvent(
    request: WaitForMarketEventRequest,
  ): Promise<WaitForMarketEventResponse> {
    const session = new MarketEventSession(
      request,
      this.realTimeData,
      this.conditionEvaluator,
    );
    return WaitForMarketEventResponseSchema.parse(await session.start());
  }
}
