import { createFileRoute } from '@tanstack/react-router'
import { Payments } from '@/features/insurance/Operations'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/payments')({
  component: () => (
    <PageShell>
      <Payments />
    </PageShell>
  ),
})
