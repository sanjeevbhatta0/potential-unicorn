import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CrawlerService } from './crawler.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly crawlerService: CrawlerService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new news source' })
  @ApiResponse({ status: 201, description: 'Source created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createSourceDto: CreateSourceDto) {
    return this.sourcesService.create(createSourceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all news sources' })
  @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
  findAll(@Query('isActive') isActive?: boolean) {
    return this.sourcesService.findAll(isActive);
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active news sources' })
  @ApiResponse({ status: 200, description: 'Active sources retrieved successfully' })
  getActiveSources() {
    return this.sourcesService.getActiveSources();
  }

  @Get('type/:type')
  @Public()
  @ApiOperation({ summary: 'Get sources by type' })
  @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
  findByType(@Param('type') type: 'website' | 'youtube') {
    return this.sourcesService.findByType(type);
  }

  @Get('language/:language')
  @Public()
  @ApiOperation({ summary: 'Get sources by language' })
  @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
  findByLanguage(@Param('language') language: 'ne' | 'en') {
    return this.sourcesService.findByLanguage(language);
  }

  @Get('cron-crawl')
  @Public()
  @ApiOperation({ summary: 'Cron endpoint to crawl all active sources' })
  @ApiResponse({ status: 200, description: 'Crawl results returned' })
  cronCrawl(@Headers('authorization') authHeader: string) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new UnauthorizedException('Invalid CRON_SECRET');
    }
    return this.crawlerService.crawlAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get source by ID' })
  @ApiResponse({ status: 200, description: 'Source retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update source' })
  @ApiResponse({ status: 200, description: 'Source updated successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateSourceDto: UpdateSourceDto) {
    return this.sourcesService.update(id, updateSourceDto);
  }

  @Post('crawl-all')
  @Public()
  @ApiOperation({ summary: 'Crawl all active news sources' })
  @ApiResponse({ status: 200, description: 'Crawl results returned' })
  crawlAll(@Headers('x-api-key') apiKey: string) {
    const validApiKey = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return this.crawlerService.crawlAll();
  }

  @Post(':id/crawl')
  @Public()
  @ApiOperation({ summary: 'Crawl a specific news source' })
  @ApiResponse({ status: 200, description: 'Crawl result returned' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  crawlSource(
    @Param('id') id: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    const validApiKey = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return this.crawlerService.crawlSource(id);
  }

  @Post('admin/crawl-all')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Crawl all active sources' })
  @ApiResponse({ status: 200, description: 'Crawl results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  adminCrawlAll() {
    return this.crawlerService.crawlAll();
  }

  @Post(':id/admin-crawl')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Crawl a specific source' })
  @ApiResponse({ status: 200, description: 'Crawl result returned' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  adminCrawlSource(@Param('id') id: string) {
    return this.crawlerService.crawlSource(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete source' })
  @ApiResponse({ status: 200, description: 'Source deleted successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.sourcesService.remove(id);
  }
}
