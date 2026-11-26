import type {
  Policy,
  Claim,
  ClaimInput,
  ClaimStatus,
  Product,
  Customer,
} from './types'
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch('/api' + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    throw new Error('Cannot reach InsureFlow. Check the backend and try again.')
  }
  if (!response.ok) {
    let message = 'Request failed. Please retry.'
    try {
      message = (await response.json()).message || message
    } catch {
      /* non-JSON error */
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}
const post = (body: object): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
})
export const api = {
  policies: () => request<Policy[]>('/policies'),
  claims: () => request<Claim[]>('/claims'),
  customers: () => request<Customer[]>('/customers'),
  createCustomer: (name: string, email: string) =>
    request<Customer>('/customers', post({ name, email })),
  createClaim: (data: ClaimInput) => request<Claim>('/claims', post(data)),
  updateClaim: (id: string, status: ClaimStatus) =>
    request<Claim>('/claims/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  quote: (type: Product, coverage: number, months: number) =>
    request<{ premium: number; currency: string; illustrative: boolean }>(
      '/quotes',
      post({ type, coverage, months }),
    ),
}
