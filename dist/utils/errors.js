"use strict";
/**
 * Error handling utilities for Manual Chart Analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.isOperationalError = exports.ChartAnalysisError = exports.ImageProcessingError = exports.FileUploadError = exports.OpenAIError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class OpenAIError extends AppError {
    constructor(message, originalError) {
        super(`OpenAI API Error: ${message}`, 503);
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }
}
exports.OpenAIError = OpenAIError;
class FileUploadError extends AppError {
    constructor(message) {
        super(`File Upload Error: ${message}`, 400);
    }
}
exports.FileUploadError = FileUploadError;
class ImageProcessingError extends AppError {
    constructor(message) {
        super(`Image Processing Error: ${message}`, 422);
    }
}
exports.ImageProcessingError = ImageProcessingError;
class ChartAnalysisError extends AppError {
    constructor(message) {
        super(`Chart Analysis Error: ${message}`, 422);
    }
}
exports.ChartAnalysisError = ChartAnalysisError;
/**
 * Helper function to determine if an error is operational
 */
const isOperationalError = (error) => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};
exports.isOperationalError = isOperationalError;
/**
 * Format error for API response
 */
const formatErrorResponse = (error, includeStack = false) => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const response = {
        success: false,
        error: {
            message: error.message || 'Internal Server Error',
            statusCode,
            timestamp: new Date().toISOString(),
        }
    };
    if (error instanceof AppError && error.name) {
        response.error.code = error.name;
    }
    if (includeStack && error.stack) {
        response.stack = error.stack;
    }
    return response;
};
exports.formatErrorResponse = formatErrorResponse;
//# sourceMappingURL=errors.js.map