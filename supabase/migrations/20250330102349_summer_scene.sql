/*
  # Create shows table for TV/Movie metadata

  1. New Tables
    - `shows`
      - `id` (uuid, primary key)
      - `imdb_id` (text, unique) - IMDB identifier
      - `title` (text) - Show/movie title
      - `overview` (text) - Show description
      - `backdrop_url` (text) - URL to backdrop image
      - `poster_url` (text) - URL to poster image
      - `logo_url` (text) - URL to logo image
      - `media_type` (text) - Either 'tv' or 'movie'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `shows` table
    - Add policy for public read access
    - Add policy for service role write access
*/

CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imdb_id text UNIQUE NOT NULL,
  title text,
  overview text,
  backdrop_url text,
  poster_url text,
  logo_url text,
  media_type text CHECK (media_type IN ('tv', 'movie')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Shows are viewable by everyone" 
  ON shows
  FOR SELECT 
  TO public
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service role can insert shows" 
  ON shows
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update shows" 
  ON shows
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();