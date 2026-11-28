import { useLocale } from '@/i18n/locale'
import { Link } from '@tanstack/react-router'
import { ShieldCheck, Settings, Info } from 'lucide-react'
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
  const { t } = useLocale()
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
          <span className="if-brand-logo grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="if-brand-title block text-lg font-bold">InsureFlow</strong>
            <span className="if-brand-subtitle block text-xs text-muted-foreground">{t("Insurance management")}</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="if-workspace-nav">
        {sidebarData.navGroups.map((g) => (
          <NavGroup key={g.title} {...g} />
        ))}
      </SidebarContent>
      <SidebarFooter className="if-platform-nav">
        <p className="if-platform-label px-2 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">{t('Platform')}</p>
        <NavGroup title="" items={[{ title: 'About us', url: '/about', icon: Info }]} />
        <Link
          to="/settings"
          onClick={() => setOpenMobile(false)}
          className="if-platform-settings flex items-center gap-3 rounded-md p-2 text-sm hover:bg-sidebar-accent"
        >
          <Settings className="size-6 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">{t("Settings")}</span>
        </Link>
        <div className="rounded-lg border p-3 text-xs group-data-[collapsible=icon]:hidden">
          <strong>{t("Demo workspace")}</strong>
          
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
