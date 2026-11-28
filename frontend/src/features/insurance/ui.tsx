import { Link } from '@tanstack/react-router'
import { useLocale, currentText } from '@/i18n/locale'
import { toast } from 'sonner'
import type { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
export function Heading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  const { t } = useLocale()
  return (
    <>
      {title === 'Dashboard' && (
        <section className="if-dashboard-hero" aria-label={t('Baku skyline dashboard banner')}>
          <div className="if-dashboard-hero__overlay">
            <span className="if-dashboard-hero__eyebrow">{t('Digital insurance portal')}</span>
            <h2>{t('Insurance, made simpler.')}</h2>
            <p>{t('Quotes, policies, claims and payments from a single workspace.')}</p>
            <div className="if-actions"><Button asChild><Link to="/applications">{t('New application')}</Link></Button></div>
          </div>
        </section>
      )}
      <header className="if-heading">
      <div>
        <p className="if-eyebrow">{t("INSUREFLOW / OPERATIONS")}</p>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {action}
    </header>
    </>
  )
}
export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const { t } = useLocale()
  return (
    <section className="if-panel">
      <h2>{t(title)}</h2>
      {description && <p className="if-muted mb-4">{t(description)}</p>}
      {children}
    </section>
  )
}
export function Status({ value }: { value: string }) {
  const { t } = useLocale()
  const tone = [
    'Active',
    'Approved',
    'Synced',
    'Paid',
    'Policy issued',
    'Matched',
    'Connected',
    'Reserved',
  ].includes(value)
    ? 'good'
    : ['Failed', 'Rejected', 'Needs review', 'Unavailable'].includes(value)
      ? 'bad'
      : ['Pending', 'Awaiting payment', 'In review', 'Unmatched'].includes(
            value,
          )
        ? 'wait'
        : 'neutral'
  return <span className={'if-status ' + tone}>{t(value)}</span>
}
export function Table({
  headers,
  rows,
  empty = 'No records found.',
}: {
  headers: string[]
  rows: { id: string; cells: ReactNode[] }[]
  empty?: string
}) {
  const { t } = useLocale()
  return rows.length ? (
    <div className="if-table-wrap">
      <table className="if-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h}>
                {t(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {r.cells.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="if-empty">{t(empty)}</p>
  )
}
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const { t } = useLocale()
  return (
    <label className="if-field">
      <span>{t(label)}</span>
      {children}
    </label>
  )
}
export function ErrorMessage({ error }: { error: unknown }) {
  const { errorText } = useLocale()
  return error ? (
    <p role="alert" className="if-error">
      {error instanceof Error
        ? errorText(error.message)
        : errorText('Something went wrong. Please retry.')}
    </p>
  ) : null
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: unknown
  retry: () => void
}) {
  const { t } = useLocale()
  return loading ? (
    <div className="if-v6-skeleton" role="status" aria-label={t('Loading records…')}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><p className="sr-only">{t('Loading records…')}</p></div>
  ) : error ? (
    <div className="if-panel">
      <ErrorMessage error={error} />
      <Button variant="outline" onClick={retry}>
        <RefreshCw />{t("Retry")}</Button>
    </div>
  ) : null
}
export function useData<T>(key: string, fn: () => Promise<T>) {
  return useQuery({
    queryKey: ['insurance', key],
    queryFn: fn,
    retry: false,
    staleTime: 0,
  })
}
// Report business outcomes, not just an HTTP 200 response.
function notifyOutcome(result: unknown, variables: unknown, message: string) {
  const data = result && typeof result === 'object' ? result as Record<string, unknown> : {}
  const input = variables && typeof variables === 'object' ? variables as Record<string, unknown> : {}
  const success = (key: string) => toast.success(currentText(key))
  const warn = (key: string) => toast.warning(currentText(key))
  if (message === 'CRM failure simulated. Retry from applications.') {
    if (data.crm === 'Failed') warn(message)
    else toast.info(currentText('CRM response received. Check the current status.'))
    return
  }
  switch (input.action) {
    case 'sync':
      if (data.crm === 'Synced') success('CRM synchronized successfully.')
      else toast.error(currentText('CRM synchronization failed. Please retry.'))
      return
    case 'payment': {
      const scenario = (input.data as { scenario?: string } | undefined)?.scenario
      if (scenario === 'wrong' || scenario === 'duplicate') warn('Test payment created. Verify the payment before issuing a policy.')
      else success('Demo payment created successfully.')
      return
    }
    case 'reconcile':
      if (data.payment === 'Matched') success('Payment matched successfully.')
      else if (data.payment === 'Needs review') warn('Payment requires review. Check the amount or duplicates.')
      else warn('No matching payment found.')
      return
    case 'issue':
      if (data.status === 'Policy issued') success('Policy issued successfully.')
      else toast.info(currentText('Request processed. Check the updated status above.'))
      return
    case 'reset-payment': success('Incorrect demo payment cleared.'); return
    default: success(message)
  }
}
export function useAction<T, V>(fn: (value: V) => Promise<T>, message = 'Operation completed successfully.') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, variables) => {
      notifyOutcome(data, variables, message)
      return qc.invalidateQueries({ queryKey: ['insurance'] })
    },
  })
}
