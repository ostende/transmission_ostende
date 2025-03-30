import { useState, useCallback, useEffect } from 'react';
import { TVDBData } from '../types/tvdb';
import { supabase } from '../lib/supabase';

export function useTVDB() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, TVDBData>>({});

  const fetchTVDBData = useCallback(async (title: string, imdbId?: string): Promise<TVDBData> => {
    try {
      // Check cache first
      if (cache[title]) {
        return cache[title];
      }

      // If no IMDB ID, return empty object
      if (!imdbId) {
        console.log('No IMDB ID provided for:', title);
        return {};
      }

      setIsLoading(true);
      setError(null);

      // First check if we have the show in our database
      const { data: existingShow, error: dbError } = await supabase
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
        const tvdbData: TVDBData = {
          title: existingShow.title || undefined,
          overview: existingShow.overview || undefined,
          backdrop: existingShow.backdrop_url || undefined,
          poster: existingShow.poster_url || undefined,
          logo: existingShow.logo_url || undefined,
          mediaType: existingShow.media_type || undefined
        };

        setCache(prev => ({
          ...prev,
          [title]: tvdbData
        }));

        return tvdbData;
      }

      // If not in database, fetch from TVDB API
      const baseURL = import.meta.env.VITE_SUPABASE_URL;
      if (!baseURL) {
        throw new Error('VITE_SUPABASE_URL is not defined');
      }

      const cleanBaseURL = baseURL.replace(/\/+$/, '');
      const url = new URL(`${cleanBaseURL}/functions/v1/tvdb`);
      url.searchParams.append('imdb_id', imdbId);

      const annonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!annonKey) {
        throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
      }

      console.log('Fetching TMDB data for:', title, 'with IMDB ID:', imdbId);
      
      // Add retry logic for network errors
      let retries = 3;
      let response;
      
      while (retries > 0) {
        try {
          response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${annonKey}`,
              'Content-Type': 'application/json',
            },
          });
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }

      if (!response?.ok) {
        const errorText = await response?.text();
        console.error('TMDB API Response:', {
          status: response?.status,
          statusText: response?.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch TMDB data: ${response?.statusText}`);
      }

      const data = await response.json();
      console.log('Received TMDB data:', data);
      
      if (data.error) {
        console.log('TMDB API notice:', data.error);
        // Store empty result in cache to prevent repeated failed requests
        setCache(prev => ({
          ...prev,
          [title]: {}
        }));
        return {};
      }

      // Convert database format to TVDBData format
      const tvdbData: TVDBData = {
        title: data.title || undefined,
        overview: data.overview || undefined,
        backdrop: data.backdrop_url || undefined,
        poster: data.poster_url || undefined,
        logo: data.logo_url || undefined,
        mediaType: data.media_type || undefined
      };

      // Update cache with valid data only
      if (tvdbData.backdrop || tvdbData.poster || tvdbData.logo) {
        setCache(prev => ({
          ...prev,
          [title]: tvdbData
        }));
      }

      return tvdbData;
    } catch (err) {
      console.error('TMDB fetch error:', err);
      // Store empty result in cache to prevent repeated failed requests
      setCache(prev => ({
        ...prev,
        [title]: {}
      }));
      setError(err instanceof Error ? err.message : 'Failed to fetch TMDB data');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [cache]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('shows_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shows'
      }, (payload) => {
        const show = payload.new;
        if (show) {
          setCache(prev => ({
            ...prev,
            [show.title || '']: {
              title: show.title || undefined,
              overview: show.overview || undefined,
              backdrop: show.backdrop_url || undefined,
              poster: show.poster_url || undefined,
              logo: show.logo_url || undefined,
              mediaType: show.media_type || undefined
            }
          }));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    fetchTVDBData,
    isLoading,
    error,
    cache
  };
}