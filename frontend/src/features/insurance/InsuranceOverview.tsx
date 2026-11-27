import { useLocale } from '@/i18n/locale'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { api } from './api'
import { integrations } from './integrationApi'
import { products } from './types'
import { Heading, Panel, Status, Table, QueryState, useData } from './ui'
export default function InsuranceOverview() {
  const { t, money } = useLocale()
  const policies = useData('policies', api.policies),
    claims = useData('claims', api.claims),
    customers = useData('customers', api.customers),
    health = useData('health', integrations.health)
  const data = policies.data,
    c = claims.data,
    error = policies.error || claims.error || customers.error
  return (
    <>
      <Heading
        title="Dashboard"
        description="Manage policies, claims and insurance operations in one place."
        action={
          <Button asChild>
            <Link to="/calculator">{t("+ New insurance quote")}</Link>
          </Button>
        }
      />
      <QueryState
        loading={policies.isPending || claims.isPending || customers.isPending}
        error={error}
        retry={() => {
          void policies.refetch()
          void claims.refetch()
          void customers.refetch()
        }}
      />
      {data && c && customers.data && (
        <>
          <div className="if-metrics">
            {[
              [
                'Active policies',
                data.filter((p) => p.status === 'Active').length,
              ],
              [
                'Open claims',
                c.filter((x) => ['Pending', 'In review'].includes(x.status))
                  .length,
              ],
              ['Customers', customers.data.length],
              [
                'Active premiums',
                money(
                  data
                    .filter((p) => p.status === 'Active')
                    .reduce((n, p) => n + p.premium, 0),
                ),
              ],
            ].map(([label, value]) => (
              <div className="if-metric" key={label}>
                <span>{t(String(label))}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="if-grid">
            <Panel
              title="Policy distribution"
              description="Current records by insurance product"
            >
              {products.map((p) => {
                const count = data.filter((x) => x.type === p).length
                return (
                  <div key={p}>
                    <div className="flex justify-between text-sm">
                      <span>{t(p)}</span>
                      <strong>{count}</strong>
                    </div>
                    <div
                      className="if-bar"
                      role="meter"
                      aria-label={t(p)}
                      aria-valuenow={count}
                      aria-valuemin={0}
                      aria-valuemax={Math.max(1, data.length)}
                    >
                      <div
                        style={{
                          width: `${(count / Math.max(1, data.length)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </Panel>
            <Panel
              title="System connections"
              description="Local mock services, not real corporate systems"
            >
              {[
                ['Emlax', health.data?.emlax],
                ['Bitrix24 CRM', health.data?.bitrix24],
                ['1C Finance', health.data?.finance],
              ].map(([name, ok]) => (
                <div key={String(name)} className="if-line">
                  <span>{t(String(name))}</span>
                  <Status
                    value={
                      health.isPending
                        ? 'Checking'
                        : ok
                          ? 'Connected'
                          : 'Unavailable'
                    }
                  />
                </div>
              ))}
              <Button asChild variant="outline" className="mt-3">
                <Link to="/integrations">{t("Integration center")}</Link>
              </Button>
            </Panel>
          </div>
          <Panel title="Quick actions">
            <div className="if-actions">
              <Button asChild variant="outline">
                <Link to="/customers">{t("Add customer")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/claims">{t("Create claim")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/applications">{t("New application")}</Link>
              </Button>
            </div>
          </Panel>
          <Panel title="Recent claims">
            <Table
              headers={['Claim', 'Policy', 'Amount', 'Status']}
              rows={[...c]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((x) => ({
                  id: x.id,
                  cells: [
                    x.id,
                    x.policyId,
                    money(x.amount),
                    <Status value={x.status} />,
                  ],
                }))}
            />
            <Button asChild variant="outline" className="mt-3">
              <Link to="/claims">{t("View all claims")}</Link>
            </Button>
          </Panel>
        </>
      )}
    </>
  )
}
