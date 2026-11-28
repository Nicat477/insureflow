FROM node:24-bookworm-slim AS build
WORKDIR /app/frontend
RUN npm install --global pnpm@12.23.0
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTED_DEMO=1 STATIC_DIR=/app/frontend/dist DATA_DIR=/tmp/insureflow PORT=10000 MOCK_EPHEMERAL=1
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend
COPY backend/ ./backend/
COPY --from=build /app/frontend/dist ./frontend/dist
USER node
EXPOSE 10000
CMD ["node", "backend/server/index.mjs"]
