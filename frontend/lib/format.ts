/**
 * Deterministic number formatting using en-US locale
 * Guarantees 100% identical output on both SSR (Node.js) and Client (any browser locale).
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}
