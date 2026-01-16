import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import { NewsSourceEntity } from '../database/entities/source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsSourceEntity])],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
