import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('businesses')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_name' })
  businessName: string;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'business_email', nullable: true })
  businessEmail: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'business_type', nullable: true })
  businessType: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
