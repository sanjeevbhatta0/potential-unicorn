'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-primary" />
          <span className="text-xl font-serif font-bold tracking-tight">Nepali News</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href="/categories/politics"
            className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
          >
            Politics
          </Link>
          <Link
            href="/categories/business"
            className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
          >
            Business
          </Link>
          <Link
            href="/categories/sports"
            className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
          >
            Sports
          </Link>
          <Link
            href="/categories/entertainment"
            className="text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
          >
            Entertainment
          </Link>
        </nav>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="hidden md:flex">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search..."
                className="w-48 border-foreground/20 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <Button variant="default" size="sm" className="font-semibold">
            Sign In
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="container mx-auto px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch}>
          <Input
            type="search"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-foreground/20"
          />
        </form>
      </div>
    </header>
  );
}
