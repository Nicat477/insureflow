export const types = ['Motor', 'Property', 'Travel', 'Health'];
export const claimStatuses = ['Pending', 'In review', 'Approved', 'Rejected'];
export const policyStatuses = ['Active', 'Expired', 'Pending'];
export function validateClaim(input, policies) {
  if (!input || typeof input !== 'object') return 'Invalid request.';
  if (!policies.some((p) => p.id === input.policyId && p.status === 'Active'))
    return 'Select an active policy.';
  if (
    typeof input.description !== 'string' ||
    input.description.trim().length < 10 ||
    input.description.length > 500
  )
    return 'Description must be 10–500 characters.';
  if (
    typeof input.amount !== 'number' ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    input.amount > 1000000
  )
    return 'Amount must be between 0 and 1,000,000 AZN (exclusive of zero).';
  return null;
}
export function estimate(type, coverage, months) {
  const rates = { Motor: 0.018, Property: 0.009, Travel: 0.025, Health: 0.035 };
  if (
    !types.includes(type) ||
    !Number.isFinite(coverage) ||
    coverage < 100 ||
    coverage > 1000000 ||
    ![1, 3, 6, 12].includes(months)
  )
    throw new Error('Invalid quote parameters.');
  return (
    Math.round(Math.max(10, (coverage * rates[type] * months) / 12) * 100) / 100
  );
}
export const seed = {
  policies: [
    {
      id: 'POL-1001',
      customer: 'Aylin Mammadova',
      type: 'Motor',
      premium: 320,
      status: 'Active',
      start: '2026-01-10',
      end: '2027-01-10',
    },
    {
      id: 'POL-1002',
      customer: 'Murad Aliyev',
      type: 'Property',
      premium: 480,
      status: 'Active',
      start: '2026-03-12',
      end: '2027-03-12',
    },
    {
      id: 'POL-1003',
      customer: 'Leyla Hasanli',
      type: 'Travel',
      premium: 65,
      status: 'Expired',
      start: '2026-08-01',
      end: '2026-09-01',
    },
    {
      id: 'POL-1004',
      customer: 'Kamran Valiyev',
      type: 'Health',
      premium: 620,
      status: 'Active',
      start: '2026-06-20',
      end: '2027-06-20',
    },
    {
      id: 'POL-1005',
      customer: 'Nigar Rahimli',
      type: 'Motor',
      premium: 290,
      status: 'Pending',
      start: '2026-12-01',
      end: '2027-12-01',
    },
    {
      id: 'POL-1006',
      customer: 'Orkhan Karimov',
      type: 'Property',
      premium: 410,
      status: 'Active',
      start: '2026-10-05',
      end: '2027-10-05',
    },
  ],
  claims: [
    {
      id: 'CLM-2001',
      policyId: 'POL-1001',
      description: 'Vehicle repair reimbursement',
      amount: 850,
      status: 'In review',
      date: '2026-11-20',
    },
    {
      id: 'CLM-2002',
      policyId: 'POL-1002',
      description: 'Home water damage claim',
      amount: 1400,
      status: 'Pending',
      date: '2026-11-23',
    },
    {
      id: 'CLM-2003',
      policyId: 'POL-1004',
      description: 'Medical treatment reimbursement',
      amount: 275,
      status: 'Approved',
      date: '2026-11-15',
    },
  ],
};
