import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

/**
 * Public invitation endpoints — no JWT required.
 * Accessible at /invitations/:token/verify and /invitations/accept
 */
@ApiTags('Invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private userService: UserService) {}

  @Get(':token/verify')
  verifyInvitation(@Param('token') token: string) {
    return this.userService.verifyInvitationToken(token);
  }

  @Post('accept')
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.userService.acceptInvitation(dto);
  }
}
