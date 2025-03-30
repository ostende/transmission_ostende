import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const TMDB_API_KEY = "8789cfd3fbab7dccf1269c3d7d867aff";
const TMDB_API_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
  throw lastError || new Error('Failed after retries');
}

async function fetchTMDBData(imdbId: string) {
  try {
    console.log('Processing IMDB ID:', imdbId);

    // Check if show exists in database first
    const { data: existingShow, error: dbError } = await supabaseClient
      .from('shows')
      .select('*')
      .eq('imdb_id', imdbId)
      .limit(1)
      .maybeSingle();

    if (dbError) {
      console.error('Supabase query error:', dbError);
      throw dbError;
    }

    if (existingShow) {
      console.log('Found existing show in database:', existingShow);
      return existingShow;
    }
    
    // Add 'tt' prefix if not present
    const fullImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
    console.log('Full IMDB ID:', fullImdbId);
    
    // First, find the TMDB ID using IMDB ID
    const findUrl = `${TMDB_API_URL}/find/${fullImdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    console.log('Fetching from TMDB find endpoint:', findUrl);
    
    const findResponse = await fetchWithRetry(findUrl);
    const findData = await findResponse.json();
    console.log('TMDB find response:', findData);
    
    // Check both TV shows and movies
    const tvResult = findData.tv_results?.[0];
    const movieResult = findData.movie_results?.[0];
    
    if (!tvResult && !movieResult) {
      console.log('No media found for IMDB ID:', fullImdbId);
      return { error: "Media not found" };
    }

    // Use TV show if available, otherwise use movie
    const isMovie = !tvResult && movieResult;
    const mediaResult = tvResult || movieResult;
    
    // Get detailed info based on media type
    const mediaId = mediaResult.id;
    const mediaType = isMovie ? 'movie' : 'tv';
    const detailsUrl = `${TMDB_API_URL}/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=images`;
    console.log('Fetching details from TMDB:', detailsUrl);
    
    const detailsResponse = await fetchWithRetry(detailsUrl);
    const detailsData = await detailsResponse.json();
    console.log('TMDB details response:', detailsData);

    // Construct image URLs
    const baseImageUrl = "https://image.tmdb.org/t/p/original";
    const backdrop_url = detailsData.backdrop_path ? `${baseImageUrl}${detailsData.backdrop_path}` : null;
    const poster_url = detailsData.poster_path ? `${baseImageUrl}${detailsData.poster_path}` : null;

    // Store show data in Supabase
    const showData = {
      imdb_id: imdbId,
      title: detailsData.name || detailsData.title,
      overview: detailsData.overview,
      backdrop_url,
      poster_url,
      logo_url: null,
      media_type: mediaType
    };

    const { data: insertedShow, error: insertError } = await supabaseClient
      .from('shows')
      .insert(showData)
      .select()
      .limit(1)
      .maybeSingle();

    if (insertError) {
      console.error('Error inserting show:', insertError);
      throw insertError;
    }

    console.log('Successfully stored show in database:', insertedShow);
    return insertedShow || showData;
  } catch (error) {
    console.error("TMDB API Error:", error);
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imdbId = url.searchParams.get("imdb_id");

    if (!imdbId) {
      console.error('Missing IMDB ID parameter');
      return new Response(
        JSON.stringify({ error: "IMDB ID parameter is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Processing request for IMDB ID:', imdbId);
    const data = await fetchTMDBData(imdbId);
    
    return new Response(
      JSON.stringify(data),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});