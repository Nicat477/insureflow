import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translate, translateError, formatMoney, formatDate, type Language } from './messages'
const key = 'insureflow-language'
function readLanguage(): Language {
  try { return localStorage.getItem(key) === 'en' ? 'en' : 'az' } catch { return 'az' }
}
function locale(language: Language, setLanguage: (value: Language) => void) {
  return { language, setLanguage, t: (text: string) => translate(language, text), errorText: (text: string) => translateError(language, text), money: (value: number) => formatMoney(language, value), date: (value: string) => formatDate(language, value), months: (value: number) => language === 'az' ? value + ' ay' : value + (value === 1 ? ' month' : ' months') }
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
// Used by non-React notification handlers. Keep English outside the running app.
export function currentError(message: string) {
  return translateError(document.documentElement.lang === 'az' ? 'az' : 'en', message)
}
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLocale()
  return <label className="flex shrink-0 items-center gap-2 text-sm">
    <span className="sr-only">{t('Language')}</span>
    <select className="rounded-md border bg-background px-2 py-1" value={language} onChange={e => setLanguage(e.target.value === 'en' ? 'en' : 'az')}>
      <option value="az" lang="az">AZ</option>
      <option value="en" lang="en">EN</option>
    </select>
  </label>
}
