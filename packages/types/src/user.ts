export type UserRole = 'user' | 'advertiser' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Not included in API responses
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  preferences: UserPreferences;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language?: 'ne' | 'en';
  categories?: string[];
  sources?: string[];
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  fullName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  articleId: string;
  action: 'view' | 'bookmark' | 'share';
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId: string;
  createdAt: Date;
}
