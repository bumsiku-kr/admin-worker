/**
 * Post Repository
 * Data access layer for posts
 */

import { postQueries, postTagQueries, tagQueries } from "../sql/index.js";

export class PostRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return await this.db.prepare(postQueries.selectById).bind(id).first();
  }

  async findBySlug(slug) {
    return await this.db.prepare(postQueries.selectBySlug).bind(slug).first();
  }

  async findBySlugExcludingId(slug, id) {
    return await this.db
      .prepare(postQueries.selectBySlugExcludingId)
      .bind(slug, id)
      .first();
  }

  async create(postData) {
    const { slug, title, content, summary, state, createdAt, updatedAt } =
      postData;

    const result = await this.db
      .prepare(postQueries.insert)
      .bind(slug, title, content, summary, state, createdAt, updatedAt)
      .run();

    return result.meta.last_row_id;
  }

  async update(id, postData) {
    const { title, content, summary, state, slug, updatedAt } = postData;

    await this.db
      .prepare(postQueries.update)
      .bind(title, content, summary, state, slug, updatedAt, id)
      .run();
  }

  async delete(id) {
    await this.db.prepare(postQueries.delete).bind(id).run();
  }

  async getTagsByPostId(postId) {
    const result = await this.db
      .prepare(postTagQueries.selectTagsByPostId)
      .bind(postId)
      .all();

    return result.results.map((t) => t.name);
  }

  async findTagByName(name) {
    return await this.db.prepare(tagQueries.selectByName).bind(name).first();
  }

  async createTag(name, createdAt) {
    const result = await this.db
      .prepare(tagQueries.insert)
      .bind(name, createdAt)
      .run();

    return result.meta.last_row_id;
  }

  async deletePostTags(postId) {
    await this.db.prepare(postTagQueries.deleteByPostId).bind(postId).run();
  }

  async createPostTag(postId, tagId) {
    await this.db.prepare(postTagQueries.insert).bind(postId, tagId).run();
  }
}
