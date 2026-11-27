import { useLocale } from '@/i18n/locale'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { api } from './api'
import { integrations } from './integrationApi'
import type { Action, Application } from './integrationApi'
import { products, claimStatuses } from './types'
import type { Product, ClaimStatus } from './types'
import {
  Heading,
  Panel,
  Table,
  Status,
  Field,
  ErrorMessage,
  QueryState,
  useData,
  useAction,
} from './ui'

export function Customers() {
  const { t } = useLocale()
  const q = useData('customers', api.customers),
    [search, setSearch] = useState(''),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [open, setOpen] = useState(false)
  const add = useAction((v: { name: string; email: string }) =>
    api.createCustomer(v.name, v.email),
  )
  return (
    <>
      <Heading
        title="Customers"
        description="View customer records and add fictional demo contacts."
        action={
          <Button onClick={() => setOpen(!open)}>
            {open ? t("Close form") : t("+ Add customer")}
          </Button>
        }
      />
      {open && (
        <Panel title="New customer">
          <form
            className="if-form"
            onSubmit={(e) => {
              e.preventDefault()
              add.mutate(
                { name, email },
                {
                  onSuccess: () => {
                    setName('')
                    setEmail('')
                    setOpen(false)
                  },
                },
              )
            }}
          >
            <div className="if-form-row">
              <Field label="Full name">
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  type="email"
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <ErrorMessage error={add.error} />
            <div>
              <Button disabled={add.isPending} type="submit">
                {add.isPending ? t("Saving…") : t("Save customer")}
              </Button>
            </div>
          </form>
        </Panel>
      )}
      {add.isSuccess && (
        <p role="status" className="if-notice">{t("Customer saved.")}</p>
      )}
      <Panel title="Customer directory">
        <div className="if-toolbar">
          <input
            className="if-search"
            aria-label={t("Search customers")}
            placeholder={t("Search customers…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <QueryState
          loading={q.isPending}
          error={q.error}
          retry={() => void q.refetch()}
        />
        {q.data && (
          <Table
            headers={['Name', 'Email', 'Source']}
            rows={q.data
              .filter((c) =>
                [c.name, c.email]
                  .join(' ')
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase()),
              )
              .map((c) => ({
                id: c.id,
                cells: [c.name, c.email || '—', t(c.source)],
              }))}
          />
        )}
      </Panel>
    </>
  )
}
const insuranceTabs = [
  ['/policies', 'Policies'],
  ['/calculator', 'Calculator'],
  ['/applications', 'Applications'],
  ['/properties', 'Properties'],
] as const
export type InsuranceTab = (typeof insuranceTabs)[number][0]
export function InsuranceWorkspace({ tab }: { tab: InsuranceTab }) {
  const { t } = useLocale()
  return (
    <>
      <Heading
        title="Insurance"
        description="Manage policies, calculate premiums and issue property insurance."
      />
      <nav aria-label={t("Insurance sections")} className="if-tabs">
        {insuranceTabs.map(([path, label]) => (
          <Link
            key={path}
            to={path}
            aria-current={tab === path ? 'page' : undefined}
            className="if-tab"
          >
            {t(label)}
          </Link>
        ))}
      </nav>
      {tab === '/policies' ? (
        <Policies />
      ) : tab === '/calculator' ? (
        <Calculator />
      ) : tab === '/properties' ? (
        <Properties />
      ) : (
        <Applications />
      )}
    </>
  )
}
function Policies() {
  const { t, money, date } = useLocale()
  const q = useData('policies', api.policies),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('All')
  return (
    <Panel
      title="Policies"
      description="All issued and existing demo insurance records."
    >
      <div className="if-toolbar">
        <input
          className="if-search"
          aria-label={t("Search policies")}
          placeholder={t("Search policy, customer or product…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="if-select max-w-40"
          aria-label={t("Filter policy status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {['All', 'Active', 'Pending', 'Expired'].map((s) => (
            <option key={s} value={s}>{t(s)}</option>
          ))}
        </select>
        <Button asChild variant="outline">
          <Link to="/applications">{t("New application")}</Link>
        </Button>
      </div>
      <QueryState
        loading={q.isPending}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {q.data && (
        <Table
          headers={[
            'Policy',
            'Customer',
            'Product',
            'Premium',
            'Period',
            'Status',
          ]}
          rows={q.data
            .filter(
              (p) =>
                (status === 'All' || p.status === status) &&
                [p.id, p.customer, p.type, t(p.type)]
                  .join(' ')
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase()),
            )
            .map((p) => ({
              id: p.id,
              cells: [
                p.id,
                p.customer,
                t(p.type),
                money(p.premium),
                `${date(p.start)} – ${date(p.end)}`,
                <Status value={p.status} />,
              ],
            }))}
        />
      )}
    </Panel>
  )
}
function Calculator() {
  const { t, money, months: monthLabel } = useLocale()
  const [type, setType] = useState<Product>('Property'),
    [coverage, setCoverage] = useState('100000'),
    [months, setMonths] = useState('12')
  const quote = useAction(
    (v: { type: Product; coverage: number; months: number }) =>
      api.quote(v.type, v.coverage, v.months),
  )
  return (
    <div className="if-grid">
      <Panel
        title="Premium calculator"
        description="Estimate a premium with three simple fields."
      >
        <form
          className="if-form"
          onSubmit={(e) => {
            e.preventDefault()
            quote.mutate({
              type,
              coverage: Number(coverage),
              months: Number(months),
            })
          }}
        >
          <Field label="Insurance product">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as Product)
                quote.reset()
              }}
            >
              {products.map((p) => (
                <option key={p} value={p}>{t(p)}</option>
              ))}
            </select>
          </Field>
          <Field label="Coverage amount (AZN)">
            <input
              type="number"
              min={100}
              max={1000000}
              step="0.01"
              required
              value={coverage}
              onChange={(e) => {
                setCoverage(e.target.value)
                quote.reset()
              }}
            />
          </Field>
          <Field label="Coverage period">
            <select
              value={months}
              onChange={(e) => {
                setMonths(e.target.value)
                quote.reset()
              }}
            >
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </Field>
          <ErrorMessage error={quote.error} />
          <Button disabled={quote.isPending} type="submit">
            {quote.isPending ? t("Calculating…") : t("Calculate premium")}
          </Button>
        </form>
      </Panel>
      <Panel title="Estimated premium">
        <p className="if-muted">{t("Illustrative pricing only, not an official insurance quote.")}</p>
        <p className="if-amount my-5" aria-live="polite">
          {quote.data ? money(quote.data.premium) : '—'}
        </p>
        <p className="if-muted mb-4">{t("Property reservations can be turned into applications through the Emlax demo.")}</p>
        <Button asChild variant="outline">
          <Link to="/applications">{t("Go to applications")}</Link>
        </Button>
      </Panel>
    </div>
  )
}
function Properties() {
  const { t, money } = useLocale()
  const q = useData('integrations', integrations.load)
  return (
    <Panel
      title="Property reservations"
      description="Read-only reservations from the simulated Emlax API."
    >
      <QueryState
        loading={q.isPending}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {q.data && (
        <>
          {q.data.emlaxError && (
            <ErrorMessage error={new Error(q.data.emlaxError)} />
          )}
          <Table
            headers={['Property', 'Customer', 'Value', 'Status']}
            rows={q.data.properties.map((p) => ({
              id: p.id,
              cells: [
                p.unit,
                p.customer,
                money(p.value),
                <Status value={p.status} />,
              ],
            }))}
          />
          <Button asChild className="mt-4">
            <Link to="/applications">{t("Create insurance application")}</Link>
          </Button>
        </>
      )}
    </Panel>
  )
}
function Applications() {
  const { t, money } = useLocale()
  const q = useData('integrations', integrations.load),
    [property, setProperty] = useState(''),
    [key, setKey] = useState(() => crypto.randomUUID()),
    [selected, setSelected] = useState(''),
    [scenario, setScenario] = useState('exact')
  const create = useAction((v: { property: string; key: string }) =>
      integrations.create(v.property, v.key),
    ),
    act = useAction((v: { id: string; action: Action; data?: object }) =>
      integrations.action(v.id, v.action, v.data),
    )
  const a =
      q.data?.applications.find((x) => x.id === selected) ??
      q.data?.applications[0],
    available =
      q.data?.properties.filter(
        (p) =>
          p.status === 'Reserved' &&
          !q.data?.applications.some((x) => x.propertyId === p.id),
      ) ?? []
  const action = (app: Application, action: Action, data?: object) =>
    act.mutate({ id: app.id, action, data })
  return (
    <>
      <QueryState
        loading={q.isPending}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {q.data && (
        <>
          <Panel
            title="New property insurance"
            description="Choose an Emlax reservation. The application and premium are created automatically."
          >
            {q.data.emlaxError && (
              <ErrorMessage error={new Error(q.data.emlaxError)} />
            )}
            <form
              className="if-form"
              onSubmit={(e) => {
                e.preventDefault()
                create.mutate(
                  { property, key },
                  {
                    onSuccess: (app) => {
                      setSelected(app.id)
                      setProperty('')
                      setKey(crypto.randomUUID())
                      act.reset()
                    },
                  },
                )
              }}
            >
              <Field label="Reserved property">
                <select
                  required
                  value={property}
                  onChange={(e) => {
                    setProperty(e.target.value)
                    setKey(crypto.randomUUID())
                  }}
                >
                  <option value="">{t("Select a reservation")}</option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.unit} — {p.customer}
                    </option>
                  ))}
                </select>
              </Field>
              {!available.length && (
                <p className="if-muted">{t("No unused reservations are available.")}</p>
              )}
              <ErrorMessage error={create.error} />
              <div>
                <Button type="submit" disabled={!property || create.isPending}>
                  {create.isPending ? t("Creating…") : t("Create application")}
                </Button>
              </div>
            </form>
          </Panel>
          <Panel title="Applications">
            <Table
              headers={[
                'Application',
                'Customer',
                'Premium',
                'Status',
                'Action',
              ]}
              rows={q.data.applications.map((x) => ({
                id: x.id,
                cells: [
                  x.id,
                  x.customer,
                  money(x.premiumMinor / 100),
                  <Status value={x.status} />,
                  <Button
                    size="sm"
                    variant={a?.id === x.id ? 'secondary' : 'outline'}
                    onClick={() => {
                      setSelected(x.id)
                      act.reset()
                      setScenario('exact')
                    }}
                  >
                    {a?.id === x.id ? t("Selected") : t("View")}
                  </Button>,
                ],
              }))}
              empty="Create a property application to begin."
            />
          </Panel>
          {a && (
            <Panel
              title={`${t('Application')} ${a.id}`}
              description={`${a.customer} · ${a.unit} · ${money(a.premiumMinor / 100)}`}
            >
              <div className="if-card-list">
                <div className="if-step">
                  <div className="flex justify-between gap-2">
                    <h3>{t("1. Sync customer with CRM")}</h3>
                    <Status value={a.crm} />
                  </div>
                  <p>{t("Create a Bitrix24 demo deal. A failed request can safely be retried.")}</p>
                  <div className="if-actions">
                    <Button
                      size="sm"
                      disabled={act.isPending || a.crm === 'Synced'}
                      onClick={() => action(a, 'sync')}
                    >
                      {a.crm === 'Failed' ? t("Retry CRM sync") : t("Sync CRM")}
                    </Button>
                    {a.crmId && <span className="if-muted">{a.crmId}</span>}
                  </div>
                </div>
                <div className="if-step">
                  <div className="flex justify-between gap-2">
                    <h3>{t("2. Match the payment")}</h3>
                    <Status value={a.payment} />
                  </div>
                  <p>{t("Generate a fictional payment, then match its reference and amount.")}</p>
                  <div className="if-actions">
                    <select
                      aria-label={t("Demo payment scenario")}
                      className="if-select max-w-48"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      disabled={a.status !== 'Awaiting payment'}
                    >
                      <option value="exact">{t("Exact amount")}</option>
                      <option value="wrong">{t("Wrong amount (test)")}</option>
                      <option value="duplicate">{t("Duplicate (test)")}</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        act.isPending ||
                        a.status !== 'Awaiting payment' ||
                        a.payment === 'Needs review'
                      }
                      onClick={() => action(a, 'payment', { scenario })}
                    >{t("Generate demo payment")}</Button>
                    <Button
                      size="sm"
                      disabled={
                        act.isPending || a.status !== 'Awaiting payment'
                      }
                      onClick={() => action(a, 'reconcile')}
                    >{t("Match payment")}</Button>
                    {a.payment === 'Needs review' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={act.isPending}
                        onClick={() => action(a, 'reset-payment')}
                      >{t("Clear incorrect demo payment")}</Button>
                    )}
                  </div>
                </div>
                <div className="if-step">
                  <div className="flex justify-between gap-2">
                    <h3>{t("3. Issue policy")}</h3>
                    <Status value={a.status} />
                  </div>
                  <p>{t("Requires a synced CRM record and a matched payment.")}</p>
                  <div className="if-actions">
                    <Button
                      size="sm"
                      disabled={
                        act.isPending ||
                        a.crm !== 'Synced' ||
                        a.status !== 'Paid'
                      }
                      onClick={() => action(a, 'issue')}
                    >{t("Issue policy")}</Button>
                    {a.policyId && (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/policies">{t('View')} {a.policyId}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {act.isPending && (
                <p className="if-muted mt-3" role="status">{t("Processing…")}</p>
              )}
              <ErrorMessage error={act.error} />
              {act.isSuccess && (
                <p className="if-notice mt-3" role="status">{t("Request processed. Check the updated status above.")}</p>
              )}
            </Panel>
          )}
        </>
      )}
    </>
  )
}
export function Claims() {
  const { t, money, date } = useLocale()
  const q = useData('claims', api.claims),
    p = useData('policies', api.policies),
    [open, setOpen] = useState(false),
    [policyId, setPolicyId] = useState(''),
    [amount, setAmount] = useState(''),
    [description, setDescription] = useState(''),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('All')
  const add = useAction(api.createClaim),
    update = useAction((v: { id: string; status: ClaimStatus }) =>
      api.updateClaim(v.id, v.status),
    )
  return (
    <>
      <Heading
        title="Claims"
        description="Submit and track claims for active insurance policies."
        action={
          <Button onClick={() => setOpen(!open)}>
            {open ? t("Close form") : t("+ Create claim")}
          </Button>
        }
      />
      {open && (
        <Panel title="New claim">
          <form
            className="if-form"
            onSubmit={(e) => {
              e.preventDefault()
              add.mutate(
                { policyId, description, amount: Number(amount) },
                {
                  onSuccess: () => {
                    setOpen(false)
                    setPolicyId('')
                    setDescription('')
                    setAmount('')
                  },
                },
              )
            }}
          >
            <QueryState
              loading={p.isPending}
              error={p.error}
              retry={() => void p.refetch()}
            />
            <div className="if-form-row">
              <Field label="Active policy">
                <select
                  required
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                >
                  <option value="">{t("Choose a policy")}</option>
                  {p.data
                    ?.filter((x) => x.status === 'Active')
                    .map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.id} — {x.customer}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Claim amount (AZN)">
                <input
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Description (10–500 characters)">
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <ErrorMessage error={add.error} />
            <div>
              <Button type="submit" disabled={add.isPending || !policyId}>
                {add.isPending ? t("Submitting…") : t("Submit claim")}
              </Button>
            </div>
          </form>
        </Panel>
      )}
      {add.isSuccess && (
        <p className="if-notice" role="status">{t("Claim submitted successfully.")}</p>
      )}
      <Panel title="Claim records">
        <div className="if-toolbar">
          <input
            className="if-search"
            aria-label={t("Search claims")}
            placeholder={t("Search claims…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="if-select max-w-40"
            aria-label={t("Filter claims")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {['All', ...claimStatuses].map((s) => (
              <option key={s} value={s}>{t(s)}</option>
            ))}
          </select>
        </div>
        <QueryState
          loading={q.isPending}
          error={q.error}
          retry={() => void q.refetch()}
        />
        <ErrorMessage error={update.error} />
        {q.data && (
          <Table
            headers={[
              'Claim / policy',
              'Description',
              'Amount',
              'Date',
              'Status',
              'Update status',
            ]}
            rows={q.data
              .filter(
                (x) =>
                  (filter === 'All' || filter === x.status) &&
                  [x.id, x.policyId, x.description]
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
              )
              .map((x) => ({
                id: x.id,
                cells: [
                  <>
                    {x.id}
                    <div className="if-muted">{x.policyId}</div>
                  </>,
                  x.description,
                  money(x.amount),
                  date(x.date),
                  <Status value={x.status} />,
                  <select
                    className="if-select min-w-30"
                    aria-label={`${t('Update status')}: ${x.id}`}
                    value={x.status}
                    disabled={update.isPending}
                    onChange={(e) =>
                      update.mutate({
                        id: x.id,
                        status: e.target.value as ClaimStatus,
                      })
                    }
                  >
                    {claimStatuses.map((s) => (
                      <option key={s} value={s}>{t(s)}</option>
                    ))}
                  </select>,
                ],
              }))}
          />
        )}
      </Panel>
    </>
  )
}
export function Payments() {
  const { t, money } = useLocale()
  const q = useData('payments', integrations.payments),
    a = useData('integrations', integrations.load)
  return (
    <>
      <Heading
        title="Payments"
        description="Review simulated 1C payment records and matching results."
        action={
          <Button asChild>
            <Link to="/applications">{t("Match a payment")}</Link>
          </Button>
        }
      />
      <Panel
        title="Payment history"
        description="Fictional transactions generated through insurance applications."
      >
        <QueryState
          loading={q.isPending || a.isPending}
          error={q.error || a.error}
          retry={() => {
            void q.refetch()
            void a.refetch()
          }}
        />
        {q.data && a.data && (
          <Table
            headers={[
              'Payment',
              'Application',
              'Amount',
              'Currency',
              'Application match',
            ]}
            rows={q.data.map((p) => ({
              id: p.id,
              cells: [
                p.id,
                p.reference,
                money(p.amountMinor / 100),
                p.currency,
                <Status
                  value={
                    a.data?.applications.find((x) => x.id === p.reference)
                      ?.payment ?? 'Unmatched'
                  }
                />,
              ],
            }))}
            empty="No payments yet. Generate a demo payment from an application."
          />
        )}
      </Panel>
    </>
  )
}
export function IntegrationCenter() {
  const { t, money, errorText } = useLocale()
  const h = useData('health', integrations.health),
    q = useData('integrations', integrations.load),
    d = useData('deals', integrations.deals)
  const act = useAction((id: string) =>
    integrations.action(id, 'sync', { simulateFailure: true }),
  )
  return (
    <>
      <Heading
        title="Integrations"
        description="Monitor the three local mock systems from one workspace."
        action={
          <Button
            variant="outline"
            onClick={() => {
              void h.refetch()
              void q.refetch()
              void d.refetch()
            }}
          >{t("Refresh status")}</Button>
        }
      />
      <QueryState
        loading={h.isPending}
        error={h.error}
        retry={() => void h.refetch()}
      />
      <div className="if-grid">
        {(
          [
            {
              name: 'Emlax',
              ok: h.data?.emlax,
              description: 'Property reservations',
              path: '/properties',
            },
            {
              name: 'Bitrix24 CRM',
              ok: h.data?.bitrix24,
              description: 'Customer and deal synchronization',
              path: '/applications',
            },
            {
              name: '1C Finance',
              ok: h.data?.finance,
              description: 'Payment records and reconciliation',
              path: '/payments',
            },
          ] as const
        ).map((s) => (
          <Panel key={s.name} title={s.name}>
            <Status
              value={
                h.isPending ? 'Checking' : s.ok ? 'Connected' : 'Unavailable'
              }
            />
            <p className="if-muted my-3">{t(s.description)} · {t('Local simulation')}</p>
            <Button asChild variant="outline" size="sm">
              <Link to={s.path}>{t("Open workspace")}</Link>
            </Button>
          </Panel>
        ))}
      </div>
      <Panel
        title="CRM delivery history"
        description="Persistent integration events and retry attempts."
      >
        <QueryState
          loading={q.isPending}
          error={q.error}
          retry={() => void q.refetch()}
        />
        <ErrorMessage error={act.error} />
        {q.data && (
          <Table
            headers={['Application', 'Status', 'Attempts', 'Last result']}
            rows={q.data.outbox.map((j) => ({
              id: j.id,
              cells: [
                j.applicationId,
                <Status value={j.status} />,
                j.attempts,
                j.error ? errorText(j.error) : '—',
              ],
            }))}
            empty="No events yet."
          />
        )}
        {q.data?.outbox.some((j) => j.status === 'Failed') && (
          <Button asChild variant="outline" className="mt-3">
            <Link to="/applications">{t("Retry from applications")}</Link>
          </Button>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium">{t("Optional failure simulation")}</summary>
          <p className="if-muted my-2">{t("Demonstrate safe retries by simulating a CRM outage before synchronization.")}</p>
          {q.data?.outbox
            .filter((j) => j.status === 'Pending')
            .map((j) => (
              <Button
                key={j.id}
                variant="outline"
                size="sm"
                disabled={act.isPending}
                className="me-2 mb-2"
                onClick={() => act.mutate(j.applicationId)}
              >
                {t('Simulate failure:')} {j.applicationId}
              </Button>
            ))}
          {!q.data?.outbox.some((j) => j.status === 'Pending') && (
            <p className="if-muted">{t("Create a new application first.")}</p>
          )}
        </details>
      </Panel>
      <Panel title="Synchronized CRM deals">
        <QueryState
          loading={d.isPending}
          error={d.error}
          retry={() => void d.refetch()}
        />
        {d.data && (
          <Table
            headers={['Deal', 'Customer', 'Property', 'Premium']}
            rows={d.data.map((x) => ({
              id: x.id,
              cells: [x.id, x.customer, x.unit, money(x.premiumMinor / 100)],
            }))}
          />
        )}
      </Panel>
    </>
  )
}
