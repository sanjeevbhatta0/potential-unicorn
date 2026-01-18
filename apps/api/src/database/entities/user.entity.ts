import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '@potential-unicorn/types';
import { Exclude } from 'class-transformer';

@Entity('users')
@Index(['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: ['user', 'advertiser', 'admin'],
    default: 'user',
  })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'country_of_residence', nullable: true })
  countryOfResidence: string;

  @Column({ name: 'age_group', nullable: true })
  ageGroup: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'account_type', default: 'general' })
  accountType: 'general' | 'business';

  @Column('jsonb', { default: {} })
  preferences: {
    language?: 'ne' | 'en';
    categories?: string[];
    sources?: string[];
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
