'use client';

import { useEffect, useState } from 'react';

interface AIModel {
    id: string;
    provider: string;
    name: string;
    modelId: string;
    apiKey: string;
    isActive: boolean;
    isDefault: boolean;
    config: {
        temperature?: number;
        maxTokens?: number;
    };
    lastTestedAt?: string;
    lastTestSuccess?: boolean;
}

interface Provider {
    provider: string;
    name: string;
}

interface AvailableModel {
    id: string;
    name: string;
    costPer1kTokens: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function AIModelsPage() {
    const [models, setModels] = useState<AIModel[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        provider: 'openai',
        name: '',
        modelId: '',
        apiKey: '',
        isActive: true,
        config: { temperature: 0.7, maxTokens: 4096 },
    });

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    useEffect(() => {
        fetchModels();
        fetchProviders();
    }, []);

    useEffect(() => {
        if (formData.provider) {
            fetchAvailableModels(formData.provider);
        }
    }, [formData.provider]);

    async function fetchModels() {
        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                // Handle wrapped response or direct array
                const models = Array.isArray(data) ? data : (data.data || []);
                setModels(models);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchProviders() {
        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings/providers`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                const providers = Array.isArray(data) ? data : (data.data || []);
                setProviders(providers);
            }
        } catch (error) {
            console.error('Failed to fetch providers:', error);
        }
    }

    async function fetchAvailableModels(provider: string) {
        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings/providers/${provider}/models`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                const models = Array.isArray(data) ? data : (data.data || []);
                setAvailableModels(models);
            }
        } catch (error) {
            console.error('Failed to fetch available models:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const url = editingModel
                ? `${API_URL}/api/v1/ai-settings/${editingModel.id}`
                : `${API_URL}/api/v1/ai-settings`;

            const res = await fetch(url, {
                method: editingModel ? 'PATCH' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingModel(null);
                resetForm();
                fetchModels();
            }
        } catch (error) {
            console.error('Failed to save model:', error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this AI model configuration?')) return;

        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                fetchModels();
            }
        } catch (error) {
            console.error('Failed to delete model:', error);
        }
    }

    async function handleSetDefault(id: string) {
        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings/${id}/set-default`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                fetchModels();
            }
        } catch (error) {
            console.error('Failed to set default:', error);
        }
    }

    async function handleTest(id: string) {
        setTestingId(id);
        setTestResult(null);

        try {
            const res = await fetch(`${API_URL}/api/v1/ai-settings/${id}/test`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            const result = await res.json();
            setTestResult({ id, ...result });
            fetchModels();
        } catch (error) {
            setTestResult({ id, success: false, message: 'Test failed' });
        } finally {
            setTestingId(null);
        }
    }

    function resetForm() {
        setFormData({
            provider: 'openai',
            name: '',
            modelId: '',
            apiKey: '',
            isActive: true,
            config: { temperature: 0.7, maxTokens: 4096 },
        });
    }

    function openEditModal(model: AIModel) {
        setEditingModel(model);
        setFormData({
            provider: model.provider,
            name: model.name,
            modelId: model.modelId,
            apiKey: '',
            isActive: model.isActive,
            config: {
                temperature: model.config?.temperature ?? 0.7,
                maxTokens: model.config?.maxTokens ?? 4096,
            },
        });
        setShowModal(true);
    }

    const providerIcons: Record<string, string> = {
        openai: '🟢',
        anthropic: '🟠',
        gemini: '🔵',
        perplexity: '🟣',
        groq: '⚡',
        mistral: '🔴',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">AI Models</h1>
                    <p className="text-gray-400 mt-1">Configure AI providers and manage API keys</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingModel(null); setShowModal(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <span>+</span> Add Model
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
            ) : models.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                    <span className="text-6xl block mb-4">🤖</span>
                    <h2 className="text-xl font-semibold text-white mb-2">No AI Models Configured</h2>
                    <p className="text-gray-400 mb-6">Add your first AI model to start using AI features</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Add Your First Model
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {models.map((model) => (
                        <div
                            key={model.id}
                            className={`bg-gray-800 rounded-xl p-6 border ${model.isDefault ? 'border-blue-500' : 'border-gray-700'
                                } hover:border-gray-600 transition-colors`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{providerIcons[model.provider] || '🤖'}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                                            {model.isDefault && (
                                                <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                            {!model.isActive && (
                                                <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                                                    Disabled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm">
                                            {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)} • {model.modelId}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">API Key: {model.apiKey}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {model.lastTestedAt && (
                                        <span className={`text-xs px-2 py-1 rounded ${model.lastTestSuccess
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {model.lastTestSuccess ? '✓ Working' : '✗ Failed'}
                                        </span>
                                    )}

                                    <button
                                        onClick={() => handleTest(model.id)}
                                        disabled={testingId === model.id}
                                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        {testingId === model.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                Testing...
                                            </>
                                        ) : (
                                            '🔌 Test'
                                        )}
                                    </button>

                                    {!model.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(model.id)}
                                            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            ⭐ Set Default
                                        </button>
                                    )}

                                    <button
                                        onClick={() => openEditModal(model)}
                                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>

                                    {!model.isDefault && (
                                        <button
                                            onClick={() => handleDelete(model.id)}
                                            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>

                            {testResult && testResult.id === model.id && (
                                <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                                    }`}>
                                    <p className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                                        {testResult.success ? '✓' : '✗'} {testResult.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingModel ? 'Edit AI Model' : 'Add AI Model'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                                    <select
                                        value={formData.provider}
                                        onChange={(e) => setFormData({ ...formData, provider: e.target.value, modelId: '' })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        {providers.map((p) => (
                                            <option key={p.provider} value={p.provider}>
                                                {providerIcons[p.provider]} {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                                    <select
                                        value={formData.modelId}
                                        onChange={(e) => {
                                            const model = availableModels.find(m => m.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                modelId: e.target.value,
                                                name: model?.name || formData.name,
                                            });
                                        }}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        required
                                    >
                                        <option value="">Select a model...</option>
                                        {availableModels.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} (${m.costPer1kTokens}/1K tokens)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="My GPT-4 Config"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        API Key {editingModel && <span className="text-gray-500">(leave blank to keep current)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.apiKey}
                                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="sk-..."
                                        required={!editingModel}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="2"
                                            value={formData.config.temperature}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                config: { ...formData.config, temperature: parseFloat(e.target.value) }
                                            })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="128000"
                                            value={formData.config.maxTokens}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                config: { ...formData.config, maxTokens: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="isActive" className="text-gray-300">Active</label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingModel(null); }}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    {editingModel ? 'Save Changes' : 'Add Model'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
