/**
 * Comment Management Handler
 * Admin operations for comment moderation
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { CommentService } from "../services/index.js";

/**
 * DELETE /admin/comments/{commentId}
 * Delete comment by ID
 *
 * @param {Request} request - Delete comment request
 * @param {Object} env - Environment variables (DB binding)
 * @param {Object} params - URL parameters {commentId}
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Deletion confirmation response
 */
export async function handleDeleteComment(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    const commentId = params.commentId;
    const commentService = new CommentService(env.DB);
    const result = await commentService.deleteComment(commentId, logger);

    return successResponse(result, 200);
  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      if (logger) {
        logger.warn("Comment deletion failed", {
          commentId: params.commentId,
          error: err.message,
        });
      }
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Delete comment error", err);
    } else {
      console.error("Delete comment error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}
