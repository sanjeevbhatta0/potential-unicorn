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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="text-xl font-bold">Nepali News</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href="/categories/politics"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Politics
          </Link>
          <Link
            href="/categories/business"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Business
          </Link>
          <Link
            href="/categories/sports"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Sports
          </Link>
          <Link
            href="/categories/entertainment"
            className="text-sm font-medium transition-colors hover:text-primary"
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
                placeholder="Search news..."
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <Button variant="outline" size="sm">
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
          />
        </form>
      </div>
    </header>
  );
}
