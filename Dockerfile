# Multi-stage Dockerfile for Next.js app in ./ow subfolder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY ow/package*.json ./ow/
WORKDIR /app/ow
RUN npm ci

# Copy application source
COPY ow/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app/ow

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000

# Copy node_modules and built app
COPY --from=builder /app/ow/node_modules ./node_modules
COPY --from=builder /app/ow/.next ./.next
COPY --from=builder /app/ow/public ./public
COPY --from=builder /app/ow/package*.json ./
COPY --from=builder /app/ow/prisma ./prisma

# Expose port
EXPOSE 10000

# Start Next.js
CMD ["npm", "start", "--", "-p", "10000"]

