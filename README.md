# Pujofy Backend Foundation

Smart Puja Pandal-Hopping and Recommendation Platform Backend.

Given a user's location, crowd metrics, queue wait times, and travel distance, Pujofy recommends the best Puja pandal to visit next.

---

## Features
- **REST API Service**: Built with Node.js, Fastify, and TypeScript.
- **Geospatial Engine**: PostgreSQL + PostGIS spatial index (`GIST`) & queries (`ST_DWithin`, `ST_Distance`).
- **Deterministic Recommendation Engine**: Multi-factor weighted normalization scoring (`QUICK_HOP`, `LOW_CROWD`, `BALANCED`).
- **Seed Data**: 20 realistic Kolkata Puja pandals with realistic coordinates, descriptions, and active crowd reports.
- **Vitest Unit & Integration Tests**: Comprehensive tests for scoring engine and REST API routes.
- **Docker Setup**: PostgreSQL + PostGIS container via Docker Compose.

---

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- Docker & Docker Compose (optional, for local Postgres + PostGIS)

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Packages and Applications
```bash
npm run build
```

### 4. Run Tests
```bash
npm test
```

### 5. Start Database with Docker (Optional for PostGIS)
```bash
npm run docker:up
```

To seed the live database:
```bash
npm run seed
```

### 6. Start Development API Server
```bash
npm run dev
```

The API will listen on `http://localhost:3000`.

---

## API Summary

- `GET /health`: Health check
- `GET /api/pandals/nearby?lat=22.57&lng=88.36&radius=5000`: Search nearby pandals
- `GET /api/pandals/:id`: Fetch pandal details by ID
- `POST /api/crowd/report`: Submit real-time crowd report
- `GET /api/recommendations/next?lat=22.57&lng=88.36&mode=BALANCED&radius=5000`: Get top 3 recommended pandals with scores and explanations

See [docs/api.md](docs/api.md) for full endpoint specifications.
See [docs/architecture.md](docs/architecture.md) for architecture details.
