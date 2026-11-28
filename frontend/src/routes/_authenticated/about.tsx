// InsureFlow About workspace
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/features/insurance/PageShell'
import { Heading, Panel } from '@/features/insurance/ui'
import { Photo } from '@/features/insurance/Visuals'
import { useLocale } from '@/i18n/locale'

const categories = [
  { image: '/insurance-images/motor.jpg', title: 'Motor insurance', description: 'Estimate the cost of coverage for your vehicle.' },
  { image: '/insurance-images/property.jpg', title: 'Property insurance', description: 'Calculate a premium or create an application from an available Emlax reservation.' },
  { image: '/insurance-images/travel.jpg', title: 'Travel insurance', description: 'Explore illustrative insurance pricing for your next trip.' },
  { image: '/insurance-images/health.png', title: 'Health insurance', description: 'Estimate the cost of health insurance coverage.' },
] as const
const values = [
  { title: 'Clarity', description: 'Clear information, straightforward steps and visible application statuses.' },
  { title: 'Digital convenience', description: 'Quotes, applications, policies and claims in a single workspace.' },
  { title: 'Connected operations', description: 'Explore simulated Emlax, Bitrix24 and 1C integration workflows.' },
] as const
const steps = [
  { title: 'Calculate a quote', to: '/calculator' },
  { title: 'Create a property application', to: '/applications' },
  { title: 'Match the demo payment and issue a policy', to: '/applications' },
  { title: 'Track policies and claims', to: '/policies' },
] as const
function AboutPage() {
  const { t } = useLocale()
  return (
    <PageShell>
      <Heading title="About us" description="Discover a simpler way to manage insurance." />
      <section className="if-about-hero if-v6-about-hero">
        <div>
          <p className="if-eyebrow">INSUREFLOW</p>
          <h2>{t('Insurance, made simpler.')}</h2>
          <p>{t('InsureFlow brings insurance quotes, policy management, claims and payment tracking together in one digital workspace.')}</p>
          <div className="if-actions">
            <Button asChild><Link to="/policies">{t('Explore insurance')}<ArrowRight /></Link></Button>
            <Button asChild variant="outline"><Link to="/calculator">{t('Calculate premium')}</Link></Button>
          </div>
        </div>
        <div><Photo file="about-banner.jpg" fallback="baku-dashboard.jpg" /><p className="if-muted mt-2">{t('Illustrative photo')}</p></div>
      </section>
      <section className="if-about-section">
        <h2>{t('Our insurance categories')}</h2>
        <p className="if-muted">{t('Explore the illustrative premium calculator for each category.')}</p>
        <div className="if-about-services">
          {categories.map(({ image, title, description }) => (
            <article className="if-panel if-about-service" key={title}>
              <img className="if-about-photo" src={image} alt="" width={480} height={180} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none' }} />
              <h3 className="font-semibold">{t(title)}</h3>
              <p className="if-muted">{t(description)}</p>
              <Button asChild variant="outline"><Link to="/calculator">{t('Calculate premium')}<ArrowRight /></Link></Button>
              {title === 'Property insurance' && <Button asChild variant="outline"><Link to="/applications">{t('Create application')}</Link></Button>}
            </article>
          ))}
        </div>
      </section>
      <section className="if-v6-editorial if-panel"><div><h2>{t('Our mission')}</h2><p className="if-muted">{t('Make insurance workflows understandable, accessible and easier to manage through technology.')}</p></div><Photo file="about-mission.jpg" fallback="property.jpg" /></section>
      <section className="if-v6-editorial if-panel"><Photo file="about-vision.jpg" fallback="travel.jpg" /><div><h2>{t('Our vision')}</h2><p className="if-muted">{t('A transparent digital experience for every insurance operation.')}</p></div></section>
      <section className="if-about-section">
        <h2>{t('Our approach')}</h2>
        <div className="if-grid">
          {values.map(({ title, description }) => (
            <article className="if-panel if-about-service" key={title}>
              <h3 className="font-semibold">{t(title)}</h3>
              <p className="if-muted">{t(description)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="if-about-section">
        <h2>{t('How InsureFlow works')}</h2>
        <div className="if-about-steps">
          {steps.map((step, index) => <Link key={step.title} to={step.to}><span className="if-about-step-number">{index+1}</span>{t(step.title)}</Link>)}
        </div>
      </section>
      <Panel title="Independent portfolio project"><p className="if-muted leading-relaxed">{t('InsureFlow is an independent insurance technology demonstration, not a licensed insurer or an official PAŞA Sığorta product. Prices, policies, payments and integrations are simulated. Do not enter real personal or financial information.')}</p></Panel>
    </PageShell>
  )
}
export const Route = createFileRoute('/_authenticated/about')({ component: AboutPage })
