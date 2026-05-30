CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS map_index;

CREATE OR REPLACE FUNCTION map_index.normalize_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(unaccent(coalesce(input, ''))), '\s+', ' ', 'g')
$$;

CREATE TABLE IF NOT EXISTS map_index.places (
  place_id text PRIMARY KEY,
  source text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  short_name text,
  display_name text NOT NULL,
  municipality text,
  district text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  importance numeric(6,3) NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS map_index.place_aliases (
  alias_id bigserial PRIMARY KEY,
  place_id text NOT NULL REFERENCES map_index.places(place_id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_map_places_search_trgm
  ON map_index.places
  USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_map_place_aliases_trgm
  ON map_index.place_aliases
  USING gin (normalized_alias gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_map_places_importance
  ON map_index.places (importance DESC, name);

CREATE INDEX IF NOT EXISTS idx_map_places_coordinates
  ON map_index.places (latitude, longitude);

GRANT USAGE ON SCHEMA map_index TO neredeservis_app;
GRANT EXECUTE ON FUNCTION map_index.normalize_text(text) TO neredeservis_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA map_index TO neredeservis_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA map_index TO neredeservis_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA map_index
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neredeservis_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA map_index
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO neredeservis_app;
