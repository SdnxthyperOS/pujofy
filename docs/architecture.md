# Pujofy Backend Architecture

## Overview
Pujofy backend is organized as a clean TypeScript monorepo with separation of concerns between API service, domain types, database schemas/migrations, and recommendation/scoring engine.

```
pujofy/
├── apps/
│   └── api/                  # Fastify REST API Service
│       ├── src/
│       │   ├── config/       # Env validation via Zod
│       │   ├── controllers/  # Route handlers
│       │   ├── models/       # DB entity mappers
│       │   ├── plugins/      # Fastify plugins (Postgres pool)
│       │   ├── repositories/ # Abstracted Data Access Layer (Pg & InMemory)
│       │   ├── routes/       # API endpoints
│       │   ├── schemas/      # Zod validation schemas
│       │   ├── services/     # Business logic & recommendation integration
│       │   ├── utils/        # Haversine distance & math utilities
│       │   ├── app.ts        # Fastify application builder
│       │   └── server.ts     # Process entry point
│       └── tests/            # Integration & endpoint tests via Vitest
│
├── database/                 # Database DDL & seeds
│   ├── migrations/           # Versioned SQL migration scripts
│   ├── schema/               # Full PostGIS database schema DDL
│   └── seeds/                # Seed script & SQL inserts
│
├── packages/
│   ├── scoring/              # Deterministic multi-factor scoring engine
│   └── types/                # Shared TypeScript domain interfaces & types
│
├── data/
│   └── seed/                 # JSON seed data (20 realistic Puja pandals)
│
└── docs/                     # Documentation & specifications
```

---

## Technical Highlights

### 1. Spatial Geospatial Queries (PostgreSQL + PostGIS)
Pandals store spatial locations in `GEOGRAPHY(Point, 4326)` columns indexed with spatial `GIST` indexes. Lookups use PostGIS spatial functions:
- `ST_DWithin`: Filter pandals within radius in meters.
- `ST_Distance`: Compute distance in meters directly inside database engine.

### 2. Repository Pattern & Testing Strategy
All data operations are abstracted behind interface contracts (`IPandalRepository`, `ICrowdReportRepository`).
- `PgPandalRepository` executes raw PostGIS queries.
- `InMemoryPandalRepository` provides fast in-memory fallback allowing all Vitest unit & integration tests to run deterministically without requiring a live Postgres instance.

### 3. Recommendation & Scoring Engine (`@pujofy/scoring`)
Deterministic multi-factor scoring formula:
```
Score = wTravel * normTravel + wCrowd * normCrowd + wQueue * normQueue + wDistance * normDistance
```
- Supports 3 modes: `QUICK_HOP`, `LOW_CROWD`, `BALANCED`.
- Normalizes all components relative to candidate set range $[0, 1]$.
- Ranks candidates in ascending order (lower score = higher recommendation).
- Generates human-friendly rationale for recommendations.
