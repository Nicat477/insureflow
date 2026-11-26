import { createFileRoute } from '@tanstack/react-router'
import InsuranceOverview from '@/features/insurance/InsuranceOverview'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/reports')({
  component: () => (
    <PageShell>
      <InsuranceOverview />
    </PageShell>
  ),
})
