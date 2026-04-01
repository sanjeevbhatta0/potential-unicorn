'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/app/providers';
import { useAuth } from '@/contexts/AuthContext';
import { SignInDialog } from '../auth/SignInDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Sun icon for light mode
function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

// Navigation items
const NAV_ITEMS = [
  { label: 'All', href: '/' },
  { label: 'Politics', href: '/?category=politics' },
  { label: 'Sports', href: '/?category=sports' },
  { label: 'Business', href: '/?category=business' },
  { label: 'Technology', href: '/?category=technology' },
  { label: 'Entertainment', href: '/?category=entertainment' },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.fullName) return user.fullName.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      {/* Top Row: Logo, Search, Actions */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="NewsChautari.ai">
          {/* Mountain + Chautari SVG icon */}
          <svg
            viewBox="0 0 48 40"
            className="h-8 sm:h-9 w-auto flex-shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Back mountain */}
            <path d="M16 4L2 32h28L16 4z" className="fill-foreground/30" />
            {/* Front mountain */}
            <path d="M28 8L12 32h32L28 8z" className="fill-foreground/70" />
            {/* Snow caps */}
            <path d="M28 8l-3.5 5.5 2-1.5 1.5 2 1.5-2 2 1.5L28 8z" className="fill-background" />
            <path d="M16 4l-2.5 4 1.5-1 1 1.5 1-1.5 1.5 1L16 4z" className="fill-background" />
            {/* Chautari (brick resting place) */}
            <rect x="8" y="32" width="24" height="7" rx="1" className="fill-red-600" />
            {/* Brick lines */}
            <line x1="8" y1="35" x2="32" y2="35" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="14" y1="32" x2="14" y2="35" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="20" y1="32" x2="20" y2="35" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="26" y1="32" x2="26" y2="35" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="11" y1="35" x2="11" y2="39" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="17" y1="35" x2="17" y2="39" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="23" y1="35" x2="23" y2="39" className="stroke-red-800" strokeWidth="0.5" />
            <line x1="29" y1="35" x2="29" y2="39" className="stroke-red-800" strokeWidth="0.5" />
          </svg>
          <span className="text-lg sm:text-xl font-serif font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            NewsChautari<span className="text-red-600 dark:text-red-500">.ai</span>
          </span>
        </Link>

        {/* Search and Actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <form onSubmit={handleSearch} className="hidden md:flex relative group">
            <Input
              type="search"
              placeholder="Search news..."
              className="w-48 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all duration-300 group-hover:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="w-full cursor-pointer font-medium">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-500 font-medium cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInDialog>
              <Button variant="default" size="sm" className="font-semibold rounded-full px-5 shadow-sm hover:shadow-md transition-shadow">
                Sign In
              </Button>
            </SignInDialog>
          )}
        </div>
      </div>

      {/* Navigation Row - Horizontal Scrollable */}
      <div className="border-t border-border/40">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none mask-image-fade">
            {NAV_ITEMS.map((item) => {
              const isActive = (!activeCategory && item.href === '/') ||
                (activeCategory && item.href.includes(activeCategory));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                     whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200
                     ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                   `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
