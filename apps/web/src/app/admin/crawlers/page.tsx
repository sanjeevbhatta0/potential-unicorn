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
        selectors?: {
            article?: string;
            title?: string;
            content?: string;
            image?: string;
            author?: string;
            date?: string;
        };
    } | null;
    lastCrawledAt: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function CrawlersPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSource, setEditingSource] = useState<Source | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'website' as 'website' | 'youtube',
        baseUrl: '',
        language: 'ne' as 'ne' | 'en',
        isActive: true,
        crawlConfig: {
            enabled: true,
            interval: 30,
            maxArticles: 50,
            selectors: {
                article: '',
                title: '',
                content: '',
                image: '',
                author: '',
                date: '',
            },
        },
    });

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
                const rawData = await res.json();
                const data = Array.isArray(rawData) ? rawData : (rawData.data || []);
                setSources(data);
            }
        } catch (error) {
            console.error('Failed to fetch sources:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setUpdating('form');
        try {
            const url = editingSource
                ? `${API_URL}/api/v1/sources/${editingSource.id}`
                : `${API_URL}/api/v1/sources`;

            // Clean up the data - remove empty selectors
            const selectors = formData.crawlConfig.selectors;
            const cleanedSelectors: Record<string, string> = {};
            if (selectors) {
                Object.entries(selectors).forEach(([key, value]) => {
                    if (value && value.trim()) {
                        cleanedSelectors[key] = value.trim();
                    }
                });
            }

            // Build payload - type cannot be changed on updates
            const basePayload = {
                name: formData.name,
                baseUrl: formData.baseUrl,
                language: formData.language,
                isActive: formData.isActive,
                crawlConfig: {
                    enabled: formData.crawlConfig.enabled,
                    interval: Number.isNaN(formData.crawlConfig.interval) ? 30 : formData.crawlConfig.interval,
                    maxArticles: Number.isNaN(formData.crawlConfig.maxArticles) ? 50 : formData.crawlConfig.maxArticles,
                    ...(Object.keys(cleanedSelectors).length > 0 && { selectors: cleanedSelectors }),
                },
            };

            // Only include type for new sources
            const payload = editingSource ? basePayload : { ...basePayload, type: formData.type };

            const res = await fetch(url, {
                method: editingSource ? 'PATCH' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingSource(null);
                resetForm();
                fetchSources();
            } else {
                const error = await res.json();
                console.error('API Error:', error);
                alert(`Error: ${error.message || 'Failed to save source'}`);
            }
        } catch (error) {
            console.error('Failed to save source:', error);
        } finally {
            setUpdating(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this source? This will also delete all articles from this source.')) return;

        setUpdating(id);
        try {
            const res = await fetch(`${API_URL}/api/v1/sources/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                fetchSources();
            }
        } catch (error) {
            console.error('Failed to delete source:', error);
        } finally {
            setUpdating(null);
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

    function resetForm() {
        setFormData({
            name: '',
            type: 'website',
            baseUrl: '',
            language: 'ne',
            isActive: true,
            crawlConfig: {
                enabled: true,
                interval: 30,
                maxArticles: 50,
                selectors: {
                    article: '',
                    title: '',
                    content: '',
                    image: '',
                    author: '',
                    date: '',
                },
            },
        });
    }

    function openEditModal(source: Source) {
        setEditingSource(source);
        setFormData({
            name: source.name,
            type: source.type,
            baseUrl: source.baseUrl || '',
            language: source.language,
            isActive: source.isActive,
            crawlConfig: {
                enabled: source.crawlConfig?.enabled ?? true,
                interval: source.crawlConfig?.interval ?? 30,
                maxArticles: source.crawlConfig?.maxArticles ?? 50,
                selectors: source.crawlConfig?.selectors || {
                    article: '',
                    title: '',
                    content: '',
                    image: '',
                    author: '',
                    date: '',
                },
            },
        });
        setShowModal(true);
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
                    <p className="text-gray-400 mt-1">Manage news sources and crawling settings</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingSource(null); setShowModal(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <span>+</span> Add Source
                </button>
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
                    <p className="text-gray-400 mb-6">Add news sources to start crawling</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Add Your First Source
                    </button>
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
                                                        Paused
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
                                        <button
                                            onClick={() => toggleCrawling(source)}
                                            disabled={isUpdating || !source.isActive}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${isEnabled
                                                ? 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400'
                                                : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isUpdating ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                            ) : isEnabled ? (
                                                '⏸️ Pause'
                                            ) : (
                                                '▶️ Resume'
                                            )}
                                        </button>

                                        <button
                                            onClick={() => openEditModal(source)}
                                            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            onClick={() => toggleSourceActive(source)}
                                            disabled={isUpdating}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${source.isActive
                                                ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400'
                                                : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                                                } disabled:opacity-50`}
                                        >
                                            {source.isActive ? '🔴 Disable' : '🟢 Enable'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            disabled={isUpdating}
                                            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {source.crawlConfig && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-4">
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
                                        <div>
                                            <p className="text-gray-500 text-xs">Type</p>
                                            <p className="text-gray-300 text-sm">{source.type === 'website' ? 'Website' : 'YouTube'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700 my-8">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingSource ? 'Edit Source' : 'Add New Source'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Source Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="e.g., Nepal Times"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'website' | 'youtube' })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        <option value="website">Website</option>
                                        <option value="youtube">YouTube Channel</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Base URL *</label>
                                    <input
                                        type="url"
                                        value={formData.baseUrl}
                                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="https://example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value as 'ne' | 'en' })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        <option value="ne">Nepali</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Crawl Interval (minutes)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1440"
                                        value={formData.crawlConfig.interval}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            crawlConfig: { ...formData.crawlConfig, interval: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Articles per Crawl</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={formData.crawlConfig.maxArticles}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            crawlConfig: { ...formData.crawlConfig, maxArticles: parseInt(e.target.value) }
                                        })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded"
                                        />
                                        Source Active
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={formData.crawlConfig.enabled}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                crawlConfig: { ...formData.crawlConfig, enabled: e.target.checked }
                                            })}
                                            className="w-4 h-4 rounded"
                                        />
                                        Crawling Enabled
                                    </label>
                                </div>
                            </div>

                            {/* Selectors Section */}
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h3 className="text-lg font-medium text-white mb-4">CSS Selectors (Optional)</h3>
                                <p className="text-gray-400 text-sm mb-4">Define selectors to extract content from articles</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Article Container</label>
                                        <input
                                            type="text"
                                            value={formData.crawlConfig.selectors?.article || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                crawlConfig: {
                                                    ...formData.crawlConfig,
                                                    selectors: { ...formData.crawlConfig.selectors, article: e.target.value }
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                            placeholder=".article-content"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={formData.crawlConfig.selectors?.title || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                crawlConfig: {
                                                    ...formData.crawlConfig,
                                                    selectors: { ...formData.crawlConfig.selectors, title: e.target.value }
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                            placeholder="h1.title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                                        <input
                                            type="text"
                                            value={formData.crawlConfig.selectors?.content || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                crawlConfig: {
                                                    ...formData.crawlConfig,
                                                    selectors: { ...formData.crawlConfig.selectors, content: e.target.value }
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                            placeholder=".article-body"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Image</label>
                                        <input
                                            type="text"
                                            value={formData.crawlConfig.selectors?.image || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                crawlConfig: {
                                                    ...formData.crawlConfig,
                                                    selectors: { ...formData.crawlConfig.selectors, image: e.target.value }
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                            placeholder="img.featured"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingSource(null); }}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating === 'form'}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {updating === 'form' ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        editingSource ? 'Save Changes' : 'Add Source'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-medium flex items-center gap-2">
                    <span>ℹ️</span> About Source Management
                </h3>
                <ul className="mt-2 text-gray-400 text-sm space-y-1">
                    <li>• <strong>Crawl Interval</strong>: How often to check for new articles (minimum 5 minutes)</li>
                    <li>• <strong>Max Articles</strong>: Maximum number of articles to fetch per crawl</li>
                    <li>• <strong>CSS Selectors</strong>: Help the crawler find content on the page (optional for supported sites)</li>
                </ul>
            </div>
        </div>
    );
}
