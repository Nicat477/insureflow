import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsAppearance } from '@/features/settings/appearance'

export const Route = createFileRoute('/_authenticated/settings/appearance')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
  component: SettingsAppearance,
})
