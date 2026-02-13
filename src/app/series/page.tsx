'use client';

import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';

export default function SeriesPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Clapperboard className="w-24 h-24 text-muted-foreground/50 mb-4" />
        <h2 className="text-3xl font-semibold mb-2">Series</h2>
        <p className="text-xl text-muted-foreground">This feature is coming soon.</p>
        <p className="text-muted-foreground">Manage your video series here.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go Home</Link>
        </Button>
      </main>
    </div>
  );
}
