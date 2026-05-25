import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserUseCases } from './use-cases/user.use-cases';
import { UserRepository } from './repositories/user.repository';
import { BcryptUserPasswordHasher } from './adapters/bcrypt-user-password-hasher.adapter';
import { USER_PASSWORD_HASHER, USER_REPOSITORY } from './user.constants';

@Module({
  imports: [StorageModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserUseCases,
    UserRepository,
    BcryptUserPasswordHasher,
    { provide: USER_REPOSITORY, useExisting: UserRepository },
    { provide: USER_PASSWORD_HASHER, useExisting: BcryptUserPasswordHasher },
  ],
  exports: [UserService],
})
export class UserModule {}
