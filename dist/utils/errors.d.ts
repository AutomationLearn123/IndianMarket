/**
 * Error handling utilities for Manual Chart Analysis
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class OpenAIError extends AppError {
    constructor(message: string, originalError?: Error);
}
export declare class FileUploadError extends AppError {
    constructor(message: string);
}
export declare class ImageProcessingError extends AppError {
    constructor(message: string);
}
export declare class ChartAnalysisError extends AppError {
    constructor(message: string);
}
/**
 * Helper function to determine if an error is operational
 */
export declare const isOperationalError: (error: Error) => boolean;
/**
 * Error response formatting for API
 */
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        statusCode: number;
        timestamp: string;
    };
    stack?: string;
}
/**
 * Format error for API response
 */
export declare const formatErrorResponse: (error: Error, includeStack?: boolean) => ErrorResponse;
//# sourceMappingURL=errors.d.ts.map