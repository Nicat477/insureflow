import { createFileRoute } from '@tanstack/react-router'
import { Claims } from '@/features/insurance/Operations'
import { PageShell } from '@/features/insurance/PageShell'
export const Route = createFileRoute('/_authenticated/claims')({
  component: () => (
    <PageShell>
      <Claims />
    </PageShell>
  ),
})
