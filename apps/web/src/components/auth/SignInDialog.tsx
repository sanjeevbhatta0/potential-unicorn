'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES, AGE_GROUPS } from '@/lib/constants/countries';

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    countryOfResidence: z.string().optional(),
    ageGroup: z.enum(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']).optional(),
    phoneNumber: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface SignInDialogProps {
    children?: React.ReactNode;
    defaultTab?: 'login' | 'register';
}

export function SignInDialog({ children, defaultTab = 'login' }: SignInDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { login, register } = useAuth();
    const [error, setError] = useState<string | null>(null);

    // Login Form
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
        reset: resetLogin
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    // Register Form
    const {
        register: registerSignUp,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
        reset: resetRegister
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onLogin = async (data: LoginFormValues) => {
        setError(null);
        try {
            await login(data);
            setIsOpen(false);
            resetLogin();
        } catch (err: any) {
            // Handle axios error or other
            const message = err.response?.data?.message || 'Failed to login. Please check your credentials.';
            setError(Array.isArray(message) ? message[0] : message);
        }
    };

    const onRegister = async (data: RegisterFormValues) => {
        setError(null);
        try {
            await register(data);
            setIsOpen(false);
            resetRegister();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to register.';
            setError(Array.isArray(message) ? message[0] : message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Sign In</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Account Access</DialogTitle>
                    <DialogDescription>
                        Sign in to your account or create a new one to unlock features.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    {/* LOGIN CONTENT */}
                    <TabsContent value="login">
                        <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    {...registerLogin('email')}
                                />
                                {loginErrors.email && (
                                    <span className="text-xs text-red-500">{loginErrors.email.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    {...registerLogin('password')}
                                />
                                {loginErrors.password && (
                                    <span className="text-xs text-red-500">{loginErrors.password.message}</span>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoginSubmitting}>
                                {isLoginSubmitting ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* REGISTER CONTENT */}
                    <TabsContent value="register">
                        <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-name">Full Name *</Label>
                                <Input
                                    id="register-name"
                                    placeholder="John Doe"
                                    {...registerSignUp('fullName')}
                                />
                                {registerErrors.fullName && (
                                    <span className="text-xs text-red-500">{registerErrors.fullName.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email *</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    {...registerSignUp('email')}
                                />
                                {registerErrors.email && (
                                    <span className="text-xs text-red-500">{registerErrors.email.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-password">Password *</Label>
                                <Input
                                    id="register-password"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    {...registerSignUp('password')}
                                />
                                {registerErrors.password && (
                                    <span className="text-xs text-red-500">{registerErrors.password.message}</span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-phone">Phone Number</Label>
                                <Input
                                    id="register-phone"
                                    type="tel"
                                    placeholder="+977-9841234567"
                                    {...registerSignUp('phoneNumber')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-country">Country of Residence</Label>
                                <Select
                                    id="register-country"
                                    {...registerSignUp('countryOfResidence')}
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
                                <Label htmlFor="register-age">Age Group</Label>
                                <Select
                                    id="register-age"
                                    {...registerSignUp('ageGroup')}
                                >
                                    <option value="">Select age group</option>
                                    {AGE_GROUPS.map((group) => (
                                        <option key={group.value} value={group.value}>
                                            {group.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isRegisterSubmitting}>
                                {isRegisterSubmitting ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
