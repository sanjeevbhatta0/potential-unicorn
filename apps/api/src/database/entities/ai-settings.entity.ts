import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'groq' | 'mistral';

export interface AIModelConfig {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

@Entity('ai_settings')
@Index(['provider', 'modelId'])
export class AISettingsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['openai', 'anthropic', 'gemini', 'perplexity', 'groq', 'mistral'],
    })
    provider: AIProvider;

    @Column()
    name: string;

    @Column({ name: 'model_id' })
    modelId: string;

    @Column({ name: 'api_key' })
    apiKey: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column('jsonb', { default: { temperature: 0.7, maxTokens: 4096 } })
    config: AIModelConfig;

    @Column({ name: 'last_tested_at', nullable: true })
    lastTestedAt: Date;

    @Column({ name: 'last_test_success', nullable: true })
    lastTestSuccess: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
