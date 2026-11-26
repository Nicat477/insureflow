import { createFileRoute } from '@tanstack/react-router'
import { InsuranceWorkspace } from '@/features/insurance/Operations'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/properties')({
  component: () => (
    <PageShell>
      <InsuranceWorkspace tab="/properties" />
    </PageShell>
  ),
})
