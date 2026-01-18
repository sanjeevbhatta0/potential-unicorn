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
import { COUNTRIES, AGE_GROUPS } from '@/lib/constants/countries';
import { CheckCircle, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().optional(),
    countryOfResidence: z.string().optional(),
    ageGroup: z.enum(['18-24', '25-34', '35-44', '45-54', '55-64', '65+', '']).optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function AccountSettingsPage() {
    const { user } = useAuth();
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Profile form
    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
        reset: resetProfile,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
            countryOfResidence: user?.countryOfResidence || '',
            ageGroup: user?.ageGroup || '',
        },
    });

    // Password form
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
        reset: resetPassword,
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    // Reset form when user data loads
    useEffect(() => {
        if (user) {
            resetProfile({
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                countryOfResidence: user.countryOfResidence || '',
                ageGroup: user.ageGroup || '',
            });
        }
    }, [user, resetProfile]);

    const onProfileSubmit = async (data: ProfileFormValues) => {
        setProfileError(null);
        setProfileSuccess(false);
        try {
            await api.patch('/users/me', {
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber || undefined,
                countryOfResidence: data.countryOfResidence || undefined,
                ageGroup: data.ageGroup || undefined,
            });
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 5000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update profile';
            setProfileError(Array.isArray(message) ? message[0] : message);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        setPasswordError(null);
        setPasswordSuccess(false);
        try {
            await api.post('/users/me/password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setPasswordSuccess(true);
            resetPassword();
            setTimeout(() => setPasswordSuccess(false), 5000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to change password';
            setPasswordError(Array.isArray(message) ? message[0] : message);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-muted-foreground mb-8">Manage your profile information and security settings.</p>

            {/* Profile Section */}
            <section className="bg-card rounded-xl border border-border p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">Profile Information</h2>

                {profileSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Profile updated successfully!
                    </div>
                )}

                {profileError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {profileError}
                    </div>
                )}

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                {...registerProfile('fullName')}
                            />
                            {profileErrors.fullName && (
                                <span className="text-xs text-red-500">{profileErrors.fullName.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...registerProfile('email')}
                            />
                            {profileErrors.email && (
                                <span className="text-xs text-red-500">{profileErrors.email.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+977-9841234567"
                            {...registerProfile('phoneNumber')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="countryOfResidence">Country of Residence</Label>
                            <Select
                                id="countryOfResidence"
                                {...registerProfile('countryOfResidence')}
                            >
                                <option value="">Select a country</option>
                                {COUNTRIES.map((country) => (
                                    <option key={country.value} value={country.label}>
                                        {country.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ageGroup">Age Group</Label>
                            <Select
                                id="ageGroup"
                                {...registerProfile('ageGroup')}
                            >
                                <option value="">Select age group</option>
                                {AGE_GROUPS.map((group) => (
                                    <option key={group.value} value={group.value}>
                                        {group.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isProfileSubmitting}>
                            {isProfileSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </section>

            {/* Password Section */}
            <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-6">Change Password</h2>

                {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Password changed successfully!
                    </div>
                )}

                {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {passwordError}
                    </div>
                )}

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            {...registerPassword('currentPassword')}
                        />
                        {passwordErrors.currentPassword && (
                            <span className="text-xs text-red-500">{passwordErrors.currentPassword.message}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                {...registerPassword('newPassword')}
                            />
                            {passwordErrors.newPassword && (
                                <span className="text-xs text-red-500">{passwordErrors.newPassword.message}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...registerPassword('confirmPassword')}
                            />
                            {passwordErrors.confirmPassword && (
                                <span className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isPasswordSubmitting}>
                            {isPasswordSubmitting ? 'Changing Password...' : 'Change Password'}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
