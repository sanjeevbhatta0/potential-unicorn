import {
    Entity,
    Column,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('app_settings')
export class AppSettingsEntity {
    @PrimaryColumn()
    key: string;

    @Column('jsonb')
    value: any;

    @Column({ nullable: true })
    description: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
