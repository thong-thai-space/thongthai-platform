'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2, Plus, X } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { downloadQuotePdf, type QuoteItemInput } from '@/hooks/use-invoices';
import { extractApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';

const FIELD =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const EMPTY_ITEM: QuoteItemInput = { description: '', quantity: 1, unitPrice: 0 };

export default function QuotesPage() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const [validUntil, setValidUntil] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [discount, setDiscount] = useState('0');
  const [introNote, setIntroNote] = useState('');
  const [items, setItems] = useState<QuoteItemInput[]>([{ ...EMPTY_ITEM }]);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.quantity) * Number(it.unitPrice),
      0,
    );
    const disc = Number(discount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const tax = Math.round((taxable * (Number(taxRate) || 0)) / 100);
    return { subtotal, discount: disc, tax, total: taxable + tax };
  }, [items, discount, taxRate]);

  const setItem = (i: number, patch: Partial<QuoteItemInput>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    !!clientName.trim() &&
    items.length > 0 &&
    items.every((it) => it.description.trim() && Number(it.unitPrice) >= 0);

  const handleDownload = async () => {
    if (!canSubmit || busy) return;
    try {
      setBusy(true);
      await downloadQuotePdf({
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        currency,
        validUntil: validUntil || undefined,
        introNote: introNote.trim() || undefined,
        taxRate: Number(taxRate) || 0,
        discount: Number(discount) || 0,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });
    } catch (error) {
      alert(extractApiErrorMessage(error, 'Failed to generate quote PDF'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashboardHeader title="Quote builder" />
      <main className="flex-1 overflow-y-auto p-6">
        <Link
          href="/dashboard/invoices"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Invoices
        </Link>
        <p className="mb-6 text-sm text-muted-foreground">
          Build a pre-sale quote (báo giá) and download a branded PDF to send a
          prospect. Nothing is saved — it&apos;s a document, not an invoice.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <div className="space-y-5">
            <section className="space-y-3 rounded-lg border border-border p-4">
              <h2 className="text-sm font-semibold">Client</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={FIELD}
                  placeholder="Client name *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <input
                  className={FIELD}
                  placeholder="Email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                <input
                  className={FIELD}
                  placeholder="Phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <select
                    className={FIELD}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'VND' | 'USD')}
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="date"
                    className={FIELD}
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    title="Valid until"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border p-4">
              <h2 className="text-sm font-semibold">Line items</h2>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${FIELD} flex-1`}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    className={`${FIELD} w-20`}
                    value={item.quantity}
                    onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    min={0}
                    className={`${FIELD} w-32`}
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </section>

            <section className="space-y-3 rounded-lg border border-border p-4">
              <h2 className="text-sm font-semibold">Terms</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  Tax %
                  <input
                    type="number"
                    min={0}
                    className={FIELD}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Discount ({currency})
                  <input
                    type="number"
                    min={0}
                    className={FIELD}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </label>
              </div>
              <textarea
                className={FIELD}
                rows={3}
                placeholder="Intro note shown on the quote (optional)"
                value={introNote}
                onChange={(e) => setIntroNote(e.target.value)}
              />
            </section>
          </div>

          {/* Live summary */}
          <aside className="h-fit space-y-3 rounded-lg border border-border p-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(totals.subtotal, currency)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Discount</dt>
                  <dd>- {formatCurrency(totals.discount, currency)}</dd>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Tax</dt>
                  <dd>{formatCurrency(totals.tax, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(totals.total, currency)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canSubmit || busy}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Download quote PDF
            </button>
          </aside>
        </div>
      </main>
    </>
  );
}
