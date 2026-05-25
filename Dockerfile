# ── Stage 1: install all dependencies (needed for build) ─────────────────────
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: build the app ────────────────────────────────────────────────────
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Produces the Nitro server bundle in .output/
RUN pnpm build

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Self-contained Nitro server bundle — no node_modules needed at runtime
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
