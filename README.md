# Microservices Architecture

The project is a microservices architecture based on NestJS, consisting of three main services:

- **Gateway** (API Gateway) - main API gateway for client interactions
- **Journal** - event logging and journaling service
- **Data Pipeline** - data processing and loading service

Services communicate through Redis (microservices transport) and use MongoDB for data storage.

## Project Structure

```
.
├── apps/
│   ├── gateway/          # API Gateway service
│   ├── journal/          # Journaling service
│   └── data-pipeline/    # Data processing service
├── shared/               # Shared modules and utilities
├── docker-compose.yml    # Docker Compose configuration
├── .env.example          # Environment variables template
└── package.json          # Root package.json
```

## Dependencies

### System Requirements

- **Node.js** version 24 or higher
- **pnpm** version 8 or higher (installed automatically via corepack)
- **Docker** and **Docker Compose** (for containerized deployment)
- **MongoDB** version 7 (if running locally without Docker)
- **Redis** (if running locally without Docker)

### Technology Stack

- **NestJS** 10.4.20 - Node.js framework
- **TypeScript** 5.9.3 - programming language
- **MongoDB** 6.3.0 - database
- **Redis** (ioredis 5.5.0) - cache and microservices transport
- **Express** 4.18.2 - web server
- **Swagger** - API documentation (available in Gateway)

### Installing Dependencies

```bash
# Install all project dependencies
pnpm install
```

## Environment Variables

Copy the `.env.example` file to `.env` in the project root:

```bash
cp .env.example .env
```

The `.env.example` file contains the following variables:

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret

# MongoDB
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USER=admin
MONGODB_PASSWORD=secret

# API Gateway
API_GATEWAY_PORT=4050
API_GATEWAY_PROTOCOL=http

# Environment
NODE_ENV=development
```

**Note:** When running via Docker Compose, the `REDIS_HOST` and `MONGODB_HOST` variables are automatically overridden with service names (`redis` and `mongodb`).

## Running with Docker Compose

The easiest way to run all services is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- Copy `.env.example` to `.env` in the project root (optional, default values will be used if not provided)

### Starting All Services

```bash
# Start all services in background mode
docker-compose up -d

# Start with log output
docker-compose up

# Rebuild images before starting
docker-compose up --build
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (will delete database data)
docker-compose down -v
```

### Viewing Logs

```bash
# Logs from all services
docker-compose logs -f

# Logs from a specific service
docker-compose logs -f gateway
docker-compose logs -f journal
docker-compose logs -f data-pipeline
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### Checking Status

```bash
# Status of all containers
docker-compose ps
```

### Service Ports

After starting, services will be available on the following ports:

- **Gateway**: http://localhost:4050
- **Gateway Swagger**: http://localhost:4050/swagger
- **Journal**: 4051 (internal port)
- **Data Pipeline**: 4052 (internal port)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Local Service Startup

For development, you can run services locally without Docker.

### Prerequisites

1. Ensure MongoDB and Redis are running locally or in Docker:

```bash
# Start only infrastructure (MongoDB and Redis)
docker-compose up -d mongodb redis
```

2. Copy `.env.example` to `.env` in the project root (see "Environment Variables" section)

3. Install dependencies:

```bash
pnpm install
```

### Building Shared Module

Before starting any service, you need to build the shared module:

```bash
pnpm build:shared
```

### Starting Individual Services

#### Gateway

```bash
# Development mode with hot-reload
pnpm dev:gateway

# Or manually
pnpm build:shared
pnpm --filter gateway start:dev
```

Service will be available at http://localhost:4050
Swagger documentation: http://localhost:4050/swagger

#### Journal

```bash
# Development mode with hot-reload
pnpm dev:journal

# Or manually
pnpm build:shared
pnpm --filter journal start:dev
```

#### Data Pipeline

```bash
# Development mode with hot-reload
pnpm dev:data-pipeline

# Or manually
pnpm build:shared
pnpm --filter data-pipeline start:dev
```

### Building All Services

```bash
# Build shared module and all services
pnpm build
```

### Running in Production Mode

After building, you can run services in production mode:

```bash
# Gateway
cd apps/gateway
node dist/main.js

# Journal
cd apps/journal
node dist/main.js

# Data Pipeline
cd apps/data-pipeline
node dist/main.js
```

## Useful Commands

### Linting and Formatting

```bash
# Code linting
pnpm lint

# Code formatting
pnpm format
```

### Cleanup

```bash
# Remove all built files
find . -name "dist" -type d -exec rm -rf {} +
find . -name "*.tsbuildinfo" -type f -delete
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running and accessible
- Check credentials in `.env` file (copy from `.env.example` if needed)
- Verify that port 27017 is not occupied by another process

### Redis Connection Issues

- Ensure Redis is running and accessible
- Check password in `.env` file (copy from `.env.example` if needed)
- Verify that port 6379 is not occupied by another process

### Port Issues

If ports are occupied, change them in the `.env` file (copy from `.env.example` if needed) or `docker-compose.yml`

### Dependency Issues

```bash
# Clean and reinstall dependencies
rm -rf node_modules apps/*/node_modules shared/node_modules
pnpm install
```

## Service Startup Order

When starting locally, the following order is recommended:

1. **MongoDB** and **Redis** (infrastructure)
2. **Journal** (microservice)
3. **Data Pipeline** (microservice)
4. **Gateway** (API Gateway, depends on other services)

When using Docker Compose, the startup order is controlled via `depends_on` in `docker-compose.yml`.
