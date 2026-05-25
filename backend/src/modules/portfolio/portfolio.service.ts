import { Injectable } from '@nestjs/common';
import { UpdatePortfolioDto } from './dto/portfolio.dto';
import { PortfolioUseCases } from './use-cases/portfolio.use-cases';

// Pattern: Facade — thin controller-facing API; delegates to PortfolioUseCases.
@Injectable()
export class PortfolioService {
  constructor(private readonly useCases: PortfolioUseCases) {}

  getShowcase() {
    return this.useCases.getShowcase();
  }

  updateShowcase(projectId: string, dto: UpdatePortfolioDto) {
    return this.useCases.updateShowcase(projectId, dto);
  }
}
