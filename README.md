# Social Network API

> A production-ready RESTful Social Network API built with **NestJS**, **MongoDB**, and **JWT authentication**, featuring interactive Swagger documentation and structured Winston logging.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS (Node.js) |
| Database | MongoDB + Mongoose |
| Authentication | JWT + Passport |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI 3.0 |
| Logging | Winston + nest-winston |
| Language | TypeScript |

## Features

- User registration and login with JWT authentication
- Send / Accept / Reject friend requests
- View accepted friends list with pagination, filtering by name, and sorting
- View incoming pending friend requests with pagination
- Full input validation on all endpoints
- Comprehensive error handling with consistent JSON error responses
- Interactive Swagger UI with persistent JWT authorization
- Structured request and application logging with request IDs
- Duplicate request prevention in both directions
- Protection against sending requests to yourself
- Re-runnable seed script with realistic users and friend request scenarios

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas URI

### Installation

```bash
git clone <repo-url>
cd social-network-api
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Running the app

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/social_network |
| JWT_SECRET | JWT signing secret | your_secret_here |
| JWT_EXPIRES_IN | Token expiry | 7d |
| NODE_ENV | Runtime environment | development |
| LOG_LEVEL | Winston log level override | debug |

## Database Seeding

Create a fresh local dataset with 10 users and 12 friend requests:

```bash
npm run seed
```

The seed is safely re-runnable. It clears existing users and friend requests before inserting the seed data:

```bash
npm run seed:fresh
```

All seeded users use the same password for quick testing:

```text
password123
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **Base URL**: http://localhost:3000/api

To authenticate in Swagger UI:

1. Call `POST /api/auth/login`
2. Copy `data.token` from the response
3. Click **Authorize** at the top right
4. Paste the token and click Authorize
5. All protected endpoints are now unlocked

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register a new user |
| POST | /api/auth/login | No | Login, returns JWT token in `data.token` |

### Friends

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/friend | Yes | Send a friend request |
| GET | /api/friends | Yes | List accepted friends |
| GET | /api/friends-request | Yes | Incoming pending requests |
| PUT | /api/friends-request/:id | Yes | Accept or reject a request |

### Query Parameters for GET /api/friends

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page, max 100 |
| name | string | - | Filter friends by name |
| sort | string | -createdAt | Sort field: name, -name, createdAt, -createdAt |

## Response Format

All API responses use the same top-level shape:

```json
{
  "status": true,
  "message": "Request successful",
  "data": {}
}
```

Errors use the same shape with `status: false`:

```json
{
  "status": false,
  "message": "Cannot send friend request to yourself",
  "data": null
}
```

## Logging

This project uses Winston for structured logging.

| Environment | Format | Transports |
|-------------|--------|------------|
| development | Human-readable colourised | Console |
| production | JSON structured logs | Console + logs/error.log + logs/combined.log |

Every log line includes:

- timestamp
- requestId, the first 8 chars of a UUID and traceable across a full request
- context, meaning the class or layer that emitted the log
- log level
- message
- structured metadata such as userId, email, duration, statusCode, and path

To change log level, set `LOG_LEVEL` in `.env`. Defaults are `debug` in development and `warn` in production.

Sensitive fields are never logged:

- passwords
- password hashes
- JWT tokens
- Authorization headers
- full request or response bodies

### Development log example

```text
14:22:01 [a1b2c3d4] [HTTP] info: Incoming request
{
  "method": "POST",
  "url": "/api/auth/login",
  "userAgent": "Mozilla/5.0",
  "ip": "::1"
}
14:22:01 [a1b2c3d4] [AuthService] info: User logged in successfully
{
  "userId": "64a1b2c3d4e5f67890123456",
  "email": "alice@example.com"
}
14:22:01 [a1b2c3d4] [HTTP] info: Request completed
{
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": "23ms"
}
```

### Production log example

```json
{"level":"info","message":"User logged in successfully","timestamp":"2024-01-01T14:22:01.000Z","context":"AuthService","requestId":"a1b2c3d4","userId":"64a1b2c3d4e5f67890123456","email":"alice@example.com"}
```

Read production error logs:

```bash
tail -f logs/error.log
```

On Windows PowerShell:

```powershell
Get-Content .\logs\error.log -Tail 20 -Wait
```

Example production error entry:

```json
{"level":"error","message":"Unhandled server error","timestamp":"2024-01-01T14:22:30.000Z","context":"ExceptionFilter","requestId":"d4e5f6a7","statusCode":500,"path":"/api/friend","method":"POST","stack":"Error: ..."}
```

## Project Structure

```text
src/
|-- auth/             # Registration, login, JWT strategy
|-- users/            # User schema, profile
|-- friends/          # Friend request lifecycle
|-- database/         # Seed script and seed data
|-- logger/           # Winston logger module and service
|-- common/           # Shared filters, decorators, middleware, interceptors
|-- app.module.ts     # Root module
`-- main.ts           # Bootstrap + Swagger
```

## Running Tests

```bash
npm run test         # unit tests
npm run test:e2e     # end-to-end tests
npm run test:cov     # coverage report
```
