export interface TVDBData {
  backdrop?: string;
  logo?: string;
  poster?: string;
  title?: string;
  overview?: string;
  mediaType?: 'movie' | 'tv';
  error?: string;
}

export interface TVDBCache {
  [key: string]: TVDBData;
}