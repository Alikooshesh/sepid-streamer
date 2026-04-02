'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Clapperboard, 
  Film, 
  Plus, 
  PlayCircle, 
  Trash2, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';
import { useSeries, VideoInSeries } from '@/hooks/use-series';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { generateSeriesFromUrl, type GenerateSeriesOutput } from '@/ai/flows/generate-series-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SeriesPage() {
  const { series, createSeries, deleteSeries, removeVideoFromSeries } = useSeries();
  const { toast } = useToast();
  
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  
  // AI Generation State
  const [importUrl, setImportUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GenerateSeriesOutput | null>(null);

  const handleCreateSeries = () => {
    if (newSeriesTitle.trim()) {
      createSeries(newSeriesTitle.trim());
      setNewSeriesTitle('');
      toast({ title: "Series Created", description: `"${newSeriesTitle}" has been added.` });
    }
  };

  const handleGenerateSeries = async () => {
    if (!importUrl.trim()) return;
    
    setIsGenerating(true);
    setGeneratedResult(null);
    try {
      const result = await generateSeriesFromUrl({ url: importUrl.trim() });
      setGeneratedResult(result);
      toast({
        title: "Pattern Detected",
        description: `Found ${result.episodes.length} potential episodes for "${result.seriesTitle}".`
      });
    } catch (error) {
      console.error("Failed to generate series", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not identify a series pattern in that URL."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedResult) return;
    
    const videos: VideoInSeries[] = generatedResult.episodes.map(ep => ({
      id: crypto.randomUUID(),
      title: ep.title,
      sourceType: 'url',
      sourceValue: ep.url,
    }));
    
    createSeries(generatedResult.seriesTitle, videos);
    setGeneratedResult(null);
    setImportUrl('');
    toast({
      title: "Series Imported",
      description: `Created "${generatedResult.seriesTitle}" with ${videos.length} episodes.`
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Create Manual Series</CardTitle>
              <CardDescription>Start an empty collection to add videos later.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Series title (e.g. My Favorite Sci-Fi)"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                />
                <Button onClick={handleCreateSeries}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Series Generator
              </CardTitle>
              <CardDescription>Paste one episode URL to generate the full season.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/S01E01.mkv"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateSeries()}
                />
                <Button 
                  onClick={handleGenerateSeries} 
                  disabled={isGenerating || !importUrl}
                  variant="secondary"
                >
                  {isGenerating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Identify
                </Button>
              </div>

              {generatedResult && (
                <div className="p-4 bg-background border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-primary">{generatedResult.seriesTitle}</h4>
                    <Badge variant="outline">{generatedResult.episodes.length} Episodes</Badge>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2 bg-muted/30">
                    <div className="space-y-1">
                      {generatedResult.episodes.map((ep, i) => (
                        <div key={i} className="text-xs truncate text-muted-foreground">
                          {ep.title}: {ep.url}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button onClick={handleSaveGenerated} className="w-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save as New Series
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Clapperboard className="w-7 h-7" />
          <h2 className="text-3xl font-semibold">Your Collections</h2>
        </div>

        {series.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 border-dashed border-2 rounded-md mt-10">
            <Film className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl text-muted-foreground">No series found.</h3>
            <p className="text-muted-foreground">
              Create a manual series or use the AI generator to get started.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {series.map((s) => (
              <AccordionItem value={s.id} key={s.id} className="border rounded-lg bg-card overflow-hidden">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/30">
                  <div className="flex justify-between w-full items-center pr-4 text-left">
                    <div className="flex flex-col">
                      <span className="text-xl font-semibold truncate">{s.title}</span>
                      <span className="text-sm text-muted-foreground">{s.videos.length} video(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Series?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the "{s.title}" collection. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSeries(s.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 bg-muted/10">
                  {s.videos.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">This series is empty. Add videos from history.</p>
                    </div>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {s.videos.map((video, index) => (
                        <li key={video.id} className="flex items-center justify-between p-2 bg-background border rounded-md">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Badge variant="secondary" className="font-mono">{index + 1}</Badge>
                            <p className="font-medium truncate text-sm">{video.title}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button asChild variant="outline" size="sm" className="h-8">
                              <Link href={`/?historyId=${video.id}`}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Play
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeVideoFromSeries(s.id, video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
