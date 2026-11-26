import { createFileRoute, redirect } from '@tanstack/react-router'
import { Chats } from '@/features/chats'

export const Route = createFileRoute('/_authenticated/chats/')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: Chats,
})
