# Architecture and API

## Request flow

The React frontend uses relative `/api` requests, TanStack Query for fetched data and reusable UI components. The Vite development proxy forwards to the local Node server. Hosted mode serves the compiled SPA and API on one origin; the mock services stay bound to loopback. The API serializes operations and commits JSON snapshots by writing a temporary file and renaming it. This is a single-process demo, not a transactional production datastore.

## Main endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API readiness |
| GET / POST | `/api/customers` | List/create fictional customer |
| GET | `/api/policies` | List policies |
| GET / POST | `/api/claims` | List/create claims |
| PATCH | `/api/claims/:id` | Update claim status |
| POST | `/api/quotes` | Illustrative premium estimate |
| GET | `/api/integrations` | Properties, applications, retry jobs |
| GET | `/api/integrations/status` | Three mock service health checks |
| GET | `/api/integrations/deals` | CRM records |
| GET | `/api/integrations/payments` | Finance records |
| POST | `/api/integrations/applications` | Create application for reserved property; supports Idempotency-Key |
| POST | `/api/integrations/applications/:id/sync` | CRM sync or simulated failure |
| POST | `/api/integrations/applications/:id/payment` | Simulate payment |
| POST | `/api/integrations/applications/:id/reconcile` | Match payment |
| POST | `/api/integrations/applications/:id/reset-payment` | Clear incorrect simulated payment |
| POST | `/api/integrations/applications/:id/issue` | Issue policy when conditions are met |

JSON bodies are required for writes. Errors use a JSON `message`. The server validates inputs and checks allowed browser origins. Hosted mode additionally requires a shared access password except for the health endpoint. This is not a substitute for individual authentication or authorization.

## Testing and data

Automated tests exercise input validation, duplicate prevention, CRM retry, payment matching, policy issuance, restart persistence and hosted access controls. To reset local demo data, stop the backend and remove only `backend/server/data.json`, `mock-crm.json` and `mock-finance.json` if present. Tests use temporary directories and ephemeral ports. The mock services do not contact real vendors.
