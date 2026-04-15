export function centsToCurrency(amountCents: number, currency = 'USD', locale = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US') {
  const amount = amountCents / 100
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function parseCurrencyToCents(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)
  if (Number.isNaN(num)) return 0
  return Math.round(num * 100)
}
