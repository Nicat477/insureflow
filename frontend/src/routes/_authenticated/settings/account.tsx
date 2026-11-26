import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsAccount } from '@/features/settings/account'

export const Route = createFileRoute('/_authenticated/settings/account')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
  component: SettingsAccount,
})
