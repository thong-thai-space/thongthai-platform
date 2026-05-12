import { SecurityService } from './security.service';
import { UserRole } from '@prisma/client';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    service = new SecurityService();
  });

  it('allows owner role', () => {
    expect(() => service.assertOwnerOrAdmin(UserRole.OWNER)).not.toThrow();
  });

  it('blocks member role', () => {
    expect(() => service.assertOwnerOrAdmin(UserRole.MEMBER)).toThrow();
  });
});
