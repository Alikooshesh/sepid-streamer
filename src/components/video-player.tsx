
"use client";

import { useRef, useEffect, useCallback } from "react";
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
  onError?: (message: string) => void;
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
  activeAudioTrackId,
  onError
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const originalCueTimesRef = useRef(new Map<string, { startTime: number; endTime: number }[]>());

  const onInternalTracksChangeRef = useRef(onInternalTracksChange);
  onInternalTracksChangeRef.current = onInternalTracksChange;
  
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  
  const reportTracks = useCallback(() => {
    const video = videoRef.current;
    if (video) {
        const textTracks = video.textTracks ? Array.from(video.textTracks).filter(t => t.kind === 'subtitles' || t.kind === 'captions') : [];
        const audioTracks = video.audioTracks ? Array.from(video.audioTracks) : [];
        
        onInternalTracksChangeRef.current({
            text: textTracks,
            audio: audioTracks,
        });
    }
  }, []);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.error || !onErrorRef.current || !video.src) return;

    let message = `An unknown error occurred. Code: ${video.error.code}.`;
    switch (video.error.code) {
      case 1: /* MEDIA_ERR_ABORTED */
        message = 'The video download was aborted.';
        break;
      case 2: /* MEDIA_ERR_NETWORK */
        message = 'A network error caused the video download to fail.';
        break;
      case 3: /* MEDIA_ERR_DECODE */
        message = 'The video could not be decoded, possibly due to corruption or unsupported features.';
        break;
      case 4: /* MEDIA_ERR_SRC_NOT_SUPPORTED */
        message = 'The video could not be loaded. The format may not be supported or the server/network failed.';
        break;
    }
    onErrorRef.current(message);
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
    video.addEventListener('loadeddata', reportTracks);
    video.addEventListener('canplay', reportTracks);
    
    if (video.textTracks) {
      video.textTracks.addEventListener('addtrack', reportTracks);
      video.textTracks.addEventListener('change', reportTracks);
    }
    if (video.audioTracks) {
        video.audioTracks.addEventListener('addtrack', reportTracks);
        video.audioTracks.addEventListener('change', reportTracks);
    }

    return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', reportTracks);
        video.removeEventListener('canplay', reportTracks);
        if (video.textTracks) {
          video.textTracks.removeEventListener('addtrack', reportTracks);
          video.textTracks.removeEventListener('change', reportTracks);
        }
        if (video.audioTracks) {
          video.audioTracks.removeEventListener('addtrack', reportTracks);
          video.audioTracks.removeEventListener('change', reportTracks);
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
    }, 5000); 

    return () => clearInterval(interval);
  }, []);
  
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;
    for (const track of Array.from(video.textTracks)) {
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        // Use functional matching to handle internal and external labels
        const trackLabel = track.label || (track.language ? `Track (${track.language})` : 'Unknown');
        track.mode = trackLabel === activeTextTrackLabel ? 'showing' : 'hidden';
      }
    }
  }, [activeTextTrackLabel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.audioTracks) return;
    for (const track of Array.from(video.audioTracks)) {
      track.enabled = track.id === activeAudioTrackId;
    }
  }, [activeAudioTrackId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;

    const adjustTrack = (track: TextTrack) => {
        if ((track.kind !== 'subtitles' && track.kind !== 'captions') || !track.cues) return;

        const trackId = track.label || track.language || 'unknown';
        
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

    const activeTrack = Array.from(video.textTracks).find(t => t.mode === 'showing');

    if (activeTrack) {
        if (activeTrack.cues && activeTrack.cues.length > 0) {
            adjustTrack(activeTrack);
        } else {
            activeTrack.addEventListener('load', () => adjustTrack(activeTrack), { once: true });
        }
    }
    
  }, [subtitleOffset, subtitleRate, activeTextTrackLabel]);


  useEffect(() => {
    originalCueTimesRef.current.clear();
  }, [src]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <video
        key={src}
        ref={videoRef}
        controls
        muted={!!audioSrc}
        crossOrigin="anonymous"
        className="w-full h-full max-h-full rounded-lg bg-black shadow-2xl object-contain"
        autoPlay={!!src}
        onError={handleError}
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
      <audio ref={audioRef} />
    </div>
  );
}
