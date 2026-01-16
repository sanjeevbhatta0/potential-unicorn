import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { NewsSourceEntity } from '../database/entities/source.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(NewsSourceEntity)
    private readonly sourceRepository: Repository<NewsSourceEntity>,
  ) {}

  async create(createSourceDto: CreateSourceDto): Promise<NewsSourceEntity> {
    const source = this.sourceRepository.create({
      ...createSourceDto,
      isActive: createSourceDto.isActive ?? true,
    });

    return this.sourceRepository.save(source);
  }

  async findAll(isActive?: boolean): Promise<NewsSourceEntity[]> {
    const where: FindOptionsWhere<NewsSourceEntity> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.sourceRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<NewsSourceEntity> {
    const source = await this.sourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }

    return source;
  }

  async findByType(type: 'website' | 'youtube'): Promise<NewsSourceEntity[]> {
    return this.sourceRepository.find({
      where: { type },
      order: { name: 'ASC' },
    });
  }

  async findByLanguage(language: 'ne' | 'en'): Promise<NewsSourceEntity[]> {
    return this.sourceRepository.find({
      where: { language },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateSourceDto: UpdateSourceDto,
  ): Promise<NewsSourceEntity> {
    const source = await this.findOne(id);

    Object.assign(source, updateSourceDto);

    return this.sourceRepository.save(source);
  }

  async remove(id: string): Promise<void> {
    const source = await this.findOne(id);
    await this.sourceRepository.remove(source);
  }

  async updateLastCrawledAt(id: string): Promise<NewsSourceEntity> {
    const source = await this.findOne(id);
    source.lastCrawledAt = new Date();
    return this.sourceRepository.save(source);
  }

  async getActiveSources(): Promise<NewsSourceEntity[]> {
    return this.sourceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
