import React, { useEffect, useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useEZTV } from './hooks/useEZTV';
import { useTVDB } from './hooks/useTVDB';
import { TorrentRow } from './components/TorrentRow';
import { HeroSection } from './components/HeroSection';
import { BackdropImage } from './components/BackdropImage';
import { EZTVTorrent } from './types/eztv';
import { TVDBData } from './types/tvdb';

function App() {
  const { torrents, isLoading, error, page, totalPages, fetchTorrents, nextPage } = useEZTV();
  const { fetchTVDBData, cache } = useTVDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [heroTorrent, setHeroTorrent] = useState<EZTVTorrent | null>(null);
  const [selectedTorrent, setSelectedTorrent] = useState<EZTVTorrent | null>(null);
  const [tvdbData, setTvdbData] = useState<TVDBData>({});

  useEffect(() => {
    fetchTorrents();
  }, [fetchTorrents, page]);

  useEffect(() => {
    if (torrents.length > 0 && !heroTorrent) {
      setHeroTorrent(torrents[0]);
    }
  }, [torrents, heroTorrent]);

  useEffect(() => {
    async function loadTVDBData() {
      if (selectedTorrent) {
        const data = await fetchTVDBData(selectedTorrent.title);
        setTvdbData(data);
      }
    }
    loadTVDBData();
  }, [selectedTorrent, fetchTVDBData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTorrents(searchQuery);
  };

  const handlePlay = (torrent: EZTVTorrent) => {
    setSelectedTorrent(torrent);
    console.log('Playing:', torrent.title);
  };

  // Group torrents by season
  const groupedTorrents = torrents.reduce((acc, torrent) => {
    const season = `Season ${torrent.season}`;
    if (!acc[season]) {
      acc[season] = [];
    }
    acc[season].push(torrent);
    return acc;
  }, {} as Record<string, EZTVTorrent[]>);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Backdrop */}
      <BackdropImage
        src={tvdbData.backdrop}
        alt={selectedTorrent?.title || ''}
        className="fixed inset-0"
      />

      {/* Header */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-4 py-4 transition-all lg:px-8 lg:py-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-red-600">Transmission By Ostende</h1>
          
          <ul className="hidden space-x-4 md:flex">
            <li className="headerLink">Home</li>
            <li className="headerLink">Best TV Shows</li>
            <li className="headerLink">New & Popular</li>
            <li className="headerLink">My List</li>
          </ul>
        </div>

        <div className="flex items-center space-x-4">
          {showSearch && (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="bg-black/40 text-white border border-white/20 rounded px-4 py-1 focus:outline-none focus:border-white/50"
              />
            </form>
          )}
          <Search 
            className="h-6 w-6 text-white cursor-pointer" 
            onClick={() => setShowSearch(!showSearch)}
          />
          <Bell className="h-6 w-6 text-white" />
          <User className="h-6 w-6 text-white" />
        </div>
      </header>

      <main className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {heroTorrent && (
              <HeroSection
                torrent={heroTorrent}
                onPlay={handlePlay}
                tvdbData={cache[heroTorrent.title]}
              />
            )}

            {/* Rows */}
            <div className="px-4 md:px-8 pb-16 space-y-8">
              <TorrentRow
                title="Trending Now"
                torrents={torrents.slice(0, 10)}
                onPlay={handlePlay}
                tvdbCache={cache}
              />

              {Object.entries(groupedTorrents).map(([season, seasonTorrents]) => (
                <TorrentRow
                  key={season}
                  title={season}
                  torrents={seasonTorrents}
                  onPlay={handlePlay}
                  tvdbCache={cache}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Load more button */}
      {page < totalPages && (
        <div className="flex justify-center pb-8">
          <button
            onClick={nextPage}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default App;