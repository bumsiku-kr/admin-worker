/**
 * Auth Repository
 * Data access layer for authentication
 */

import { authQueries } from "../sql/index.js";

export class AuthRepository {
  constructor(db) {
    this.db = db;
  }

  async findUserByUsername(username) {
    return await this.db
      .prepare(authQueries.selectUserByUsername)
      .bind(username)
      .first();
  }
}
