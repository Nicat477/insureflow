import { Link } from '@tanstack/react-router'
import { ShieldCheck, Settings } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <Link
          to="/"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-3 rounded-lg p-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-lg font-bold">InsureFlow</strong>
            <span className="block truncate text-xs text-muted-foreground">
              Insurance management
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((g) => (
          <NavGroup key={g.title} {...g} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Link
          to="/settings"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent"
        >
          <Settings className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Settings</span>
        </Link>
        <div className="rounded-lg border p-3 text-xs group-data-[collapsible=icon]:hidden">
          <strong>Demo workspace</strong>
          <p className="mt-1 text-muted-foreground">Fictional records only</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
