import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AISettingsEntity } from '../database/entities/ai-settings.entity';
import { AISettingsService } from './ai-settings.service';
import { AISettingsController } from './ai-settings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AISettingsEntity])],
    controllers: [AISettingsController],
    providers: [AISettingsService],
    exports: [AISettingsService],
})
export class AISettingsModule { }
