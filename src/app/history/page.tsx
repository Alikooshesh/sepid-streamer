'use client';

import Link from 'next/link';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { History, PlayCircle, Clapperboard, Home as HomeIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function HistoryPage() {
  const { history, clearHistory } = useWatchHistory();

  return (
    <TooltipProvider>
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <PlayCircle className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Next Video Player</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-lg">
            <Link href="/" className="flex items-center gap-1 hover:text-primary">
              <HomeIcon className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link href="/series" className="flex items-center gap-1 hover:text-primary">
              <Clapperboard className="w-5 h-5" />
              <span>Series</span>
            </Link>
          </nav>
        </div>
      </header>
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
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/?historyId=${item.id}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Resume
                    </Link>
                  </Button>
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
