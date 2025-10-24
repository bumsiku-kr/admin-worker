/**
 * Authentication Handlers
 * Login and session validation endpoints
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";
import { AuthService } from "../services/index.js";

/**
 * POST /login
 * Admin login and JWT token generation
 *
 * @param {Request} request - Login request
 * @param {Object} env - Environment variables
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Login response with JWT token
 */
export async function handleLogin(request, env, ctx, params, user, logger) {
  try {
    const body = await request.json();
    const authService = new AuthService(env.DB);
    const result = await authService.login(body, env, logger);

    return successResponse(result, 200);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Login error", err);
    } else {
      console.error("Login error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}

/**
 * GET /session
 * Validate current session/token
 *
 * @param {Request} request - Session validation request
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Context
 * @param {Object} params - URL parameters
 * @param {Object} user - Authenticated user from middleware
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Session validation response
 */
export async function handleSessionValidation(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    const authService = new AuthService(env.DB);
    const result = await authService.validateSession(user, logger);

    return successResponse(result, 200);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Session validation error", err);
    } else {
      console.error("Session validation error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}
