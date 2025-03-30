export interface EZTVTorrent {
  title: string;
  filename: string;
  imdb_id: string;
  large_screenshot: string;
  seeds: number;
  peers: number;
  date_released_unix: number;
  season: string;
  episode: string;
  size_bytes: number;
  torrent_url: string;
  magnet_url: string;
}

export interface EZTVResponse {
  torrents: EZTVTorrent[];
  limit: number;
  page: number;
  total_pages: number;
}