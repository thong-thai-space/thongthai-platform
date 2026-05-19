import type { Project } from '@prisma/client';

// Pattern: Output Port — abstracts project-related notification side effects
export interface ProjectNotificationPort {
  notifyProjectCreated(project: Project, creatorId: string, clientId?: string): Promise<void>;
  notifyProjectRequested(project: Project, clientId: string): Promise<void>;
  notifyRequestAccepted(project: Project): Promise<void>;
}
