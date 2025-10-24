/**
 * Authentication-related SQL queries
 */

export const authQueries = {
  selectUserByUsername: "SELECT id, password FROM users WHERE username = ?",
};
