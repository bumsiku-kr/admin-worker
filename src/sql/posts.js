/**
 * Post-related SQL queries
 */

export const postQueries = {
  selectById: "SELECT * FROM posts WHERE id = ?",
  selectBySlug: "SELECT id FROM posts WHERE slug = ?",
  selectBySlugExcludingId: "SELECT id FROM posts WHERE slug = ? AND id != ?",
  insert: `INSERT INTO posts (slug, title, content, summary, state, created_at, updated_at, views)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  update: `UPDATE posts
           SET title = ?, content = ?, summary = ?, state = ?, slug = COALESCE(?, slug), updated_at = ?
           WHERE id = ?`,
  delete: "DELETE FROM posts WHERE id = ?",
};

export const postTagQueries = {
  selectTagsByPostId: `SELECT t.name
                       FROM tags t
                       JOIN post_tags pt ON pt.tag_id = t.id
                       WHERE pt.post_id = ?`,
  insert: "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
  deleteByPostId: "DELETE FROM post_tags WHERE post_id = ?",
};

export const tagQueries = {
  selectByName: "SELECT id FROM tags WHERE name = ?",
  insert: "INSERT INTO tags (name, created_at, post_count) VALUES (?, ?, 0)",
};
