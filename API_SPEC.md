# Blog Admin Worker API Specification

**Base URL**: `https://admin-worker.peter012677.workers.dev`

**Authentication**: JWT Bearer Token (required for all `/admin/*` endpoints)

---

## Table of Contents

- [Authentication](#authentication)
  - [POST /login](#post-login)
  - [GET /session](#get-session)
- [Posts Management](#posts-management)
  - [POST /admin/posts](#post-adminposts)
  - [PUT /admin/posts/:postId](#put-adminpostspostid)
  - [DELETE /admin/posts/:postId](#delete-adminpostspostid)
- [Comments Management](#comments-management)
  - [DELETE /admin/comments/:commentId](#delete-admincommentscommentid)
- [Image Upload](#image-upload)
  - [POST /admin/images](#post-adminimages)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

---

## Authentication

### POST /login

Admin login endpoint that returns a JWT token.

**Endpoint**: `POST /login`

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Validation Rules**:
- `username`: required, non-empty string
- `password`: required, non-empty string

**Success Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 7200
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body or validation failure
  ```json
  { "error": "Username and password are required" }
  ```
- `401 Unauthorized`: Invalid credentials
  ```json
  { "error": "Invalid credentials" }
  ```
- `500 Internal Server Error`: Server error
  ```json
  { "error": "Internal server error" }
  ```

---

### GET /session

Validate current JWT token and check session validity.

**Endpoint**: `GET /session`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "valid": true,
  "userId": 1,
  "expiresAt": "2024-01-15T12:00:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
  ```json
  { "error": "Invalid or missing token" }
  ```
- `500 Internal Server Error`: Server error
  ```json
  { "error": "Internal server error" }
  ```

---

## Posts Management

### POST /admin/posts

Create a new blog post.

**Endpoint**: `POST /admin/posts`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "summary": "string (optional)",
  "slug": "string (optional)",
  "tags": ["string"] (optional),
  "state": "string (required, enum: 'draft' | 'published')"
}
```

**Validation Rules**:
- `title`: required, non-empty string
- `content`: required, non-empty string
- `state`: required, must be "draft" or "published"
- `slug`: optional, auto-generated from title if not provided
- `tags`: optional array of strings
- `summary`: optional string

**Success Response** (200 OK):
```json
{
  "id": 1,
  "slug": "my-blog-post",
  "title": "My Blog Post",
  "content": "Full post content...",
  "summary": "Brief summary",
  "tags": ["javascript", "web"],
  "state": "published",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "views": 0
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  { "error": "Title and content are required" }
  { "error": "State must be 'draft' or 'published'" }
  { "error": "Slug already exists" }
  ```
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

### PUT /admin/posts/:postId

Update an existing blog post.

**Endpoint**: `PUT /admin/posts/:postId`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
- `postId`: integer, the ID of the post to update

**Request Body**:
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "summary": "string (optional)",
  "slug": "string (optional)",
  "tags": ["string"] (optional),
  "state": "string (required, enum: 'draft' | 'published')"
}
```

**Validation Rules**:
- Same as POST /admin/posts
- `postId` must be a valid integer

**Success Response** (200 OK):
```json
{
  "id": 1,
  "slug": "updated-blog-post",
  "title": "Updated Blog Post",
  "content": "Updated content...",
  "summary": "Updated summary",
  "tags": ["javascript", "web", "updated"],
  "state": "published",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  "views": 42
}
```

**Error Responses**:
- `400 Bad Request`: Invalid post ID or validation error
  ```json
  { "error": "Invalid post ID" }
  { "error": "Slug already exists" }
  ```
- `404 Not Found`: Post not found
  ```json
  { "error": "Post not found" }
  ```
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

### DELETE /admin/posts/:postId

Delete a blog post.

**Endpoint**: `DELETE /admin/posts/:postId`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Path Parameters**:
- `postId`: integer, the ID of the post to delete

**Success Response** (200 OK):
```json
{
  "deleted": true,
  "id": 1
}
```

**Error Responses**:
- `400 Bad Request`: Invalid post ID
  ```json
  { "error": "Invalid post ID" }
  ```
- `404 Not Found`: Post not found
  ```json
  { "error": "Post not found" }
  ```
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

## Comments Management

### DELETE /admin/comments/:commentId

Delete a comment by ID.

**Endpoint**: `DELETE /admin/comments/:commentId`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Path Parameters**:
- `commentId`: string (UUID format), the ID of the comment to delete

**Success Response** (200 OK):
```json
{
  "deleted": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid comment ID format
  ```json
  { "error": "Invalid comment ID format" }
  ```
- `404 Not Found`: Comment not found
  ```json
  { "error": "Comment not found" }
  ```
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

## Image Upload

### POST /admin/images

Upload an image file to R2 storage.

**Endpoint**: `POST /admin/images`

**Authentication**: Required (JWT Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
- `file`: File (required)

**File Constraints**:
- **Allowed types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Maximum size**: 5MB
- **Storage path**: `images/{year}/{month}/{uuid}.{extension}`

**Success Response** (200 OK):
```json
{
  "url": "https://pub-5e4858d1f4a945f983eb087580355811.r2.dev/images/2024/01/550e8400-e29b-41d4-a716-446655440000.jpg",
  "key": "images/2024/01/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  { "error": "No file provided" }
  { "error": "Invalid file type. Allowed: image/jpeg, image/png, image/gif, image/webp" }
  { "error": "File too large. Maximum size: 5MB" }
  ```
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (authentication required or failed) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

### CORS

All endpoints support CORS with the following configuration:
- **Allowed Origins**: Configurable via `ALLOWED_ORIGINS` environment variable (default: `*`)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Content-Type`, `Authorization`

---

## Data Models

### Post

```typescript
interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  state: 'draft' | 'published';
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  views: number;
}
```

### Comment

```typescript
interface Comment {
  id: string; // UUID
  // Additional fields depend on database schema
}
```

### Authentication Token

```typescript
interface AuthToken {
  token: string; // JWT token
  expiresIn: number; // Expiry time in seconds (default: 7200 = 2 hours)
}
```

### Session Validation

```typescript
interface SessionValidation {
  valid: boolean;
  userId: number;
  expiresAt: string; // ISO 8601 datetime
}
```

### Image Upload Response

```typescript
interface ImageUpload {
  url: string; // Full CDN URL
  key: string; // R2 storage key
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: string;
}
```

---

## Authentication Flow

1. **Login**:
   ```
   POST /login
   Body: { username, password }
   Response: { token, expiresIn }
   ```

2. **Store Token**:
   - Save the JWT token in secure storage (e.g., httpOnly cookie or secure localStorage)
   - Token expires in `expiresIn` seconds (default: 7200 = 2 hours)

3. **Authenticated Requests**:
   ```
   Header: Authorization: Bearer <token>
   ```

4. **Session Validation** (optional):
   ```
   GET /session
   Header: Authorization: Bearer <token>
   Response: { valid, userId, expiresAt }
   ```

5. **Token Expiry**:
   - Check `expiresAt` timestamp
   - Redirect to login when token expires
   - Handle 401 responses by clearing token and redirecting to login

---

## Example Usage

### Login Example

```javascript
// Login request
const response = await fetch('https://admin-worker.peter012677.workers.dev/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'your-password'
  })
});

const { token, expiresIn } = await response.json();
// Store token for subsequent requests
```

### Create Post Example

```javascript
// Create post with authentication
const response = await fetch('https://admin-worker.peter012677.workers.dev/admin/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'My New Blog Post',
    content: 'This is the full content of the blog post...',
    summary: 'A brief summary',
    tags: ['javascript', 'tutorial'],
    state: 'published'
  })
});

const post = await response.json();
```

### Upload Image Example

```javascript
// Upload image with authentication
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('https://admin-worker.peter012677.workers.dev/admin/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { url, key } = await response.json();
// Use the url in your blog post content
```

### Update Post Example

```javascript
// Update post
const response = await fetch('https://admin-worker.peter012677.workers.dev/admin/posts/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Updated Blog Post',
    content: 'Updated content...',
    summary: 'Updated summary',
    tags: ['javascript', 'tutorial', 'updated'],
    state: 'published'
  })
});

const updatedPost = await response.json();
```

### Delete Comment Example

```javascript
// Delete comment
const response = await fetch('https://admin-worker.peter012677.workers.dev/admin/comments/550e8400-e29b-41d4-a716-446655440000', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { deleted, id } = await response.json();
```

---

## Environment Variables

The following environment variables are used by the API:

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_USERNAME` | Admin username for authentication | Required |
| `ADMIN_PASSWORD` | Hashed admin password | Required |
| `PASSWORD_SALT` | Salt for password hashing | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRY` | JWT expiry time in seconds | 7200 (2 hours) |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `CDN_DOMAIN` | CDN domain for image URLs | `pub-5e4858d1f4a945f983eb087580355811.r2.dev` |

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- The API uses a single admin account (userId: 1)
- Slugs are auto-generated from titles if not provided
- Tags are automatically created if they don't exist
- Images are stored in R2 with the pattern: `images/{year}/{month}/{uuid}.{extension}`
- JWT tokens expire after 2 hours by default
- All `/admin/*` endpoints require JWT authentication
