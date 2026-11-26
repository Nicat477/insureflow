import { createFileRoute } from '@tanstack/react-router'
import { Customers } from '@/features/insurance/Operations'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/customers')({
  component: () => (
    <PageShell>
      <Customers />
    </PageShell>
  ),
})
