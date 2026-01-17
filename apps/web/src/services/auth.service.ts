import { User } from '@potential-unicorn/types';
import { api } from '../lib/api/client';

// Types
export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        // Shared api client unwraps response.data, so we just get the result directly
        const response = await api.post<AuthResponse>('/auth/login', data);
        if (response.accessToken) {
            localStorage.setItem('auth_token', response.accessToken); // client.ts uses 'auth_token', switched from 'token' to match client.ts
        }
        return response;
    },

    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        if (response.accessToken) {
            localStorage.setItem('auth_token', response.accessToken); // Match client.ts key
        }
        return response;
    },

    async getMe(): Promise<User> {
        return api.get<User>('/auth/me');
    },

    logout() {
        localStorage.removeItem('auth_token'); // Match client.ts key
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token'); // Match client.ts key
    },
};
