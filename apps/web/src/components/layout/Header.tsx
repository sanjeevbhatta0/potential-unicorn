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
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-md transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="NewsChautari" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              NewsChautari
            </span>
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase leading-none">
              Smart. Short. Simple.
            </span>
          </div>
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
