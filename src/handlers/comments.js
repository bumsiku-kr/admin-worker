/**
 * Comment Management Handler
 * Admin operations for comment moderation
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * DELETE /admin/comments/{commentId}
 * Delete comment by ID
 *
 * @param {Request} request - Delete comment request
 * @param {Object} env - Environment variables (DB binding)
 * @param {Object} params - URL parameters {commentId}
 * @returns {Promise<Response>} Deletion confirmation response
 */
export async function handleDeleteComment(request, env, ctx, params, user) {
  try {
    const commentId = params.commentId;

    // Validate UUID format (basic check)
    if (!commentId || commentId.length < 36) {
      throw new ValidationError('Invalid comment ID format');
    }

    // Check comment exists
    const existingComment = await env.DB.prepare(
      'SELECT id FROM comments WHERE id = ?'
    ).bind(commentId).first();

    if (!existingComment) {
      throw new NotFoundError('Comment not found');
    }

    // Delete comment
    await env.DB.prepare(
      'DELETE FROM comments WHERE id = ?'
    ).bind(commentId).run();

    return successResponse({
      deleted: true,
      id: commentId
    }, 200);

  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Delete comment error:', err);
    return errorResponse('Internal server error', 500);
  }
}
