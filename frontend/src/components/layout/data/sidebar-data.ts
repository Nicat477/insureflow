import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Wallet,
  Network,
} from 'lucide-react'
import type { SidebarData } from '../types'
export const sidebarData: SidebarData = {
  user: { name: 'Demo Operator', email: 'Local workspace', avatar: '' },
  teams: [
    { name: 'InsureFlow', logo: ShieldCheck, plan: 'Insurance Management' },
  ],
  navGroups: [
    {
      title: 'Workspace',
      items: [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        { title: 'Customers', url: '/customers', icon: Users },
        { title: 'Insurance', url: '/policies', icon: ShieldCheck },
        { title: 'Claims', url: '/claims', icon: FileText },
        { title: 'Payments', url: '/payments', icon: Wallet },
        { title: 'Integrations', url: '/integrations', icon: Network },
      ],
    },
  ],
}
