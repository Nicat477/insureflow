import { AccountMenu } from '@/features/account/AccountGate'
import { LanguageSwitcher, useLocale } from '@/i18n/locale'
import type { ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import './insurance.css'
export function PageShell({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  return (
    <>
      <Header className="border-b bg-card">
        <span className="if-workspace-title me-auto min-w-0 truncate text-sm font-medium">{t("Insurance workspace")}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">Demo</span>
        <LanguageSwitcher />
        <ThemeSwitch />
        <AccountMenu />
      </Header>
      <Main id="content" className="if-page">
        {children}
      </Main>
    </>
  )
}
