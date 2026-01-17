'use client';

import { useEffect, useState } from 'react';

interface Stats {
    totalArticles: number;
    activeModels: number;
    defaultModel: string | null;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalArticles: 0,
        activeModels: 0,
        defaultModel: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
                const token = localStorage.getItem('token');

                // Fetch AI settings count
                const aiRes = await fetch(`${API_URL}/api/v1/ai-settings`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (aiRes.ok) {
                    const rawData = await aiRes.json();
                    // Handle wrapped response: {success, data: [...]}
                    const aiSettings = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    const defaultModel = aiSettings.find((s: any) => s.isDefault);
                    setStats({
                        totalArticles: 0,
                        activeModels: aiSettings.filter((s: any) => s.isActive).length,
                        defaultModel: defaultModel ? `${defaultModel.name} (${defaultModel.provider})` : null,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Active AI Models', value: stats.activeModels, icon: '🤖', color: 'blue' },
        { label: 'Default Model', value: stats.defaultModel || 'Not set', icon: '⭐', color: 'yellow' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">{stat.icon}</span>
                                <span className={`text-xs px-2 py-1 rounded-full bg-${stat.color}-500/20 text-${stat.color}-400`}>
                                    Active
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a
                        href="/admin/ai-models"
                        className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors group"
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform">🤖</span>
                        <div>
                            <p className="text-white font-medium">Manage AI Models</p>
                            <p className="text-gray-400 text-sm">Configure AI providers and API keys</p>
                        </div>
                    </a>
                    <a
                        href="/admin/crawlers"
                        className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors group"
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform">🕷️</span>
                        <div>
                            <p className="text-white font-medium">Crawler Controls</p>
                            <p className="text-gray-400 text-sm">Pause or resume news source crawling</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
