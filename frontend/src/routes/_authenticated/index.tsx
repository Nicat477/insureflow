
import { createFileRoute } from '@tanstack/react-router'
import InsuranceOverview from '@/features/insurance/InsuranceOverview'
import { PageShell } from '@/features/insurance/PageShell'

function InsuranceDashboard() {
  return (
    <PageShell>
      <InsuranceOverview />
    </PageShell>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  component: InsuranceDashboard,
})
