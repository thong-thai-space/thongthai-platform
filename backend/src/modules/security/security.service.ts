import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class SecurityService {
  // Pattern: Policy - centralize authorization rules.
  assertRole(role: UserRole, allowed: UserRole[]) {
    if (!allowed.includes(role)) {
      throw new ForbiddenException('You do not have permission');
    }
  }

  assertOwnerOrAdmin(role: UserRole) {
    this.assertRole(role, [UserRole.OWNER, UserRole.ADMIN]);
  }
}
