/**
 * Error handling utilities for Manual Chart Analysis
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class OpenAIError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`OpenAI API Error: ${message}`, 503);
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
}

export class FileUploadError extends AppError {
  constructor(message: string) {
    super(`File Upload Error: ${message}`, 400);
  }
}

export class ImageProcessingError extends AppError {
  constructor(message: string) {
    super(`Image Processing Error: ${message}`, 422);
  }
}

export class ChartAnalysisError extends AppError {
  constructor(message: string) {
    super(`Chart Analysis Error: ${message}`, 422);
  }
}

/**
 * Helper function to determine if an error is operational
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

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
export const formatErrorResponse = (error: Error, includeStack: boolean = false): ErrorResponse => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  
  const response: ErrorResponse = {
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
