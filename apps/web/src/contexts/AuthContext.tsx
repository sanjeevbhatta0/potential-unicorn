'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@potential-unicorn/types';
import { authService, LoginDto, RegisterDto } from '../services/auth.service';

import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const userData = await authService.getMe();
                setUser(userData);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            authService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginDto) => {
        setIsLoading(true);
        try {
            await authService.login(data);
            const userData = await authService.getMe();
            setUser(userData);
            // Redirect to dashboard after login
            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterDto) => {
        setIsLoading(true);
        try {
            await authService.register(data);
            // Assuming register returns token and logs in automatically
            const userData = await authService.getMe();
            setUser(userData);
            // Redirect to dashboard after registration
            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        router.refresh();
        // Optional: Redirect to home
        router.push('/');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
