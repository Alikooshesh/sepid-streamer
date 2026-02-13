"use client";

import Link from "next/link";
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

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history, addToHistory, updateHistoryItem } = useWatchHistory();
  
  const [urlInput, setUrlInput] = useState("");
  const [currentItem, setCurrentItem] = useState<WatchHistoryItem | null>(null);

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <VideoPlayer 
            src={getVideoSrc()}
            historyItem={currentItem}
            onTimeUpdate={handleTimeUpdate} 
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
                    Load and customize subtitles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Subtitle controls will be here.</p>
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
