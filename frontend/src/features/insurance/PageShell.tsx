import type { ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import './insurance.css'
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header className="border-b bg-card">
        <span className="me-auto text-sm font-medium">Insurance workspace</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Demo · fictional data only
        </span>
        <ThemeSwitch />
      </Header>
      <Main id="content" className="if-page">
        {children}
      </Main>
    </>
  )
}
