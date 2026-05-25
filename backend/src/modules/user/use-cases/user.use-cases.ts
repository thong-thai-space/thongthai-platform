import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateMemberDto } from '../dto/create-member.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  USER_PASSWORD_HASHER,
  USER_PASSWORD_RULES,
  USER_REPOSITORY,
} from '../user.constants';
import type { UserRepositoryPort } from '../domain/user.repository.port';
import type { UserPasswordHasherPort } from '../domain/user.password-hasher.port';

// Pattern: Use Case — user management business logic
@Injectable()
export class UserUseCases {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: UserRepositoryPort,
    @Inject(USER_PASSWORD_HASHER)
    private readonly hasher: UserPasswordHasherPort,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  update(id: string, dto: UpdateUserDto) {
    return this.repo.update(id, dto);
  }

  remove(id: string) {
    return this.repo.update(id, { isActive: false });
  }

  getProfile(userId: string) {
    return this.findOne(userId);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.repo.update(userId, dto);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new UnauthorizedException(
        'Password change is not available for this account',
      );
    }

    const matches = await this.hasher.compare(
      dto.currentPassword,
      user.password,
    );
    if (!matches)
      throw new UnauthorizedException('Current password is incorrect');

    this.assertStrongPassword(dto.newPassword);
    const hashedPassword = await this.hasher.hash(dto.newPassword);
    await this.repo.update(userId, { password: hashedPassword });
    return { message: 'Password changed successfully' };
  }

  async createMember(dto: CreateMemberDto) {
    this.assertStrongPassword(dto.password);
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await this.hasher.hash(dto.password);
    return this.repo.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.MEMBER,
    });
  }

  private assertStrongPassword(password: string): void {
    if (!USER_PASSWORD_RULES.regex.test(password)) {
      throw new BadRequestException(USER_PASSWORD_RULES.message);
    }
  }
}
