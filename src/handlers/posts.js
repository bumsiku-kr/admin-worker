/**
 * Post Management Handlers
 * Admin CRUD operations for blog posts
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { PostService } from "../services/index.js";

/**
 * POST /admin/posts
 * Create new blog post
 *
 * @param {Request} request - Create post request
 * @param {Object} env - Environment variables (DB binding)
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Created post response
 */
export async function handleCreatePost(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    const body = await request.json();
    const postService = new PostService(env.DB);
    const createdPost = await postService.createPost(body, logger);

    return successResponse(createdPost, 200);
  } catch (err) {
    if (err instanceof ValidationError) {
      if (logger) {
        logger.warn("Post creation validation failed", { error: err.message });
      }
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Create post error", err);
    } else {
      console.error("Create post error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PUT /admin/posts/{postId}
 * Update existing blog post
 *
 * @param {Request} request - Update post request
 * @param {Object} env - Environment variables
 * @param {Object} params - URL parameters {postId}
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Updated post response
 */
export async function handleUpdatePost(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    const postId = parseInt(params.postId);
    if (isNaN(postId)) {
      throw new ValidationError("Invalid post ID");
    }

    const body = await request.json();
    const postService = new PostService(env.DB);
    const updatedPost = await postService.updatePost(postId, body, logger);

    return successResponse(updatedPost, 200);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      if (logger) {
        logger.warn("Post update failed", {
          postId: params.postId,
          error: err.message,
        });
      }
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Update post error", err);
    } else {
      console.error("Update post error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /admin/posts/{postId}
 * Delete blog post
 *
 * @param {Request} request - Delete post request
 * @param {Object} env - Environment variables
 * @param {Object} params - URL parameters {postId}
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Deletion confirmation response
 */
export async function handleDeletePost(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    const postId = parseInt(params.postId);
    if (isNaN(postId)) {
      throw new ValidationError("Invalid post ID");
    }

    const postService = new PostService(env.DB);
    const result = await postService.deletePost(postId, logger);

    return successResponse(result, 200);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      if (logger) {
        logger.warn("Post deletion failed", {
          postId: params.postId,
          error: err.message,
        });
      }
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Delete post error", err);
    } else {
      console.error("Delete post error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}
