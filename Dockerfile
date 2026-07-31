# syntax=docker/dockerfile:1

# AuricleHealth prototype — SPA + API in one image.
#
# Multi-stage so the runtime layer carries no toolchain, no dev dependencies, and
# no source: just node_modules for production, the built assets, and server/.
#
# NOTHING SECRET IS BAKED IN. No ARG or ENV here carries a credential, and the
# build never reads .env. Every secret arrives at `docker run` time as an
# environment variable. Baking one into a layer would publish it to GHCR, and
# image layers are permanent and world-readable for a public package.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so the dependency layer caches independently of source.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Fail the image if the checks or tests fail. A container that builds but whose
# tests were red is worse than a failed build — it looks deployable.
RUN npm run check && npm test && npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Production dependencies only. livekit-server-sdk and @anthropic-ai/sdk are
# needed at runtime for token signing and the model calls; vite and the React
# packages are build-time only and are excluded by --omit=dev.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
# server/api.js imports the three prompt modules, so those ship. Nothing else
# from src/ is reachable from server/prod.js — the rest is compiled into dist/.
# Verified by tracing the import graph, not assumed.
COPY --from=build /app/src/prompts ./src/prompts

# Run unprivileged. The node image ships a `node` user; use it rather than root.
USER node

EXPOSE 8080

# Hits the app's own readiness endpoint, which reports whether the static build
# and each credential are present.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/prod.js"]
