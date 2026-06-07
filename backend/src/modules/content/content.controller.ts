import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ContentService } from './content.service';
import { UpdateOverrideDto } from './dto/update-override.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Public ── consumed by the frontend at render time (i18n/request.ts).
  @Get('overrides/:locale')
  getOverrides(@Param('locale') locale: string) {
    return this.contentService.getOverridesForLocale(locale);
  }

  // ── Admin ──
  @Get('admin/overrides/:locale')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getAdminOverrides(@Param('locale') locale: string) {
    return this.contentService.getOverridesForLocale(locale);
  }

  @Put('admin/overrides/:locale/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async upsertOverride(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
    @Body() dto: UpdateOverrideDto,
  ) {
    await this.contentService.upsertOverride(locale, namespace, dto.data);
    return { success: true };
  }

  @Delete('admin/overrides/:locale/:namespace')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeOverride(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
  ) {
    await this.contentService.removeOverride(locale, namespace);
    return { success: true };
  }
}
