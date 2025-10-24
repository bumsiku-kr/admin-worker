/**
 * Centralized Logger Utility
 * Structured logging for Cloudflare Workers with request context
 * Follows Cloudflare Workers best practices for observability
 */

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

/**
 * Logger class for structured logging
 */
export class Logger {
  constructor(context = {}) {
    this.context = context;
  }

  /**
   * Create structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Structured log entry
   */
  createLogEntry(level, message, meta = {}) {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...this.context,
      ...meta,
    };
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or metadata
   */
  error(message, error = {}) {
    const meta =
      error instanceof Error
        ? {
            error: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

    const logEntry = this.createLogEntry(LogLevel.ERROR, message, meta);
    console.error(JSON.stringify(logEntry));
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    const logEntry = this.createLogEntry(LogLevel.WARN, message, meta);
    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    const logEntry = this.createLogEntry(LogLevel.INFO, message, meta);
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.context.environment !== "production") {
      const logEntry = this.createLogEntry(LogLevel.DEBUG, message, meta);
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Create child logger with additional context
   * @param {Object} additionalContext - Context to add
   * @returns {Logger} New logger instance with merged context
   */
  child(additionalContext) {
    return new Logger({
      ...this.context,
      ...additionalContext,
    });
  }
}

/**
 * Create logger with request context
 * @param {Request} request - Request object
 * @param {Object} env - Environment variables
 * @param {string} correlationId - Request correlation ID
 * @returns {Logger} Logger instance with request context
 */
export function createRequestLogger(request, env, correlationId) {
  const url = new URL(request.url);

  return new Logger({
    correlationId,
    method: request.method,
    path: url.pathname,
    environment: env.ENVIRONMENT || "development",
  });
}

/**
 * Generate correlation ID for request tracking
 * @returns {string} Unique correlation ID
 */
export function generateCorrelationId() {
  return `req_${crypto.randomUUID()}`;
}

/**
 * Log request completion with metrics
 * @param {Logger} logger - Logger instance
 * @param {Response} response - Response object
 * @param {number} startTime - Request start timestamp
 */
export function logRequestCompletion(logger, response, startTime) {
  const duration = Date.now() - startTime;

  logger.info("Request completed", {
    status: response.status,
    duration,
    statusText: response.statusText,
  });
}

/**
 * Log database operation with timing
 * @param {Logger} logger - Logger instance
 * @param {string} operation - Operation description
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>} Function result
 */
export async function logDatabaseOperation(logger, operation, fn) {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logger.debug(`Database operation: ${operation}`, { duration });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`Database operation failed: ${operation}`, {
      error,
      duration,
    });

    throw error;
  }
}
