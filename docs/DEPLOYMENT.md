# Hosted demo on Render

## Prerequisites

A GitHub repository containing this project, a Render account meeting the platform's terms (Render's privacy policy excludes users under 16), and an approved deployment. Do not add billing details or upgrade a plan just to publish this demo. If not eligible, keep the local project and GitHub source as the portfolio deliverable.

1. Push the project root to GitHub. Keep credentials, runtime data and dependencies out of the repository.
2. In the Render dashboard, choose **New → Blueprint**, connect the repository and use the root `render.yaml`. Review the configuration; it declares a free Docker web service with health check `/api/health` and generates `DEMO_PASSWORD`.
3. Apply the Blueprint only if the service is on the Free plan and no unexpected charges are shown. Docker builds the React frontend and starts the Node server with its local mock services. The built app and API use the same HTTPS origin.
4. Open the assigned URL once deployment succeeds. The browser prompts for username `demo` and the value of `DEMO_PASSWORD` from the service's Environment settings. Share this demo-only password privately, not in GitHub, screenshots or a public README. Never reuse a personal password.
5. Verify `/api/health`, Dashboard, refreshing `/customers`, the calculator, and the application-to-policy workflow. Use fictional data only.

The access gate is a shared password, not a real account system. The free instance may sleep after inactivity and lose runtime JSON data on restart, sleep or redeploy. Do not store real information. Only invite trusted reviewers. Rotate the demo password when appropriate or disable the service when no longer needed.

References: https://render.com/docs/blueprint-spec ; https://render.com/docs/free ; https://render.com/docs/docker

## Optional PostgreSQL persistence

For a shared, persistent fictional demo database, follow [POSTGRESQL.md](POSTGRESQL.md). The default JSON mode still uses temporary Render storage.
