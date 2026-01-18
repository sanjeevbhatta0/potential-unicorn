'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Newspaper, Building2, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();

    const quickActions = [
        {
            href: '/dashboard/settings',
            label: 'Account Settings',
            description: 'Update your profile information and change your password',
            icon: Settings,
            color: 'bg-blue-500',
        },
        {
            href: '/dashboard/preferences',
            label: 'News Preferences',
            description: 'Select your preferred news categories to personalize your feed',
            icon: Newspaper,
            color: 'bg-purple-500',
        },
        {
            href: '/dashboard/business',
            label: 'Business Registration',
            description: user?.accountType === 'business'
                ? 'Manage your business details and publish ads on our website'
                : 'Register your business to unlock advertising features',
            icon: Building2,
            color: 'bg-green-500',
        },
    ];

    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-600">
                    Manage your account settings and preferences from your dashboard.
                </p>
            </div>

            {/* Account Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Status</h2>
                        <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                user?.accountType === 'business'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {user?.accountType === 'business' ? 'Business Account' : 'General Account'}
                            </span>
                            {user?.isVerified && (
                                <span className="inline-flex items-center text-sm text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Member since</p>
                        <p className="text-sm font-medium text-gray-900">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                            }) : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-between">
                                {action.label}
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </h3>
                            <p className="text-sm text-gray-600">{action.description}</p>
                        </Link>
                    );
                })}
            </div>

            {/* Info Banner for Business Registration */}
            {user?.accountType !== 'business' && (
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Have a business?
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Register your business to unlock advertising features and reach thousands of readers on our platform.
                            </p>
                            <Link
                                href="/dashboard/business"
                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Register your business
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
