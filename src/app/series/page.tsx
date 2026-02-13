'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clapperboard, Film, Plus, PlayCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';
import { useSeries } from '@/hooks/use-series';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function SeriesPage() {
  const { series, createSeries, deleteSeries, removeVideoFromSeries } = useSeries();
  const [newSeriesTitle, setNewSeriesTitle] = useState('');

  const handleCreateSeries = () => {
    if (newSeriesTitle.trim()) {
      createSeries(newSeriesTitle.trim());
      setNewSeriesTitle('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Series</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter series title..."
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

        <div className="flex items-center gap-3 mb-4 mt-6">
          <Clapperboard className="w-7 h-7" />
          <h2 className="text-3xl font-semibold">Your Series</h2>
        </div>

        {series.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 border-dashed border-2 rounded-md mt-10">
            <Film className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl text-muted-foreground">You haven't created any series yet.</h3>
            <p className="text-muted-foreground">
              Use the form above to create your first series, then add videos from your history.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {series.map((s) => (
              <AccordionItem value={s.id} key={s.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex justify-between w-full items-center pr-4">
                    <span className="text-xl font-semibold truncate">{s.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{s.videos.length} video(s)</span>
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
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{s.title}" series. This action
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
                <AccordionContent className="p-4 pt-0">
                  {s.videos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      This series is empty. Add videos from your watch history.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {s.videos.map((video, index) => (
                        <li key={video.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            <p className="font-medium truncate">{video.title}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button asChild variant="secondary" size="sm">
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
