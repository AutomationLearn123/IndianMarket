/**
 * Configuration management for Manual Chart Analysis
 */
export interface AppConfig {
    port: number;
    nodeEnv: string;
    openaiApiKey: string;
    openaiModel: string;
    maxTokens: number;
    kiteApiKey: string;
    kiteApiSecret: string;
    kiteRequestToken?: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    uploadDir: string;
    minVolumeRatio: number;
    minConfidence: number;
    maxPositionSize: number;
    riskPerTrade: number;
    corsOrigin: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
}
export declare const appConfig: AppConfig;
//# sourceMappingURL=config.d.ts.map