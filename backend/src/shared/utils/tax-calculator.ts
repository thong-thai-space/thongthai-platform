/**
 * Tax Calculator - Precision arithmetic for financial calculations
 * Prevents floating-point rounding errors when calculating taxes
 *
 * All amounts are in cents (integers) to avoid floating-point errors
 */

export class TaxCalculator {
  /**
   * Calculate tax amount with precision
   * @param subtotalInCents Subtotal in cents (e.g., 100 = $1.00)
   * @param taxRateAsDecimal Tax rate as decimal (e.g., 0.1 = 10%)
   * @returns Tax amount in cents
   */
  static calculateTax(subtotalInCents: number, taxRateAsDecimal: number): number {
    // Pattern: Precision - Use integer arithmetic to avoid floating-point errors
    // Formula: subtotal * rate, rounded to nearest cent
    const taxInCents = Math.round(subtotalInCents * taxRateAsDecimal);
    return taxInCents;
  }

  /**
   * Calculate total with tax
   * @param subtotalInCents Subtotal in cents
   * @param taxRateAsDecimal Tax rate as decimal
   * @param discountInCents Discount in cents (optional)
   * @returns Total in cents
   */
  static calculateTotal(
    subtotalInCents: number,
    taxRateAsDecimal: number,
    discountInCents: number = 0,
  ): number {
    const tax = this.calculateTax(subtotalInCents, taxRateAsDecimal);
    const total = subtotalInCents + tax - discountInCents;
    return Math.max(0, total); // Ensure no negative totals
  }

  /**
   * Convert dollars/VND to cents for calculation
   * @param amount Amount in dollars/VND
   * @returns Amount in cents
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert cents back to dollars/VND
   * @param amountInCents Amount in cents
   * @returns Amount in dollars/VND
   */
  static fromCents(amountInCents: number): number {
    return amountInCents / 100;
  }
}
