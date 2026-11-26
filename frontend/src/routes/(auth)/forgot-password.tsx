import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPassword } from '@/features/auth/forgot-password'

export const Route = createFileRoute('/(auth)/forgot-password')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: ForgotPassword,
})
