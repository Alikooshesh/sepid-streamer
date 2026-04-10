
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlayCircle, History, Clapperboard, Home as HomeIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/history', label: 'History', icon: History },
    { href: '/series', label: 'Series', icon: Clapperboard },
  ];

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <PlayCircle className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Next Video Player</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1 hover:text-primary',
                pathname === link.href && 'text-primary font-semibold'
              )}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt && (
          <Button variant="outline" size="sm" onClick={handleInstallClick} className="gap-2">
            <Download className="w-4 h-4" />
            Install App
          </Button>
        )}
      </div>
    </header>
  );
}
