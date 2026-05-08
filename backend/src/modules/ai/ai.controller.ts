import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AiService } from './ai.service';
import {
  ChatDto,
  GenerateProposalDto,
  BreakdownTasksDto,
  ReviewCodeDto,
  EstimateDto,
  StrategicPlanDto,
  ApplyStrategicPlanDto,
  AiAuditFeedbackDto,
  ReviewApplyRequestDto,
  AuditQueryDto,
  PurgeAuditDto,
} from './dto/ai.dto';
import { ArchitectureAgentDto } from './dto/architecture-agent.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('architecture-agent')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/png',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
          return;
        }

        callback(
          new BadRequestException(`File type ${file.mimetype} is not allowed`),
          false,
        );
      },
    }),
  )
  async architectureAgent(
    @Body() dto: ArchitectureAgentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.generateArchitectureDiagram(userId, role, dto.message, file);
  }

  @Post('chat')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.chat(userId, dto.message, dto.conversationId, role);
  }

  @Post('generate-proposal')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async generateProposal(
    @Body() dto: GenerateProposalDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const proposal = await this.aiService.generateProposal(
      userId,
      role,
      dto.requirements,
      dto.locale,
      dto.budget,
    );
    return { proposal };
  }

  @Post('breakdown-tasks')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  async breakdownTasks(
    @Body() dto: BreakdownTasksDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.breakdownTasks(
      userId,
      role,
      dto.description,
      dto.techStack,
    );
  }

  @Post('review-code')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  async reviewCode(
    @Body() dto: ReviewCodeDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const review = await this.aiService.reviewCode(
      userId,
      role,
      dto.code,
      dto.language,
      dto.context,
    );
    return { review };
  }

  @Post('estimate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async estimate(
    @Body() dto: EstimateDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.estimateProject(userId, role, dto.requirements, dto.locale);
  }

  @Post('progress-report/:projectId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async progressReport(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('locale') locale: string,
  ) {
    const report = await this.aiService.generateProgressReport(
      userId,
      role,
      projectId,
      locale as any,
    );
    return { report };
  }

  @Post('strategic-plan')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async strategicPlan(
    @Body() dto: StrategicPlanDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.generateStrategicPlan(userId, role, dto);
  }

  @Post('strategic-plan/apply')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async applyStrategicPlan(
    @Body() dto: ApplyStrategicPlanDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.applyStrategicPlan(userId, role, dto);
  }

  @Get('strategic-plan/apply-requests')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async listApplyRequests(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query('status') status?: string,
  ) {
    return this.aiService.listApplyRequests(userId, role, status);
  }

  @Patch('strategic-plan/apply-requests/:id/review')
  @Roles(UserRole.OWNER)
  async reviewApplyRequest(
    @Param('id') id: string,
    @Body() dto: ReviewApplyRequestDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.reviewApplyRequest(id, userId, role, dto.approve, dto.notes);
  }

  @Post('audit')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async getAuditLogs(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() body?: AuditQueryDto,
  ) {
    return this.aiService.getAiAuditLogs(userId, role, body?.limit, body?.days);
  }

  @Get('audit/summary')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async getAuditSummary(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query('days') days?: string,
  ) {
    return this.aiService.getAiAuditSummary(userId, role, Number(days) || 30);
  }

  @Patch('audit/:id/feedback')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async feedbackAudit(
    @Param('id') id: string,
    @Body() dto: AiAuditFeedbackDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.updateAiAuditFeedback(id, userId, role, dto);
  }

  @Delete('audit/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT)
  async deleteAuditLog(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.deleteAiAuditLog(id, userId, role);
  }

  @Post('audit/purge')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async purgeAuditLogs(
    @Body() dto: PurgeAuditDto,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.aiService.purgeAiAuditLogs(role, dto.retentionDays);
  }
}
