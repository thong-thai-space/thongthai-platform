import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [StorageModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
