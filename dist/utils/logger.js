"use strict";
/**
 * Winston-based logging utility for Manual Chart Analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.createLogger = exports.Logger = void 0;
const winston = require('winston');
const path = require('path');
const fs = require('fs');
// Define log levels and colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};
winston.addColors(logColors);
// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
// Define log format
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize({ all: true }), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    format: winston.format.json(),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: logFormat
        }),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        })
    ]
});
class Logger {
    constructor(context = 'Application') {
        this.context = context;
        this.winston = logger;
    }
    formatMessage(message, context) {
        const prefix = `[${this.context}]`;
        if (context) {
            const contextStr = Object.keys(context).length > 0 ?
                ` ${JSON.stringify(context)}` : '';
            return `${prefix} ${message}${contextStr}`;
        }
        return `${prefix} ${message}`;
    }
    error(message, context) {
        if (context instanceof Error) {
            this.winston.error(this.formatMessage(message), {
                error: {
                    message: context.message,
                    stack: context.stack,
                    name: context.name
                }
            });
        }
        else {
            this.winston.error(this.formatMessage(message, context));
        }
    }
    warn(message, context) {
        this.winston.warn(this.formatMessage(message, context));
    }
    info(message, context) {
        this.winston.info(this.formatMessage(message, context));
    }
    debug(message, context) {
        this.winston.debug(this.formatMessage(message, context));
    }
    // Analysis-specific logging methods
    analysis(message, data) {
        this.info(`ANALYSIS: ${message}`, data);
    }
    upload(message, data) {
        this.info(`UPLOAD: ${message}`, data);
    }
    signal(message, data) {
        this.info(`SIGNAL: ${message}`, data);
    }
}
exports.Logger = Logger;
const createLogger = (context) => {
    return new Logger(context);
};
exports.createLogger = createLogger;
exports.defaultLogger = new Logger();
//# sourceMappingURL=logger.js.map