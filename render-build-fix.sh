#!/bin/bash
# Render build fix for Node 22.16.0 npm issue

cd ow

# Use npx to run npm commands as a workaround
npx --yes npm@latest ci --include=dev
npx --yes prisma generate
npx --yes npm@latest run build
