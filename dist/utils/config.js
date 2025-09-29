"use strict";
/**
 * Configuration management for Manual Chart Analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = require("dotenv");
const logger_1 = require("./logger");
// Load environment variables
(0, dotenv_1.config)();
const logger = new logger_1.Logger('Config');
// Default configuration values
const defaultConfig = {
    port: 3001,
    nodeEnv: 'development',
    openaiModel: 'gpt-4-vision-preview',
    maxTokens: 4096,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadDir: './uploads',
    minVolumeRatio: 4.0, // 400% volume increase
    minConfidence: 0.7,
    maxPositionSize: 10, // 10% of portfolio
    riskPerTrade: 2, // 2% risk per trade
    corsOrigin: ['http://localhost:3000', 'http://localhost:5173'],
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100
};
/**
 * Validate required environment variables
 */
const validateRequiredEnvVars = () => {
    const required = ['OPENAI_API_KEY', 'KITE_API_KEY', 'KITE_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    // Check for placeholder values
    const placeholders = [
        { key: 'OPENAI_API_KEY', placeholder: 'your_openai_api_key_here' },
        { key: 'KITE_API_KEY', placeholder: 'your_kite_api_key_here' },
        { key: 'KITE_API_SECRET', placeholder: 'your_kite_api_secret_here' }
    ];
    const hasPlaceholders = placeholders.filter(({ key, placeholder }) => process.env[key] === placeholder);
    if (hasPlaceholders.length > 0) {
        logger.warn(`Using placeholder values for: ${hasPlaceholders.map(p => p.key).join(', ')}. ` +
            `Please update your .env file with real API credentials.`);
    }
};
/**
 * Parse CORS origins from environment variable
 */
const parseCorsOrigins = (origins) => {
    if (!origins)
        return defaultConfig.corsOrigin || [];
    return origins.split(',').map(origin => origin.trim());
};
/**
 * Parse allowed file types from environment variable
 */
const parseAllowedFileTypes = (types) => {
    if (!types)
        return defaultConfig.allowedFileTypes || [];
    return types.split(',').map(type => type.trim());
};
/**
 * Create and validate application configuration
 */
const createConfig = () => {
    validateRequiredEnvVars();
    const config = {
        // Server Configuration
        port: parseInt(process.env.PORT || String(defaultConfig.port), 10),
        nodeEnv: process.env.NODE_ENV || defaultConfig.nodeEnv,
        // OpenAI Configuration
        openaiApiKey: process.env.OPENAI_API_KEY,
        openaiModel: process.env.OPENAI_MODEL || defaultConfig.openaiModel,
        maxTokens: parseInt(process.env.MAX_TOKENS || String(defaultConfig.maxTokens), 10),
        // Kite Connect Configuration
        kiteApiKey: process.env.KITE_API_KEY,
        kiteApiSecret: process.env.KITE_API_SECRET,
        // File Upload Configuration
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(defaultConfig.maxFileSize), 10),
        allowedFileTypes: parseAllowedFileTypes(process.env.ALLOWED_FILE_TYPES),
        uploadDir: process.env.UPLOAD_DIR || defaultConfig.uploadDir,
        // Trading Configuration
        minVolumeRatio: parseFloat(process.env.MIN_VOLUME_RATIO || String(defaultConfig.minVolumeRatio)),
        minConfidence: parseFloat(process.env.MIN_CONFIDENCE || String(defaultConfig.minConfidence)),
        maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || String(defaultConfig.maxPositionSize)),
        riskPerTrade: parseFloat(process.env.RISK_PER_TRADE || String(defaultConfig.riskPerTrade)),
        // Security Configuration
        corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(defaultConfig.rateLimitWindowMs), 10),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(defaultConfig.rateLimitMaxRequests), 10)
    };
    // Log configuration (excluding sensitive data)
    const logConfig = { ...config };
    logConfig.openaiApiKey = '***';
    logConfig.kiteApiKey = '***';
    logConfig.kiteApiSecret = '***';
    logger.info('Configuration loaded', logConfig);
    return config;
};
exports.appConfig = createConfig();
//# sourceMappingURL=config.js.map