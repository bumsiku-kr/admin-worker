/**
 * Post Management Handlers
 * Admin CRUD operations for blog posts
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { validatePostCreate } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Generate slug from title
 * @param {string} title - Post title
 * @returns {string} URL-safe slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * POST /admin/posts
 * Create new blog post
 *
 * @param {Request} request - Create post request
 * @param {Object} env - Environment variables (DB binding)
 * @returns {Promise<Response>} Created post response
 */
export async function handleCreatePost(request, env, ctx, params, user) {
  try {
    const body = await request.json();
    const validation = validatePostCreate(body);

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    const { title, content, summary, tags = [], state } = body;
    let { slug } = body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(title);
    }

    // Check slug uniqueness
    const existingPost = await env.DB.prepare(
      'SELECT id FROM posts WHERE slug = ?'
    ).bind(slug).first();

    if (existingPost) {
      throw new ValidationError('Slug already exists');
    }

    // Insert post
    const now = new Date().toISOString();
    const insertResult = await env.DB.prepare(
      `INSERT INTO posts (slug, title, content, summary, state, created_at, updated_at, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    ).bind(slug, title, content, summary, state, now, now).run();

    const postId = insertResult.meta.last_row_id;

    // Insert tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        let tag = await env.DB.prepare(
          'SELECT id FROM tags WHERE name = ?'
        ).bind(tagName).first();

        let tagId;
        if (!tag) {
          const tagResult = await env.DB.prepare(
            'INSERT INTO tags (name, created_at, post_count) VALUES (?, ?, 0)'
          ).bind(tagName, now).run();
          tagId = tagResult.meta.last_row_id;
        } else {
          tagId = tag.id;
        }

        // Create post-tag relationship
        await env.DB.prepare(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)'
        ).bind(postId, tagId).run();
      }
    }

    // Fetch created post with tags
    const createdPost = await getPostById(env, postId);

    return successResponse(createdPost, 200);

  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Create post error:', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * PUT /admin/posts/{postId}
 * Update existing blog post
 *
 * @param {Request} request - Update post request
 * @param {Object} env - Environment variables
 * @param {Object} params - URL parameters {postId}
 * @returns {Promise<Response>} Updated post response
 */
export async function handleUpdatePost(request, env, ctx, params, user) {
  try {
    const postId = parseInt(params.postId);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    const body = await request.json();
    const validation = validatePostCreate(body);

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Check post exists
    const existingPost = await env.DB.prepare(
      'SELECT id FROM posts WHERE id = ?'
    ).bind(postId).first();

    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const { title, content, summary, tags = [], state, slug } = body;

    // Check slug uniqueness (if changed)
    if (slug) {
      const slugConflict = await env.DB.prepare(
        'SELECT id FROM posts WHERE slug = ? AND id != ?'
      ).bind(slug, postId).first();

      if (slugConflict) {
        throw new ValidationError('Slug already exists');
      }
    }

    // Update post
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE posts
       SET title = ?, content = ?, summary = ?, state = ?, slug = COALESCE(?, slug), updated_at = ?
       WHERE id = ?`
    ).bind(title, content, summary, state, slug, now, postId).run();

    // Update tags - delete existing and insert new
    await env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(postId).run();

    if (tags.length > 0) {
      const nowTs = new Date().toISOString();
      for (const tagName of tags) {
        let tag = await env.DB.prepare(
          'SELECT id FROM tags WHERE name = ?'
        ).bind(tagName).first();

        let tagId;
        if (!tag) {
          const tagResult = await env.DB.prepare(
            'INSERT INTO tags (name, created_at, post_count) VALUES (?, ?, 0)'
          ).bind(tagName, nowTs).run();
          tagId = tagResult.meta.last_row_id;
        } else {
          tagId = tag.id;
        }

        await env.DB.prepare(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)'
        ).bind(postId, tagId).run();
      }
    }

    // Fetch updated post
    const updatedPost = await getPostById(env, postId);

    return successResponse(updatedPost, 200);

  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Update post error:', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /admin/posts/{postId}
 * Delete blog post
 *
 * @param {Request} request - Delete post request
 * @param {Object} env - Environment variables
 * @param {Object} params - URL parameters {postId}
 * @returns {Promise<Response>} Deletion confirmation response
 */
export async function handleDeletePost(request, env, ctx, params, user) {
  try {
    const postId = parseInt(params.postId);
    if (isNaN(postId)) {
      throw new ValidationError('Invalid post ID');
    }

    // Check post exists
    const existingPost = await env.DB.prepare(
      'SELECT id FROM posts WHERE id = ?'
    ).bind(postId).first();

    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    // Delete post (cascading deletes will handle post_tags and comments via triggers)
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

    return successResponse({
      deleted: true,
      id: postId
    }, 200);

  } catch (err) {
    if (err instanceof ValidationError || err instanceof NotFoundError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Delete post error:', err);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * Helper: Get post by ID with tags
 * @param {Object} env - Environment variables
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Post with tags
 */
async function getPostById(env, postId) {
  const post = await env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(postId).first();

  if (!post) {
    return null;
  }

  // Fetch tags
  const tagResults = await env.DB.prepare(
    `SELECT t.name
     FROM tags t
     JOIN post_tags pt ON pt.tag_id = t.id
     WHERE pt.post_id = ?`
  ).bind(postId).all();

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    summary: post.summary,
    tags: tagResults.results.map(t => t.name),
    state: post.state,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    views: post.views
  };
}
