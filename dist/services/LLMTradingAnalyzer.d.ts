/**
 * LLM Trading Signal Generator
 * Processes market data and generates trading signals using OpenAI
 */
export interface TradingSignalRequest {
    symbol: string;
    currentPrice: number;
    volume: number;
    historicalData: any[];
    volumeFootprint: any;
    marketContext: any;
}
export interface TradingSignal {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD' | 'NO_TRADE';
    confidence: number;
    reasoning: string;
    entryPrice: number;
    stopLoss: number;
    target: number;
    riskRewardRatio: number;
    timestamp: string;
}
export declare class LLMTradingAnalyzer {
    generateTradingSignal(marketData: TradingSignalRequest): Promise<TradingSignal>;
    private buildAnalysisPrompt;
    private parseSignalFromAnalysis;
    private extractAction;
    private extractConfidence;
    private calculateStopLoss;
    private calculateTarget;
    private calculateRiskReward;
    private getDefaultSignal;
    private generateMockSignal;
}
export declare const llmAnalyzer: LLMTradingAnalyzer;
//# sourceMappingURL=LLMTradingAnalyzer.d.ts.map