/**
 * Admin Worker - Main Entry Point
 * Handles authenticated admin API requests
 */

import { router } from "./router.js";
import { errorResponse, handleCORS, addCORSHeaders } from "./utils/response.js";
import { toAPIError } from "./utils/errors.js";
import {
  createRequestLogger,
  generateCorrelationId,
  logRequestCompletion,
} from "./utils/logger.js";

export default {
  async fetch(request, env, ctx) {
    // Generate correlation ID for request tracking
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    // Create logger with request context
    const logger = createRequestLogger(request, env, correlationId);

    try {
      const allowedOrigins = env.ALLOWED_ORIGINS || "*";

      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        const response = handleCORS(allowedOrigins);
        logRequestCompletion(logger, response, startTime);
        return response;
      }

      logger.debug("Processing request");

      // Route request through router with logger
      const response = await router(request, env, ctx, null, logger);

      // Log successful request completion
      logRequestCompletion(logger, response, startTime);

      // Add CORS headers to response
      return addCORSHeaders(response, allowedOrigins);
    } catch (error) {
      // Log error with full context
      logger.error("Admin Worker Error", error);

      // Convert to API error and return error response
      const apiError = toAPIError(error);
      const errorResp = errorResponse(apiError.message, apiError.status);

      // Log error response
      logRequestCompletion(logger, errorResp, startTime);

      // Add CORS headers to error response
      return addCORSHeaders(errorResp, env.ALLOWED_ORIGINS || "*");
    }
  },
};
