import React from 'react';
import { Download, Play, Info } from 'lucide-react';
import { EZTVTorrent } from '../types/eztv';

interface TorrentCardProps {
  torrent: EZTVTorrent;
  onDownload: (torrent: EZTVTorrent) => void;
  onPlay: (torrent: EZTVTorrent) => void;
}

export function TorrentCard({ torrent, onDownload, onPlay }: TorrentCardProps) {
  const formatSize = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (unix: number) => {
    return new Date(unix * 1000).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {torrent.large_screenshot && (
        <img 
          src={torrent.large_screenshot.startsWith('//') ? `https:${torrent.large_screenshot}` : torrent.large_screenshot}
          alt={torrent.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{torrent.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>Season: {torrent.season} | Episode: {torrent.episode}</p>
          <p>Size: {formatSize(torrent.size_bytes)}</p>
          <p>Released: {formatDate(torrent.date_released_unix)}</p>
          <p>Seeds: {torrent.seeds} | Peers: {torrent.peers}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onDownload(torrent)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            <Download size={16} />
            Download
          </button>
          
          <button
            onClick={() => onPlay(torrent)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            <Play size={16} />
            Play
          </button>
        </div>
      </div>
    </div>
  );
}