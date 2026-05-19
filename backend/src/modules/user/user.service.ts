import { Injectable } from '@nestjs/common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserUseCases } from './use-cases/user.use-cases';

// Pattern: Facade — keeps the controller surface stable
@Injectable()
export class UserService {
  constructor(private readonly useCases: UserUseCases) {}

  findAll() {
    return this.useCases.findAll();
  }

  findOne(id: string) {
    return this.useCases.findOne(id);
  }

  update(id: string, dto: UpdateUserDto) {
    return this.useCases.update(id, dto);
  }

  remove(id: string) {
    return this.useCases.remove(id);
  }

  getProfile(userId: string) {
    return this.useCases.getProfile(userId);
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.useCases.updateProfile(userId, dto);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.useCases.changePassword(userId, dto);
  }

  createMember(dto: CreateMemberDto) {
    return this.useCases.createMember(dto);
  }
}
