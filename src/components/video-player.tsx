"use client";

import { useRef, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { WatchHistoryItem } from "@/hooks/use-watch-history";

interface SubtitleTrack {
  id: string;
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
  subtitleOffset: number;
  subtitleRate: number;
}

export function VideoPlayer({ src, historyItem, onTimeUpdate, subtitles, subtitleOffset, subtitleRate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const originalCueTimesRef = useRef(new Map<string, { startTime: number; endTime: number }[]>());

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    originalCueTimesRef.current.clear();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const adjustTrack = (track: TextTrack) => {
        if (track.kind !== 'subtitles' || !track.cues) return;

        const trackId = track.label;
        
        if (!originalCueTimesRef.current.has(trackId)) {
            const originalTimes = Array.from(track.cues).map(cue => ({ startTime: cue.startTime, endTime: cue.endTime }));
            originalCueTimesRef.current.set(trackId, originalTimes);
        }

        const originalTimesForTrack = originalCueTimesRef.current.get(trackId);
        if (!originalTimesForTrack) return;

        Array.from(track.cues).forEach((cue, index) => {
            const vttCue = cue as VTTCue;
            const original = originalTimesForTrack[index];
            if (original) {
                vttCue.startTime = Math.max(0, original.startTime / subtitleRate + subtitleOffset);
                vttCue.endTime = Math.max(0, original.endTime / subtitleRate + subtitleOffset);
            }
        });
    }

    const onAddTrack = (e: TrackEvent) => {
      const track = e.track as TextTrack | null;
      if (track) {
        if (track.cues && track.cues.length > 0) {
          adjustTrack(track);
        } else {
          track.addEventListener('load', () => adjustTrack(track), { once: true });
        }
      }
    };
    
    for (const track of Array.from(video.textTracks)) {
      if (track.cues && track.cues.length > 0) {
        adjustTrack(track);
      } else {
        track.addEventListener('load', () => adjustTrack(track), { once: true });
      }
    }

    video.textTracks.addEventListener('addtrack', onAddTrack);

    return () => {
      video.textTracks.removeEventListener('addtrack', onAddTrack);
    };

  }, [subtitleOffset, subtitleRate, subtitles, src]);

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
          {subtitles?.map((sub) => (
            <track
              key={sub.id}
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
