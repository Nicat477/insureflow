import { useState } from 'react'
import { useLocale } from '@/i18n/locale'
import type { Product } from './types'

const base = '/insurance-images/'
const products: Record<Product, string> = { Motor: 'motor.jpg', Property: 'property.jpg', Travel: 'travel.jpg', Health: 'health.png' }
const propertyFiles: Record<string, string> = { 'EML-101': 'caspian-residence.jpg', 'EML-102': 'park-view.jpg', 'EML-103': 'city-garden.jpg' }
const logoFiles: Record<string, string> = { Emlax: 'emlax-logo.png', 'Bitrix24 CRM': 'bitrix24-logo.png', '1C Finance': '1c-logo.svg' }

export function Photo({ file, fallback, alt = '', className = '' }: { file: string; fallback?: string; alt?: string; className?: string }) {
  return <PhotoContent key={file + ':' + (fallback || '')} file={file} fallback={fallback} alt={alt} className={className} />
}
function PhotoContent({ file, fallback, alt, className }: { file: string; fallback?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(0)
  const { t } = useLocale()
  const current = failed === 0 ? file : failed === 1 && fallback !== file ? fallback : undefined
  return <div className={'if-v6-photo ' + className}>
    {current ? <img key={current} src={base + current} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(n => n + 1)} /> : <span className="if-v6-photo-empty">{t('Photo unavailable')}</span>}
  </div>
}
export function ProductPhoto({ product }: { product: Product }) {
  const { t } = useLocale()
  return <Photo file={products[product]} alt={t(product)} className={'if-v6-product-photo ' + (product === 'Health' ? 'if-v6-health' : '')} />
}
export function PropertyPhoto({ id }: { id: string }) {
  return <Photo file={propertyFiles[id] || 'property.jpg'} fallback="property.jpg" className="if-v6-property-photo" />
}
export function IntegrationBrand({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="if-v6-brand" aria-label={name}>
    {!failed && logoFiles[name] ? <img src={base + logoFiles[name]} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <span>{name}</span>}
  </div>
}
export function WorkflowProgress({ crm, payment, status }: { crm: string; payment: string; status: string }) {
  const { t } = useLocale()
  const steps = [
    { title: 'Application created', done: true },
    { title: 'CRM synchronization', done: crm === 'Synced' },
    { title: 'Payment verification', done: payment === 'Matched' },
    { title: 'Policy issuance', done: status === 'Policy issued' },
  ]
  const count = steps.filter(s => s.done).length
  return <section className="if-v6-progress" aria-label={t('Application progress')}>
    <div className="if-v6-progress-heading"><strong>{t('Application progress')}</strong><span>{count} / {steps.length}</span></div>
    <progress max={steps.length} value={count} aria-label={t('Application progress')} />
    <ol>{steps.map((step, index) => <li key={step.title} data-done={step.done}><span aria-hidden="true">{step.done ? '✓' : index + 1}</span><div>{t(step.title)}<small>{t(step.done ? 'Completed' : 'Not completed')}</small></div></li>)}</ol>
  </section>
}
export function PolicyChart({ items }: { items: { name: string; count: number }[] }) {
  const { t } = useLocale()
  const total = items.reduce((n, item) => n + item.count, 0)
  const colors = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-4)']
  let offset = 0
  const stops = items.map((item, i) => { const from = offset; offset += total ? item.count / total * 100 : 0; return colors[i % colors.length] + ' ' + from + '% ' + offset + '%' })
  return <div className="if-v6-chart">
    <div className="if-v6-donut" style={{ background: total ? 'conic-gradient(' + stops.join(',') + ')' : 'var(--muted)' }} aria-hidden="true"><div><strong>{total}</strong><small>{t('Policies')}</small></div></div>
    <ul aria-label={t('Policy distribution')}>{items.map((item, i) => <li key={item.name}><span className="if-v6-chart-dot" style={{ background: colors[i % colors.length] }} /><span>{t(item.name)}</span><strong>{item.count}</strong><small>{total ? Math.round(item.count / total * 100) : 0}%</small></li>)}</ul>
  </div>
}
