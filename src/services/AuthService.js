/**
 * Auth Service
 * Business logic for authentication
 *
 * NOTE: DB 없이 단일 Admin 계정 운용
 * ADMIN_USERNAME, ADMIN_PASSWORD 환경 변수 사용
 */

import { generateJWT, createPayload } from "../auth/validators.js";
import { validateLoginRequest } from "../utils/validation.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";

export class AuthService {
  constructor(db) {
    // DB는 사용하지 않지만 호환성을 위해 유지
    this.db = db;
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

    // DB 대신 환경 변수에서 직접 검증
    if (username !== env.ADMIN_USERNAME) {
      if (logger) {
        logger.warn("Invalid credentials attempted", { username });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    const hashedPassword = await this.hashPassword(password, env.PASSWORD_SALT);
    if (hashedPassword !== env.ADMIN_PASSWORD) {
      if (logger) {
        logger.warn("Invalid credentials attempted", { username });
      }
      throw new UnauthorizedError("Invalid credentials");
    }

    // 단일 Admin 계정이므로 userId는 고정값 1 사용
    const userId = 1;
    const expirySeconds = parseInt(env.JWT_EXPIRY || "7200");
    const payload = createPayload(userId, expirySeconds);
    const token = await generateJWT(payload, env.JWT_SECRET);

    if (logger) {
      logger.info("Login successful", { userId, username });
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
