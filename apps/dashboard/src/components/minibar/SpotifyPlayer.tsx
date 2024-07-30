'use client';
import { FastForward, Play, Rewind } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

const SpotifyPlayer: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="flex items-center justify-between text-white text-xs">
      {isConnected ? (
        <>
          <div>
            <span
              style={{
                userSelect: 'none',
              }}
            >
              Song Name
            </span>{' '}
            -{' '}
            <span
              style={{
                userSelect: 'none',
              }}
            >
              Artist Name
            </span>
          </div>
          <div className="flex items-center">
            <Rewind className="mx-1 size-3" />
            <Play className="mx-1 size-4" />
            <FastForward className="mx-1 size-3" />
          </div>
        </>
      ) : (
        <button
          onClick={() => setIsConnected(true)}
          className=" text-white px-4 py-2 rounded"
        >
          Connect Spotify *coming soon*
        </button>
      )}
    </div>
  );
};

export default SpotifyPlayer;
