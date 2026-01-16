import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category, Language } from '@potential-unicorn/types';
import { NewsSourceEntity } from './source.entity';

@Entity('articles')
@Index(['category'])
@Index(['language'])
@Index(['publishedAt'])
@Index(['isTrending'])
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_id' })
  sourceId: string;

  @ManyToOne(() => NewsSourceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: NewsSourceEntity;

  @Column()
  title: string;

  @Column({ name: 'title_en', nullable: true })
  titleEn: string;

  @Column('text')
  content: string;

  @Column('text')
  summary: string;

  @Column({ name: 'summary_en', type: 'text', nullable: true })
  summaryEn: string;

  @Column('simple-array')
  highlights: string[];

  @Column()
  url: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  author: string;

  @Column({ name: 'published_at', type: 'timestamp' })
  publishedAt: Date;

  @Column({
    type: 'enum',
    enum: [
      'politics',
      'sports',
      'entertainment',
      'business',
      'technology',
      'health',
      'education',
      'international',
      'opinion',
      'general',
    ],
  })
  category: Category;

  @Column('simple-array')
  tags: string[];

  @Column({
    type: 'enum',
    enum: ['ne', 'en'],
  })
  language: Language;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'is_trending', default: false })
  isTrending: boolean;

  @Column('simple-array', { nullable: true })
  embedding: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
