import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound, AlertCircle } from 'lucide-react'
import { getAccountClient } from './account-client'
import { useLocale, LanguageSwitcher } from '@/i18n/locale'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import './account.css'
type Mode = 'login' | 'register' | 'forgot' | 'reset'
const AccountContext = createContext<{client: SupabaseClient | null; session: Session | null}>({client:null,session:null})
const words = {
  login:['Daxil ol','Sign in','Войти'], register:['Hesab yarat','Create account','Создать аккаунт'], forgot:['Parolu unutmusunuz?','Forgot password?','Забыли пароль?'], reset:['Yeni parol','New password','Новый пароль'], email:['Email ünvanı','Email address','Электронная почта'], password:['Parol','Password','Пароль'], confirm:['Parolu təsdiqlə','Confirm password','Подтвердите пароль'], mismatch:['Parollar eyni deyil.','Passwords do not match.','Пароли не совпадают.'], sent:['Email qutunu yoxla','Check your email','Проверьте почту'], failure:['Əməliyyat alınmadı. Məlumatları yoxla və yenidən cəhd et.','Unable to complete this action. Check your details and retry.','Не удалось выполнить действие. Проверьте данные и повторите.'], waiting:['Yüklənir…','Loading…','Загрузка…'], retry:['Yenidən cəhd et','Retry','Повторить'], logout:['Çıxış','Sign out','Выйти'], subtitle:['Şəxsi sığorta demo məkanın','Your personal insurance demo workspace','Ваше личное демо-пространство'], note:['Yalnız uydurma sığorta məlumatlarından istifadə et.','Use fictional insurance records only.','Используйте только вымышленные страховые данные.'], save:['Parolu yenilə','Update password','Обновить пароль'], send:['Bərpa linki göndər','Send reset link','Отправить ссылку'], profile:['Hesab','Account','Аккаунт'], name:['Ad və soyad','Full name','Имя и фамилия'],
  google:['Google ilə davam et','Continue with Google','Продолжить с Google'], googleHint:['Google ilə hesab yaratmaq və daxil olmaq üçün InsureFlow təsdiq məktubu lazım deyil.','Create an account or sign in with Google without an InsureFlow confirmation email.','Для регистрации или входа через Google письмо от InsureFlow не требуется.'], orEmail:['və ya email ilə','or use email','или через email'], oauthError:['Google ilə giriş tamamlanmadı. Yenidən cəhd et.','Google sign-in could not be completed. Please try again.','Не удалось войти через Google. Попробуйте снова.'],
  hero:['Sığortanın rəqəmsal gələcəyi.','A digital future for insurance.','Цифровое будущее страхования.'], heroText:['Müştərilər, sığorta müqavilələri və müraciətlər — bir təhlükəsiz demo iş məkanında.','Customers, policies and applications in one secure demo workspace.','Клиенты, полисы и заявки в одном защищённом демо-пространстве.'], badge:['RƏQƏMSAL SIĞORTA PLATFORMASI','DIGITAL INSURANCE PLATFORM','ЦИФРОВАЯ СТРАХОВАЯ ПЛАТФОРМА'], private:['Şəxsi iş məkanı','Personal workspace','Личное пространство'], cloud:['Buludda saxlanma','Cloud persistence','Хранение в облаке'], welcome:['Yenidən xoş gördük','Welcome back','С возвращением'], start:['İş məkanını yarat','Create your workspace','Создайте своё пространство'], forgotTitle:['Parolu bərpa et','Reset your password','Восстановление пароля'], resetTitle:['Yeni parol təyin et','Set a new password','Установите новый пароль'], loginText:['Davam etmək üçün hesabına daxil ol.','Sign in to continue to your workspace.','Войдите, чтобы продолжить.'], registerText:['Şəxsi hesabını yarat və demo funksiyalarını sına.','Create an account and explore the demo features.','Создайте аккаунт и изучите возможности демо.'], forgotText:['Email ünvanını daxil et. Uyğun hesab varsa, bərpa linki göndəriləcək.','Enter your email. If eligible, a recovery link will be sent.','Введите почту. Если возможно, будет отправлена ссылка.'], resetText:['Minimum 12 simvoldan ibarət yeni parol seç.','Choose a new password with at least 12 characters.','Выберите новый пароль от 12 символов.'], show:['Parolu göstər','Show password','Показать пароль'], hide:['Parolu gizlət','Hide password','Скрыть пароль'], min:['Minimum 12 simvol.','At least 12 characters.','Не менее 12 символов.'], noAccount:['Hesabın yoxdur?','New to InsureFlow?','Нет аккаунта?'], haveAccount:['Artıq hesabın var?','Already have an account?','Уже есть аккаунт?'], signupPending:['Qeydiyyat sorğusu qəbul edildi. Yeni hesab üçün email təsdiqi tələb olunursa, gələn məktubdakı linki aç. Artıq hesabın varsa, daxil ol və ya parolu bərpa et.','Your request was accepted. If confirmation is required for a new account, open the email link. If you already have an account, sign in or reset your password.','Запрос принят. Если новому аккаунту нужно подтверждение, откройте ссылку в письме. Если аккаунт уже есть, войдите или восстановите пароль.'], resetPending:['Əgər uyğun hesab varsa, bərpa məktubu göndəriləcək. Spam qovluğunu da yoxla.','If an eligible account exists, a recovery email will be sent. Check your spam folder too.','Если подходящий аккаунт существует, будет отправлено письмо. Проверьте папку спама.'], spam:['Məktub gəlməyibsə, Spam qovluğunu yoxla.','No email? Check your spam folder.','Нет письма? Проверьте спам.'], resend:['Təsdiq məktubunu yenidən göndər','Resend confirmation email','Отправить подтверждение повторно'], resendDone:['Sorğu qəbul edildi. Email qutunu yoxla.','Request accepted. Check your inbox.','Запрос принят. Проверьте почту.'], editEmail:['Email ünvanını dəyiş','Change email address','Изменить адрес почты'], invalid:['Email və ya parol düzgün deyil.','Email or password is incorrect.','Неверная почта или пароль.'], unconfirmed:['Email təsdiqlənməyib. Təsdiq linkini aç və ya yeni məktub istə.','Email is not confirmed. Open the confirmation link or request another email.','Почта не подтверждена. Откройте ссылку или запросите новое письмо.'], limit:['Çox sayda sorğu göndərilib. Bir qədər sonra yenidən cəhd et.','Too many requests. Try again shortly.','Слишком много запросов. Попробуйте позже.'], mailError:['Email göndərilməsi alınmadı. Bir qədər sonra yenidən cəhd et.','Email delivery failed. Try again later.','Не удалось отправить письмо. Попробуйте позже.'], weak:['Parol tələblərə uyğun deyil. Daha güclü parol seç.','Password does not meet the requirements. Choose a stronger password.','Пароль не соответствует требованиям. Выберите более надёжный.'], existing:['Daxil ol və ya parol bərpasını yoxla.','Try signing in or resetting your password.','Попробуйте войти или восстановить пароль.'], loginDone:['Hesabına daxil oldun.','Signed in successfully.','Вход выполнен.'], resetDone:['Parol yeniləndi.','Password updated.','Пароль обновлён.'], badLink:['Email linki etibarsızdır və ya müddəti bitib. Yeni link istə.','Email link is invalid or expired. Request a new link.','Ссылка недействительна или истекла. Запросите новую.']
} as const
type Word = keyof typeof words
function useWords(){const {language}=useLocale();return (key:Word)=>words[key][language==='az'?0:language==='en'?1:2]}
function errorKey(error:unknown):Word { const e=error as {code?:string;status?:number;message?:string}|null;const code=e?.code??'';if(e?.status===429||code.includes('rate_limit'))return 'limit';if(code==='invalid_credentials')return 'invalid';if(code==='email_not_confirmed')return 'unconfirmed';if(code==='weak_password')return 'weak';if(code==='user_already_exists'||code==='email_exists')return 'existing';if(code.includes('email')&&(/send|smtp|delivery|not_authorized/.test(code)||/send|smtp/i.test(e?.message??'')))return 'mailError';return 'failure' }
function Brand(){return <div className="if-auth-brand"><img src="/images/insureflow.svg" alt="" width="56" height="56"/><span>InsureFlow</span></div>}
function AccountLayout({children}:{children:ReactNode}){const t=useWords();return <div className="if-account-screen"><aside className="if-auth-hero"><Brand/><div className="if-auth-hero-content"><span className="if-auth-kicker"><ShieldCheck size={17}/>{t('badge')}</span><h2>{t('hero')}</h2><p>{t('heroText')}</p><div className="if-auth-features"><span><LockKeyhole size={19}/>{t('private')}</span><span><CheckCircle2 size={19}/>{t('cloud')}</span></div></div><small>InsureFlow · Demo</small></aside><section className="if-auth-main"><header><Brand/><div><LanguageSwitcher/><ThemeSwitch/></div></header><main className="if-account-card">{children}</main><footer>{t('note')} <span> · </span><a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{textDecoration:'underline'}}>Privacy Policy</a><span> · </span><a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{textDecoration:'underline'}}>Terms of Service</a></footer></section></div>}
function AccountForm({client,mode,setMode,onReset,initialError}:{client:SupabaseClient;mode:Mode;setMode:(m:Mode)=>void;onReset:()=>void;initialError?:Word}) {
  const t=useWords();const [email,setEmail]=useState(''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<Word|null>(initialError??null),[notice,setNotice]=useState<Word|null>(null),[pending,setPending]=useState<'register'|'forgot'|null>(null),[visible,setVisible]=useState(false),[confirmVisible,setConfirmVisible]=useState(false),[cooldown,setCooldown]=useState(0);const lock=useRef(false)
  useEffect(()=>{if(cooldown<=0)return;const timer=window.setTimeout(()=>setCooldown(c=>c-1),1000);return ()=>window.clearTimeout(timer)},[cooldown])
  function change(m:Mode){if(lock.current)return;setError(null);setNotice(null);setPending(null);setPassword('');setConfirm('');setVisible(false);setConfirmVisible(false);setMode(m)}
  async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError(null);setNotice(null);try{await action()}catch(e){setError(errorKey(e))}finally{lock.current=false;setBusy(false)}}
  const redirectTo=window.location.origin+'/'
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if((mode==='register'||mode==='reset')&&password!==confirm){setError('mismatch');return}await run(async()=>{
    const address=email.trim();
    if(mode==='login'){const {error}=await client.auth.signInWithPassword({email:address,password});if(error)throw error;toast.success(t('loginDone'))}
    else if(mode==='register'){const {data,error}=await client.auth.signUp({email:address,password,options:{emailRedirectTo:redirectTo,data:{full_name:name.trim()}}});if(error)throw error;if(!data.session){setPending('register');setCooldown(60)}}
    else if(mode==='forgot'){const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo});if(error)throw error;setPending('forgot');setCooldown(60)}
    else {const {error}=await client.auth.updateUser({password});if(error)throw error;toast.success(t('resetDone'));onReset()}
    setPassword('');setConfirm('');setVisible(false);setConfirmVisible(false)
  })}
  async function googleSignIn(){if(lock.current)return;lock.current=true;setBusy(true);setError(null);setNotice(null);try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});if(error)throw error}catch{setError('oauthError')}finally{lock.current=false;setBusy(false)}}
  const googleButton=<div className="if-auth-oauth"><Button variant="outline" type="button" className="if-auth-google" disabled={busy} onClick={()=>void googleSignIn()}><span className="if-auth-google-mark" aria-hidden="true">G</span>{t('google')}</Button><p>{t('googleHint')}</p></div>;
  async function resend(){if(cooldown>0)return;await run(async()=>{const {error}=await client.auth.resend({type:'signup',email:email.trim(),options:{emailRedirectTo:redirectTo}});if(error)throw error;setCooldown(60);setNotice('resendDone')})}
  const title:Word=mode==='login'?'welcome':mode==='register'?'start':mode==='forgot'?'forgotTitle':'resetTitle';const description:Word=mode==='login'?'loginText':mode==='register'?'registerText':mode==='forgot'?'forgotText':'resetText';
  const feedback=<>{error&&<div className="if-auth-feedback is-error" role="alert"><AlertCircle size={19}/><span>{t(error)}</span></div>}{notice&&<div className="if-auth-feedback is-success" role="status"><CheckCircle2 size={19}/><span>{t(notice)}</span></div>}</>;
  return <AccountLayout>{pending?<div className="if-auth-form-content" key="pending"><div className="if-auth-symbol"><Mail size={29}/></div><h1>{t('sent')}</h1><p role="status">{t(pending==='register'?'signupPending':'resetPending')}</p><p className="if-auth-email">{email.trim()}</p><p>{t('spam')}</p>{feedback}{pending==='register'&&googleButton}<Button type="button" className="if-auth-primary" disabled={busy} onClick={()=>change('login')}>{t('login')}<ArrowRight size={18}/></Button>{pending==='register'&&<Button type="button" variant="outline" disabled={busy||cooldown>0} onClick={()=>void resend()}>{busy?<LoaderCircle className="if-auth-spin" size={18}/>:<Mail size={18}/>} {t('resend')}{cooldown>0?` (${cooldown}s)`:''}</Button>}<button className="if-auth-link" type="button" disabled={busy} onClick={()=>change(pending)}>{t('editEmail')}</button></div>:<div className="if-auth-form-content" key={mode}><div className="if-auth-symbol">{mode==='register'?<UserRound size={26}/>:<LockKeyhole size={26}/>}</div><div><h1>{t(title)}</h1><p>{t(description)}</p></div>{(mode==='login'||mode==='register')&&<>{googleButton}<div className="if-auth-divider"><span>{t('orEmail')}</span></div></>}<form onSubmit={submit} aria-busy={busy}>
    {mode==='register'&&<label>{t('name')}<span className="if-auth-input"><UserRound size={19}/><input autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></span></label>}
    {mode!=='reset'&&<label>{t('email')}<span className="if-auth-input"><Mail size={19}/><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></span></label>}
    {mode!=='forgot'&&<label>{t('password')}<span className="if-auth-input"><LockKeyhole size={19}/><input type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:12} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type="button" aria-label={t(visible?'hide':'show')} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></span>{mode!=='login'&&<small>{t('min')}</small>}</label>}
    {(mode==='register'||mode==='reset')&&<label>{t('confirm')}<span className="if-auth-input"><LockKeyhole size={19}/><input type={confirmVisible?'text':'password'} autoComplete="new-password" required minLength={12} maxLength={72} value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/><button type="button" aria-label={t(confirmVisible?'hide':'show')} aria-pressed={confirmVisible} onClick={()=>setConfirmVisible(v=>!v)}>{confirmVisible?<EyeOff size={19}/>:<Eye size={19}/>}</button></span></label>}
    {mode==='login'&&<button className="if-auth-link if-auth-forgot" type="button" disabled={busy} onClick={()=>change('forgot')}>{t('forgot')}</button>}
    {feedback}{error==='unconfirmed'&&<Button type="button" variant="outline" disabled={busy||cooldown>0} onClick={()=>void resend()}>{t('resend')}{cooldown>0?` (${cooldown}s)`:''}</Button>}
    <Button className="if-auth-primary" type="submit" disabled={busy}>{busy?<LoaderCircle size={19} className="if-auth-spin"/>:null}{busy?t('waiting'):t(mode==='forgot'?'send':mode==='reset'?'save':mode)}{!busy&&<ArrowRight size={19}/>}</Button>
  </form>{mode!=='reset'&&<div className="if-account-links"><span>{mode==='login'?t('noAccount'):t('haveAccount')}</span><button type="button" className="if-auth-link" disabled={busy} onClick={()=>change(mode==='login'?'register':'login')}>{t(mode==='login'?'register':'login')}</button></div>}</div>}</AccountLayout>
}
export function AccountGate({children}:{children:ReactNode}) {
  const t=useWords();const qc=useQueryClient();const [initialError]=useState<Word|undefined>(()=>{const p=new URLSearchParams(window.location.hash.slice(1));return p.has('error')||new URLSearchParams(window.location.search).has('error')?'badLink':undefined});const [client,setClient]=useState<SupabaseClient|null>(null),[session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[mode,setMode]=useState<Mode>(()=>new URLSearchParams(window.location.hash.slice(1)).get('type')==='recovery'?'reset':'login');
  useEffect(()=>{let active=true;let unsubscribe:(()=>void)|undefined;let previous:string|null|undefined;
    void getAccountClient().then(c=>{if(!active)return;setClient(c);if(!c){setReady(true);return}
      const {data}=c.auth.onAuthStateChange((event,next)=>{if(!active)return;const id=next?.user.id??null;if(previous!==id){qc.clear();previous=id}if(event==='PASSWORD_RECOVERY')setMode('reset');if(event==='SIGNED_OUT')setMode('login');setSession(next);setReady(true)});unsubscribe=()=>data.subscription.unsubscribe();
    }).catch(()=>{if(active)setFailed(true)});return()=>{active=false;unsubscribe?.()}
  },[qc,attempt]);
  if(failed)return <AccountLayout><div className="if-auth-feedback is-error" role="alert"><AlertCircle size={19}/>{t('failure')}</div><Button onClick={()=>{setFailed(false);setAttempt(x=>x+1)}}>{t('retry')}</Button></AccountLayout>
  if(!ready)return <AccountLayout><div className="if-auth-loading" role="status"><LoaderCircle className="if-auth-spin" size={30}/>{t('waiting')}</div></AccountLayout>
  if(client&&(!session||mode==='reset'))return <AccountForm client={client} mode={mode} setMode={setMode} initialError={initialError} onReset={()=>setMode('login')}/>
  return <AccountContext.Provider value={{client,session}}>{children}</AccountContext.Provider>
}
// InsureFlow account-card v1
export function AccountMenu() {
  const { client, session } = useContext(AccountContext)
  const t = useWords()
  const { language } = useLocale()
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  if (!client || !session) return null
  const user = session.user
  const email = user.email ?? ''
  const meta = user.user_metadata ?? {}
  const name = [meta.full_name, meta.name].find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() || email.split('@')[0] || t('profile')
  const initials = name.split(/\s+/u).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase() || 'U'
  const isGoogle = user.app_metadata?.provider === 'google'
  const labels = language === 'az'
    ? { menu: 'Hesab menyusu', details: 'Hesab məlumatları', google: 'Google hesabı', email: 'Email hesabı', signedIn: 'Şəxsi iş məkanı' }
    : language === 'en'
      ? { menu: 'Account menu', details: 'Account details', google: 'Google account', email: 'Email account', signedIn: 'Personal workspace' }
      : { menu: 'Меню аккаунта', details: 'Данные аккаунта', google: 'Аккаунт Google', email: 'Аккаунт с почтой', signedIn: 'Личное пространство' }
  const provider = isGoogle ? labels.google : labels.email
  async function signOut() {
    if (lock.current || !client) return
    lock.current = true
    setBusy(true)
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch {
      toast.error(t('failure'))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="if-profile-trigger" aria-label={`${labels.menu}: ${name}`} disabled={busy} title={email || name}>
          <span className="if-profile-avatar" aria-hidden="true">{initials}</span>
          <span className="if-profile-trigger-meta"><strong>{name}</strong><span>{email || labels.signedIn}</span></span>
          <span className="if-profile-provider if-profile-provider-compact">{isGoogle ? <><span className="if-profile-google" aria-hidden="true">G</span>Google</> : <><Mail size={13} aria-hidden="true"/>Email</>}</span>
          {busy ? <LoaderCircle size={15} className="if-auth-spin" aria-hidden="true"/> : <ChevronDown size={15} className="if-profile-chevron" aria-hidden="true"/>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="if-profile-dropdown" align="end" sideOffset={10} collisionPadding={12}>
          <DropdownMenu.Label className="if-profile-heading">{labels.details}</DropdownMenu.Label>
          <div className="if-profile-identity">
            <span className="if-profile-avatar if-profile-avatar-large" aria-hidden="true">{initials}</span>
            <div className="if-profile-identity-meta"><strong>{name}</strong><span>{email}</span><span className="if-profile-provider">{isGoogle ? <span className="if-profile-google" aria-hidden="true">G</span> : <Mail size={13} aria-hidden="true"/>}{provider}</span></div>
          </div>
          <div className="if-profile-workspace"><ShieldCheck size={16} aria-hidden="true"/>{labels.signedIn}</div>
          <DropdownMenu.Separator className="if-profile-separator"/>
          <DropdownMenu.Item className="if-profile-logout" disabled={busy} onSelect={() => void signOut()}><LogOut size={17} aria-hidden="true"/><span>{t('logout')}</span></DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
