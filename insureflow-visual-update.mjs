// Run from the InsureFlow root after the first UI update. No GitHub changes.
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const src = 'frontend/src/';
const dry = process.argv.includes('--dry-run');
const pending = new Map();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const set = (p, text) => { if (text !== read(p)) pending.set(p,text); };
const requireReplace = (s, re, v, name) => { if (!re.test(s)) throw new Error('Expected code not found: '+name); return s.replace(re,v); };
const photos = [
 {name:'motor.jpg',file:'White_BMW_by_the_sidewalk_(Unsplash).jpg',dir:'4/45',author:'Lance Anderson',page:'White_BMW_by_the_sidewalk_(Unsplash).jpg'},
 {name:'property.jpg',file:'Forest_house_(Unsplash).jpg',dir:'9/9a',author:'Bruno Marinho',page:'Forest_house_(Unsplash).jpg'},
 {name:'travel.jpg',file:'Passenger_airplane_(Unsplash).jpg',dir:'f/f9',author:'Jordan Sanchez',page:'Passenger_airplane_(Unsplash).jpg'},
 {name:'health.png',file:'Stethoscope.png',dir:'d/d7',author:'Sprinno',page:'Stethoscope.png'},
];
const photoDir = 'frontend/public/insurance-images/';
function validImage(b, name) {return name.endsWith('.png') ? b.length>100 && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : b.length>100 && b[0]===255 && b[1]===216;}
async function download(photo) {
 const file = encodeURIComponent(photo.file).replaceAll('(', '%28').replaceAll(')', '%29');
 const prefix = 'https://upload.wikimedia.org/wikipedia/commons/';
 const original = prefix+photo.dir+'/'+file;
 const candidates = photo.name.endsWith('.png') ? [original] : [prefix+'thumb/'+photo.dir+'/'+file+'/960px-'+file,original];
 for(const url of candidates){
   try {
     const r=await fetch(url,{headers:{'User-Agent':'InsureFlowPortfolio/1.0 (educational project; downloading CC0 images)'},signal:AbortSignal.timeout(25000)});
     if(!r.ok) throw Error('HTTP '+r.status);
     const data=Buffer.from(await r.arrayBuffer());
     if(!validImage(data,photo.name)) throw Error('Not a valid image');
     return data;
   } catch(err){console.warn(photo.name+': '+err.message);}
 }
 throw Error('Could not download '+photo.name+'. Check internet access and retry. No source files were changed.');
}
try {
 const about = src+'routes/_authenticated/about.tsx';
 if(!fs.existsSync(path.join(root,about))) throw Error('About route not found. Apply the previous InsureFlow_UI_Update first.');
 let page=read(about);
 if(!page.includes('// InsureFlow About workspace')) throw Error('Unexpected About page; no files changed.');
 if(!page.includes('if-about-photo')) {
   page=requireReplace(page,/import \{ Car, House, Plane, HeartPulse, ShieldCheck, ArrowRight, CheckCircle2, Monitor, Network \} from 'lucide-react'/,"import { ArrowRight } from 'lucide-react'",'About icons');
   for(const [icon,photo] of [['Car','motor.jpg'],['House','property.jpg'],['Plane','travel.jpg'],['HeartPulse','health.png']]) page=requireReplace(page,new RegExp('icon: '+icon+','),`image: '/insurance-images/${photo}',`,'category '+icon);
   for(const icon of ['CheckCircle2','Monitor','Network']) page=requireReplace(page,new RegExp('icon: '+icon+', '),'','value '+icon);
   page=requireReplace(page,/\s*<div className="if-about-symbol" aria-hidden="true"><ShieldCheck \/><\/div>/,'','hero icon');
   page=requireReplace(page,/categories\.map\(\(\{ icon: Icon, title, description \}\)/,'categories.map(({ image, title, description })','category map');
   page=requireReplace(page,/<span className="if-about-icon"><Icon size=\{23\} aria-hidden="true" \/><\/span>/,'<img className="if-about-photo" src={image} alt="" width={480} height={180} loading="lazy" decoding="async" />','product photo');
   page=requireReplace(page,/values\.map\(\(\{ icon: Icon, title, description \}\)/,'values.map(({ title, description })','values map');
   page=requireReplace(page,/\s*<span className="if-about-icon"><Icon size=\{23\} aria-hidden="true" \/><\/span>/,'','value icon');
   // Avoid implying each product link preselects a product; calculator still uses its own form.
   set(about,page);
 }
 const dataPath=src+'components/layout/data/sidebar-data.ts';
 let data=read(dataPath);
 data=data.replace(/^[ \t]*\{ title: 'About us', url: '\/about', icon: Info \},\r?\n/m,'').replace(/^[ \t]*Info,\r?\n/m,'');
 set(dataPath,data);
 const sidebarPath=src+'components/layout/app-sidebar.tsx';
 let side=read(sidebarPath);
 if(!side.includes('if-platform-nav')) {
   side=requireReplace(side,/import \{ ShieldCheck, Settings \} from 'lucide-react'/,"import { ShieldCheck, Settings, Info } from 'lucide-react'",'sidebar imports');
   side=requireReplace(side,/<SidebarFooter>/,`<SidebarFooter className="if-platform-nav">
        <p className="px-2 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">{t('Platform')}</p>
        <NavGroup title="" items={[{ title: 'About us', url: '/about', icon: Info }]} />`,'footer');
   side=side.replace('className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent"','className="if-platform-settings flex items-center gap-3 rounded-md p-2 text-sm hover:bg-sidebar-accent"').replace('<Settings className="size-4 shrink-0" />','<Settings className="size-6 shrink-0" />');
   // An empty group label is hidden by CSS; the footer uses an actual route-aware NavGroup.
   set(sidebarPath,side);
 }
 const lang=src+'i18n/messages.ts'; let l=read(lang);
 if(!l.includes('"Platform":')) { l=requireReplace(l,/export const azMessages:\s*Record<string,\s*string>\s*=\s*\{/,m=>m+'\n  "Platform": "Platforma",','translations');set(lang,l); }
 const cssPath=src+'features/insurance/insurance.css'; let css=read(cssPath);
 if(!css.includes('/* InsureFlow visual refinement v2 */')) {
 css+=`
/* InsureFlow visual refinement v2 */
.if-workspace-nav [data-sidebar='menu-button'], .if-platform-nav [data-sidebar='menu-button'] { min-height:44px; gap:12px; font-size:15px; }
.if-workspace-nav [data-sidebar='menu-button'] > svg, .if-platform-nav [data-sidebar='menu-button'] > svg { width:24px; height:24px; flex-shrink:0; }
.if-workspace-nav [data-sidebar='menu-button'] > span, .if-platform-nav [data-sidebar='menu-button'] > span { min-width:0; }
.if-platform-nav [data-sidebar='group'] { padding:0; }
.if-platform-nav [data-sidebar='group-label'] { display:none; }
.if-platform-settings { min-height:44px; font-size:15px; }
[data-collapsible='icon'] .if-workspace-nav [data-sidebar='menu-button'], [data-collapsible='icon'] .if-platform-nav [data-sidebar='menu-button'] { min-height:32px; height:32px !important; width:32px !important; padding:4px !important; }
[data-collapsible='icon'] .if-platform-settings { min-height:32px; width:32px; padding:4px; }
.if-about-hero { grid-template-columns:1fr; }
.if-about-hero h2 { max-width:780px; }
.if-about-services { grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr)); }
.if-about-photo { width:100%; height:clamp(105px,10vw,150px); object-fit:cover; object-position:center; border-radius:9px; background:#f5f7fa; }
.if-about-photo[src$='health.png'] { object-fit:contain; padding:8px; }
.if-about-service h3 { font-size:16px; }
`;
 set(cssPath,css);
 }
 const credits=photoDir+'PHOTO_CREDITS.md';
 const creditText='# Insurance category photography\n\nAll listed sources specify CC0 1.0. Photos are used for illustration only.\n\n'+photos.map(p=>`- ${p.name}: ${p.author} — https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.page)} (CC0 1.0)`).join('\n')+'\n';
 const missing=photos.filter(p=>!fs.existsSync(path.join(root,photoDir,p.name))||!validImage(fs.readFileSync(path.join(root,photoDir,p.name)),p.name));
 if(dry){console.log('Dry run: '+[...pending.keys(),...missing.map(p=>photoDir+p.name),credits].join('\n'));process.exit(0);}
 // Download all assets before changing any source file.
 const downloaded = await Promise.all(missing.map(async p=>[photoDir+p.name,await download(p)]));
 fs.mkdirSync(path.join(root,photoDir),{recursive:true});
 for(const [p,bytes] of downloaded){fs.writeFileSync(path.join(root,p),bytes);console.log('Downloaded '+p);}
 fs.writeFileSync(path.join(root,credits),creditText,'utf8');
 for(const [p,c] of pending){fs.writeFileSync(path.join(root,p),c,'utf8');console.log('Updated '+p);}
 console.log('Done. Restart Vite if needed, open /about and run pnpm.cmd run build.');
} catch(err){console.error(err.message);process.exitCode=1;}
