'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants/countries';
import { CheckCircle, AlertCircle, Building2, Megaphone } from 'lucide-react';

const businessSchema = z.object({
    businessName: z.string().min(2, 'Business name is required'),
    registrationNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phoneNumber: z.string().optional(),
    businessEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    description: z.string().optional(),
    businessType: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

const BUSINESS_TYPES = [
    { value: 'retail', label: 'Retail / E-commerce' },
    { value: 'technology', label: 'Technology / Software' },
    { value: 'hospitality', label: 'Hospitality / Tourism' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance / Banking' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'media', label: 'Media / Entertainment' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' },
];

export default function BusinessRegistrationPage() {
    const { user } = useAuth();
    const [business, setBusiness] = useState<BusinessFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<BusinessFormData>({
        resolver: zodResolver(businessSchema),
    });

    useEffect(() => {
        fetchBusiness();
    }, []);

    const fetchBusiness = async () => {
        try {
            const data = await api.get('/business/me');
            if (data) {
                setBusiness(data);
                reset(data);
            }
        } catch (err) {
            // No business registered yet - this is expected
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: BusinessFormData) => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            if (business) {
                await api.patch('/business/me', data);
            } else {
                await api.post('/business', data);
            }
            setSuccess(true);
            fetchBusiness();
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to save business';
            setError(Array.isArray(message) ? message[0] : message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {business ? 'Manage Your Business' : 'Register Your Business'}
            </h1>
            <p className="text-gray-600 mb-8">
                {business
                    ? 'Update your business information and manage your advertising features.'
                    : 'Register your business to unlock advertising features and reach thousands of readers.'}
            </p>

            {/* Status Banner */}
            {user?.accountType === 'business' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-medium text-green-800">Business Account Active</p>
                        <p className="text-sm text-green-600">You have access to advertising features</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    {business ? 'Business updated successfully!' : 'Business registered successfully! Your account is now a business account.'}
                </div>
            )}

            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Business Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name *</Label>
                            <Input
                                id="businessName"
                                placeholder="Acme Corporation"
                                {...register('businessName')}
                            />
                            {errors.businessName && (
                                <span className="text-xs text-red-500">{errors.businessName.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessType">Business Type</Label>
                            <Select id="businessType" {...register('businessType')}>
                                <option value="">Select type</option>
                                {BUSINESS_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration Number</Label>
                            <Input
                                id="registrationNumber"
                                placeholder="REG-12345"
                                {...register('registrationNumber')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Business Phone</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+977-1-1234567"
                                {...register('phoneNumber')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="businessEmail">Business Email</Label>
                            <Input
                                id="businessEmail"
                                type="email"
                                placeholder="contact@business.com"
                                {...register('businessEmail')}
                            />
                            {errors.businessEmail && (
                                <span className="text-xs text-red-500">{errors.businessEmail.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://www.example.com"
                                {...register('website')}
                            />
                            {errors.website && (
                                <span className="text-xs text-red-500">{errors.website.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            placeholder="123 Business Street"
                            {...register('address')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                placeholder="Kathmandu"
                                {...register('city')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Select id="country" {...register('country')}>
                                <option value="">Select country</option>
                                {COUNTRIES.map((country) => (
                                    <option key={country.value} value={country.label}>
                                        {country.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <textarea
                            id="description"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Tell us about your business..."
                            {...register('description')}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : business ? 'Update Business' : 'Register Business'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Advertising Info */}
            {user?.accountType === 'business' && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Advertise with Us
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                As a business account holder, you can publish ads on our website and reach thousands of readers.
                                Our advertising feature is coming soon!
                            </p>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                Coming Soon
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
