import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AISettingsEntity } from '../database/entities/ai-settings.entity';
import { AISettingsService } from './ai-settings.service';
import { AIProcessingService } from './ai-processing.service';
import { AISettingsController } from './ai-settings.controller';
import { AIProcessingController } from './ai-processing.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AISettingsEntity])],
    controllers: [AISettingsController, AIProcessingController],
    providers: [AISettingsService, AIProcessingService],
    exports: [AISettingsService, AIProcessingService],
})
export class AISettingsModule { }

