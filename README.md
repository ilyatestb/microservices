# Microservices Case

NestJS-based microservices architecture for data processing with event journaling. Consists of three services communicating via Redis and using MongoDB for storage.

## Architecture

**Gateway** — API Gateway with Swagger documentation
**Journal** — event journaling service with PDF report generation
**Data Pipeline** — external API data fetching, file upload parsing, and data search

Services communicate through Redis microservices transport, data is stored in MongoDB.

## Project Structure

```
.
├── apps/
│   ├── gateway/         # API Gateway with Swagger
│   ├── journal/         # Journaling + PDF generation
│   └── data-pipeline/   # Data fetching, file upload, data search
├── shared/              # Shared types and modules
├── docker-compose.yml
└── .env.example
```

## Tech Stack

- **NestJS 10.4.20** - Node.js framework
- **ypeScript 5.9.3** - programming language
- **MongoDB 6.3.0** - database
- **Redis (ioredis 5.5.0)** - cache and microservices transport
- **Express 4.18.2** - web server
- **Swagger** - API documentation (available in Gateway)

## Implementation Details

- **Monorepo with pnpm workspaces** — shared module with common types and utilities
- **Redis microservices transport** — async service communication via request-response pattern

## Requirements

- Node.js version 24 or higher
- pnpm version 8 or higher (installed automatically via corepack)
- Docker and Docker Compose (for containerized deployment)
- Cairo, Pango, Jpeg, Giflib, Pixman (for local development(Journal service))

**For local development (Journal service):**
On macOS:

```bash
brew install cairo pango jpeg giflib pixman
```

## Quick Start

### Run with Docker Compose (recommended)

```bash
# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d
```

Services will be available at:

- API: http://localhost:4050
- Swagger: http://localhost:4050/swagger

### Local Development Setup

```bash
# 1. Start infrastructure
docker-compose up -d mongodb redis

# 2. Install dependencies
pnpm install

# 3. Build shared module
pnpm build:shared

# 4. Start services (in separate terminals)
pnpm dev:journal
pnpm dev:data-pipeline
pnpm dev:gateway
```

### Service Ports

After starting, services will be available on the following ports:

- **Gateway**: http://localhost:4050
- **Gateway Swagger**: http://localhost:4050/swagger
- **Journal**: 4051 (internal port)
- **Data Pipeline**: 4052 (internal port)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Commands

```bash
# Build
pnpm build              # Build everything
pnpm build:shared       # Shared module only

# Development
pnpm dev:gateway        # Gateway in dev mode
pnpm dev:journal        # Journal in dev mode
pnpm dev:data-pipeline  # Data Pipeline in dev mode

# Linting
pnpm lint               # ESLint with autofix
pnpm format             # Prettier formatting

# Docker
docker-compose up -d    # Start in background
docker-compose logs -f  # View all logs
docker-compose down -v  # Stop + remove volumes
```

## Environment Variables

See `.env.example` for the complete list. Main variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret

MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USER=admin
MONGODB_PASSWORD=secret

API_GATEWAY_PORT=4050
API_GATEWAY_PROTOCOL=http

NODE_ENV=development
```

When running via Docker Compose, hosts are automatically changed to service names (`redis`, `mongodb`).
