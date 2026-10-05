-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Pandals table
CREATE TABLE IF NOT EXISTS pandals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    entrance_latitude DOUBLE PRECISION,
    entrance_longitude DOUBLE PRECISION,
    location GEOGRAPHY(Point, 4326),
    address TEXT,
    area VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Kolkata',
    category VARCHAR(100),
    estimated_visit_minutes INT DEFAULT 30,
    opening_time VARCHAR(10) DEFAULT '00:00',
    closing_time VARCHAR(10) DEFAULT '23:59',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Index on location for fast geospatial bounding box & distance lookups
CREATE INDEX IF NOT EXISTS idx_pandals_location ON pandals USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_pandals_active ON pandals (is_active);

-- Trigger function to keep GEOGRAPHY location column synced with latitude and longitude
CREATE OR REPLACE FUNCTION update_pandal_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pandal_location ON pandals;
CREATE TRIGGER trg_pandal_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON pandals
FOR EACH ROW EXECUTE FUNCTION update_pandal_location();

-- 2. Crowd Reports table
CREATE TABLE IF NOT EXISTS crowd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pandal_id UUID NOT NULL REFERENCES pandals(id) ON DELETE CASCADE,
    crowd_level VARCHAR(20) NOT NULL CHECK (crowd_level IN ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
    crowd_score DOUBLE PRECISION NOT NULL CHECK (crowd_score >= 0.0 AND crowd_score <= 1.0),
    queue_minutes INT DEFAULT 0,
    confidence DOUBLE PRECISION DEFAULT 0.8 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    source VARCHAR(50) DEFAULT 'USER',
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 hours'),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crowd_reports_pandal_id ON crowd_reports(pandal_id);
CREATE INDEX IF NOT EXISTS idx_crowd_reports_reported_at ON crowd_reports(reported_at DESC);

-- 3. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- 5. Trip Events table
CREATE TABLE IF NOT EXISTS trip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    pandal_id UUID NOT NULL REFERENCES pandals(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('VISITED', 'SKIPPED', 'RECOMMENDED')),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
