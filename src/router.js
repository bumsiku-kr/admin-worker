/**
 * Admin Worker Router
 * URL routing logic for admin API endpoints
 */

import { errorResponse } from "./utils/response.js";
import { toAPIError } from "./utils/errors.js";
import { handleLogin, handleSessionValidation } from "./handlers/auth.js";
import {
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
} from "./handlers/posts.js";
import { handleImageUpload } from "./handlers/images.js";
import { handleDeleteComment } from "./handlers/comments.js";

/**
 * Route configuration
 * Pattern format: "METHOD /path/pattern"
 * Path parameters: :paramName
 */
const routes = [
  // Authentication endpoints (login doesn't require auth, session does)
  { pattern: "POST /login", handler: handleLogin },
  { pattern: "GET /session", handler: handleSessionValidation },

  // Admin endpoints (auth required via middleware)
  { pattern: "POST /admin/posts", handler: handleCreatePost },
  { pattern: "PUT /admin/posts/:postId", handler: handleUpdatePost },
  { pattern: "DELETE /admin/posts/:postId", handler: handleDeletePost },
  { pattern: "POST /admin/images", handler: handleImageUpload },
  {
    pattern: "DELETE /admin/comments/:commentId",
    handler: handleDeleteComment,
  },
];

/**
 * Match a route pattern against a URL path
 * @param {string} pattern - Route pattern (e.g., "/posts/:id")
 * @param {string} path - URL path (e.g., "/posts/123")
 * @returns {Object|null} Match result with params, or null if no match
 */
function matchPattern(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  // Must have same number of parts
  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Parameter (starts with :)
    if (patternPart.startsWith(":")) {
      const paramName = patternPart.substring(1);
      params[paramName] = decodeURIComponent(pathPart);
    }
    // Literal match
    else if (patternPart !== pathPart) {
      return null;
    }
  }

  return { params };
}

/**
 * Find matching route for request
 * @param {string} method - HTTP method
 * @param {string} pathname - URL pathname
 * @returns {Object|null} Route match with handler and params
 */
function findRoute(method, pathname) {
  for (const route of routes) {
    const [routeMethod, routePattern] = route.pattern.split(" ", 2);

    // Method must match
    if (routeMethod !== method) {
      continue;
    }

    // Try to match pattern
    const match = matchPattern(routePattern, pathname);
    if (match) {
      return {
        handler: route.handler,
        params: match.params,
      };
    }
  }

  return null;
}

/**
 * Parse request body as JSON
 * @param {Request} request - Request object
 * @returns {Promise<Object>} Parsed JSON body
 */
async function parseJsonBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Extract query parameters from URL
 * @param {URL} url - URL object
 * @returns {Object} Query parameters as object
 */
function getQueryParams(url) {
  const params = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * Main router function
 * @param {Request} request - Request object
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Execution context
 * @param {Object} user - Authenticated user (if applicable)
 * @param {Logger} logger - Logger instance with request context
 * @returns {Promise<Response>} Response object
 */
export async function router(request, env, ctx, user = null, logger = null) {
  try {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Find matching route
    const match = findRoute(method, pathname);

    if (!match) {
      if (logger) {
        logger.warn("Route not found", { pathname, method });
      }
      return errorResponse("Not Found", 404);
    }

    // Create child logger with route context
    const routeLogger = logger
      ? logger.child({ handler: match.handler.name })
      : null;

    if (routeLogger) {
      routeLogger.debug("Route matched", { params: match.params });
    }

    // Call handler with separate arguments
    // Signature: handler(request, env, ctx, params, user, logger)
    const handlerStartTime = Date.now();
    const response = await match.handler(
      request,
      env,
      ctx,
      match.params,
      user,
      routeLogger,
    );
    const handlerDuration = Date.now() - handlerStartTime;

    if (routeLogger) {
      routeLogger.debug("Handler completed", {
        duration: handlerDuration,
        status: response.status,
      });
    }

    return response;
  } catch (error) {
    if (logger) {
      logger.error("Router error", error);
    } else {
      console.error("Router error:", error);
    }

    // Convert to API error
    const apiError = toAPIError(error);
    return errorResponse(apiError.message, apiError.status);
  }
}

/**
 * Register a route
 * @param {string} pattern - Route pattern (e.g., "GET /posts/:id")
 * @param {Function} handler - Route handler function
 */
export function registerRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

/**
 * Get all registered routes (for debugging)
 * @returns {Array} Array of routes
 */
export function getRoutes() {
  return routes.map((r) => r.pattern);
}
