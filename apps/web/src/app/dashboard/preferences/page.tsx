'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { NEWS_CATEGORIES } from '@/lib/constants/countries';
import { CheckCircle, AlertCircle, Building2, Trophy, Film, Briefcase, Laptop, Heart, GraduationCap, Globe, MessageSquare, Newspaper } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
    politics: Building2,
    sports: Trophy,
    entertainment: Film,
    business: Briefcase,
    tech: Laptop,
    health: Heart,
    education: GraduationCap,
    international: Globe,
    opinion: MessageSquare,
    general: Newspaper,
};

export default function NewsPreferencesPage() {
    const { user } = useAuth();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with user's preferences
    useEffect(() => {
        if (user?.preferences?.categories) {
            setSelectedCategories(user.preferences.categories);
        }
    }, [user]);

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((c) => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const selectAll = () => {
        setSelectedCategories(NEWS_CATEGORIES.map(c => c.id));
    };

    const clearAll = () => {
        setSelectedCategories([]);
    };

    const savePreferences = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await api.patch('/users/me', {
                preferences: {
                    ...user?.preferences,
                    categories: selectedCategories,
                },
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to save preferences';
            setError(Array.isArray(message) ? message[0] : message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">News Preferences</h1>
            <p className="text-gray-600 mb-8">
                Select the news categories you&apos;re interested in. We&apos;ll personalize your feed based on your selections.
            </p>

            {success && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Preferences saved successfully!
                </div>
            )}

            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Select All
                </button>
                <button
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                    Clear All
                </button>
                <span className="text-sm text-gray-400">
                    {selectedCategories.length} of {NEWS_CATEGORIES.length} selected
                </span>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {NEWS_CATEGORIES.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    const Icon = CATEGORY_ICONS[category.id] || Newspaper;
                    return (
                        <button
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                </div>
                            )}
                            <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${
                                isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                                <Icon className={`w-6 h-6 ${
                                    isSelected ? 'text-blue-600' : 'text-gray-500'
                                }`} />
                            </div>
                            <span className={`font-medium ${
                                isSelected ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                                {category.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
                <Button onClick={savePreferences} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
                <span className="text-sm text-gray-500">
                    Your preferences will be used to personalize your news feed.
                </span>
            </div>
        </div>
    );
}
