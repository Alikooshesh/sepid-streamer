"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoPlayer } from "@/components/video-player";
import { useWatchHistory, WatchHistoryItem } from "@/hooks/use-watch-history";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus, RotateCcw, Timer, FastForward, AudioLines, Server } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubtitleTrack {
  id: string;
  src: string;
  lang: string;
  label: string;
  default: boolean;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history, addToHistory, updateHistoryItem } = useWatchHistory();
  const { toast } = useToast();
  
  const [urlInput, setUrlInput] = useState("");
  const [currentItem, setCurrentItem] = useState<WatchHistoryItem | null>(null);
  
  // External media attachments
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [audioTrack, setAudioTrack] = useState<{ url: string; name: string } | null>(null);

  // Subtitle timing controls
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [subtitleRate, setSubtitleRate] = useState(1);

  // Internal (embedded) tracks
  const [internalTextTracks, setInternalTextTracks] = useState<TextTrack[]>([]);
  const [internalAudioTracks, setInternalAudioTracks] = useState<AudioTrack[]>([]);
  const [activeTextTrackLabel, setActiveTextTrackLabel] = useState<string | null>(null);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<string | null>(null);


  const resetSubtitleTiming = useCallback(() => {
    setSubtitleOffset(0);
    setSubtitleRate(1);
  }, []);

  const resetMediaAttachments = useCallback(() => {
    // Revoke old subtitle URLs
    subtitles.forEach(sub => URL.revokeObjectURL(sub.src));
    setSubtitles([]);
    resetSubtitleTiming();
    
    // Revoke old audio URL
    if (audioTrack) {
      URL.revokeObjectURL(audioTrack.url);
      setAudioTrack(null);
    }
  }, [subtitles, audioTrack, resetSubtitleTiming]);
  
  // Effect to reset all media state when the video source changes
  useEffect(() => {
    if (currentItem) {
      resetMediaAttachments();
      setInternalTextTracks([]);
      setInternalAudioTracks([]);
      setActiveTextTrackLabel(null);
      setActiveAudioTrackId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id]);

  // General cleanup effect for object URLs
  useEffect(() => {
    return () => {
      subtitles.forEach(sub => URL.revokeObjectURL(sub.src));
      if (audioTrack) {
        URL.revokeObjectURL(audioTrack.url);
      }
    };
  }, [subtitles, audioTrack]);

  // Effect to load video from history via URL param
  useEffect(() => {
    const historyId = searchParams.get('historyId');
    if (historyId) {
      const item = history.find(h => h.id === historyId);
      if (item) {
        setCurrentItem(item);
        // Clear the query param
        router.replace('/', { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, history, router]);

  const handleUrlLoad = () => {
    if (!urlInput) return;
    const title = urlInput.substring(urlInput.lastIndexOf('/') + 1) || urlInput;
    const newItem = addToHistory({
      title,
      sourceType: 'url',
      sourceValue: urlInput,
      lastPositionSeconds: 0,
    });
    setCurrentItem(newItem);
    setUrlInput("");
  };

  const handleProxyLoad = () => {
    if (!urlInput) return;
    const title = urlInput.substring(urlInput.lastIndexOf('/') + 1) || urlInput;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(urlInput)}`;
    
    const itemToPlay = addToHistory({
      title: `${title} (Proxied)`,
      sourceType: 'url',
      sourceValue: proxyUrl,
      lastPositionSeconds: 0,
    });

    setCurrentItem(itemToPlay);
    setUrlInput("");
    toast({
        title: "Loading via proxy",
        description: "The video will be streamed through the server."
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItem = addToHistory({
        title: file.name,
        sourceType: 'local',
        sourceValue: url,
        lastPositionSeconds: 0,
      });
      setCurrentItem(newItem);
    }
    event.target.value = ""; // Reset file input
  };

  const handleTimeUpdate = (time: number, duration: number) => {
    if (currentItem) {
      updateHistoryItem(currentItem.id, {
        lastPositionSeconds: time,
        durationSeconds: duration,
      });
    }
  };
  
  const getVideoSrc = () => {
    if (!currentItem) return null;
    return currentItem.sourceValue;
  }

  const convertSrtToVtt = (srtText: string): string => {
    return 'WEBVTT\n\n' +
      srtText
        .trim()
        .replace(/\r/g, '')
        .split('\n\n')
        .map(line => {
          const parts = line.split('\n');
          if (parts.length > 1 && parts[0].match(/^\d+$/)) {
            parts.shift();
          }
          return parts.join('\n');
        })
        .join('\n\n')
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  };

  const handleSubtitleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let subtitleBlob: Blob;

    if (file.name.endsWith('.srt')) {
      try {
        const srtText = await file.text();
        const vttContent = convertSrtToVtt(srtText);
        subtitleBlob = new Blob([vttContent], { type: 'text/vtt' });
      } catch (error) {
        console.error("Error converting SRT to VTT", error);
        toast({
          variant: "destructive",
          title: "Subtitle Conversion Error",
          description: "Could not convert SRT file to VTT.",
        });
        return;
      }
    } else if (file.name.endsWith('.vtt')) {
      subtitleBlob = file;
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported Format",
        description: "Please upload a .vtt or .srt file.",
      });
      return;
    }
    
    const subtitleUrl = URL.createObjectURL(subtitleBlob);
  
    const newSubtitle: SubtitleTrack = {
      id: crypto.randomUUID(),
      src: subtitleUrl,
      lang: file.name.slice(0, 2).toLowerCase() || 'en',
      label: file.name,
      default: subtitles.length === 0,
    };
  
    setSubtitles(prev => [...prev, newSubtitle]);
    setActiveTextTrackLabel(newSubtitle.label); // Auto-select the newly added track
    event.target.value = ""; // Reset file input
  };

  const removeSubtitle = (id: string) => {
    const subToRemove = subtitles.find(s => s.id === id);
    if (subToRemove) {
      if (activeTextTrackLabel === subToRemove.label) {
        setActiveTextTrackLabel(null);
      }
      URL.revokeObjectURL(subToRemove.src);
    }
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };

  const handleOffsetChange = (delta: number) => {
    setSubtitleOffset(prev => parseFloat((prev + delta).toFixed(2)));
  };
  
  const handleRateChange = (delta: number) => {
      setSubtitleRate(prev => {
          const newRate = parseFloat((prev + delta).toFixed(2));
          return Math.max(0.1, newRate); // Prevent rate from being 0 or negative
      });
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (audioTrack) {
        URL.revokeObjectURL(audioTrack.url);
      }
      const url = URL.createObjectURL(file);
      setAudioTrack({ url, name: file.name });
      toast({ title: "Audio track loaded", description: file.name });
    }
    event.target.value = ""; // Reset file input
  };

  const removeAudioTrack = () => {
    if (audioTrack) {
      URL.revokeObjectURL(audioTrack.url);
      setAudioTrack(null);
      toast({ title: "Audio track removed" });
    }
  };

  const handleInternalTracksChange = useCallback(({ text, audio }: { text: TextTrack[], audio: AudioTrack[] }) => {
    const subtitleTracks = text.filter(t => t.kind === 'subtitles' || t.kind === 'captions');
    setInternalTextTracks(subtitleTracks);
    setInternalAudioTracks(audio);

    if (!activeTextTrackLabel && subtitleTracks.length > 0) {
      const defaultTrack = subtitleTracks.find(t => t.mode === 'showing') || subtitleTracks.find(t => t.language.startsWith('en')) || subtitleTracks[0];
      if (defaultTrack) {
        setActiveTextTrackLabel(defaultTrack.label);
      }
    }
    
    if (!activeAudioTrackId && audio.length > 0) {
      const defaultTrack = audio.find(t => t.enabled) || audio.find(t => t.language.startsWith('en')) || audio[0];
      if (defaultTrack) {
        setActiveAudioTrackId(defaultTrack.id);
      }
    }
  }, [activeTextTrackLabel, activeAudioTrackId]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <VideoPlayer 
            src={getVideoSrc()}
            historyItem={currentItem}
            onTimeUpdate={handleTimeUpdate} 
            subtitles={subtitles}
            subtitleOffset={subtitleOffset}
            subtitleRate={subtitleRate}
            audioSrc={audioTrack?.url ?? null}
            onInternalTracksChange={handleInternalTracksChange}
            activeTextTrackLabel={activeTextTrackLabel}
            activeAudioTrackId={activeAudioTrackId}
          />
        </div>
        <aside className="w-96 border-l p-4 overflow-y-auto">
          <Tabs defaultValue="source">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="subtitles">Subtitles</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>
            <TabsContent value="source">
              <Card>
                <CardHeader>
                  <CardTitle>Video Source</CardTitle>
                  <CardDescription>
                    {currentItem ? `Now Playing: ${currentItem.title}` : 'Load video from a URL or a local file.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Video URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="url"
                        placeholder="https://example.com/video.mp4"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                      />
                      <Button onClick={handleUrlLoad}>Load</Button>
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button onClick={handleProxyLoad} variant="outline" size="icon">
                                      <Server className="h-4 w-4" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Load via server proxy</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local-file">Local File</Label>
                    <Input id="local-file" type="file" onChange={handleFileChange} accept="video/*" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="subtitles">
              <Card>
                <CardHeader>
                  <CardTitle>Subtitles</CardTitle>
                  <CardDescription>
                    Load or select subtitle tracks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {(internalTextTracks.length > 0 || subtitles.length > 0) && (
                    <div className="space-y-2">
                      <Label>Active Subtitle</Label>
                      <Select
                          value={activeTextTrackLabel ?? ""}
                          onValueChange={(label) => setActiveTextTrackLabel(label || null)}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="Select a track" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {internalTextTracks.map((track, i) => (
                                  <SelectItem key={`${track.label}-${i}`} value={track.label}>
                                      {track.label || `Track ${i+1}`} (Embedded)
                                  </SelectItem>
                              ))}
                              {subtitles.map(sub => (
                                <SelectItem key={sub.id} value={sub.label}>
                                    {sub.label} (External)
                                </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subtitle-file">Load External Subtitle</Label>
                    <Input id="subtitle-file" type="file" onChange={handleSubtitleFileChange} accept=".vtt,.srt" />
                  </div>

                  {subtitles.length > 0 && (
                    <div className="space-y-2">
                      <Label>External Tracks</Label>
                      <ul className="space-y-2">
                        {subtitles.map(sub => (
                          <li key={sub.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                            <span className="truncate">{sub.label}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSubtitle(sub.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                   <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4" />
                        Subtitle Delay (s)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOffsetChange(-0.1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          readOnly
                          value={subtitleOffset.toFixed(2)}
                          className="w-20 text-center h-8"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOffsetChange(0.1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <FastForward className="h-4 w-4" />
                        Subtitle Speed
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRateChange(-0.1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          readOnly
                          value={subtitleRate.toFixed(2)}
                          className="w-20 text-center h-8"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRateChange(0.1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  
                    <Button variant="outline" size="sm" onClick={resetSubtitleTiming}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Timing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="audio">
              <Card>
                <CardHeader>
                  <CardTitle>Audio Track</CardTitle>
                  <CardDescription>
                    Attach or select an audio track.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="audio-file">Load External Audio File</Label>
                        <Input id="audio-file" type="file" onChange={handleAudioFileChange} accept="audio/*,.mp3,.wav,.ogg" />
                    </div>

                    {audioTrack ? (
                        <div className="space-y-2">
                            <Label>Loaded Audio Track</Label>
                            <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                <span className="truncate">{audioTrack.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeAudioTrack}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : internalAudioTracks.length <= 1 ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 rounded-md">
                            <AudioLines className="w-10 h-10 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No separate or multiple audio tracks.</p>
                        </div>
                    ) : null}

                    {internalAudioTracks.length > 1 && (
                      <div className="space-y-2 pt-4 border-t">
                          <Label>Embedded Audio Tracks</Label>
                          <Select
                              value={activeAudioTrackId ?? ''}
                              onValueChange={(id) => {
                                  if (audioTrack) removeAudioTrack();
                                  setActiveAudioTrackId(id);
                              }}
                              disabled={!!audioTrack}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Select an audio track" />
                              </SelectTrigger>
                              <SelectContent>
                                  {internalAudioTracks.map(track => (
                                      <SelectItem key={track.id} value={track.id}>
                                          {track.label || `Track ${track.id}`} ({track.language})
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          {!!audioTrack && <p className="text-xs text-muted-foreground">Disable external audio to select embedded tracks.</p>}
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </aside>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
