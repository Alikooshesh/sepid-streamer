"use client";

import { useRef, useEffect, useCallback } from "react";
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
  audioSrc: string | null;
  historyItem: WatchHistoryItem | null;
  onTimeUpdate: (time: number, duration: number) => void;
  subtitles?: SubtitleTrack[];
  subtitleOffset: number;
  subtitleRate: number;
  onInternalTracksChange: (tracks: { text: TextTrack[]; audio: AudioTrack[] }) => void;
  activeTextTrackLabel: string | null;
  activeAudioTrackId: string | null;
}

export function VideoPlayer({ 
  src, 
  audioSrc, 
  historyItem, 
  onTimeUpdate, 
  subtitles, 
  subtitleOffset, 
  subtitleRate,
  onInternalTracksChange,
  activeTextTrackLabel,
  activeAudioTrackId 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const originalCueTimesRef = useRef(new Map<string, { startTime: number; endTime: number }[]>());

  const onInternalTracksChangeRef = useRef(onInternalTracksChange);
  onInternalTracksChangeRef.current = onInternalTracksChange;
  
  const reportTracks = useCallback(() => {
    const video = videoRef.current;
    if (video) {
        onInternalTracksChangeRef.current({
            text: video.textTracks ? Array.from(video.textTracks) : [],
            audio: video.audioTracks ? Array.from(video.audioTracks) : [],
        });
    }
  }, []);

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
      reportTracks();
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    if (video.textTracks) {
      video.textTracks.addEventListener('addtrack', reportTracks);
    }
    if (video.audioTracks) {
      video.audioTracks.addEventListener('addtrack', reportTracks);
    }

    return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        if (video.textTracks) {
          video.textTracks.removeEventListener('addtrack', reportTracks);
        }
        if (video.audioTracks) {
          video.audioTracks.removeEventListener('addtrack', reportTracks);
        }
    }
  }, [historyItem, reportTracks]);


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
  
  // Effect for handling separate audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (audioSrc) {
      if (audio.src !== audioSrc) {
        audio.src = audioSrc;
        audio.load();
      }
    } else if (audio.src) {
      audio.removeAttribute('src');
      audio.load();
    }
  }, [audioSrc]);
  
  // Effect for synchronizing video and audio playback
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const syncPlay = () => audio.play();
    const syncPause = () => audio.pause();
    const syncTime = () => { audio.currentTime = video.currentTime; };
    const syncVolumeAndMute = () => {
      audio.volume = video.volume;
      if (audioSrc) {
        audio.muted = video.muted;
      }
    };
    const syncRate = () => { audio.playbackRate = video.playbackRate; };

    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPause);
    video.addEventListener('seeking', syncTime);
    video.addEventListener('seeked', syncTime);
    video.addEventListener('volumechange', syncVolumeAndMute);
    video.addEventListener('ratechange', syncRate);

    // Initial sync
    syncTime();
    syncVolumeAndMute();
    syncRate();
    if (video.paused) {
        syncPause();
    } else {
        syncPlay().catch(e => console.error("Audio play failed", e));
    }

    return () => {
        video.removeEventListener('play', syncPlay);
        video.removeEventListener('pause', syncPause);
        video.removeEventListener('seeking', syncTime);
        video.removeEventListener('seeked', syncTime);
        video.removeEventListener('volumechange', syncVolumeAndMute);
        video.removeEventListener('ratechange', syncRate);
    }
  }, [audioSrc]);

  // Effect to manage which subtitle track is showing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;
    for (const track of Array.from(video.textTracks)) {
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        track.mode = track.label === activeTextTrackLabel ? 'showing' : 'hidden';
      }
    }
  }, [activeTextTrackLabel]);

  // Effect to manage which audio track is enabled
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.audioTracks) return;
    for (const track of Array.from(video.audioTracks)) {
      track.enabled = track.id === activeAudioTrackId;
    }
  }, [activeAudioTrackId]);

  // Effect to adjust subtitle timings
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;

    // This function will adjust timings for a given track
    const adjustTrack = (track: TextTrack) => {
        if ((track.kind !== 'subtitles' && track.kind !== 'captions') || !track.cues) return;

        const trackId = track.label;
        
        if (!originalCueTimesRef.current.has(trackId)) {
            const originalTimes = Array.from(track.cues).map(cue => ({ startTime: cue.startTime, endTime: cue.endTime }));
            if (originalTimes.length > 0) {
              originalCueTimesRef.current.set(trackId, originalTimes);
            }
        }

        const originalTimesForTrack = originalCueTimesRef.current.get(trackId);
        if (!originalTimesForTrack) return;

        for (let i = 0; i < track.cues.length; i++) {
          const cue = track.cues[i] as VTTCue;
          const original = originalTimesForTrack[i];
          if (original) {
              cue.startTime = Math.max(0, original.startTime / subtitleRate + subtitleOffset);
              cue.endTime = Math.max(0, original.endTime / subtitleRate + subtitleOffset);
          }
        }
    }

    // Find the currently active track and apply adjustments
    const activeTrack = Array.from(video.textTracks).find(t => t.mode === 'showing');

    if (activeTrack) {
        if (activeTrack.cues && activeTrack.cues.length > 0) {
            adjustTrack(activeTrack);
        } else {
            activeTrack.addEventListener('load', () => adjustTrack(activeTrack), { once: true });
        }
    }
    
  }, [subtitleOffset, subtitleRate, activeTextTrackLabel]);


  // Effect to clear original cue times when source changes to prevent memory leaks
  useEffect(() => {
    originalCueTimesRef.current.clear();
  }, [src]);

  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <video
          key={src} // Re-mount when src changes to properly load new tracks
          ref={videoRef}
          controls
          muted={!!audioSrc}
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
        <audio ref={audioRef} crossOrigin="anonymous" />
      </AspectRatio>
    </div>
  );
}
