/**
 * Post Service
 * Business logic for post management
 */

import { PostRepository } from "../repositories/index.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { validatePostCreate } from "../utils/validation.js";

export class PostService {
  constructor(db) {
    this.repository = new PostRepository(db);
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async createPost(postData, logger) {
    const validation = validatePostCreate(postData);

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    const { title, content, summary, tags = [], state } = postData;
    let { slug } = postData;

    if (!slug) {
      slug = this.generateSlug(title);
    }

    const existingPost = await this.repository.findBySlug(slug);
    if (existingPost) {
      throw new ValidationError("Slug already exists");
    }

    const now = new Date().toISOString();
    const postId = await this.repository.create({
      slug,
      title,
      content,
      summary,
      state,
      createdAt: now,
      updatedAt: now,
    });

    if (tags.length > 0) {
      await this.associateTags(postId, tags, now);
    }

    const createdPost = await this.getPostWithTags(postId);

    if (logger) {
      logger.info("Post created", { postId, slug });
    }

    return createdPost;
  }

  async updatePost(postId, postData, logger) {
    const validation = validatePostCreate(postData);

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    const existingPost = await this.repository.findById(postId);
    if (!existingPost) {
      throw new NotFoundError("Post not found");
    }

    const { title, content, summary, tags = [], state, slug } = postData;

    if (slug) {
      const slugConflict = await this.repository.findBySlugExcludingId(
        slug,
        postId,
      );
      if (slugConflict) {
        throw new ValidationError("Slug already exists");
      }
    }

    const now = new Date().toISOString();
    await this.repository.update(postId, {
      title,
      content,
      summary,
      state,
      slug,
      updatedAt: now,
    });

    await this.repository.deletePostTags(postId);

    if (tags.length > 0) {
      await this.associateTags(postId, tags, now);
    }

    const updatedPost = await this.getPostWithTags(postId);

    if (logger) {
      logger.info("Post updated", { postId });
    }

    return updatedPost;
  }

  async deletePost(postId, logger) {
    const existingPost = await this.repository.findById(postId);
    if (!existingPost) {
      throw new NotFoundError("Post not found");
    }

    await this.repository.delete(postId);

    if (logger) {
      logger.info("Post deleted", { postId });
    }

    return { deleted: true, id: postId };
  }

  async associateTags(postId, tags, timestamp) {
    for (const tagName of tags) {
      let tag = await this.repository.findTagByName(tagName);

      let tagId;
      if (!tag) {
        tagId = await this.repository.createTag(tagName, timestamp);
      } else {
        tagId = tag.id;
      }

      await this.repository.createPostTag(postId, tagId);
    }
  }

  async getPostWithTags(postId) {
    const post = await this.repository.findById(postId);
    if (!post) {
      return null;
    }

    const tags = await this.repository.getTagsByPostId(postId);

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      summary: post.summary,
      tags,
      state: post.state,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      views: post.views,
    };
  }
}
