import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioRepository } from './repositories/portfolio.repository';

@Module({
  imports: [StorageModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioRepository],
  exports: [PortfolioService],
})
export class PortfolioModule {}
