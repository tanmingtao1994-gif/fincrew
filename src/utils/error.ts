/**
 * Standard error codes for tools.
 */
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RISK_CONTROL_ERROR = 'RISK_CONTROL_ERROR',
}

/**
 * Base class for tool execution errors.
 */
export class ToolError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: ErrorCode | string = ErrorCode.UNKNOWN, details?: any) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToolError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Helper to wrap tool execution with error handling.
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  errorCode: ErrorCode = ErrorCode.UNKNOWN
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ToolError) {
      // If it's already a ToolError, preserve it but maybe add context if needed
      // For now, we just rethrow to avoid masking the original error code
      throw error;
    }
    
    // Wrap unknown errors
    let message = 'Unknown error';
    try {
        message = error instanceof Error ? error.message : String(error);
    } catch (e) {
        message = 'Could not stringify error';
    }
    throw new ToolError(
      `Error in ${context}: ${message}`,
      errorCode,
      { originalError: error }
    );
  }
}

/**
 * Formats an error for display/logging.
 */
export function formatError(error: unknown): string {
  if (error instanceof ToolError) {
    const details = error.details ? ` Details: ${JSON.stringify(error.details)}` : '';
    return `[${error.code}] ${error.message}${details}`;
  }
  if (error instanceof Error) {
    return `[ERROR] ${error.message}`;
  }
  return `[UNKNOWN] ${String(error)}`;
}
