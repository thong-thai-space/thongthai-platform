import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientUseCases } from './use-cases/client.use-cases';
import { ClientRepository } from './repositories/client.repository';
import { BcryptClientPasswordHasher } from './adapters/bcrypt-client-password-hasher.adapter';
import { CLIENT_PASSWORD_HASHER, CLIENT_REPOSITORY } from './client.constants';

@Module({
  controllers: [ClientController],
  providers: [
    ClientService,
    ClientUseCases,
    ClientRepository,
    BcryptClientPasswordHasher,
    { provide: CLIENT_REPOSITORY, useExisting: ClientRepository },
    {
      provide: CLIENT_PASSWORD_HASHER,
      useExisting: BcryptClientPasswordHasher,
    },
  ],
  exports: [ClientService],
})
export class ClientModule {}
