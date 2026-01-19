import {
    Controller,
    Get,
    Put,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { AppSettingsService } from './app-settings.service';

@ApiTags('App Settings')
@Controller('app-settings')
export class AppSettingsController {
    constructor(private readonly settingsService: AppSettingsService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all app settings' })
    async getAll() {
        return this.settingsService.getAll();
    }

    @Get(':key')
    @Public()
    @ApiOperation({ summary: 'Get a specific setting by key' })
    async get(@Param('key') key: string) {
        const value = await this.settingsService.get(key);
        return { key, value };
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a setting (admin only)' })
    async set(
        @Param('key') key: string,
        @Body() body: { value: any; description?: string },
    ) {
        return this.settingsService.set(key, body.value, body.description);
    }
}

