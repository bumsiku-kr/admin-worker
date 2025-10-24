/**
 * Comment Service
 * Business logic for comment management
 */

import { CommentRepository } from "../repositories/index.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

export class CommentService {
  constructor(db) {
    this.repository = new CommentRepository(db);
  }

  async deleteComment(commentId, logger) {
    if (!commentId || commentId.length < 36) {
      throw new ValidationError("Invalid comment ID format");
    }

    const existingComment = await this.repository.findById(commentId);
    if (!existingComment) {
      throw new NotFoundError("Comment not found");
    }

    await this.repository.delete(commentId);

    if (logger) {
      logger.info("Comment deleted", { commentId });
    }

    return { deleted: true, id: commentId };
  }
}
