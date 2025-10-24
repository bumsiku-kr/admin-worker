/**
 * Auth Service
 * Business logic for authentication
 */

import { AuthRepository } from "../repositories/index.js";
import { generateJWT, createPayload } from "../auth/validators.js";
import { validateLoginRequest } from "../utils/validation.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";

export class AuthService {
  constructor(db) {
    this.repository = new AuthRepository(db);
  }

  async login(credentials, env, logger) {
    const validation = validateLoginRequest(credentials);

    if (!validation.valid) {
      if (logger) {
        logger.warn("Login validation failed", { error: validation.error });
      }
      throw new ValidationError(validation.error);
    }

    const { username, password } = credentials;

    const user = await this.repository.findUserByUsername(username);

    if (!user) {
      if (logger) {
        logger.warn("Invalid credentials attempted", { username });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    const hashedPassword = await this.hashPassword(password, env.PASSWORD_SALT);
    if (hashedPassword !== user.password) {
      if (logger) {
        logger.warn("Invalid credentials attempted", { username });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    const expirySeconds = parseInt(env.JWT_EXPIRY || "7200");
    const payload = createPayload(user.id, expirySeconds);
    const token = await generateJWT(payload, env.JWT_SECRET);

    if (logger) {
      logger.info("Login successful", { userId: user.id });
    }

    return {
      token,
      expiresIn: expirySeconds,
    };
  }

  async validateSession(user, logger) {
    if (!user) {
      if (logger) {
        logger.warn("Session validation failed - no user");
      }
      throw new UnauthorizedError("Invalid or missing token");
    }

    const expiresAt = new Date(user.exp * 1000).toISOString();

    if (logger) {
      logger.debug("Session validated", { userId: user.userId, expiresAt });
    }

    return {
      valid: true,
      userId: user.userId,
      expiresAt,
    };
  }

  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
