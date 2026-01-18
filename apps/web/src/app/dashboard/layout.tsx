'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Newspaper, Building2, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
        { href: '/dashboard/preferences', label: 'News Preferences', icon: Newspaper },
        { href: '/dashboard/business', label: 'Business Registration', icon: Building2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                        My Account
                    </h1>
                </div>

                <nav className="flex-1 px-4 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="px-4 py-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user?.accountType === 'business'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {user?.accountType === 'business' ? 'Business Account' : 'General Account'}
                        </span>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 mt-2 text-gray-500 hover:text-gray-900 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
