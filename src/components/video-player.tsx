"use client";

import { useRef, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { WatchHistoryItem } from "@/hooks/use-watch-history";

interface SubtitleTrack {
  src: string;
  lang: string;
  label: string;
  default?: boolean;
}

interface VideoPlayerProps {
  src: string | null;
  historyItem: WatchHistoryItem | null;
  onTimeUpdate: (time: number, duration: number) => void;
  subtitles?: SubtitleTrack[];
}

export function VideoPlayer({ src, historyItem, onTimeUpdate, subtitles }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (historyItem) {
        video.currentTime = historyItem.lastPositionSeconds;
      }
      if (video.duration) {
        onTimeUpdateRef.current(video.currentTime, video.duration);
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [historyItem]);


  useEffect(() => {
    if (videoRef.current) {
      if (src && videoRef.current.src !== src) {
        videoRef.current.src = src;
        videoRef.current.load();
      } else if (!src && videoRef.current.src) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    }
  }, [src]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (!video.paused && video.duration && !isNaN(video.duration)) {
        onTimeUpdateRef.current(video.currentTime, video.duration);
      }
    }, 5000); // Report every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <video
          key={src} // Re-mount when src changes to properly load new tracks
          ref={videoRef}
          controls
          crossOrigin="anonymous" // Needed for external subtitles from blob URLs
          className="w-full h-full rounded-lg bg-black"
          autoPlay={!!src}
        >
          {subtitles?.map((sub, index) => (
            <track
              key={index}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.lang}
              label={sub.label}
              default={sub.default}
            />
          ))}
        </video>
      </AspectRatio>
    </div>
  );
}
