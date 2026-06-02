import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AcademyService } from './academy.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';
import { ListAdminPlaybooksQueryDto } from './dto/list-playbooks.dto';
import { AssignPlaybookDto } from './dto/assign-playbook.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Academy')
@ApiBearerAuth()
@Controller()
export class AcademyController {
  constructor(private readonly academy: AcademyService) {}

  // ════════════════ Admin: authoring (OWNER/ADMIN) ════════════════

  @Get('admin/playbooks')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  listAdmin(@Query() query: ListAdminPlaybooksQueryDto) {
    return this.academy.listPlaybooks(query);
  }

  @Get('admin/playbooks/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  getAdmin(@Param('id') id: string) {
    return this.academy.getPlaybook(id);
  }

  @Post('admin/playbooks')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(@Body() dto: CreatePlaybookDto, @CurrentUser('id') userId: string) {
    return this.academy.createPlaybook(dto, userId);
  }

  @Patch('admin/playbooks/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePlaybookDto) {
    return this.academy.updatePlaybook(id, dto);
  }

  @Post('admin/playbooks/:id/publish')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) {
    return this.academy.publishPlaybook(id);
  }

  @Post('admin/playbooks/:id/unpublish')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id') id: string) {
    return this.academy.unpublishPlaybook(id);
  }

  @Post('admin/playbooks/:id/archive')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string) {
    return this.academy.archivePlaybook(id);
  }

  @Delete('admin/playbooks/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.academy.deletePlaybook(id);
  }

  // ════════════════ Admin: delivery (OWNER/ADMIN) ════════════════

  @Get('admin/playbooks/:id/assignments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  listAssignees(@Param('id') playbookId: string) {
    return this.academy.listPlaybookAssignees(playbookId);
  }

  @Post('admin/playbooks/:id/assignments')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  assign(
    @Param('id') playbookId: string,
    @Body() dto: AssignPlaybookDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.academy.assignPlaybook(playbookId, dto.clientId, userId);
  }

  @Delete('admin/playbook-assignments/:assignmentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(@Param('assignmentId') assignmentId: string) {
    return this.academy.unassignPlaybook(assignmentId);
  }

  // ════════════════ Client portal (the authenticated client) ════════════════

  @Get('academy/playbooks')
  @UseGuards(AuthGuard('jwt'))
  listMine(@CurrentUser('id') clientId: string) {
    return this.academy.listMyPlaybooks(clientId);
  }

  @Get('academy/playbooks/:assignmentId')
  @UseGuards(AuthGuard('jwt'))
  getMine(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('id') clientId: string,
  ) {
    return this.academy.getMyPlaybook(assignmentId, clientId);
  }

  @Post('academy/playbooks/:assignmentId/progress')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  updateProgress(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('id') clientId: string,
  ) {
    return this.academy.updateMyProgress(assignmentId, clientId, dto.action);
  }
}
