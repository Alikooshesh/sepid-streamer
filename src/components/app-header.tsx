'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlayCircle, History, Clapperboard, Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const pathname = usePathname();

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
    </header>
  );
}
