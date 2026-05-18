import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Invoice, InvoiceStatus, UserRole } from '@prisma/client';

// Pattern: Policy
@Injectable()
export class InvoicePolicy {
  assertCanView(role: UserRole, invoice: Invoice, userId: string) {
    if (role === UserRole.CLIENT && invoice.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this invoice');
    }
  }

  assertCanDelete(invoice: Invoice) {
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only delete draft invoices');
    }
  }

  assertValidStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
      PAID: [],
      OVERDUE: ['PAID', 'CANCELLED'],
      CANCELLED: [],
    };

    const allowedNextStates = validTransitions[currentStatus];
    if (!allowedNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${
          allowedNextStates.join(', ') || 'none'
        }`,
      );
    }
  }
}
