import { describe, expect, it } from 'vitest'
import { translate, translateError, formatMoney, formatDate } from './messages'
describe('InsureFlow localization', () => {
  it('translates labels and status values without mutating the original', () => {
    const status = 'Awaiting payment'
    expect(translate('az', status)).toBe('Ödəniş gözlənilir')
    expect(translate('en', status)).toBe(status)
    expect(translate('az', 'POL-123')).toBe('POL-123')
  })
  it('localizes known backend errors and handles unknown ones', () => {
    expect(translateError('az', 'Customer already exists.')).toBe('Bu müştəri artıq mövcuddur.')
    expect(translateError('az', 'unexpected')).toBe('Xəta baş verdi. Yenidən cəhd edin.')
    expect(translateError('en', 'unexpected')).toBe('unexpected')
  })
  it('formats currency and date consistently with the selected language', () => {
    expect(formatMoney('az', 1080)).toBe(new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', maximumFractionDigits: 2 }).format(1080))
    expect(formatDate('en', '2026-11-28')).toBe('28 Nov 2026')
    expect(formatDate('az', 'unknown')).toBe('unknown')
  })
})
