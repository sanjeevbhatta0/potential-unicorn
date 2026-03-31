'use client';

import { useEffect, useState } from 'react';

interface Stats {
    totalArticles: number;
    activeModels: number;
    defaultModel: string | null;
}

interface AppSettings {
    balancedFeedEnabled: { value: boolean; description?: string };
}

interface AIUsageStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalEstimatedCost: number;
    totalEstimatedTokens: number;
    byProvider: Record<string, { calls: number; cost: number; tokens: number }>;
    recentCalls: Array<{
        timestamp: string;
        provider: string;
        model: string;
        estimatedTokens: number;
        estimatedCost: number;
        success: boolean;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalArticles: 0,
        activeModels: 0,
        defaultModel: null,
    });
    const [loading, setLoading] = useState(true);
    const [appSettings, setAppSettings] = useState<AppSettings>({
        balancedFeedEnabled: { value: false },
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [aiUsage, setAiUsage] = useState<AIUsageStats | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

    useEffect(() => {
        async function fetchData() {
            try {
                const token = localStorage.getItem('token');

                // Fetch AI settings count
                const aiRes = await fetch(`${API_URL}/api/v1/ai-settings`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (aiRes.ok) {
                    const rawData = await aiRes.json();
                    const aiSettings = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    const defaultModel = aiSettings.find((s: any) => s.isDefault);
                    setStats({
                        totalArticles: 0,
                        activeModels: aiSettings.filter((s: any) => s.isActive).length,
                        defaultModel: defaultModel ? `${defaultModel.name} (${defaultModel.provider})` : null,
                    });
                }

                // Fetch App Settings
                const settingsRes = await fetch(`${API_URL}/api/v1/app-settings`);
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    if (settingsData.success && settingsData.data) {
                        setAppSettings(settingsData.data);
                    }
                }

                // Fetch AI Usage Stats
                const usageRes = await fetch(`${API_URL}/api/v1/ai-settings/usage`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (usageRes.ok) {
                    const usageRaw = await usageRes.json();
                    const usageData = usageRaw.data || usageRaw;
                    setAiUsage(usageData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [API_URL]);

    const toggleBalancedFeed = async () => {
        try {
            setSettingsLoading(true);
            const token = localStorage.getItem('token');
            const newValue = !appSettings.balancedFeedEnabled?.value;

            const res = await fetch(`${API_URL}/api/v1/app-settings/balancedFeedEnabled`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ value: newValue }),
            });

            if (res.ok) {
                setAppSettings(prev => ({
                    ...prev,
                    balancedFeedEnabled: { ...prev.balancedFeedEnabled, value: newValue },
                }));
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

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

            {/* Feed Settings */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold text-white mb-4">Feed Settings</h2>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium">Balanced Feed</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                Show articles from all sources evenly on the homepage
                            </p>
                        </div>
                        <button
                            onClick={toggleBalancedFeed}
                            disabled={settingsLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${appSettings.balancedFeedEnabled?.value ? 'bg-blue-600' : 'bg-gray-600'
                                } ${settingsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appSettings.balancedFeedEnabled?.value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Cost Monitoring */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold text-white mb-4">AI Cost Monitor</h2>
                {aiUsage ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Total Calls</p>
                                <p className="text-2xl font-bold text-white mt-1">{aiUsage.totalCalls}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {aiUsage.successfulCalls} ok / {aiUsage.failedCalls} failed
                                </p>
                            </div>
                            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Est. Cost</p>
                                <p className="text-2xl font-bold text-green-400 mt-1">
                                    ${aiUsage.totalEstimatedCost.toFixed(4)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">since last cold start</p>
                            </div>
                            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Tokens Used</p>
                                <p className="text-2xl font-bold text-blue-400 mt-1">
                                    {aiUsage.totalEstimatedTokens.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">estimated</p>
                            </div>
                            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Providers</p>
                                <div className="mt-1">
                                    {Object.entries(aiUsage.byProvider).length > 0 ? (
                                        Object.entries(aiUsage.byProvider).map(([provider, data]) => (
                                            <div key={provider} className="flex justify-between text-sm">
                                                <span className="text-white capitalize">{provider}</span>
                                                <span className="text-gray-400">{data.calls} calls / ${data.cost.toFixed(4)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No usage yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {aiUsage.recentCalls.length > 0 && (
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-700">
                                    <h3 className="text-sm font-medium text-white">Recent AI Calls</h3>
                                </div>
                                <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                                    {aiUsage.recentCalls.slice(0, 10).map((call, i) => (
                                        <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full ${call.success ? 'bg-green-400' : 'bg-red-400'}`} />
                                                <span className="text-white capitalize">{call.provider}</span>
                                                <span className="text-gray-500">{call.model}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-gray-400">
                                                <span>{call.estimatedTokens.toLocaleString()} tokens</span>
                                                <span>${call.estimatedCost.toFixed(4)}</span>
                                                <span className="text-xs">
                                                    {new Date(call.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <p className="text-gray-400">No AI usage data available. Configure an AI model and process an article to see stats.</p>
                    </div>
                )}
            </div>

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

