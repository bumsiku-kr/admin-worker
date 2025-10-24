/**
 * Authentication Middleware
 * JWT-based authentication for admin endpoints
 */

import { validateJWT } from "./validators.js";
import { errorResponse } from "../utils/response.js";

/**
 * Authenticate request using JWT Bearer token
 * Exempts login and session endpoints from authentication
 *
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|Response>} Auth result or error response
 */
export async function authenticate(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const publicEndpoints = ["/login", "/session"];
  const isPublicEndpoint = publicEndpoints.some(
    (endpoint) => pathname === endpoint,
  );

  if (pathname === "/session") {
    return await verifyToken(request, env);
  }

  if (isPublicEndpoint) {
    return { authorized: true, user: null };
  }

  return await verifyToken(request, env);
}

/**
 * Verify JWT token from Authorization header
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|Response>} Auth result or error response
 */
async function verifyToken(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(
      "Unauthorized - Missing or invalid authorization header",
      401,
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = await validateJWT(token, env.JWT_SECRET);
    return { authorized: true, user: payload };
  } catch (err) {
    return errorResponse(`Unauthorized - ${err.message}`, 401);
  }
}

/**
 * Extract and validate credentials from login request
 * @param {Request} request - Login request
 * @param {Object} env - Environment variables
 * @returns {Promise<{valid: boolean, userId?: number}>} Validation result
 */
export async function validateCredentials(request, env) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return { valid: false };
    }

    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      return { valid: true, userId: 1 };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Alternative: HTTP Basic Auth (simpler but less secure)
 * Not used in current implementation, but available for reference
 *
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {Object|Response} Auth result or error response
 */
export function basicAuth(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
        "Content-Type": "text/plain",
      },
    });
  }

  const credentials = atob(authHeader.substring(6));
  const [username, password] = credentials.split(":");

  if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
    return { authorized: true, user: { username } };
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: { "Content-Type": "text/plain" },
  });
}
