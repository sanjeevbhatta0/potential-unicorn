import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSettingsEntity } from '../database/entities/app-settings.entity';
import { AppSettingsService } from './app-settings.service';
import { AppSettingsController } from './app-settings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AppSettingsEntity])],
    controllers: [AppSettingsController],
    providers: [AppSettingsService],
    exports: [AppSettingsService],
})
export class AppSettingsModule { }
