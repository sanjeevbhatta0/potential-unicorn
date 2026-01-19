import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleEntity } from '../database/entities/article.entity';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity]),
    CacheModule.register({ ttl: 300000 }), // 5 minutes cache
    AppSettingsModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule { }

