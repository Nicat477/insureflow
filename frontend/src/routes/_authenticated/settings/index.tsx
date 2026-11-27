import { useLocale } from '@/i18n/locale'
import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/features/insurance/PageShell'
import { Heading, Panel, Field } from '@/features/insurance/ui'
import { useTheme } from '@/context/theme-provider'
function DemoSettings() {
  const { t } = useLocale()
  const { theme, setTheme } = useTheme()
  return (
    <PageShell>
      <Heading
        title="Settings"
        description="Personalize your local workspace."
      />
      <Panel
        title="Appearance"
        description="Your theme preference is saved in this browser."
      >
        <Field label="Color theme">
          <select
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value as 'light' | 'dark' | 'system')
            }
          >
            <option value="light">{t("Light")}</option>
            <option value="dark">{t("Dark")}</option>
            <option value="system">{t("System default")}</option>
          </select>
        </Field>
      </Panel>
      <Panel title="About this workspace">
        <p className="if-muted">{t("InsureFlow is an independent, fictional insurance portfolio demo. It runs on your computer, does not use real accounts, and does not connect to actual Emlax, Bitrix24 or 1C systems. Do not enter personal or financial information.")}</p>
      </Panel>
    </PageShell>
  )
}
export const Route = createFileRoute('/_authenticated/settings/')({
  component: DemoSettings,
})
