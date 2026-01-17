import { PartialType } from '@nestjs/swagger';
import { CreateAISettingsDto } from './create-ai-settings.dto';

export class UpdateAISettingsDto extends PartialType(CreateAISettingsDto) { }
