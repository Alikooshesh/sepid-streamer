"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoPlayer } from "@/components/video-player";
import { useWatchHistory, WatchHistoryItem } from "@/hooks/use-watch-history";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

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
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);

  useEffect(() => {
    // Revoke object URLs on cleanup
    return () => {
      subtitles.forEach(sub => URL.revokeObjectURL(sub.src));
    };
  }, [subtitles]);

  useEffect(() => {
    const historyId = searchParams.get('historyId');
    if (historyId) {
      const item = history.find(h => h.id === historyId);
      if (item) {
        setCurrentItem(item);
        setSubtitles([]); // Clear subtitles for new video
        // Clear the query param
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
    setSubtitles([]);
    setUrlInput("");
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
      setSubtitles([]);
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
    event.target.value = ""; // Reset file input
  };

  const removeSubtitle = (id: string) => {
    const subToRemove = subtitles.find(s => s.id === id);
    if (subToRemove) {
      URL.revokeObjectURL(subToRemove.src);
    }
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };


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
                      />
                      <Button onClick={handleUrlLoad}>Load</Button>
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
                    Load .vtt or .srt subtitle files.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subtitle-file">Load Subtitle File</Label>
                    <Input id="subtitle-file" type="file" onChange={handleSubtitleFileChange} accept=".vtt,.srt" />
                  </div>
                  {subtitles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Loaded Tracks</Label>
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
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="audio">
              <Card>
                <CardHeader>
                  <CardTitle>Separate Audio</CardTitle>
                  <CardDescription>
                    Attach a separate audio track.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Audio controls will be here.</p>
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
