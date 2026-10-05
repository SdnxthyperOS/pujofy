-- Migration 002: Add image_url and image_alt to pandals
ALTER TABLE pandals
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT '/images/pandals/fallback.webp',
ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT 'Festive Durga Puja pandal in Kolkata';
