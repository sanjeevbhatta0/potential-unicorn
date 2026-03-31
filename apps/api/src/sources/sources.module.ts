import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourcesService } from './sources.service';
import { CrawlerService } from './crawler.service';
import { SourcesController } from './sources.controller';
import { NewsSourceEntity } from '../database/entities/source.entity';
import { ArticleEntity } from '../database/entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsSourceEntity, ArticleEntity])],
  controllers: [SourcesController],
  providers: [SourcesService, CrawlerService],
  exports: [SourcesService],
})
export class SourcesModule {}
