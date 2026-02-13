'use client';

import Link from 'next/link';
import { useWatchHistory, WatchHistoryItem } from '@/hooks/use-watch-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { History, PlayCircle, PlusCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppHeader } from '@/components/app-header';
import { useSeries } from '@/hooks/use-series';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function HistoryPage() {
  const { history, clearHistory } = useWatchHistory();
  const { series, addVideoToSeries } = useSeries();
  const { toast } = useToast();

  const handleAddVideoToSeries = (seriesId: string, video: WatchHistoryItem) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (targetSeries?.videos.some(v => v.id === video.id)) {
        toast({
            variant: 'destructive',
            title: "Already in series",
            description: `"${video.title}" is already in "${targetSeries?.title}".`
        });
        return;
    }
    addVideoToSeries(seriesId, video);
    toast({
      title: "Video Added",
      description: `"${video.title}" has been added to "${targetSeries?.title}".`
    });
  };

  return (
    <TooltipProvider>
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7" />
            <h2 className="text-3xl font-semibold">Watch History</h2>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" onClick={clearHistory}>
              Clear History
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <History className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <p className="text-xl text-muted-foreground">Your watch history is empty.</p>
            <p className="text-muted-foreground">Videos you watch will appear here.</p>
            <Button asChild className="mt-4">
              <Link href="/">
                Watch a video
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {history.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="truncate">{item.title || 'Untitled'}</CardTitle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.title || 'Untitled'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardDescription>
                    Last watched: {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {item.durationSeconds && item.durationSeconds > 0 ? (
                    <Progress value={(item.lastPositionSeconds / item.durationSeconds) * 100} className="w-full" />
                  ) : <div className='h-2'/>}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild className="flex-grow">
                    <Link href={`/?historyId=${item.id}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Resume
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add to series</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Add to a Series</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {series.length > 0 ? series.map(s => (
                            <DropdownMenuItem key={s.id} onClick={() => handleAddVideoToSeries(s.id, item)}>
                                {s.title}
                            </DropdownMenuItem>
                        )) : <DropdownMenuItem disabled>No series available</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/series">Manage Series</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
    </TooltipProvider>
  );
}
