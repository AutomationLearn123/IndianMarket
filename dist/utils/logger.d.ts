/**
 * Winston-based logging utility for Manual Chart Analysis
 */
export interface LogContext {
    [key: string]: any;
}
export declare class Logger {
    private context;
    private winston;
    constructor(context?: string);
    private formatMessage;
    error(message: string, context?: LogContext | Error): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    analysis(message: string, data: LogContext): void;
    upload(message: string, data: LogContext): void;
    signal(message: string, data: LogContext): void;
}
export declare const createLogger: (context: string) => Logger;
export declare const defaultLogger: Logger;
//# sourceMappingURL=logger.d.ts.map