/**
 * Comment Repository
 * Data access layer for comments
 */

import { commentQueries } from "../sql/index.js";

export class CommentRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return await this.db.prepare(commentQueries.selectById).bind(id).first();
  }

  async delete(id) {
    await this.db.prepare(commentQueries.delete).bind(id).run();
  }
}
