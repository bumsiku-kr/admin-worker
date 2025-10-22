/**
 * Authentication Handlers
 * Login and session validation endpoints
 */

import { generateJWT, createPayload } from '../auth/validators.js';
import { validateCredentials } from '../auth/middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { validateLoginRequest } from '../utils/validation.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';

/**
 * POST /login
 * Admin login and JWT token generation
 *
 * @param {Request} request - Login request
 * @param {Object} env - Environment variables
 * @returns {Promise<Response>} Login response with JWT token
 */
export async function handleLogin(request, env, ctx, params, user) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateLoginRequest(body);

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Validate credentials
    const authResult = await validateCredentials(request, env);

    if (!authResult.valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get JWT expiry from environment (default: 7200 seconds = 2 hours)
    const expirySeconds = parseInt(env.JWT_EXPIRY || '7200');

    // Generate JWT token
    const payload = createPayload(authResult.userId, expirySeconds);
    const token = await generateJWT(payload, env.JWT_SECRET);

    // Return success response
    return successResponse({
      token,
      expiresIn: expirySeconds
    }, 200);

  } catch (err) {
    if (err instanceof ValidationError || err instanceof UnauthorizedError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Login error:', err);
    return errorResponse('Internal server error', 500);
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
 * @returns {Promise<Response>} Session validation response
 */
export async function handleSessionValidation(request, env, ctx, params, user) {
  try {
    // If we reach here, authentication middleware has already validated the token
    if (!user) {
      throw new UnauthorizedError('Invalid or missing token');
    }

    // Calculate expiration time from token payload
    const expiresAt = new Date(user.exp * 1000).toISOString();

    return successResponse({
      valid: true,
      userId: user.userId,
      expiresAt
    }, 200);

  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Session validation error:', err);
    return errorResponse('Internal server error', 500);
  }
}
