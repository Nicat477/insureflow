import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { translate, translateError, formatMoney, formatDate, type Language } from './messages'
const key = 'insureflow-language'
function validLanguage(value: string | null): Language { return value === 'en' || value === 'ru' ? value : 'az' }
function readLanguage(): Language {
  try { return validLanguage(localStorage.getItem(key)) } catch { return 'az' }
}
function locale(language: Language, setLanguage: (value: Language) => void) {
  return { language, setLanguage, t: (text: string) => translate(language, text), errorText: (text: string) => translateError(language, text), money: (value: number) => formatMoney(language, value), date: (value: string) => formatDate(language, value), months: (value: number) => language === 'az' ? value + ' ay' : language === 'ru' ? value + (value === 1 ? ' месяц' : value >= 2 && value <= 4 ? ' месяца' : ' месяцев') : value + (value === 1 ? ' month' : ' months') }
}
const LocaleContext = createContext(locale('en', () => {}))
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readLanguage)
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem(key, language) } catch { /* storage may be unavailable */ }
  }, [language])
  return <LocaleContext.Provider value={locale(language, setLanguage)}>{children}</LocaleContext.Provider>
}
export function useLocale() { return useContext(LocaleContext) }
function currentLanguage(): Language {
  if (typeof document === 'undefined') return 'en'
  const lang = document.documentElement.lang
  return lang === 'az' || lang === 'ru' ? lang : 'en'
}
export function currentError(message: string) { return translateError(currentLanguage(), message) }
export function currentText(message: string) { return translate(currentLanguage(), message) }
const languages = [{ code: 'az', name: 'Azərbaycan dili' }, { code: 'en', name: 'English' }, { code: 'ru', name: 'Русский' }] as const
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLocale()
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <button type="button" className="if-language-trigger" aria-label={t('Language') + ': ' + language.toUpperCase()}>
        {language.toUpperCase()} <ChevronDown size={16} aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="if-language-menu min-w-44">
      {languages.map(item => <DropdownMenuItem key={item.code} lang={item.code} onSelect={() => setLanguage(item.code)} className="cursor-pointer gap-3">
        <span className="font-semibold w-7">{item.code.toUpperCase()}</span><span className="flex-1">{item.name}</span>{language === item.code && <Check size={16} aria-label={t('Selected')} />}
      </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>
}
