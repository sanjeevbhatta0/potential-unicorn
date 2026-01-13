import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Language } from '@potential-unicorn/types';
import { ArticleEntity } from './article.entity';

@Entity('news_sources')
export class NewsSourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['website', 'youtube'],
  })
  type: 'website' | 'youtube';

  @Column({ name: 'base_url', nullable: true })
  baseUrl: string;

  @Column({ name: 'channel_id', nullable: true })
  channelId: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({
    type: 'enum',
    enum: ['ne', 'en'],
  })
  language: Language;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column('jsonb', { name: 'crawl_config', nullable: true })
  crawlConfig: {
    enabled: boolean;
    interval: number;
    selectors?: {
      article?: string;
      title?: string;
      content?: string;
      image?: string;
      author?: string;
      date?: string;
    };
    maxArticles?: number;
    respectRobotsTxt?: boolean;
    userAgent?: string;
  };

  @Column({ name: 'last_crawled_at', type: 'timestamp', nullable: true })
  lastCrawledAt: Date;

  @OneToMany(() => ArticleEntity, (article) => article.source)
  articles: ArticleEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
