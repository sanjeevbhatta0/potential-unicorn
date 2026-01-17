'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// Simple admin auth check - in production use proper auth context
function useAdminAuth() {
    // Check for admin token in localStorage
    if (typeof window === 'undefined') return { isAdmin: false, isLoading: true };

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        return { isAdmin: false, isLoading: false };
    }

    try {
        const user = JSON.parse(userStr);
        return { isAdmin: user.role === 'admin', isLoading: false, user };
    } catch {
        return { isAdmin: false, isLoading: false };
    }
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAdmin, isLoading, user } = useAdminAuth();

    useEffect(() => {
        if (!isLoading && !isAdmin && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [isAdmin, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show login page without layout
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (!isAdmin) {
        return null;
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/ai-models', label: 'AI Models', icon: '🤖' },
        { href: '/admin/crawlers', label: 'Crawlers', icon: '🕷️' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        Admin Panel
                    </h1>
                </div>

                <nav className="px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-sm text-white">{user?.fullName || 'Admin'}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 mt-2 text-gray-400 hover:text-white text-sm"
                    >
                        ← Back to Site
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
