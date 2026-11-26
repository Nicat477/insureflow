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
  return (
    <header className="if-heading">
      <div>
        <p className="if-eyebrow">INSUREFLOW / OPERATIONS</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
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
  return (
    <section className="if-panel">
      <h2>{title}</h2>
      {description && <p className="if-muted mb-4">{description}</p>}
      {children}
    </section>
  )
}
export function Status({ value }: { value: string }) {
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
  return <span className={'if-status ' + tone}>{value}</span>
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
  return rows.length ? (
    <div className="if-table-wrap">
      <table className="if-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th scope="col" key={h}>
                {h}
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
    <p className="if-empty">{empty}</p>
  )
}
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="if-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="if-error">
      {error instanceof Error
        ? error.message
        : 'Something went wrong. Please retry.'}
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
  return loading ? (
    <p role="status" className="if-empty">
      Loading records…
    </p>
  ) : error ? (
    <div className="if-panel">
      <ErrorMessage error={error} />
      <Button variant="outline" onClick={retry}>
        <RefreshCw /> Retry
      </Button>
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
export function useAction<T, V>(fn: (value: V) => Promise<T>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  })
}
