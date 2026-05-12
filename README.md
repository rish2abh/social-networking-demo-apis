# Social Network API

> A production-ready RESTful Social Network API built with **NestJS**, **MongoDB**, and **JWT authentication** — featuring Swagger documentation, structured Winston logging, and graceful shutdown handling.

---

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

---

## Features

- User registration and login with JWT authentication
- Send, accept, and reject friend requests
- View accepted friends list with pagination, filtering by name, and sorting
- View incoming pending friend requests with pagination
- Full input validation on all endpoints
- Comprehensive error handling with consistent JSON error responses
- Interactive Swagger UI with persistent JWT authorization
- Structured request and application logging with request ID tracing
- Graceful shutdown — drains in-flight requests and closes DB connection cleanly
- Duplicate request prevention in both directions
- Protection against sending requests to yourself
- Re-runnable seed script with 10 realistic users and 12 friend request scenarios

---

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
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. The app will refuse to start if any required variable is missing.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (default: 3000) | `3000` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | `mongodb://localhost:27017/social_network` |
| `JWT_SECRET` | **Yes** | JWT signing secret (min 32 chars recommended) | `supersecretkey` |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) | `7d` |
| `NODE_ENV` | No | Runtime environment | `development` |
| `LOG_LEVEL` | No | Winston log level override | `debug` |
| `SHUTDOWN_TIMEOUT` | No | Max ms to wait for drain on shutdown (default: 10000) | `10000` |

### .env.example

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/social_network
JWT_SECRET=replace_with_a_strong_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
LOG_LEVEL=debug
SHUTDOWN_TIMEOUT=10000
```

---

## Graceful Shutdown

The application handles `SIGTERM` and `SIGINT` signals (e.g. `Ctrl+C`, Docker stop, PM2 restart, Kubernetes pod eviction) without dropping in-flight requests or corrupting data.

### What happens on shutdown

```
Signal received (SIGTERM / SIGINT)
        │
        ▼
Stop accepting new HTTP connections
        │
        ▼
Wait for in-flight requests to complete
(max SHUTDOWN_TIMEOUT ms, default 10 000 ms)
        │
        ▼
Close MongoDB connection gracefully
        │
        ▼
Flush Winston log buffers
        │
        ▼
process.exit(0)
```

### Implementation (main.ts)

The shutdown hook is registered in `main.ts` using NestJS's built-in `enableShutdownHooks()`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable NestJS lifecycle hooks (OnModuleDestroy, OnApplicationShutdown)
  app.enableShutdownHooks();

  await app.listen(PORT);

  // Graceful shutdown on SIGTERM (Docker, Kubernetes, PM2)
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — starting graceful shutdown', 'Bootstrap');
    await app.close();
    logger.log('Graceful shutdown complete', 'Bootstrap');
    process.exit(0);
  });

  // Graceful shutdown on SIGINT (Ctrl+C in terminal)
  process.on('SIGINT', async () => {
    logger.log('SIGINT received — starting graceful shutdown', 'Bootstrap');
    await app.close();
    logger.log('Graceful shutdown complete', 'Bootstrap');
    process.exit(0);
  });
}
```

### What `app.close()` does automatically

NestJS calls these lifecycle methods in order when `app.close()` is invoked:

| Order | Hook | Where it runs |
|-------|------|---------------|
| 1 | `onModuleDestroy()` | Every module that implements it |
| 2 | `beforeApplicationShutdown()` | Every module that implements it |
| 3 | `onApplicationShutdown()` | Every module that implements it |

Mongoose closes its connection pool in `onApplicationShutdown` automatically when registered via `MongooseModule`. No manual `mongoose.disconnect()` is needed.

### Shutdown log output

```text
14:22:45 [Bootstrap] info: SIGTERM received — starting graceful shutdown
14:22:45 [HTTP] info: Stopped accepting new connections
14:22:45 [Database] info: Closing MongoDB connection
14:22:45 [Database] info: MongoDB connection closed
14:22:45 [Bootstrap] info: Graceful shutdown complete
```

### Testing graceful shutdown locally

```bash
# Start the app
npm run start:dev

# In another terminal, send SIGTERM to the process
kill -SIGTERM $(lsof -ti:3000)

# Or simply press Ctrl+C — this sends SIGINT
```

---

## Database Seeding

Populate a fresh local dataset with 10 users and 12 friend requests covering all three statuses:

```bash
npm run seed
```

The seed is safely re-runnable. It clears existing data before inserting:

```bash
npm run seed:fresh
```

All seeded users share the same password for quick testing:

```
password123
```

### Seeded users

| Name | Email |
|------|-------|
| Alice Johnson | alice@example.com |
| Bob Smith | bob@example.com |
| Carol White | carol@example.com |
| David Brown | david@example.com |
| Eva Martinez | eva@example.com |
| Frank Lee | frank@example.com |
| Grace Kim | grace@example.com |
| Henry Wilson | henry@example.com |
| Iris Chen | iris@example.com |
| Jack Taylor | jack@example.com |

### Seeded friend request scenarios

| Sender | Receiver | Status | Purpose |
|--------|----------|--------|---------|
| Alice | Bob | accepted | Alice's friends list |
| Alice | Carol | accepted | Alice's friends list |
| Bob | David | accepted | Bob's friends list |
| David | Alice | pending | Alice has incoming request to test |
| Eva | Bob | pending | Bob has incoming request to test |
| Iris | Jack | rejected | Verify rejected don't appear in friends |

---

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **Base URL**: http://localhost:3000/api

### Authenticating in Swagger UI

1. Call `POST /api/auth/login`
2. Copy `data.token` from the response
3. Click **Authorize** (lock icon) at the top right
4. Paste the token and click Authorize
5. All protected endpoints are now unlocked

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns JWT in `data.token` |

### Friends

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/friend` | Yes | Send a friend request |
| GET | `/api/friends` | Yes | List accepted friends |
| GET | `/api/friends-request` | Yes | List incoming pending requests |
| PUT | `/api/friends-request/:id` | Yes | Accept or reject a request |

### Query Parameters — GET /api/friends

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `name` | string | — | Filter friends by name (case-insensitive) |
| `sort` | string | `-createdAt` | `name`, `-name`, `createdAt`, `-createdAt` |

---

## Response Format

Every endpoint returns the same top-level shape:

```json
{
  "status": true,
  "message": "Request successful",
  "data": {}
}
```

Errors follow the same shape with `status: false`:

```json
{
  "status": false,
  "message": "Cannot send friend request to yourself",
  "data": null
}
```

Paginated responses include a `pagination` object inside `data`:

```json
{
  "status": true,
  "message": "Friends fetched successfully",
  "data": {
    "friends": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

## Logging

| Environment | Format | Transports |
|-------------|--------|------------|
| `development` | Human-readable colourised | Console |
| `production` | JSON structured | Console + `logs/error.log` + `logs/combined.log` |

Every log line includes:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 date-time |
| `requestId` | First 8 chars of UUID — traceable across a full request lifecycle |
| `context` | Class or layer that emitted the log (e.g. `AuthService`, `HTTP`) |
| `level` | `error`, `warn`, `info`, `debug`, `verbose` |
| `message` | Short past-tense action description |
| metadata | `userId`, `email`, `duration`, `statusCode`, `path` — only safe fields |

Sensitive fields are **never** logged: passwords, password hashes, JWT tokens, Authorization headers, full request/response bodies.

### Development log example

```text
14:22:01 [a1b2c3d4] [HTTP] info: Incoming request
{ "method": "POST", "url": "/api/auth/login", "ip": "::1" }

14:22:01 [a1b2c3d4] [AuthService] info: User logged in successfully
{ "userId": "64a1b2c3d4e5f67890123456", "email": "alice@example.com" }

14:22:01 [a1b2c3d4] [HTTP] info: Request completed
{ "method": "POST", "url": "/api/auth/login", "statusCode": 200, "duration": "23ms" }

14:22:45 [Bootstrap] info: SIGTERM received — starting graceful shutdown
14:22:45 [Database] info: MongoDB connection closed
14:22:45 [Bootstrap] info: Graceful shutdown complete
```

### Production log example

```json
{"level":"info","message":"User logged in successfully","timestamp":"2024-01-01T14:22:01.000Z","context":"AuthService","requestId":"a1b2c3d4","userId":"64a1b2c3d4e5f67890123456","email":"alice@example.com"}
```

### Reading production logs

```bash
# Tail error log
tail -f logs/error.log

# Tail combined log
tail -f logs/combined.log
```

On Windows PowerShell:

```powershell
Get-Content .\logs\error.log -Tail 20 -Wait
```

---

## Project Structure

```
src/
├── auth/                   # Registration, login, JWT strategy and guard
├── users/                  # User schema and profile
├── friends/                # Friend request lifecycle
├── database/               # Seed script and seed data
├── logger/                 # Winston logger module and service
├── common/
│   ├── decorators/         # @CurrentUser()
│   ├── filters/            # HttpExceptionFilter (global)
│   ├── interceptors/       # LoggingInterceptor (global)
│   └── middleware/         # RequestIdMiddleware
├── app.module.ts           # Root module
└── main.ts                 # Bootstrap, Swagger setup, graceful shutdown
```

---

## Running Tests

```bash
npm run test          # unit tests
npm run test:watch    # unit tests in watch mode
npm run test:e2e      # end-to-end tests (uses in-memory MongoDB)
npm run test:cov      # coverage report
npm run test:all      # unit + e2e + coverage in one command
```

---

## Reviewer Setup (get running in 2 minutes)

```bash
git clone <repo-url>
cd Backend-practical
git checkout rishabh-shrivastava
cp .env.example .env
npm install
npm run seed
npm run start:dev
```

- App: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Test credentials: any seeded email + `password123`

---

## CHANGELOG

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Report

See [REPORT.md](./REPORT.md) for design decisions, architecture notes, and challenges faced.
