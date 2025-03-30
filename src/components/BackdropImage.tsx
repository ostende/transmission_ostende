import React from 'react';

interface BackdropImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function BackdropImage({ src, alt, className = '' }: BackdropImageProps) {
  if (!src) return null;

  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}