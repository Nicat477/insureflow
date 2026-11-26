import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsNotifications } from '@/features/settings/notifications'

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
  component: SettingsNotifications,
})
