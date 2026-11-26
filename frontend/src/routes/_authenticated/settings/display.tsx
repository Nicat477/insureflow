import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsDisplay } from '@/features/settings/display'

export const Route = createFileRoute('/_authenticated/settings/display')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
  component: SettingsDisplay,
})
