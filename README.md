# Admin Worker - bumsiku.kr Blog

JWT-authenticated CloudFlare Worker for administrative API operations.

## Overview

This worker handles all authenticated operations for the bumsiku.kr blog:

- User authentication (login, session validation)
- Post management (create, update, delete)
- Image uploads to R2 storage
- Comment moderation (delete)

## Authentication

All endpoints (except `/login` and `/session`) require JWT authentication:

```bash
Authorization: Bearer <jwt-token>
```

Token is obtained via `/login` endpoint and expires after 2 hours (configurable via `JWT_EXPIRY`).

## API Endpoints

### Public Endpoints (No Auth)

- `POST /login` - Administrator login, returns JWT token
- `GET /session` - Validate current session/token

### Protected Endpoints (JWT Required)

- `POST /admin/posts` - Create new blog post
- `PUT /admin/posts/{postId}` - Update existing post
- `DELETE /admin/posts/{postId}` - Delete post
- `POST /admin/images` - Upload image to R2 storage
- `DELETE /admin/comments/{commentId}` - Delete comment

## Configuration

### Environment Variables (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://bumsiku.kr"
JWT_EXPIRY = "7200"  # 2 hours
```

### Secrets (set via wrangler secret put)

- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `ADMIN_USERNAME` - Administrator username
- `ADMIN_PASSWORD` - Administrator password (bcrypt hashed)

### CloudFlare Bindings

- `DB` - D1 database (blog-db)
- `STORAGE` - R2 bucket (blog-images)
- `CACHE` - KV namespace (optional)

## Local Development

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev

# Access at http://localhost:8787
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to staging
wrangler deploy --env staging
```

## Project Structure

```
admin-worker/
├── src/
│   ├── index.js              # Main entry point and fetch handler
│   ├── router.js             # URL routing logic
│   ├── auth/
│   │   ├── middleware.js     # JWT authentication middleware
│   │   └── validators.js     # JWT token validation
│   ├── handlers/
│   │   ├── auth.js           # Login and session handlers
│   │   ├── posts.js          # Post CRUD handlers
│   │   ├── images.js         # Image upload handlers
│   │   └── comments.js       # Comment deletion handlers
│   └── utils/
│       ├── errors.js         # Custom error classes
│       ├── response.js       # Response formatting utilities
│       └── validation.js     # Input validation functions
├── tests/
│   ├── auth.test.js          # Authentication tests
│   └── handlers.test.js      # Handler integration tests
├── package.json
├── wrangler.toml
└── README.md
```

## Security Considerations

1. **JWT Secret**: Use strong random string (min 32 characters)

   ```bash
   openssl rand -base64 32
   ```

2. **Admin Password**: Always use bcrypt hashed passwords

   ```bash
   node -e "console.log(require('bcrypt').hashSync('password', 10))"
   ```

3. **CORS**: Restrict `ALLOWED_ORIGINS` to your domain in production

4. **Rate Limiting**: Consider implementing rate limiting for login endpoint

5. **Input Validation**: All inputs are validated before processing

## Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": 400,
    "message": "Error description"
  }
}
```

## Response Format

All successful responses follow standard format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## Implementation Status

- [ ] Phase 1: Project Setup ✅
- [ ] Phase 2: Core Infrastructure
- [ ] Phase 3: Authentication Implementation
- [ ] Phase 4: Handler Implementation
- [ ] Phase 5: Testing
- [ ] Phase 6: Deployment

## Next Steps

1. Implement core utilities (response, error, validation)
2. Implement JWT authentication system
3. Create route handlers for each endpoint
4. Write comprehensive tests
5. Deploy to staging for validation

## GitHub Actions Deployment

This repository includes automatic deployment via GitHub Actions:

- Push to `main` branch triggers automatic deployment to production
- Manual deployment available via GitHub Actions tab
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Related Repositories

- [blog-public-worker](../blog-public-worker) - Public API Worker
- [blog-migration](../blog-migration) - Database schema and migrations
- [blog-frontend](../blog-frontend) - Next.js frontend
- [blog-backend](../blog-backend) - Backend services

## Resources

- [CloudFlare Workers Docs](https://developers.cloudflare.com/workers/)
- [CloudFlare D1 Docs](https://developers.cloudflare.com/d1/)
- [CloudFlare R2 Docs](https://developers.cloudflare.com/r2/)
