import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PortfolioUseCases } from './use-cases/portfolio.use-cases';
import { PORTFOLIO_REPOSITORY } from './portfolio.constants';

// Pattern: Composition Root — binds the PORTFOLIO_REPOSITORY port to its
// Prisma adapter and wires up the full use-case layer.
@Module({
  imports: [StorageModule],
  controllers: [PortfolioController],
  providers: [
    {
      provide: PORTFOLIO_REPOSITORY,
      useClass: PortfolioRepository,
    },
    PortfolioUseCases,
    PortfolioService,
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
