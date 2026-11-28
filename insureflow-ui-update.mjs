// Run from the InsureFlow project root. No dependencies or GitHub writes.
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const src = 'frontend/src/';
const pending = new Map();
const get = p => fs.readFileSync(path.join(root,p),'utf8');
const set = (p, value) => pending.set(p,value);
const replace = (s, re, value, label) => {
  if (!re.test(s)) throw new Error('Expected code not found: '+label);
  return s.replace(re,value);
};
const cssMarker = '/* InsureFlow About and workspace icons */';
const routeMarker = '// InsureFlow About workspace';
const route = src+'routes/_authenticated/about.tsx';
try {
  const sidebar = src+'components/layout/data/sidebar-data.ts';
  let s = get(sidebar);
  if (!s.includes("url: '/about'")) {
    s = replace(s,/\bLayoutDashboard,/, 'Info,\n  LayoutDashboard,','sidebar icon imports');
    s = replace(s,/(items:\s*\[\s*)(\{ title: 'Dashboard')/,"$1{ title: 'About us', url: '/about', icon: Info },\n        $2",'first sidebar item');
    set(sidebar,s);
  }
  const lang = src+'i18n/messages.ts';
  let messages = get(lang);
  const entries = {
    'About us':'Haqqımızda',
    'Discover a simpler way to manage insurance.':'Sığortanı idarə etməyin daha sadə yolu ilə tanış olun.',
    'Insurance, made simpler.':'Sığorta daha sadə, daha əlçatan.',
    'InsureFlow brings insurance quotes, policy management, claims and payment tracking together in one digital workspace.':'InsureFlow sığorta haqqının hesablanmasını, polislərin idarə edilməsini, hadisə müraciətlərini və ödənişlərin izlənilməsini vahid rəqəmsal platformada birləşdirir.',
    'Explore insurance':'Sığorta bölməsinə keç',
    'Our insurance categories':'Sığorta növlərimiz',
    'Explore the illustrative premium calculator for each category.':'Hər sığorta növü üçün nümunəvi sığorta haqqını kalkulyatorda hesablayın.',
    'Motor insurance':'Avtomobil sığortası',
    'Estimate the cost of coverage for your vehicle.':'Avtomobiliniz üçün sığorta haqqını təxmini hesablayın.',
    'Property insurance':'Əmlak sığortası',
    'Calculate a premium or create an application from an available Emlax reservation.':'Sığorta haqqını hesablayın və ya Emlax-da rezerv edilmiş əmlak üzrə müraciət yaradın.',
    'Travel insurance':'Səfər sığortası',
    'Explore illustrative insurance pricing for your next trip.':'Növbəti səfəriniz üçün nümunəvi sığorta qiymətini hesablayın.',
    'Health insurance':'Sağlamlıq sığortası',
    'Estimate the cost of health insurance coverage.':'Sağlamlıq sığortası üzrə təxmini sığorta haqqını hesablayın.',
    'Our mission':'Missiyamız',
    'Make insurance workflows understandable, accessible and easier to manage through technology.':'Texnologiya vasitəsilə sığorta əməliyyatlarını daha anlaşılan, əlçatan və rahat idarə olunan etmək.',
    'Our approach':'Yanaşmamız',
    'Clarity':'Aydınlıq',
    'Clear information, straightforward steps and visible application statuses.':'Aydın məlumatlar, sadə addımlar və izlənilə bilən müraciət statusları.',
    'Digital convenience':'Rəqəmsal rahatlıq',
    'Quotes, applications, policies and claims in a single workspace.':'Sığorta təklifləri, müraciətlər, polislər və hadisələr vahid iş sahəsində.',
    'Connected operations':'Əlaqələndirilmiş əməliyyatlar',
    'Explore simulated Emlax, Bitrix24 and 1C integration workflows.':'Emlax, Bitrix24 və 1C sistemlərinin demo inteqrasiya prosesləri ilə tanış olun.',
    'How InsureFlow works':'InsureFlow necə işləyir?',
    'Calculate a quote':'Sığorta haqqını hesabla',
    'Create a property application':'Əmlak sığortası müraciəti yarat',
    'Match the demo payment and issue a policy':'Demo ödənişi yoxla və polisi rəsmiləşdir',
    'Track policies and claims':'Polisləri və hadisə müraciətlərini izlə',
    'Independent portfolio project':'Müstəqil portfel layihəsi',
    'InsureFlow is an independent insurance technology demonstration, not a licensed insurer or an official PAŞA Sığorta product. Prices, policies, payments and integrations are simulated. Do not enter real personal or financial information.':'InsureFlow müstəqil sığorta texnologiyaları demo layihəsidir; lisenziyalı sığorta şirkəti və ya PAŞA Sığortanın rəsmi məhsulu deyil. Qiymətlər, polislər, ödənişlər və inteqrasiyalar simulyasiya olunur. Real şəxsi və maliyyə məlumatlarını daxil etməyin.',
  };
  const missing = Object.entries(entries).filter(([key])=>!messages.includes(JSON.stringify(key)+':')&&!messages.includes("'"+key+"':"));
  if (missing.length) {
    messages = replace(messages,/export const azMessages:\s*Record<string,\s*string>\s*=\s*\{/,m=>m+'\n'+missing.map(([k,v])=>'  '+JSON.stringify(k)+': '+JSON.stringify(v)+',').join('\n'),'translation dictionary');
    set(lang,messages);
  }
  const appSidebar = src+'components/layout/app-sidebar.tsx';
  let a = get(appSidebar);
  if (!a.includes('if-workspace-nav')) a = replace(a,/<SidebarContent>/,'<SidebarContent className="if-workspace-nav">','workspace container');
  // Preserve the previously requested concise demo labels, if not yet applied.
  a = a.replace(/\s*<p\b[^>]*>\s*\{t\(["']Fictional records only["']\)\}\s*<\/p>/g,'');
  if (a !== get(appSidebar)) set(appSidebar,a);
  const shell = src+'features/insurance/PageShell.tsx';
  let sh = get(shell).replace(/\{t\(["']Demo · fictional data only["']\)\}/g,'Demo');
  if (sh !== get(shell)) set(shell,sh);
  const theme = src+'styles/theme.css';
  let th = get(theme);
  const dark = `/* InsureFlow Corporate Theme — Dark Mode */
.dark {
  --background: #0b1018;
  --foreground: #e9eff8;
  --card: #111923;
  --card-foreground: #e9eff8;
  --popover: #192331;
  --popover-foreground: #e9eff8;
  --primary: #22d3ee;
  --primary-foreground: #083344;
  --secondary: #173140;
  --secondary-foreground: #c4f1fa;
  --muted: #1b2533;
  --muted-foreground: #a5b4c7;
  --accent: #173140;
  --accent-foreground: #67e8f9;
  --destructive: #f87171;
  --border: #2b3747;
  --input: #435366;
  --ring: #22d3ee;
  --chart-1: #22d3ee;
  --chart-2: #38bdf8;
  --chart-3: #818cf8;
  --chart-4: #a5f3fc;
  --chart-5: #94a3b8;
  --sidebar: #111923;
  --sidebar-foreground: #e9eff8;
  --sidebar-primary: #22d3ee;
  --sidebar-primary-foreground: #083344;
  --sidebar-accent: #173140;
  --sidebar-accent-foreground: #67e8f9;
  --sidebar-border: #2b3747;
  --sidebar-ring: #22d3ee;
}`;
  th = replace(th,/\/\* InsureFlow Corporate Theme — Dark Mode \*\/\s*\.dark\s*\{[^}]*\}/,dark,'corporate dark theme');
  if (th !== get(theme)) set(theme,th);
  const css = src+'features/insurance/insurance.css';
  let cs = get(css);
  if (!cs.includes(cssMarker)) {
    cs += '\n'+cssMarker+`
.if-workspace-nav [data-sidebar='menu-button'] > svg { width: 20px; height: 20px; flex-shrink: 0; }
.if-workspace-nav [data-sidebar='menu-button'] { min-height: 38px; gap: 10px; }
[data-collapsible='icon'] .if-workspace-nav [data-sidebar='menu-button'] { min-height: 32px; padding: 6px !important; }
.if-about-hero { position: relative; overflow: hidden; border: 1px solid var(--border); border-radius: 20px; padding: clamp(22px, 4vw, 52px); background: linear-gradient(120deg, var(--card) 35%, var(--accent)); display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; }
.if-about-hero h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 750; letter-spacing: -.04em; line-height: 1.12; margin: 12px 0; }
.if-about-hero p:not(.if-eyebrow) { max-width: 660px; font-size: 15px; line-height: 1.7; color: var(--muted-foreground); margin-bottom: 22px; }
.if-about-symbol { display: grid; place-items: center; width: clamp(90px, 15vw, 180px); aspect-ratio: 1; border-radius: 32px; color: var(--primary); background: var(--card); border: 1px solid var(--border); }
.if-about-symbol svg { width: 48%; height: 48%; }
.if-about-services { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,220px),1fr)); gap: 14px; }
.if-about-service { display: flex; flex-direction: column; gap: 10px; }
.if-about-service p { flex: 1; line-height: 1.6; }
.if-about-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: var(--accent); color: var(--primary); }
.if-about-section h2 { font-size: 21px; font-weight: 700; margin-bottom: 8px; }
.if-about-section > .if-muted { margin-bottom: 15px; }
.if-about-steps { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,200px),1fr)); gap: 12px; }
.if-about-steps a { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--card); font-size: 14px; font-weight: 600; }
.if-about-steps a:hover { background: var(--accent); color: var(--accent-foreground); }
.if-about-step-number { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: var(--primary-foreground); }
.dark .if-page [data-slot='button']:not([class*='bg-destructive'])[class*='border'] { color: #67e8f9; border-color: #36596a; }
.dark .if-panel { box-shadow: 0 2px 7px #0002; }
@media(max-width: 600px) { .if-about-hero { grid-template-columns: 1fr; } .if-about-symbol { display: none; } }
`;
    set(css,cs);
  }
  const page = `// InsureFlow About workspace
import { createFileRoute, Link } from '@tanstack/react-router'
import { Car, House, Plane, HeartPulse, ShieldCheck, ArrowRight, CheckCircle2, Monitor, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/features/insurance/PageShell'
import { Heading, Panel } from '@/features/insurance/ui'
import { useLocale } from '@/i18n/locale'

const categories = [
  { icon: Car, title: 'Motor insurance', description: 'Estimate the cost of coverage for your vehicle.' },
  { icon: House, title: 'Property insurance', description: 'Calculate a premium or create an application from an available Emlax reservation.' },
  { icon: Plane, title: 'Travel insurance', description: 'Explore illustrative insurance pricing for your next trip.' },
  { icon: HeartPulse, title: 'Health insurance', description: 'Estimate the cost of health insurance coverage.' },
] as const
const values = [
  { icon: CheckCircle2, title: 'Clarity', description: 'Clear information, straightforward steps and visible application statuses.' },
  { icon: Monitor, title: 'Digital convenience', description: 'Quotes, applications, policies and claims in a single workspace.' },
  { icon: Network, title: 'Connected operations', description: 'Explore simulated Emlax, Bitrix24 and 1C integration workflows.' },
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
      <section className="if-about-hero">
        <div>
          <p className="if-eyebrow">INSUREFLOW</p>
          <h2>{t('Insurance, made simpler.')}</h2>
          <p>{t('InsureFlow brings insurance quotes, policy management, claims and payment tracking together in one digital workspace.')}</p>
          <div className="if-actions">
            <Button asChild><Link to="/policies">{t('Explore insurance')}<ArrowRight /></Link></Button>
            <Button asChild variant="outline"><Link to="/calculator">{t('Calculate premium')}</Link></Button>
          </div>
        </div>
        <div className="if-about-symbol" aria-hidden="true"><ShieldCheck /></div>
      </section>
      <section className="if-about-section">
        <h2>{t('Our insurance categories')}</h2>
        <p className="if-muted">{t('Explore the illustrative premium calculator for each category.')}</p>
        <div className="if-about-services">
          {categories.map(({ icon: Icon, title, description }) => (
            <article className="if-panel if-about-service" key={title}>
              <span className="if-about-icon"><Icon size={23} aria-hidden="true" /></span>
              <h3 className="font-semibold">{t(title)}</h3>
              <p className="if-muted">{t(description)}</p>
              <Button asChild variant="outline"><Link to="/calculator">{t('Calculate premium')}<ArrowRight /></Link></Button>
              {title === 'Property insurance' && <Button asChild variant="outline"><Link to="/applications">{t('Create application')}</Link></Button>}
            </article>
          ))}
        </div>
      </section>
      <Panel title="Our mission"><p className="if-muted leading-relaxed">{t('Make insurance workflows understandable, accessible and easier to manage through technology.')}</p></Panel>
      <section className="if-about-section">
        <h2>{t('Our approach')}</h2>
        <div className="if-grid">
          {values.map(({ icon: Icon, title, description }) => (
            <article className="if-panel if-about-service" key={title}>
              <span className="if-about-icon"><Icon size={23} aria-hidden="true" /></span>
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
`;
  if (!fs.existsSync(path.join(root,route))) set(route,page);
  else if (!get(route).includes(routeMarker)) throw new Error('Existing About route was not modified: '+route);
  if (process.argv.includes('--dry-run')) { console.log('Dry run — files to update:', [...pending.keys()].join('\n')); process.exit(0); }
  if (!pending.size) { console.log('All updates are already applied.'); process.exit(0); }
  for (const [p,content] of pending) { fs.writeFileSync(path.join(root,p),content,'utf8'); console.log('Updated '+p); }
  console.log('Done. Run pnpm.cmd run dev in frontend to regenerate routeTree.gen.ts. Then run pnpm.cmd run build.');
} catch (err) { console.error(err.message); process.exitCode=1; }
