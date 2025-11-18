# Dockerfile for Opticwise CRM - builds Next.js app from ./ow subdirectory
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app/ow
COPY ow/package.json ow/package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app/ow
COPY --from=deps /app/ow/node_modules ./node_modules
COPY ow/ ./

# Generate Prisma Client (no DB connection needed at build time)
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app/ow

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/ow/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/ow/.next ./.next
COPY --from=builder /app/ow/node_modules ./node_modules
COPY --from=builder /app/ow/package.json ./package.json
COPY --from=builder /app/ow/prisma ./prisma

USER nextjs

EXPOSE 10000

CMD ["npm", "start"]
