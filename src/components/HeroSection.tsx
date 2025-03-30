import React from 'react';
import { Play, Info } from 'lucide-react';
import { EZTVTorrent } from '../types/eztv';
import { TVDBData } from '../types/tvdb';
import { BackdropImage } from './BackdropImage';

interface HeroSectionProps {
  torrent: EZTVTorrent;
  onPlay: (torrent: EZTVTorrent) => void;
  tvdbData?: TVDBData;
}

export function HeroSection({ torrent, onPlay, tvdbData }: HeroSectionProps) {
  return (
    <div className="flex flex-col space-y-2 py-16 md:space-y-4 lg:h-[65vh] lg:justify-end lg:pb-12 relative">
      <BackdropImage
        src={tvdbData?.backdrop}
        alt={torrent.title}
        className="absolute inset-0"
      />

      <div className="relative z-10 px-4 md:px-8 max-w-screen-xl mx-auto w-full">
        {tvdbData?.logo ? (
          <img
            src={tvdbData.logo}
            alt={torrent.title}
            className="max-w-md w-full h-auto mb-4"
          />
        ) : (
          <h1 className="text-2xl font-bold md:text-4xl lg:text-6xl text-white max-w-2xl">
            {torrent.title}
          </h1>
        )}

        <p className="text-white/70 text-sm md:text-lg max-w-xs md:max-w-lg md:mt-2">
          Season {torrent.season} Episode {torrent.episode}
        </p>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => onPlay(torrent)}
            className="flex items-center gap-x-2 rounded bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/80 md:px-8 md:py-3"
          >
            <Play className="h-4 w-4 text-black" />
            Play
          </button>

          <button className="flex items-center gap-x-2 rounded bg-gray-600/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-600/50 md:px-8 md:py-3">
            <Info className="h-4 w-4 text-white" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}