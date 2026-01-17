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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Post()
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all articles with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  findAll(@Query() query: QueryArticleDto) {
    return this.articlesService.findAll(query);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending articles' })
  @ApiResponse({ status: 200, description: 'Trending articles retrieved successfully' })
  findTrending(@Query('limit') limit?: number) {
    return this.articlesService.findTrending(limit);
  }

  @Get('category/:category')
  @Public()
  @ApiOperation({ summary: 'Get articles by category' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  findByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
  ) {
    return this.articlesService.findByCategory(category, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get article by ID' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update article' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete article' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  @Post(':id/view')
  @Public()
  @ApiOperation({ summary: 'Increment article view count' })
  @ApiResponse({ status: 200, description: 'View count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  incrementView(@Param('id') id: string) {
    return this.articlesService.incrementViewCount(id);
  }

  @Post(':id/process-ai')
  @Public()
  @ApiOperation({ summary: 'Process article with AI (on-demand for existing articles)' })
  @ApiResponse({ status: 200, description: 'AI processing result returned' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  processWithAI(@Param('id') id: string) {
    return this.articlesService.processArticleWithAI(id);
  }

  @Post('recategorize/general')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Re-categorize all articles marked as general' })
  @ApiResponse({ status: 200, description: 'Re-categorization started' })
  recategorizeGeneralArticles(@Query('limit') limit?: number) {
    return this.articlesService.recategorizeGeneralArticles(limit || 50);
  }

  @Post(':id/recategorize')
  @Public()
  @ApiOperation({ summary: 'Re-categorize a single article using keyword detection' })
  @ApiResponse({ status: 200, description: 'Article re-categorized' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  recategorizeArticle(@Param('id') id: string) {
    return this.articlesService.recategorizeArticle(id);
  }
}
