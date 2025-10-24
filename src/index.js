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
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    const logger = createRequestLogger(request, env, correlationId);

    try {
      const allowedOrigins = env.ALLOWED_ORIGINS || "*";

      if (request.method === "OPTIONS") {
        const response = handleCORS(allowedOrigins);
        logRequestCompletion(logger, response, startTime);
        return response;
      }

      logger.debug("Processing request");

      const response = await router(request, env, ctx, null, logger);

      logRequestCompletion(logger, response, startTime);

      return addCORSHeaders(response, allowedOrigins);
    } catch (error) {
      logger.error("Admin Worker Error", error);

      const apiError = toAPIError(error);
      const errorResp = errorResponse(apiError.message, apiError.status);

      logRequestCompletion(logger, errorResp, startTime);

      return addCORSHeaders(errorResp, env.ALLOWED_ORIGINS || "*");
    }
  },
};
