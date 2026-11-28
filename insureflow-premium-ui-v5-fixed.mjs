import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const root = process.cwd()
const dry = process.argv.includes('--dry-run')
const pending = new Map()
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(root, p))
const set = (p, text) => { const full = path.join(root,p); const prev = fs.existsSync(full) ? fs.readFileSync(full,'utf8') : ''; if (text !== prev) pending.set(p, text) }
const replace = (s, re, v, name) => { if (!re.test(s)) throw new Error('Expected code not found: '+name); return s.replace(re, v) }

try {
  if (!exists('frontend/src/features/insurance/ui.tsx')) throw new Error('Run this script from the InsureFlow project root.')
  // This patch runs independently, preserving the locally installed v3/v4.
  if (!exists('frontend/src/i18n/messages.ts') || !read('frontend/src/i18n/messages.ts').includes('export const ruMessages')) throw new Error('UX v4 is not installed. Apply UX v4 first, then run this script again.')

  // 1) Remove the extra fictional-data helper lines and keep only "Demo".
  const pageShellPath = 'frontend/src/features/insurance/PageShell.tsx'
  let pageShell = read(pageShellPath)
  pageShell = pageShell.replace('{t("Demo · fictional data only")}', 'Demo')
  set(pageShellPath, pageShell)

  const sidebarPath = 'frontend/src/components/layout/app-sidebar.tsx'
  let sidebar = read(sidebarPath)
  sidebar = sidebar.replace(/\s*<p className="mt-1 text-muted-foreground">\{t\("Fictional records only"\)\}<\/p>/, '')
  set(sidebarPath, sidebar)

  // 2) Add a Baku dashboard banner inside the generic Heading component when title === Dashboard.
  const uiPath = 'frontend/src/features/insurance/ui.tsx'
  let ui = read(uiPath)
  if (!ui.includes('if-dashboard-hero')) {
    ui = replace(
      ui,
      /return \(\s*<header className="if-heading">/,
      `return (\n    <>\n      {title === 'Dashboard' && (\n        <section className="if-dashboard-hero" aria-label={t('Baku skyline dashboard banner')}>\n          <div className="if-dashboard-hero__overlay">\n            <span className="if-dashboard-hero__eyebrow">{t('Digital insurance portal')}</span>\n            <h2>{t('Insurance, made simpler.')}</h2>\n            <p>{t('Quotes, policies, claims and payments from a single workspace.')}</p>\n          </div>\n        </section>\n      )}\n      <header className="if-heading">`,
      'dashboard hero start',
    )
    ui = replace(ui, /<\/header>\s*\)\s*\n}/, '</header>\n    </>\n  )\n}', 'dashboard hero close')
    set(uiPath, ui)
  }

  // 3) Add translations for the new hero copy if missing.
  const msgPath = 'frontend/src/i18n/messages.ts'
  let msg = read(msgPath)
  const translations = {
    az: {
      'Baku skyline dashboard banner': 'Bakı panoraması',
      'Digital insurance portal': 'Rəqəmsal sığorta platforması',
      'Quotes, policies, claims and payments from a single workspace.': 'Təkliflər, polislər, hadisə müraciətləri və ödənişlər vahid iş sahəsində.',
      'Insurance, made simpler.': 'Sığorta daha sadə, daha əlçatan.',
    },
    ru: {
      'Baku skyline dashboard banner': 'Панорама Баку',
      'Digital insurance portal': 'Цифровая страховая платформа',
      'Quotes, policies, claims and payments from a single workspace.': 'Расчёты, полисы, страховые случаи и платежи в единой рабочей среде.',
      'Insurance, made simpler.': 'Страхование стало проще.',
    },
  }
  for (const lang of ['az','ru']) {
    const start = new RegExp('export const ' + lang + 'Messages:\\s*Record<string,\\s*string>\\s*=\\s*\\{')
    const match = start.exec(msg)
    if (!match) throw new Error('Dictionary missing: ' + lang)
    const end = msg.indexOf('\n}', match.index + match[0].length)
    if (end < 0) throw new Error('Dictionary ending missing: ' + lang)
    const body = msg.slice(match.index + match[0].length, end)
    const missing = Object.entries(translations[lang]).filter(([k]) => !body.includes(JSON.stringify(k) + ':') && !body.includes("'" + k + "':"))
    if (missing.length) {
      const entries = missing.map(([k,v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',').join('\n')
      const at = match.index + match[0].length
      msg = msg.slice(0,at) + '\n' + entries + msg.slice(at)
    }
  }
  set(msgPath,msg)


  // 4) Premium dashboard banner + real-image blocks styling.
  const cssPath = 'frontend/src/features/insurance/insurance.css'
  let css = read(cssPath)
  const marker = '/* InsureFlow premium dashboard v5 */'
  if (!css.includes(marker)) {
    css += `\n${marker}\n.if-dashboard-hero { position:relative; overflow:hidden; border:1px solid color-mix(in srgb,var(--border) 80%,transparent); border-radius:22px; padding:clamp(22px,4vw,34px); margin:0 0 22px; min-height:220px; display:flex; align-items:end; background-color:#16334a; background-image:linear-gradient(120deg, rgba(3,19,40,.78), rgba(6,46,68,.42)), url('/insurance-images/baku-dashboard.jpg'); background-size:cover; background-position:center; box-shadow:0 12px 40px color-mix(in srgb,var(--foreground) 10%,transparent); }\n.if-dashboard-hero__overlay { max-width:620px; color:#fff; }\n.if-dashboard-hero__eyebrow { display:inline-flex; align-items:center; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.10); backdrop-filter:blur(8px); color:#fff; border-radius:999px; padding:7px 12px; margin-bottom:14px; font-size:13px; font-weight:700; letter-spacing:.02em; }\n.if-dashboard-hero__overlay h2 { margin:0 0 10px; font-size:clamp(30px,4vw,42px); line-height:1.05; color:#fff; }\n.if-dashboard-hero__overlay p { margin:0; max-width:55ch; font-size:15px; line-height:1.55; color:rgba(255,255,255,.92); }\n.if-dashboard-hero:before { content:''; position:absolute; inset:auto -12% -55% auto; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle at center, rgba(103,232,249,.34), rgba(103,232,249,0)); pointer-events:none; }\n.dark .if-dashboard-hero { border-color:#1f3e4d; box-shadow:0 0 0 1px rgba(34,211,238,.14), 0 16px 48px rgba(0,0,0,.35); }\n.if-heading > div > h1 { font-size:clamp(32px,4vw,40px); line-height:1.08; }\n.if-heading > div > p:not(.if-eyebrow) { font-size:15px; line-height:1.6; }\n@media (max-width: 768px) { .if-dashboard-hero { min-height:190px; padding:20px; border-radius:18px; } .if-dashboard-hero__overlay h2 { font-size:28px; } }\n`
    set(cssPath, css)
  }

  // 5) Add a helper folder and note for the real images.
  const note = `Place the real images in this folder with these exact file names:\n- baku-dashboard.jpg  -> dashboard banner image of Baku\n- motor.jpg           -> motor insurance card\n- property.jpg        -> property insurance card\n- travel.jpg          -> travel insurance card\n- health.png          -> health insurance card\n\nThe UI changes work without these files, but the real-photo sections will look best after you add them.\n`
  set('frontend/public/insurance-images/README_IMAGES.txt', note)

  if (dry) {
    console.log('Dry run — final premium UI patch would update:')
    for (const p of pending.keys()) console.log(p)
    process.exit(0)
  }

  if (!pending.size) { console.log('Premium UI v5 is already applied.'); process.exit(0) }
  const backup = fs.mkdtempSync(path.join(os.tmpdir(), 'insureflow-v5-'))
  for (const [p] of pending) {
    if (exists(p)) { const dest = path.join(backup,p); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(path.join(root,p),dest) }
  }
  for (const [p,content] of pending) {
    fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true})
    fs.writeFileSync(path.join(root,p), content, 'utf8')
    console.log('Updated '+p)
  }
  console.log('Backup: '+backup)
  console.log('\nPremium UI v5 applied. If you already have the Baku image, save it as frontend/public/insurance-images/baku-dashboard.jpg and then run:')
  console.log('  cd frontend')
  console.log('  pnpm.cmd run dev')
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
}
