import { Injectable, NotFoundException, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { MailService } from '../../shared/mail/mail.service';
import { UserRole, InvitationStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        locale: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        locale: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        locale: true,
        isActive: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }

  async getProfile(userId: string) {
    return this.findOne(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        locale: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async createMember(dto: CreateMemberDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        role: UserRole.MEMBER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async sendInvitation(invitedById: string, dto: InviteMemberDto) {
    const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const pending = await this.prisma.invitation.findFirst({
      where: { email: dto.email, status: InvitationStatus.PENDING },
    });
    if (pending) throw new ConflictException('An invitation for this email is already pending');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        token,
        role: dto.role ?? UserRole.MEMBER,
        invitedById,
        expiresAt,
      },
      include: { invitedBy: { select: { name: true } } },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/${token}`;

    await this.mail.sendInvitation({
      to: dto.email,
      inviterName: invitation.invitedBy.name,
      inviteUrl,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async getInvitations() {
    return this.prisma.invitation.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(id: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }
    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
      select: { id: true, email: true, status: true },
    });
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired');
    }
    return { email: invitation.email, role: invitation.role };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token: dto.token } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        role: invitation.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
    });

    return user;
  }
}
