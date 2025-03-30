import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useTVDB } from '../hooks/useTVDB';
import { EZTVTorrent } from '../types/eztv';
import { TVDBCache } from '../types/tvdb';

interface TorrentRowProps {
  title: string;
  torrents: EZTVTorrent[];
  onPlay: (torrent: EZTVTorrent) => void;
  tvdbCache: TVDBCache;
}

export function TorrentRow({ title, torrents, onPlay, tvdbCache }: TorrentRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const { fetchTVDBData } = useTVDB();

  useEffect(() => {
    async function loadPosters() {
      for (const torrent of torrents) {
        if (!tvdbCache[torrent.title]) {
          await fetchTVDBData(torrent.title, torrent.imdb_id);
        }
      }
    }
    loadPosters();
  }, [torrents, fetchTVDBData, tvdbCache]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const getImageUrl = (torrent: EZTVTorrent): string => {
    const tvdbData = tvdbCache[torrent.title];
    if (tvdbData?.poster) {
      return tvdbData.poster;
    }
    
    if (torrent.large_screenshot) {
      return torrent.large_screenshot.startsWith('//') 
        ? `https:${torrent.large_screenshot}` 
        : torrent.large_screenshot;
    }
    
    // Fallback to a placeholder image from Unsplash
    return 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&auto=format&fit=crop';
  };

  return (
    <div className="relative group">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      <button 
        className="absolute top-0 bottom-0 left-0 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-9 w-9 text-white" />
      </button>

      <div 
        ref={rowRef}
        className="flex items-center space-x-2.5 overflow-x-scroll scrollbar-hide md:space-x-4 pb-4"
      >
        {torrents.map((torrent) => {
          const key = `${torrent.imdb_id}-${torrent.episode}-${torrent.season}`;
          const imageUrl = getImageUrl(torrent);

          return (
            <div 
              key={key}
              className="relative h-56 min-w-[200px] cursor-pointer transition duration-200 ease-out md:h-64 md:min-w-[280px] hover:scale-105 bg-gray-900 rounded-sm md:rounded overflow-hidden"
              onClick={() => onPlay(torrent)}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={torrent.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-sm font-semibold line-clamp-1">{torrent.title}</h3>
                <p className="text-white/70 text-xs">S{torrent.season} E{torrent.episode}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className="absolute top-0 bottom-0 right-0 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-9 w-9 text-white" />
      </button>
    </div>
  );
}