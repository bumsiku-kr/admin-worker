/**
 * Image Upload Handler
 * R2 storage integration for blog images
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Supported image MIME types
 */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Maximum file size (5MB in bytes)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /admin/images
 * Upload image file to R2 storage
 *
 * @param {Request} request - Image upload request (multipart/form-data)
 * @param {Object} env - Environment variables (STORAGE R2 binding)
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Response>} Upload response with CDN URL
 */
export async function handleImageUpload(
  request,
  env,
  ctx,
  params,
  user,
  logger,
) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      throw new ValidationError("No file provided");
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Generate unique file key with date-based organization
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const extension = getFileExtension(file.type);
    const key = `images/${year}/${month}/${uuid}.${extension}`;

    // Upload to R2
    await env.STORAGE.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate CDN URL
    // TODO: Replace with actual CDN domain when configured
    const cdnDomain = env.CDN_DOMAIN || "cdn.bumsiku.kr";
    const url = `https://${cdnDomain}/${key}`;

    if (logger) {
      logger.info("Image uploaded", {
        key,
        size: file.size,
        type: file.type,
        url,
      });
    }

    return successResponse(
      {
        url,
        key,
      },
      200,
    );
  } catch (err) {
    if (err instanceof ValidationError) {
      if (logger) {
        logger.warn("Image upload validation failed", { error: err.message });
      }
      return errorResponse(err.message, err.status);
    }

    if (logger) {
      logger.error("Image upload error", err);
    } else {
      console.error("Image upload error:", err);
    }
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
function getFileExtension(mimeType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return extensions[mimeType] || "jpg";
}
