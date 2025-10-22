/**
 * JWT Generation and Validation
 * CloudFlare Workers crypto API implementation for stateless authentication
 */

/**
 * Generate JWT token using HMAC-SHA256
 * @param {Object} payload - Token payload (userId, exp, etc.)
 * @param {string} secret - JWT secret key
 * @returns {Promise<string>} JWT token
 */
export async function generateJWT(payload, secret) {
  // Encode header and payload
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  // Create signature
  const data = `${headerB64}.${payloadB64}`;
  const signature = await signData(data, secret);
  const signatureB64 = base64UrlEncode(signature);

  // Return complete JWT
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Validate JWT token and return payload
 * @param {string} token - JWT token to validate
 * @param {string} secret - JWT secret key
 * @returns {Promise<Object>} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export async function validateJWT(token, secret) {
  // Split token into parts
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature
  const data = `${headerB64}.${payloadB64}`;
  const signature = base64UrlDecode(signatureB64);
  const valid = await verifySignature(data, signature, secret);

  if (!valid) {
    throw new Error('Invalid signature');
  }

  // Decode and validate payload
  const payload = JSON.parse(base64UrlDecodeString(payloadB64));

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * Sign data using HMAC-SHA256
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {Promise<ArrayBuffer>} Signature
 */
async function signData(data, secret) {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(data)
  );
}

/**
 * Verify HMAC-SHA256 signature
 * @param {string} data - Original data
 * @param {ArrayBuffer} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {Promise<boolean>} True if valid
 */
async function verifySignature(data, signature, secret) {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return await crypto.subtle.verify(
    'HMAC',
    secretKey,
    signature,
    encoder.encode(data)
  );
}

/**
 * Base64 URL encode (Buffer/ArrayBuffer to string)
 * @param {string|ArrayBuffer} input - Input to encode
 * @returns {string} Base64 URL encoded string
 */
function base64UrlEncode(input) {
  let str;

  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    // ArrayBuffer
    const bytes = new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    str = btoa(binary);
  }

  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode (string to ArrayBuffer)
 * @param {string} str - Base64 URL encoded string
 * @returns {Uint8Array} Decoded data
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) {
    str += '='.repeat(4 - pad);
  }
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

/**
 * Base64 URL decode to string
 * @param {string} str - Base64 URL encoded string
 * @returns {string} Decoded string
 */
function base64UrlDecodeString(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) {
    str += '='.repeat(4 - pad);
  }
  return atob(str);
}

/**
 * Create JWT payload with standard claims
 * @param {number} userId - User ID
 * @param {number} expiresInSeconds - Expiration time in seconds
 * @returns {Object} JWT payload
 */
export function createPayload(userId, expiresInSeconds = 7200) {
  const now = Math.floor(Date.now() / 1000);
  return {
    userId,
    iat: now,
    exp: now + expiresInSeconds
  };
}
