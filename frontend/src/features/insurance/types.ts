export type Product = 'Motor' | 'Property' | 'Travel' | 'Health'
export type PolicyStatus = 'Active' | 'Expired' | 'Pending'
export type ClaimStatus = 'Pending' | 'In review' | 'Approved' | 'Rejected'
export interface Policy {
  id: string
  customer: string
  type: Product
  premium: number
  status: PolicyStatus
  start: string
  end: string
}
export interface Claim {
  id: string
  policyId: string
  description: string
  amount: number
  status: ClaimStatus
  date: string
}
export interface ClaimInput {
  policyId: string
  description: string
  amount: number
}
export const products: Product[] = ['Motor', 'Property', 'Travel', 'Health']
export const claimStatuses: ClaimStatus[] = [
  'Pending',
  'In review',
  'Approved',
  'Rejected',
]
export const money = (n: number) =>
  new Intl.NumberFormat('en-AZ', {
    style: 'currency',
    currency: 'AZN',
    maximumFractionDigits: 2,
  }).format(n)
export interface Customer {
  id: string
  name: string
  email: string
  source: string
}
