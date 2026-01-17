'use client';

import { useEffect, useState } from 'react';

interface Source {
    id: string;
    name: string;
    type: 'website' | 'youtube';
    baseUrl: string;
    language: 'ne' | 'en';
    isActive: boolean;
    crawlConfig: {
        enabled: boolean;
        interval?: number;
        maxArticles?: number;
    } | null;
    lastCrawledAt: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function CrawlersPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    useEffect(() => {
        fetchSources();
    }, []);

    async function fetchSources() {
        try {
            const res = await fetch(`${API_URL}/api/v1/sources`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setSources(data.data || data);
            }
        } catch (error) {
            console.error('Failed to fetch sources:', error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleCrawling(source: Source) {
        setUpdating(source.id);
        try {
            const newEnabled = !(source.crawlConfig?.enabled ?? true);

            const res = await fetch(`${API_URL}/api/v1/sources/${source.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    crawlConfig: {
                        ...source.crawlConfig,
                        enabled: newEnabled,
                    },
                }),
            });

            if (res.ok) {
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to toggle crawling:', error);
        } finally {
            setUpdating(null);
        }
    }

    async function toggleSourceActive(source: Source) {
        setUpdating(source.id);
        try {
            const res = await fetch(`${API_URL}/api/v1/sources/${source.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    isActive: !source.isActive,
                }),
            });

            if (res.ok) {
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to toggle source:', error);
        } finally {
            setUpdating(null);
        }
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    }

    const sourceIcons: Record<string, string> = {
        'Online Khabar': '📰',
        'eKantipur': '📱',
        'Setopati': '🗞️',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Crawler Sources</h1>
                    <p className="text-gray-400 mt-1">Manage and control news source crawling</p>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : sources.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                    <span className="text-6xl block mb-4">🕷️</span>
                    <h2 className="text-xl font-semibold text-white mb-2">No Sources Configured</h2>
                    <p className="text-gray-400">Add news sources to start crawling</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sources.map((source) => {
                        const isEnabled = source.crawlConfig?.enabled ?? true;
                        const isUpdating = updating === source.id;

                        return (
                            <div
                                key={source.id}
                                className={`bg-gray-800 rounded-xl p-6 border ${source.isActive && isEnabled ? 'border-green-500/30' : 'border-gray-700'
                                    } transition-colors`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{sourceIcons[source.name] || '📄'}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                                                {!source.isActive && (
                                                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                                {source.isActive && !isEnabled && (
                                                    <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                                        Crawling Paused
                                                    </span>
                                                )}
                                                {source.isActive && isEnabled && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                {source.baseUrl ? new URL(source.baseUrl).hostname : source.type}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                Last crawled: {formatDate(source.lastCrawledAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Toggle Crawling Button */}
                                        <button
                                            onClick={() => toggleCrawling(source)}
                                            disabled={isUpdating || !source.isActive}
                                            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${isEnabled
                                                    ? 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400'
                                                    : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isUpdating ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                            ) : isEnabled ? (
                                                <>⏸️ Pause Crawling</>
                                            ) : (
                                                <>▶️ Resume Crawling</>
                                            )}
                                        </button>

                                        {/* Toggle Source Active Button */}
                                        <button
                                            onClick={() => toggleSourceActive(source)}
                                            disabled={isUpdating}
                                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${source.isActive
                                                    ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400'
                                                    : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                                                } disabled:opacity-50`}
                                        >
                                            {source.isActive ? '🔴 Disable Source' : '🟢 Enable Source'}
                                        </button>
                                    </div>
                                </div>

                                {/* Crawl Config Details */}
                                {source.crawlConfig && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-gray-500 text-xs">Crawl Interval</p>
                                            <p className="text-gray-300 text-sm">{source.crawlConfig.interval || 30} min</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Max Articles</p>
                                            <p className="text-gray-300 text-sm">{source.crawlConfig.maxArticles || 'Unlimited'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Language</p>
                                            <p className="text-gray-300 text-sm">{source.language === 'ne' ? 'Nepali' : 'English'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-medium flex items-center gap-2">
                    <span>ℹ️</span> About Crawler Controls
                </h3>
                <ul className="mt-2 text-gray-400 text-sm space-y-1">
                    <li>• <strong>Pause Crawling</strong>: Temporarily stops crawling from a source. Articles already in queue will still be processed.</li>
                    <li>• <strong>Disable Source</strong>: Completely disables the source. It won't appear in the news feed.</li>
                    <li>• Changes take effect on the next crawler run (every 30 minutes by default).</li>
                </ul>
            </div>
        </div>
    );
}
