export type UserRole = 'user' | 'advertiser' | 'admin';
export type AccountType = 'general' | 'business';
export type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Not included in API responses
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  countryOfResidence?: string;
  ageGroup?: AgeGroup;
  phoneNumber?: string;
  accountType: AccountType;
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
  countryOfResidence?: string;
  ageGroup?: AgeGroup;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  countryOfResidence?: string;
  ageGroup?: AgeGroup;
  phoneNumber?: string;
  accountType?: AccountType;
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
  countryOfResidence?: string;
  ageGroup?: AgeGroup;
  phoneNumber?: string;
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

// Business types
export interface Business {
  id: string;
  businessName: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
  businessEmail?: string;
  website?: string;
  description?: string;
  businessType?: string;
  logoUrl?: string;
  isVerified: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessDto {
  businessName: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
  businessEmail?: string;
  website?: string;
  description?: string;
  businessType?: string;
}

export type UpdateBusinessDto = Partial<CreateBusinessDto>;
