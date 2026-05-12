import { Injectable } from '@nestjs/common';
import { UpdatePortfolioDto } from './dto/portfolio.dto';
import { PortfolioRepository } from './repositories/portfolio.repository';

@Injectable()
export class PortfolioService {
  constructor(private portfolioRepository: PortfolioRepository) {}

  async getShowcase() {
    return this.portfolioRepository.findShowcaseProjects();
  }

  async updateShowcase(projectId: string, dto: UpdatePortfolioDto) {
    return this.portfolioRepository.updateShowcaseProject(projectId, dto);
  }
}
