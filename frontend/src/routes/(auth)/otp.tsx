import { createFileRoute, redirect } from '@tanstack/react-router'
import { Otp } from '@/features/auth/otp'

export const Route = createFileRoute('/(auth)/otp')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: Otp,
})
