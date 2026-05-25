import { Inject, Injectable } from '@nestjs/common';
import { PORTFOLIO_REPOSITORY } from '../portfolio.constants';
import type {
  PortfolioRepositoryPort,
  ShowcaseProjectSummary,
  UpdateShowcaseInput,
} from '../domain/portfolio.repository.port';

// Pattern: Use Case bundle — both operations share the same dependency and
// the same concern (showcase lifecycle). Single class avoids micro-splitting
// a module that has no divergent growth paths yet (YAGNI).
@Injectable()
export class PortfolioUseCases {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY)
    private readonly repo: PortfolioRepositoryPort,
  ) {}

  /** Return all showcase projects ordered by display order. */
  getShowcase(): Promise<ShowcaseProjectSummary[]> {
    return this.repo.findShowcaseProjects();
  }

  /**
   * Update showcase metadata for a project.
   * Delegates NotFoundException propagation to the repository (P2025).
   */
  updateShowcase(
    projectId: string,
    data: UpdateShowcaseInput,
  ): Promise<ShowcaseProjectSummary> {
    return this.repo.updateShowcaseProject(projectId, data);
  }
}
