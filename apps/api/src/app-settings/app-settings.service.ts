import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettingsEntity } from '../database/entities/app-settings.entity';

// Default settings
const DEFAULT_SETTINGS: Record<string, { value: any; description: string }> = {
    balancedFeedEnabled: {
        value: false,
        description: 'Enable balanced feed to show articles from all sources evenly',
    },
};

@Injectable()
export class AppSettingsService {
    constructor(
        @InjectRepository(AppSettingsEntity)
        private readonly settingsRepository: Repository<AppSettingsEntity>,
    ) { }

    async get<T = any>(key: string): Promise<T | null> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        if (setting) {
            return setting.value as T;
        }
        // Return default if exists
        if (DEFAULT_SETTINGS[key]) {
            return DEFAULT_SETTINGS[key].value as T;
        }
        return null;
    }

    async set(key: string, value: any, description?: string): Promise<AppSettingsEntity> {
        let setting = await this.settingsRepository.findOne({ where: { key } });

        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
        } else {
            setting = this.settingsRepository.create({
                key,
                value,
                description: description || DEFAULT_SETTINGS[key]?.description,
            });
        }

        return this.settingsRepository.save(setting);
    }

    async getAll(): Promise<Record<string, any>> {
        const settings = await this.settingsRepository.find();
        const result: Record<string, any> = {};

        // Start with defaults
        for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
            result[key] = { value: config.value, description: config.description };
        }

        // Override with DB values
        for (const setting of settings) {
            result[setting.key] = {
                value: setting.value,
                description: setting.description,
                updatedAt: setting.updatedAt,
            };
        }

        return result;
    }

    async isBalancedFeedEnabled(): Promise<boolean> {
        return (await this.get<boolean>('balancedFeedEnabled')) ?? false;
    }
}
