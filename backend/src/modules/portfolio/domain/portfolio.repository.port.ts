// Pattern: Repository Port — domain interface; depends on nothing outside this module.

/** Shape returned for public showcase display. */
export interface ShowcaseProjectSummary {
  id: string;
  name: string;
  description: string | null;
  client: { id: string; name: string } | null;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  figmaUrl: string | null;
  showcaseCategory: string | null;
  showcaseResults: string | null;
  thumbnailUrl: string | null;
  screenshots: string[];
  showcaseOrder: number | null;
}

/** All fields are optional — caller sends only what changed. */
export interface UpdateShowcaseInput {
  isShowcase?: boolean;
  showcaseOrder?: number;
  showcaseCategory?: string;
  showcaseResults?: string;
  thumbnailUrl?: string;
  screenshots?: string[];
  liveUrl?: string;
  repoUrl?: string;
  figmaUrl?: string;
}

export interface PortfolioRepositoryPort {
  /** Returns all projects flagged as showcase, ordered by showcaseOrder asc. */
  findShowcaseProjects(): Promise<ShowcaseProjectSummary[]>;

  /**
   * Updates showcase metadata for a project.
   * Throws NotFoundException (P2025) if the project does not exist.
   */
  updateShowcaseProject(
    id: string,
    data: UpdateShowcaseInput,
  ): Promise<ShowcaseProjectSummary>;
}
