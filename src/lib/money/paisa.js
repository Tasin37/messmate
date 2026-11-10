/**
 * Money utilities using integer minor units (paisa)
 * 1 BDT = 100 paisa
 * Prevents JavaScript floating-point inaccuracy.
 */

export function toPaisa(amount) {
  if (typeof amount === 'bigint') return amount;
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new TypeError('Amount must be finite');
    return BigInt(Math.round(amount * 100));
  }
  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (!trimmed) return 0n;
    const isNegative = trimmed.startsWith('-');
    const cleanStr = isNegative ? trimmed.slice(1) : trimmed;
    const parts = cleanStr.split('.');
    if (parts.length > 2) throw new Error(`Invalid decimal amount: ${amount}`);
    const whole = BigInt(parts[0] || '0');
    const fracStr = (parts[1] || '').padEnd(2, '0').slice(0, 2);
    const fraction = BigInt(fracStr);
    const total = whole * 100n + fraction;
    return isNegative ? -total : total;
  }
  throw new TypeError(`Cannot convert ${typeof amount} to paisa`);
}

export function fromPaisa(paisa) {
  const bigPaisa = typeof paisa === 'bigint' ? paisa : BigInt(paisa);
  const isNegative = bigPaisa < 0n;
  const absPaisa = isNegative ? -bigPaisa : bigPaisa;
  const whole = absPaisa / 100n;
  const fraction = absPaisa % 100n;
  const fracStr = fraction.toString().padStart(2, '0');
  const formatted = `${whole.toString()}.${fracStr}`;
  return isNegative ? `-${formatted}` : formatted;
}

export function formatBDT(amount, locale = 'en-BD') {
  const paisa = toPaisa(amount);
  const num = Number(paisa) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
