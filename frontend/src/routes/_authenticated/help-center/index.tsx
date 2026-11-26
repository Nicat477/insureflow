import { createFileRoute, redirect } from '@tanstack/react-router'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/help-center/')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: ComingSoon,
})
