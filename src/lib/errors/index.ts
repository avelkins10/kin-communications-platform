import { logger } from '../logging/logger';

// Base error class
export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// API Errors
export class ApiError extends BaseError {
  constructor(
    message: string,
    statusCode: number = 500,
    context?: any
  ) {
    super(message, statusCode, true, context);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, context?: any) {
    super(message, 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, context?: any) {
    super(message, 409, context);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Database Errors
export class DatabaseError extends BaseError {
  constructor(message: string, context?: any) {
    super(message, 500, true, context);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string = 'Database connection failed') {
    super(message, { type: 'connection' });
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, query?: string) {
    super(message, { type: 'query', query });
    this.name = 'QueryError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, context?: any) {
    super(message, { type: 'transaction', ...context });
    this.name = 'TransactionError';
  }
}

// External Service Errors
export class ExternalServiceError extends BaseError {
  public readonly service: string;
  public readonly originalError?: any;

  constructor(
    service: string,
    message: string,
    originalError?: any,
    context?: any
  ) {
    super(message, 502, true, { service, ...context });
    this.service = service;
    this.originalError = originalError;
    this.name = 'ExternalServiceError';
  }
}

export class TwilioError extends ExternalServiceError {
  constructor(message: string, originalError?: any, context?: any) {
    super('Twilio', message, originalError, context);
    this.name = 'TwilioError';
  }
}

export class QuickBaseError extends ExternalServiceError {
  constructor(message: string, originalError?: any, context?: any) {
    super('QuickBase', message, originalError, context);
    this.name = 'QuickBaseError';
  }
}


// Authentication & Authorization Errors
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, 401, true, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, 403, true, context);
    this.name = 'AuthorizationError';
  }
}

export class SessionError extends BaseError {
  constructor(message: string = 'Invalid session', context?: any) {
    super(message, 401, true, context);
    this.name = 'SessionError';
  }
}

// File & Upload Errors
export class FileError extends BaseError {
  constructor(message: string, context?: any) {
    super(message, 400, true, context);
    this.name = 'FileError';
  }
}

export class UploadError extends FileError {
  constructor(message: string, context?: any) {
    super(message, context);
    this.name = 'UploadError';
  }
}

export class FileSizeError extends FileError {
  constructor(maxSize: number, actualSize: number) {
    super(`File size ${actualSize} exceeds maximum allowed size ${maxSize}`, {
      maxSize,
      actualSize,
    });
    this.name = 'FileSizeError';
  }
}

export class FileTypeError extends FileError {
  constructor(allowedTypes: string[], actualType: string) {
    super(`File type ${actualType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, {
      allowedTypes,
      actualType,
    });
    this.name = 'FileTypeError';
  }
}

// Webhook Errors
export class WebhookError extends BaseError {
  public readonly webhookType: string;
  public readonly payload?: any;

  constructor(
    webhookType: string,
    message: string,
    payload?: any,
    context?: any
  ) {
    super(message, 400, true, { webhookType, ...context });
    this.webhookType = webhookType;
    this.payload = payload;
    this.name = 'WebhookError';
  }
}

export class WebhookValidationError extends WebhookError {
  constructor(webhookType: string, message: string, payload?: any) {
    super(webhookType, message, payload);
    this.name = 'WebhookValidationError';
  }
}

// TaskRouter Errors
export class TaskRouterError extends ExternalServiceError {
  constructor(message: string, originalError?: any, context?: any) {
    super('TaskRouter', message, originalError, context);
    this.name = 'TaskRouterError';
  }
}

export class WorkerError extends TaskRouterError {
  constructor(message: string, workerId?: string, context?: any) {
    super(message, undefined, { workerId, ...context });
    this.name = 'WorkerError';
  }
}

export class TaskError extends TaskRouterError {
  constructor(message: string, taskId?: string, context?: any) {
    super(message, undefined, { taskId, ...context });
    this.name = 'TaskError';
  }
}

// Error handling utilities
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

export const getErrorStatusCode = (error: Error): number => {
  if (error instanceof BaseError) {
    return error.statusCode;
  }
  return 500;
};

export const getErrorContext = (error: Error): any => {
  if (error instanceof BaseError) {
    return error.context;
  }
  return undefined;
};

// Error logging utility
export const logError = (error: Error, context?: any): void => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context: context || getErrorContext(error),
    isOperational: isOperationalError(error),
    statusCode: getErrorStatusCode(error),
  };

  if (isOperationalError(error)) {
    logger.warn('Operational Error', errorInfo);
  } else {
    logger.error('System Error', errorInfo);
  }
};

// Error response formatter
export const formatErrorResponse = (error: Error, includeStack: boolean = false) => {
  const statusCode = getErrorStatusCode(error);
  const context = getErrorContext(error);
  
  const response: any = {
    error: {
      name: error.name,
      message: error.message,
      statusCode,
    },
  };

  if (context) {
    response.error.context = context;
  }

  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error boundary for React components
export class ErrorBoundary extends Error {
  public readonly component: string;
  public readonly props?: any;

  constructor(component: string, message: string, props?: any) {
    super(message);
    this.component = component;
    this.props = props;
    this.name = 'ErrorBoundary';
  }
}

// Retry utility for external service calls
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Don't retry operational errors
      if (isOperationalError(lastError)) {
        throw lastError;
      }
      
      logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
        error: lastError.message,
        attempt,
        maxRetries,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError(
          'Circuit Breaker',
          'Service is temporarily unavailable',
          undefined,
          { state: this.state }
        );
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFailures(): number {
    return this.failures;
  }
}

export default {
  BaseError,
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  ExternalServiceError,
  TwilioError,
  QuickBaseError,
  AuthenticationError,
  AuthorizationError,
  SessionError,
  FileError,
  UploadError,
  FileSizeError,
  FileTypeError,
  WebhookError,
  WebhookValidationError,
  TaskRouterError,
  WorkerError,
  TaskError,
  isOperationalError,
  getErrorStatusCode,
  getErrorContext,
  logError,
  formatErrorResponse,
  asyncHandler,
  ErrorBoundary,
  retryOperation,
  CircuitBreaker,
};
