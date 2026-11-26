import { request } from './api'
export interface Property {
  id: string
  unit: string
  customer: string
  value: number
  status: 'Reserved' | 'Available'
}
export interface Application {
  id: string
  propertyId: string
  unit: string
  customer: string
  coverage: number
  premiumMinor: number
  crm: 'Pending' | 'Synced' | 'Failed'
  crmId?: string
  status: 'Awaiting payment' | 'Paid' | 'Policy issued'
  payment: 'Unmatched' | 'Matched' | 'Needs review'
  policyId?: string
  createdAt: string
}
export interface OutboxJob {
  id: string
  applicationId: string
  status: 'Pending' | 'Synced' | 'Failed'
  attempts: number
  error: string
  updatedAt: string
}
export interface IntegrationData {
  properties: Property[]
  applications: Application[]
  outbox: OutboxJob[]
  emlaxError: string
}
export interface Payment {
  id: string
  reference: string
  amountMinor: number
  currency: string
}
export interface Deal {
  id: string
  applicationId: string
  customer: string
  unit: string
  premiumMinor: number
}
export type Action =
  | 'sync'
  | 'payment'
  | 'reconcile'
  | 'issue'
  | 'reset-payment'
export const integrations = {
  load: () => request<IntegrationData>('/integrations'),
  health: () =>
    request<{ emlax: boolean; bitrix24: boolean; finance: boolean }>(
      '/integrations/status',
    ),
  payments: () => request<Payment[]>('/integrations/payments'),
  deals: () => request<Deal[]>('/integrations/deals'),
  create: (id: string, key: string) =>
    request<Application>('/integrations/applications', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ propertyId: id }),
    }),
  action: (id: string, action: Action, data: object = {}) =>
    request<unknown>(
      '/integrations/applications/' + encodeURIComponent(id) + '/' + action,
      { method: 'POST', body: JSON.stringify(data) },
    ),
}
