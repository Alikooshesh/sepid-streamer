
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
import { 
  Trash2, 
  Plus, 
  Minus, 
  RotateCcw, 
  Timer, 
  FastForward, 
  AudioLines, 
  Server, 
  Sparkles, 
  FileText, 
  Clock,
  Loader2,
  PanelRight,
  Settings2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { analyzeVideo, type AnalyzeVideoOutput } from "@/ai/flows/analyze-video-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  // UI State - Sidebar closed by default
  const [showSidebar, setShowSidebar] = useState(false);

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

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeVideoOutput | null>(null);


  const resetSubtitleTiming = useCallback(() => {
    setSubtitleOffset(0);
    setSubtitleRate(1);
  }, []);

  const resetMediaAttachments = useCallback(() => {
    // We use functional updates to clear state and revoke URLs without needing dependencies
    setSubtitles(prev => {
      prev.forEach(sub => URL.revokeObjectURL(sub.src));
      return [];
    });
    setAudioTrack(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    resetSubtitleTiming();
  }, [resetSubtitleTiming]);

  // Effect to reset all media state when the video source changes
  useEffect(() => {
    if (currentItem) {
      resetMediaAttachments();
      setInternalTextTracks([]);
      setInternalAudioTracks([]);
      setActiveTextTrackLabel(null);
      setActiveAudioTrackId(null);
      setAiAnalysis(null);
    }
  }, [currentItem?.id, resetMediaAttachments]);

  // General cleanup effect for object URLs on unmount
  useEffect(() => {
    return () => {
      setSubtitles(prev => {
        prev.forEach(sub => URL.revokeObjectURL(sub.src));
        return [];
      });
      setAudioTrack(prev => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
    };
  }, []);

  // Effect to load video from history via URL param
  useEffect(() => {
    const historyId = searchParams.get('historyId');
    if (historyId) {
      const item = history.find(h => h.id === historyId);
      if (item) {
        setCurrentItem(item);
        if (item.sourceType === 'url') {
          setUrlInput(item.sourceValue);
        }
        router.replace('/', { scroll: false });
      }
    }
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
    event.target.value = ""; 
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
    setActiveTextTrackLabel(newSubtitle.label); 
    event.target.value = ""; 
  };

  const removeSubtitle = (id: string) => {
    setSubtitles(prev => {
      const subToRemove = prev.find(s => s.id === id);
      if (subToRemove) {
        if (activeTextTrackLabel === subToRemove.label) {
          setActiveTextTrackLabel(null);
        }
        URL.revokeObjectURL(subToRemove.src);
      }
      return prev.filter(s => s.id !== id);
    });
  };

  const handleOffsetChange = (delta: number) => {
    setSubtitleOffset(prev => parseFloat((prev + delta).toFixed(2)));
  };

  const handleRateChange = (delta: number) => {
    setSubtitleRate(prev => {
      const newRate = parseFloat((prev + delta).toFixed(2));
      return Math.max(0.1, newRate); 
    });
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioTrack(prev => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(file), name: file.name };
      });
      toast({ title: "Audio track loaded", description: file.name });
    }
    event.target.value = ""; 
  };

  const removeAudioTrack = () => {
    setAudioTrack(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    toast({ title: "Audio track removed" });
  };

  const handleInternalTracksChange = useCallback(({ text, audio }: { text: TextTrack[], audio: AudioTrack[] }) => {
    const subtitleTracks = text.filter(t => t.kind === 'subtitles' || t.kind === 'captions');
    setInternalTextTracks(subtitleTracks);
    setInternalAudioTracks(audio);

    // Use functional updates for labels/ids to avoid callback dependency loops
    setActiveTextTrackLabel(prev => {
      if (!prev && subtitleTracks.length > 0) {
        const defaultTrack = subtitleTracks.find(t => t.mode === 'showing') || subtitleTracks.find(t => t.language.startsWith('en')) || subtitleTracks[0];
        return defaultTrack?.label || null;
      }
      return prev;
    });

    setActiveAudioTrackId(prev => {
      if (!prev && audio.length > 0) {
        const defaultTrack = audio.find(t => t.enabled) || audio.find(t => t.language.startsWith('en')) || audio[0];
        return defaultTrack?.id || null;
      }
      return prev;
    });
  }, []);

  const handleVideoError = useCallback((message: string) => {
    toast({
      variant: 'destructive',
      title: "Video Playback Error",
      description: message,
      duration: 10000,
    });
  }, [toast]);

  const handleAIAnalysis = async () => {
    if (!currentItem) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeVideo({
        videoUrl: currentItem.sourceValue,
        title: currentItem.title,
      });
      setAiAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: "AI has successfully summarized the video.",
      });
    } catch (error) {
      console.error("AI Analysis failed", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not analyze video content.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-end p-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={cn("gap-2 shadow-sm", showSidebar && "bg-accent border-accent text-accent-foreground")}
                  >
                    {showSidebar ? (
                       <>
                        <PanelRight className="h-4 w-4" />
                        Close Controls
                       </>
                    ) : (
                      <>
                        <Settings2 className="h-4 w-4" />
                        Media Controls & AI
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showSidebar ? "Collapse Sidebar" : "Expand Sidebar"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
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
              onError={handleVideoError}
            />
          </div>
        </div>

        <aside className={cn(
          "h-full border-l bg-card shadow-lg transition-all duration-300 ease-in-out flex flex-col",
          showSidebar ? "w-96 opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}>
          <div className="w-96 h-full flex flex-col p-4 overflow-y-auto">
            <Tabs defaultValue="source" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="source">Src</TabsTrigger>
                <TabsTrigger value="subtitles">Sub</TabsTrigger>
                <TabsTrigger value="audio">Aud</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              <TabsContent value="source" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Video Source</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      {currentItem ?
                        <>
                          <p className="text-xs uppercase font-bold text-muted-foreground">Now Playing:</p>
                          <p className="font-medium text-foreground line-clamp-2">{currentItem.title}</p>
                        </>
                        : 'Load video from a URL or a local file.'}
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
                          className="flex-1"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={handleProxyLoad} variant="outline" size="icon" className="shrink-0">
                                <Server className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Load via server proxy</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button className="w-full mt-1" onClick={handleUrlLoad}>Load URL</Button>
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="local-file">Local File</Label>
                      <Input id="local-file" type="file" onChange={handleFileChange} accept="video/*" className="cursor-pointer" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="subtitles" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Subtitles</CardTitle>
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
                                {track.label || `Track ${i + 1}`} (Embedded)
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
                      <Input id="subtitle-file" type="file" onChange={handleSubtitleFileChange} accept=".vtt,.srt" className="cursor-pointer" />
                    </div>

                    {subtitles.length > 0 && (
                      <div className="space-y-2">
                        <Label>External Tracks</Label>
                        <ul className="space-y-2">
                          {subtitles.map(sub => (
                            <li key={sub.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                              <span className="truncate flex-1 pr-2">{sub.label}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeSubtitle(sub.id)}>
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

                      <Button variant="outline" size="sm" className="w-full" onClick={resetSubtitleTiming}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Timing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="audio" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Audio Track</CardTitle>
                    <CardDescription>
                      Attach or select an audio track.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio-file">Load External Audio File</Label>
                      <Input id="audio-file" type="file" onChange={handleAudioFileChange} accept="audio/*,.mp3,.wav,.ogg" className="cursor-pointer" />
                    </div>

                    {audioTrack ? (
                      <div className="space-y-2">
                        <Label>Loaded Audio Track</Label>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                          <span className="truncate flex-1 pr-2">{audioTrack.name}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={removeAudioTrack}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : internalAudioTracks.length <= 1 ? (
                      <div className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 rounded-md bg-muted/20">
                        <AudioLines className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No separate audio tracks found.</p>
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
                        {!!audioTrack && <p className="text-[10px] text-muted-foreground italic">Disable external audio to select embedded tracks.</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ai" className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription>
                      Generate insights using Gemini 1.5 Flash.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!currentItem ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Load a video first to use AI features.
                      </p>
                    ) : (
                      <>
                        <Button 
                          onClick={handleAIAnalysis} 
                          className="w-full shadow-sm" 
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing Content...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Analyze Video
                            </>
                          )}
                        </Button>

                        {aiAnalysis && (
                          <div className="space-y-6 mt-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <FileText className="w-3 h-3" />
                                Summary
                              </Label>
                              <p className="text-sm leading-relaxed text-foreground/90 bg-background p-3 rounded-lg border">{aiAnalysis.summary}</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <AudioLines className="w-3 h-3" />
                                Transcript Overview
                              </Label>
                              <ScrollArea className="h-40 rounded-lg border bg-background p-3">
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                  {aiAnalysis.transcript}
                                </p>
                              </ScrollArea>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <Clock className="w-3 h-3" />
                                Chapters
                              </Label>
                              <div className="space-y-2">
                                {aiAnalysis.chapters.map((chapter, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm p-2 bg-background border rounded-md hover:bg-muted/50 transition-colors">
                                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{chapter.timestamp}</Badge>
                                    <span className="truncate font-medium">{chapter.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <HomePageContent />
    </Suspense>
  )
}
