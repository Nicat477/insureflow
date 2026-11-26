import { createFileRoute } from '@tanstack/react-router'
import { IntegrationCenter } from '@/features/insurance/Operations'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/bitrix24')({
  component: () => (
    <PageShell>
      <IntegrationCenter />
    </PageShell>
  ),
})
