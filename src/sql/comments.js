/**
 * Comment-related SQL queries
 */

export const commentQueries = {
  selectById: "SELECT id FROM comments WHERE id = ?",
  delete: "DELETE FROM comments WHERE id = ?",
};
