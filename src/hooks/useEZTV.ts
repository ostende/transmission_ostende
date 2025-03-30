import { useState, useCallback } from 'react';
import { EZTVResponse, EZTVTorrent } from '../types/eztv';

const BASE_URL = 'https://eztvx.to/api';

export function useEZTV() {
  const [torrents, setTorrents] = useState<EZTVTorrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTorrents = useCallback(async (searchQuery?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(`${BASE_URL}/get-torrents`);
      url.searchParams.append('page', page.toString());
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch torrents');
      }

      const data: EZTVResponse = await response.json();
      setTorrents(data.torrents);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  return {
    torrents,
    isLoading,
    error,
    page,
    totalPages,
    fetchTorrents,
    nextPage,
    previousPage,
  };
}