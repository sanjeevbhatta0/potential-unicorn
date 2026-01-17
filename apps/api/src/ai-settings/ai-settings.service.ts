import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AISettingsEntity, AIProvider } from '../database/entities/ai-settings.entity';
import { CreateAISettingsDto, UpdateAISettingsDto } from './dto';
import * as crypto from 'crypto';

// Available models per provider
const AVAILABLE_MODELS: Record<AIProvider, { id: string; name: string; costPer1kTokens: number }[]> = {
    openai: [
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', costPer1kTokens: 0.01 },
        { id: 'gpt-4o', name: 'GPT-4o', costPer1kTokens: 0.005 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', costPer1kTokens: 0.00015 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', costPer1kTokens: 0.0005 },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', costPer1kTokens: 0.003 },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', costPer1kTokens: 0.003 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', costPer1kTokens: 0.0008 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', costPer1kTokens: 0.015 },
    ],
    gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', costPer1kTokens: 0.0001 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', costPer1kTokens: 0.00125 },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', costPer1kTokens: 0.000075 },
    ],
    perplexity: [
        { id: 'sonar-pro', name: 'Sonar Pro', costPer1kTokens: 0.003 },
        { id: 'sonar', name: 'Sonar', costPer1kTokens: 0.001 },
    ],
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', costPer1kTokens: 0.00059 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', costPer1kTokens: 0.00005 },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', costPer1kTokens: 0.00024 },
    ],
    mistral: [
        { id: 'mistral-large-latest', name: 'Mistral Large', costPer1kTokens: 0.002 },
        { id: 'mistral-small-latest', name: 'Mistral Small', costPer1kTokens: 0.0002 },
        { id: 'codestral-latest', name: 'Codestral', costPer1kTokens: 0.0003 },
    ],
};

@Injectable()
export class AISettingsService {
    private readonly encryptionKey: Buffer;

    constructor(
        @InjectRepository(AISettingsEntity)
        private readonly aiSettingsRepository: Repository<AISettingsEntity>,
    ) {
        // Use JWT_SECRET for encryption (in production, use a separate key)
        const secret = process.env.JWT_SECRET || 'default-secret-key';
        this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
    }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    private decrypt(text: string): string {
        try {
            const [ivHex, encrypted] = text.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return text; // Return as-is if not encrypted (for migration)
        }
    }

    private maskApiKey(apiKey: string): string {
        if (!apiKey || apiKey.length < 8) return '****';
        return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
    }

    async findAll(): Promise<AISettingsEntity[]> {
        const settings = await this.aiSettingsRepository.find({
            order: { isDefault: 'DESC', provider: 'ASC', name: 'ASC' },
        });
        // Mask API keys in response
        return settings.map(s => ({ ...s, apiKey: this.maskApiKey(this.decrypt(s.apiKey)) }));
    }

    async findOne(id: string): Promise<AISettingsEntity> {
        const setting = await this.aiSettingsRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`AI Setting with ID ${id} not found`);
        }
        return { ...setting, apiKey: this.maskApiKey(this.decrypt(setting.apiKey)) };
    }

    async findDefault(): Promise<AISettingsEntity | null> {
        return this.aiSettingsRepository.findOne({
            where: { isDefault: true, isActive: true },
        });
    }

    async getDecryptedApiKey(id: string): Promise<string> {
        const setting = await this.aiSettingsRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`AI Setting with ID ${id} not found`);
        }
        return this.decrypt(setting.apiKey);
    }

    async create(dto: CreateAISettingsDto): Promise<AISettingsEntity> {
        const setting = this.aiSettingsRepository.create({
            ...dto,
            apiKey: this.encrypt(dto.apiKey),
            config: dto.config || { temperature: 0.7, maxTokens: 4096 },
        });
        const saved = await this.aiSettingsRepository.save(setting);
        return { ...saved, apiKey: this.maskApiKey(dto.apiKey) };
    }

    async update(id: string, dto: UpdateAISettingsDto): Promise<AISettingsEntity> {
        const setting = await this.aiSettingsRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`AI Setting with ID ${id} not found`);
        }

        if (dto.apiKey) {
            dto.apiKey = this.encrypt(dto.apiKey);
        }

        Object.assign(setting, dto);
        const saved = await this.aiSettingsRepository.save(setting);
        return { ...saved, apiKey: this.maskApiKey(this.decrypt(saved.apiKey)) };
    }

    async remove(id: string): Promise<void> {
        const setting = await this.aiSettingsRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`AI Setting with ID ${id} not found`);
        }
        if (setting.isDefault) {
            throw new BadRequestException('Cannot delete the default AI setting');
        }
        await this.aiSettingsRepository.remove(setting);
    }

    async setDefault(id: string): Promise<AISettingsEntity> {
        const setting = await this.aiSettingsRepository.findOne({ where: { id } });
        if (!setting) {
            throw new NotFoundException(`AI Setting with ID ${id} not found`);
        }

        // Remove default from all others using query builder (avoids empty criteria error)
        await this.aiSettingsRepository
            .createQueryBuilder()
            .update(AISettingsEntity)
            .set({ isDefault: false })
            .where('isDefault = :isDefault', { isDefault: true })
            .execute();

        // Set this one as default
        setting.isDefault = true;
        const saved = await this.aiSettingsRepository.save(setting);
        return { ...saved, apiKey: this.maskApiKey(this.decrypt(saved.apiKey)) };
    }

    async updateTestStatus(id: string, success: boolean): Promise<void> {
        await this.aiSettingsRepository.update(id, {
            lastTestedAt: new Date(),
            lastTestSuccess: success,
        });
    }

    getAvailableProviders(): { provider: AIProvider; name: string }[] {
        return [
            { provider: 'openai', name: 'OpenAI' },
            { provider: 'anthropic', name: 'Anthropic' },
            { provider: 'gemini', name: 'Google Gemini' },
            { provider: 'perplexity', name: 'Perplexity' },
            { provider: 'groq', name: 'Groq' },
            { provider: 'mistral', name: 'Mistral AI' },
        ];
    }

    getModelsForProvider(provider: AIProvider): { id: string; name: string; costPer1kTokens: number }[] {
        return AVAILABLE_MODELS[provider] || [];
    }
}
