import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
const root=process.cwd(), dry=process.argv.includes('--dry-run'), offline=process.argv.includes('--offline'), assetsOnly=process.argv.includes('--assets-only')
const prefix='frontend/src/', imgDir='frontend/public/insurance-images/'
const staged=new Map()
const exists=p=>fs.existsSync(path.join(root,p))
const read=p=>fs.readFileSync(path.join(root,p),'utf8')
const put=(p,s)=>{ if(!exists(p)||read(p)!==s) staged.set(p,s) }
const change=(s,regex,value,label)=>{ if(!regex.test(s)) throw Error('Expected code not found: '+label+' — no source files changed.'); return s.replace(regex,value) }
function within(s,start,end,fn){ const a=s.indexOf(start), b=s.indexOf(end,a+start.length); if(a<0||b<0) throw Error('Missing section: '+start); return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b) }
const marker='/* InsureFlow Visual v6 */'
const translations = {
  'Photo unavailable':['Şəkil mövcud deyil','Фото недоступно'],
  'Illustrative photo':['Nümunəvi fotoşəkil','Иллюстративное фото'],
  'Grid view':['Kart görünüşü','Карточки'],
  'Table view':['Cədvəl görünüşü','Таблица'],
  'Property view':['Əmlak görünüşü','Вид объектов'],
  'Application already created':['Müraciət artıq yaradılıb','Заявка уже создана'],
  'Application created':['Müraciət yaradılıb','Заявка создана'],
  'CRM synchronization':['CRM sinxronizasiyası','Синхронизация CRM'],
  'Payment verification':['Ödənişin yoxlanması','Проверка платежа'],
  'Policy issuance':['Polisin rəsmiləşdirilməsi','Оформление полиса'],
  'Application progress':['Müraciətin gedişatı','Ход заявки'],
  'Completed':['Tamamlanıb','Завершено'],
  'Not completed':['Tamamlanmayıb','Не завершено'],
  'Our vision':['Vizyonumuz','Наше видение'],
  'A transparent digital experience for every insurance operation.':['Hər sığorta əməliyyatı üçün şəffaf rəqəmsal təcrübə.','Прозрачный цифровой опыт для каждой страховой операции.'],
  'Baku skyline dashboard banner':['Bakı panoraması','Панорама Баку'],
  'Digital insurance portal':['Rəqəmsal sığorta platforması','Цифровая страховая платформа'],
  'Quotes, policies, claims and payments from a single workspace.':['Təkliflər, polislər, hadisə müraciətləri və ödənişlər vahid iş sahəsində.','Расчёты, полисы, страховые случаи и платежи в единой рабочей среде.'],
  'Insurance, made simpler.':['Sığorta daha sadə, daha əlçatan.','Страхование стало проще.'],
}
// Source modifications are staged before writing. No dependencies are installed, no Git command is run.
function stageSource(){
 const p=prefix+'features/insurance/Operations.tsx';let op=read(p)
 if(!op.includes("from './Visuals'")){
  op=change(op,/import \{ useState \} from 'react'/,"import { useState } from 'react'\nimport { ProductPhoto, PropertyPhoto, IntegrationBrand, WorkflowProgress } from './Visuals'",'visual imports')
  op=within(op,'function Calculator()','function Properties()',s=>change(s,/<Panel title="Estimated premium">/,'<Panel title="Estimated premium">\n        <ProductPhoto product={type} />','calculator photo'))
  op=within(op,'function Properties()','function Applications()',s=>{
   s=change(s,/const q = useData\('integrations', integrations.load\)/,"const q = useData('integrations', integrations.load)\n  const [view, setView] = useState<'grid' | 'table'>('grid')",'property view state')
   s=change(s,/<Table\s+headers=\{\['Property', 'Customer', 'Value', 'Status'\]\}[\s\S]*?\/>(?=\s*<Button asChild className="mt-4">)/,m=>`<div className="if-v6-view-switch" role="group" aria-label={t('Property view')}>
            <Button type="button" variant={view === 'grid' ? 'default' : 'outline'} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>{t('Grid view')}</Button>
            <Button type="button" variant={view === 'table' ? 'default' : 'outline'} aria-pressed={view === 'table'} onClick={() => setView('table')}>{t('Table view')}</Button>
          </div>
          {view === 'grid' ? (
            q.data.properties.length ? <div className="if-v6-property-grid">
              {q.data.properties.map(p => {
                const existing = q.data?.applications.some(x => x.propertyId === p.id)
                return <article className="if-v6-property-card" key={p.id}>
                  <PropertyPhoto id={p.id} />
                  <p className="if-muted">{t('Illustrative photo')}</p>
                  <div className="flex flex-wrap justify-between gap-2"><h3>{p.unit}</h3><Status value={p.status} /></div>
                  <p className="if-muted">{p.id} · {p.customer}</p>
                  <strong className="if-v6-property-value">{money(p.value)}</strong>
                  <div className="if-actions">
                    {p.status === 'Reserved' && !existing ? <Button asChild><Link to="/applications" hash={'property-' + p.id}>{t('Create application')}</Link></Button> : existing ? <span className="if-muted">{t('Application already created')}</span> : <span className="if-muted">{t('Available')}</span>}
                  </div>
                </article>
              })}
            </div> : <p className="if-empty">{t('No records found.')}</p>
          ) : (${m})}`,'property grid/table')
   return s
  })
  op=within(op,'function Applications()','export function Claims()',s=>{
   s=change(s,/\[property, setProperty\] = useState\(''\)/,"[property, setProperty] = useState(() => window.location.hash.startsWith('#property-') ? window.location.hash.slice(10) : '')",'property selection')
   s=change(s,/<div className="if-card-list">/,'<WorkflowProgress crm={a.crm} payment={a.payment} status={a.status} />\n              <div className="if-card-list">','workflow stepper')
   // Hash preselection is only actionable if it matches a currently available reservation.
   s=s.replace('disabled={!property || create.isPending}', 'disabled={!available.some(p => p.id === property) || create.isPending}')
   return s
  })
  op=within(op,'export function Customers()','const insuranceTabs',s=>s.replace('cells: [c.name, c.email',`cells: [<span className="if-v6-customer"><span aria-hidden="true" className="if-v6-avatar">{c.name.trim().split(/\\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('')}</span>{c.name}</span>, c.email`))
  op=change(op,/<Panel key=\{s.name\} title=\{s.name\}>/,'<Panel key={s.name} title={s.name}>\n            <IntegrationBrand name={s.name} />','integration brand')
  put(p,op)
 }
 const d=prefix+'features/insurance/InsuranceOverview.tsx';let dashboard=read(d)
 if(!dashboard.includes("from './Visuals'")){
  dashboard=change(dashboard,/import \{ products \} from '\.\/types'/,"import { products } from './types'\nimport { PolicyChart } from './Visuals'",'chart import')
  dashboard=change(dashboard,/\{products\.map\(\(p\) => \{[\s\S]*?\}\)\}(?=\s*<\/Panel>)/,"<PolicyChart items={products.map(name => ({ name, count: data.filter(p => p.type === name).length }))} />",'live dashboard chart')
  put(d,dashboard)
 }
 const u=prefix+'features/insurance/ui.tsx';let ui=read(u)
 if(!ui.includes('if-v6-skeleton')){
  if(!ui.includes("import { Link } from '@tanstack/react-router'")) ui="import { Link } from '@tanstack/react-router'\n"+ui
  if(ui.includes('if-dashboard-hero')){
   ui=change(ui,/<p>\{t\(['"]Quotes, policies, claims and payments from a single workspace\.['"]\)\}<\/p>/,m=>m+`\n            <div className="if-actions"><Button asChild><Link to="/applications">{t('New application')}</Link></Button></div>`,'dashboard banner action')
  } else {
   ui=change(ui,/return \(\s*<header className="if-heading">/,`return (\n    <>\n    {title === 'Dashboard' && <section className="if-dashboard-hero" aria-label={t('Baku skyline dashboard banner')}><div className="if-dashboard-hero__overlay"><span className="if-dashboard-hero__eyebrow">{t('Digital insurance portal')}</span><h2>{t('Insurance, made simpler.')}</h2><p>{t('Quotes, policies, claims and payments from a single workspace.')}</p><div className="if-actions"><Button asChild><Link to="/applications">{t('New application')}</Link></Button></div></div></section>}\n    <header className="if-heading">`,'dashboard hero')
   ui=change(ui,/<\/header>\s*\)\s*\n}/,'</header>\n    </>\n  )\n}','dashboard fragment')
  }
  ui=change(ui,/<p role="status" className="if-empty">\{t\(['"]Loading records…['"]\)\}<\/p>/,`<div className="if-v6-skeleton" role="status" aria-label={t('Loading records…')}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><p className="sr-only">{t('Loading records…')}</p></div>`,'skeleton loading')
  put(u,ui)
 }
 const a=prefix+'routes/_authenticated/about.tsx';let about=read(a)
 if(!about.includes('if-v6-editorial')){
  // Preserve existing v3/v4 copy and routes, add image layout to the actual About page.
  if(!about.includes('if-about-photo')) throw Error('About photo-card update not found. This v6 expects your existing v3/v4 local project.')
  about=change(about,/import \{ Heading, Panel \} from '@\/features\/insurance\/ui'/,"import { Heading, Panel } from '@/features/insurance/ui'\nimport { Photo } from '@/features/insurance/Visuals'",'about photo import')
  about=change(about,/<section className="if-about-hero">/,'<section className="if-about-hero if-v6-about-hero">','about hero')
  about=change(about,/<\/div>\s*<\/section>(?=\s*<section className="if-about-section">)/,`</div>\n        <div><Photo file="about-banner.jpg" fallback="baku-dashboard.jpg" /><p className="if-muted mt-2">{t('Illustrative photo')}</p></div>\n      </section>`,'about banner')
  about=change(about,/<Panel title="Our mission"><p className="if-muted leading-relaxed">([\s\S]*?)<\/p><\/Panel>/,`<section className="if-v6-editorial if-panel"><div><h2>{t('Our mission')}</h2><p className="if-muted">$1</p></div><Photo file="about-mission.jpg" fallback="property.jpg" /></section>\n      <section className="if-v6-editorial if-panel"><Photo file="about-vision.jpg" fallback="travel.jpg" /><div><h2>{t('Our vision')}</h2><p className="if-muted">{t('A transparent digital experience for every insurance operation.')}</p></div></section>`,'about editorial')
  put(a,about)
 }
 const mp=prefix+'i18n/messages.ts';let msg=read(mp)
 for(const [lang,i] of [['az',0],['ru',1]]){
  const start=new RegExp('export const '+lang+'Messages:\\s*Record<string,\\s*string>\\s*=\\s*\\{').exec(msg)
  if(!start) throw Error('Missing '+lang+' dictionary; v4 localization is required.')
  const at=start.index+start[0].length,end=msg.indexOf('\n}',at)
  if(end<0) throw Error('Dictionary ending missing: '+lang)
  const body=msg.slice(at,end)
  const entries=Object.entries(translations).filter(([k])=>!body.includes(JSON.stringify(k)+':')&&!body.includes("'"+k+"':")).map(([k,v])=>'  '+JSON.stringify(k)+': '+JSON.stringify(v[i])+',').join('\n')
  if(entries)msg=msg.slice(0,at)+'\n'+entries+msg.slice(at)
 }
 put(mp,msg)
 const css=prefix+'features/insurance/insurance.css';let style=read(css)
 if(!style.includes(marker))put(css,style+'\n'+cssText+'\n')
 put(prefix+'features/insurance/Visuals.tsx',visualText)
}

const visualText="import { useState } from 'react'\nimport { useLocale } from '@/i18n/locale'\nimport type { Product } from './types'\n\nconst base = '/insurance-images/'\nconst products: Record<Product, string> = { Motor: 'motor.jpg', Property: 'property.jpg', Travel: 'travel.jpg', Health: 'health.png' }\nconst propertyFiles: Record<string, string> = { 'EML-101': 'caspian-residence.jpg', 'EML-102': 'park-view.jpg', 'EML-103': 'city-garden.jpg' }\nconst logoFiles: Record<string, string> = { Emlax: 'emlax-logo.png', 'Bitrix24 CRM': 'bitrix24-logo.png', '1C Finance': '1c-logo.svg' }\n\nexport function Photo({ file, fallback, alt = '', className = '' }: { file: string; fallback?: string; alt?: string; className?: string }) {\n  return <PhotoContent key={file + ':' + (fallback || '')} file={file} fallback={fallback} alt={alt} className={className} />\n}\nfunction PhotoContent({ file, fallback, alt, className }: { file: string; fallback?: string; alt: string; className: string }) {\n  const [failed, setFailed] = useState(0)\n  const { t } = useLocale()\n  const current = failed === 0 ? file : failed === 1 && fallback !== file ? fallback : undefined\n  return <div className={'if-v6-photo ' + className}>\n    {current ? <img key={current} src={base + current} alt={alt} loading=\"lazy\" decoding=\"async\" onError={() => setFailed(n => n + 1)} /> : <span className=\"if-v6-photo-empty\">{t('Photo unavailable')}</span>}\n  </div>\n}\nexport function ProductPhoto({ product }: { product: Product }) {\n  const { t } = useLocale()\n  return <Photo file={products[product]} alt={t(product)} className={'if-v6-product-photo ' + (product === 'Health' ? 'if-v6-health' : '')} />\n}\nexport function PropertyPhoto({ id }: { id: string }) {\n  return <Photo file={propertyFiles[id] || 'property.jpg'} fallback=\"property.jpg\" className=\"if-v6-property-photo\" />\n}\nexport function IntegrationBrand({ name }: { name: string }) {\n  const [failed, setFailed] = useState(false)\n  return <div className=\"if-v6-brand\" aria-label={name}>\n    {!failed && logoFiles[name] ? <img src={base + logoFiles[name]} alt={name} loading=\"lazy\" onError={() => setFailed(true)} /> : <span>{name}</span>}\n  </div>\n}\nexport function WorkflowProgress({ crm, payment, status }: { crm: string; payment: string; status: string }) {\n  const { t } = useLocale()\n  const steps = [\n    { title: 'Application created', done: true },\n    { title: 'CRM synchronization', done: crm === 'Synced' },\n    { title: 'Payment verification', done: payment === 'Matched' },\n    { title: 'Policy issuance', done: status === 'Policy issued' },\n  ]\n  const count = steps.filter(s => s.done).length\n  return <section className=\"if-v6-progress\" aria-label={t('Application progress')}>\n    <div className=\"if-v6-progress-heading\"><strong>{t('Application progress')}</strong><span>{count} / {steps.length}</span></div>\n    <progress max={steps.length} value={count} aria-label={t('Application progress')} />\n    <ol>{steps.map((step, index) => <li key={step.title} data-done={step.done}><span aria-hidden=\"true\">{step.done ? '✓' : index + 1}</span><div>{t(step.title)}<small>{t(step.done ? 'Completed' : 'Not completed')}</small></div></li>)}</ol>\n  </section>\n}\nexport function PolicyChart({ items }: { items: { name: string; count: number }[] }) {\n  const { t } = useLocale()\n  const total = items.reduce((n, item) => n + item.count, 0)\n  const colors = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-4)']\n  let offset = 0\n  const stops = items.map((item, i) => { const from = offset; offset += total ? item.count / total * 100 : 0; return colors[i % colors.length] + ' ' + from + '% ' + offset + '%' })\n  return <div className=\"if-v6-chart\">\n    <div className=\"if-v6-donut\" style={{ background: total ? 'conic-gradient(' + stops.join(',') + ')' : 'var(--muted)' }} aria-hidden=\"true\"><div><strong>{total}</strong><small>{t('Policies')}</small></div></div>\n    <ul aria-label={t('Policy distribution')}>{items.map((item, i) => <li key={item.name}><span className=\"if-v6-chart-dot\" style={{ background: colors[i % colors.length] }} /><span>{t(item.name)}</span><strong>{item.count}</strong><small>{total ? Math.round(item.count / total * 100) : 0}%</small></li>)}</ul>\n  </div>\n}\n";
const cssText="/* InsureFlow Visual v6 */\n.if-page { gap:24px; }\n.if-panel { padding:clamp(16px,2vw,24px); }\n.if-panel h2 { font-size:18px; letter-spacing:-.015em; }\n.if-v6-photo { display:grid; place-items:center; position:relative; overflow:hidden; border-radius:12px; background:var(--muted); min-width:0; min-height:120px; }\n.if-v6-photo img { width:100%; height:100%; position:absolute; inset:0; object-fit:cover; transition:transform .35s ease,filter .25s ease; }\n.if-v6-photo-empty { color:var(--muted-foreground); font-size:13px; padding:16px; text-align:center; }\n.if-v6-photo:hover img { transform:scale(1.035); filter:brightness(1.035); }\n.if-v6-product-photo { height:clamp(155px,22vw,280px); margin:0 0 18px; animation:if-v6-enter .22s ease-out both; }\n.if-v6-health { background:#f4f6f8; }\n.if-v6-health img { object-fit:contain; padding:12px; }\n.if-v6-property-photo { height:176px; }\n.if-v6-property-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:18px; }\n.if-v6-property-card { display:flex; flex-direction:column; gap:12px; padding:12px; border:1px solid var(--border); border-radius:14px; background:var(--card); transition:border-color .2s,box-shadow .2s; }\n.if-v6-property-card:hover { border-color:var(--primary); box-shadow:0 5px 20px color-mix(in srgb,var(--primary) 10%,transparent); }\n.if-v6-property-card h3 { font-size:16px; font-weight:650; overflow-wrap:anywhere; }\n.if-v6-property-card .if-actions { margin-top:auto; }\n.if-v6-property-value { font-size:20px; font-weight:700; color:var(--primary); }\n.if-v6-view-switch { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }\n.if-v6-view-switch [aria-pressed='true'] { outline:2px solid var(--primary); outline-offset:1px; }\n.if-v6-brand { display:grid; place-items:center; height:82px; background:#f6f8fa; border-radius:10px; padding:15px; margin:4px 0 15px; }\n.if-v6-brand img { width:100%; height:52px; object-fit:contain; }\n.if-v6-brand span { font-weight:750; font-size:clamp(19px,2.3vw,28px); color:#183c55; letter-spacing:-.04em; }\n.if-v6-progress { padding:16px; background:var(--muted); border-radius:12px; margin-bottom:18px; }\n.if-v6-progress-heading { display:flex; justify-content:space-between; gap:10px; font-size:14px; }\n.if-v6-progress progress { appearance:none; width:100%; height:8px; border-radius:20px; margin:12px 0; overflow:hidden; accent-color:var(--primary); }\n.if-v6-progress progress::-webkit-progress-bar { background:var(--card); }\n.if-v6-progress progress::-webkit-progress-value { background:var(--primary); border-radius:20px; }\n.if-v6-progress ol { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }\n.if-v6-progress li { display:flex; align-items:flex-start; gap:9px; font-size:12px; overflow-wrap:anywhere; }\n.if-v6-progress li>span { flex-shrink:0; display:grid; place-items:center; width:28px; height:28px; border:1px solid var(--input); border-radius:50%; font-weight:700; }\n.if-v6-progress li[data-done='true']>span { background:var(--primary); color:var(--primary-foreground); border-color:var(--primary); }\n.if-v6-progress small { display:block; color:var(--muted-foreground); margin-top:2px; }\n.if-v6-chart { display:flex; align-items:center; flex-wrap:wrap; gap:24px; padding:12px 0; }\n.if-v6-donut { width:156px; height:156px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; margin:auto; }\n.if-v6-donut>div { width:112px; height:112px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; background:var(--card); }\n.if-v6-donut strong { font-size:30px; line-height:1.1; }\n.if-v6-donut small { color:var(--muted-foreground); font-size:11px; }\n.if-v6-chart ul { flex:1; min-width:170px; display:grid; gap:12px; }\n.if-v6-chart li { display:grid; grid-template-columns:9px minmax(0,1fr) auto auto; align-items:center; gap:8px; font-size:13px; }\n.if-v6-chart li small { color:var(--muted-foreground); min-width:34px; text-align:end; }\n.if-v6-chart-dot { width:9px; height:9px; border-radius:50%; }\n.if-v6-skeleton { display:grid; gap:12px; padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--card); }\n.if-v6-skeleton span { height:16px; border-radius:6px; background:linear-gradient(90deg,var(--muted) 25%,var(--accent) 50%,var(--muted) 75%); background-size:200% 100%; animation:if-v6-shimmer 1.35s ease-in-out infinite; }\n.if-v6-skeleton span:first-of-type { width:55%; }\n.if-v6-skeleton span:last-of-type { width:80%; }\n.if-v6-editorial { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.9fr); gap:24px; align-items:center; }\n.if-v6-editorial .if-v6-photo { min-height:220px; }\n.if-v6-editorial p { line-height:1.65; }\n.if-v6-about-hero { grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); }\n.if-v6-about-hero .if-v6-photo { min-height:240px; align-self:stretch; }\n.if-dashboard-hero { min-height:235px; margin-bottom:0; background-color:#16334a; background-image:linear-gradient(90deg,rgba(4,20,36,.89) 0%,rgba(4,20,36,.57) 45%,rgba(4,20,36,.1) 100%),url('/insurance-images/baku-dashboard.jpg'); background-size:cover; background-position:center; }\n.if-dashboard-hero__overlay { position:relative; z-index:1; }\n.if-dashboard-hero__overlay .if-actions { margin-top:18px; }\n.if-page > .if-panel,.if-page > .if-grid,.if-page > .if-metrics { animation:if-v6-enter .22s ease-out both; }\n@keyframes if-v6-shimmer { from { background-position:200% 0 } to { background-position:-200% 0 } }\n@keyframes if-v6-enter { from { opacity:0;transform:translateY(5px) } to { opacity:1;transform:translateY(0) } }\n@media(max-width:800px){ .if-v6-editorial,.if-v6-about-hero { grid-template-columns:1fr; } .if-v6-progress ol { grid-template-columns:repeat(2,minmax(0,1fr)); } }\n@media(prefers-reduced-motion:reduce){ .if-v6-photo img,.if-v6-skeleton span,.if-v6-product-photo,.if-page > .if-panel,.if-page > .if-grid,.if-page > .if-metrics { animation:none !important;transition:none !important;transform:none !important; } }\n.if-v6-customer{display:inline-flex;align-items:center;gap:9px;}\n.if-v6-avatar{width:30px;height:30px;flex-shrink:0;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:var(--accent-foreground);font-size:11px;font-weight:650;}\n.if-dashboard-hero { position:relative;overflow:hidden;display:flex;align-items:end;border-radius:20px;padding:clamp(20px,4vw,34px); }\n.if-dashboard-hero__overlay { max-width:620px;color:white; }\n.if-dashboard-hero__overlay h2 { color:white;font-size:clamp(26px,4vw,42px);font-weight:750;line-height:1.12;margin:10px 0; }\n.if-dashboard-hero__overlay p { color:#f1f5f9;max-width:55ch;line-height:1.5; }\n.if-dashboard-hero__eyebrow { font-size:13px;font-weight:650; }\n";
const assets=[
 ['caspian-residence.jpg','Port_Baku.jpg','Vita86','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'],
 ['park-view.jpg','Narimanov,_Baku_(P1090195).jpg','Matti Blume','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'],
 ['city-garden.jpg','Narimanov,_Baku_(P1090197).jpg','Matti Blume','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'],
 ['about-banner.jpg','White_office_space_(Unsplash).jpg','Breather','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/'],
 ['about-mission.jpg','Clean_minimalist_office_(Unsplash).jpg','Roman Bozhko','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/'],
 ['about-vision.jpg','Workspace_(Unsplash).jpg','Damian Patkowski','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/'],
 ['bitrix24-logo.png','Bitrix24_logo.png','Bitrix24 Ukraine','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'],
 ['1c-logo.svg','1C_Company_logo.svg','1C Company','Public domain (trademark rights may apply)','https://commons.wikimedia.org/wiki/File:1C_Company_logo.svg'],
]
const selectedBaku='https://chatgpt.com/s/i_6b0a1d89e4548191b08e18c360f92b96'
const source=f=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(f)
function valid(buf,name){if(buf.length<100)return false;if(name.endsWith('.jpg'))return buf[0]===255&&buf[1]===216;if(name.endsWith('.png'))return buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])); if(name.endsWith('.svg'))return /<svg[\s>]/i.test(buf.toString('utf8'))&&!/<(?:script|foreignObject|iframe)\b|\bon\w+\s*=/i.test(buf.toString('utf8'));return false}
function has(name){try{return valid(fs.readFileSync(path.join(root,imgDir,name)),name)}catch{return false}}
const expected=['baku-dashboard.jpg','motor.jpg','property.jpg','travel.jpg','health.png',...assets.map(a=>a[0]),'emlax-logo.png']
function writeGuide(){
 const guide='InsureFlow visual assets v6\n\nAll images are illustrative; not actual project properties, employees or offices. Integrations remain simulated.\n\nRequired folder: frontend/public/insurance-images/\n\nSelected Baku photo (not downloaded by script): '+selectedBaku+' — save as baku-dashboard.jpg (convert to JPEG if needed).\nExisting files: motor.jpg, property.jpg, travel.jpg, health.png.\nEmlax: emlax-logo.png — add an authorized logo if available; otherwise plain text is shown.\n\nOptional photo/logo sources (save as indicated):\n'+assets.map(([name,file,author,lic,url])=>name+' — '+source(file)+'\n  '+author+' — '+lic+' — '+url).join('\n')+'\n\nFor photos you supply yourself, record the correct author, source and reuse license in PHOTO_CREDITS.md.\n'
 put(imgDir+'README_IMAGES.txt',guide)
}
async function getAssets(){
 if(offline)return
 const {createHash}=await import('node:crypto')
 let limited=false
 for(const [name,file,author,license,licenseUrl] of assets){
  if(has(name))continue
  if(limited)break
  const h=createHash('md5').update(file).digest('hex'), dir=h[0]+'/'+h.slice(0,2)+'/', f=encodeURIComponent(file)
  const original='https://upload.wikimedia.org/wikipedia/commons/'+dir+f
  const url=name.endsWith('.jpg')?'https://upload.wikimedia.org/wikipedia/commons/thumb/'+dir+f+'/1024px-'+f:original
  try{
   const r=await fetch(url,{headers:{'User-Agent':'InsureFlowPortfolio/1.0 (local educational project; Wikimedia Commons licensed assets)'},signal:AbortSignal.timeout(5000)})
   if(r.status===429){limited=true;console.warn('HTTP 429: image server limit. UI is already installed; remaining photos can be saved manually.');break}
   if(!r.ok)throw Error('HTTP '+r.status)
   const len=Number(r.headers.get('content-length')||0);if(len>10_000_000)throw Error('Image too large')
   const data=Buffer.from(await r.arrayBuffer());if(data.length>10_000_000||!valid(data,name))throw Error('Invalid image')
   const target=path.join(root,imgDir,name);if(fs.existsSync(target)){console.warn('Existing invalid file preserved: '+name);continue}
   fs.writeFileSync(target,data,{flag:'wx'});console.log('Downloaded '+name)
   const credits=path.join(root,imgDir,'PHOTO_CREDITS.md');fs.appendFileSync(credits,'\n- '+name+': '+author+' — '+source(file)+' — '+license+' ('+licenseUrl+'). '+(name.endsWith('.jpg')?'Wikimedia thumbnail; illustrative photo.':'Brand identification only; no affiliation implied.')+'\n','utf8')
  }catch(e){console.warn(name+': '+e.message);if(e.message.includes('fetch failed')||e.name==='TimeoutError'){console.warn('Image network unavailable; skipping further downloads.');break}}
 }
}
try{
 if(!exists(prefix+'features/insurance/Operations.tsx'))throw Error('Run from the InsureFlow project root (frontend and backend folders).')
 if(!assetsOnly)stageSource()
 writeGuide()
 // Use the existing project TypeScript dependency to parse all staged TS/TSX before any writes.
 let ts;try{ts=createRequire(path.join(root,'frontend','package.json'))('typescript')}catch{console.warn('Local TypeScript not found; run frontend build after applying.')}
 if(ts)for(const [p,s] of staged){if(!/\.tsx?$/.test(p))continue;const file=ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true,p.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(file.parseDiagnostics.length)throw Error(p+': '+file.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '))}
 if(dry){console.log('Dry run. No files changed.\n'+[...staged.keys()].join('\n'));console.log('Missing/invalid images: '+expected.filter(n=>!has(n)).join(', '));process.exit(0)}
 if(staged.size){
  const backup=fs.mkdtempSync(path.join(os.tmpdir(),'insureflow-v6-'))
  for(const [p] of staged)if(exists(p)){const dest=path.join(backup,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,p),dest)}
  const done=[]
  try{for(const [p,s] of staged){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s,'utf8');done.push(p);console.log('Updated '+p)}}catch(e){for(const p of done){const old=path.join(backup,p);if(fs.existsSync(old))fs.copyFileSync(old,path.join(root,p));else fs.unlinkSync(path.join(root,p))}throw e}
  console.log('Source backup: '+backup)
 }
 console.log('V6 UI applied. Existing image files preserved.')
 await getAssets()
 const missing=expected.filter(n=>!has(n));if(missing.length)console.log('Still missing/invalid: '+missing.join(', ')+'\nSee '+imgDir+'README_IMAGES.txt for sources. The UI uses fallbacks where possible.')
 console.log('Run: cd frontend; pnpm.cmd run build')
}catch(e){console.error(e.message);process.exitCode=1}
