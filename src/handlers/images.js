/**
 * Image Upload Handler
 * R2 storage integration for blog images
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";
import { ImageService } from "../services/index.js";

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
    const formData = await request.formData();
    const file = formData.get("file");

    const cdnDomain = env.CDN_DOMAIN || "cdn.bumsiku.kr";
    const imageService = new ImageService(env.STORAGE, cdnDomain);
    const result = await imageService.uploadImage(file, logger);

    return successResponse(result, 200);
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
