/**
 * Base class for tool execution errors.
 */
export class ToolError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
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
}

/**
 * Helper to wrap tool execution with error handling.
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ToolError) {
      // Re-throw if it's already a ToolError
      // We might want to add context if it's missing
      throw error;
    }
    
    // Wrap unknown errors
    const message = error instanceof Error ? error.message : String(error);
    throw new ToolError(
      `Error in ${context}: ${message}`,
      ErrorCode.UNKNOWN,
      error
    );
  }
}

/**
 * Formats an error for display/logging.
 */
export function formatError(error: unknown): string {
  if (error instanceof ToolError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return `[ERROR] ${error.message}`;
  }
  return `[UNKNOWN] ${String(error)}`;
}
