# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
ENV CI=true

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/reporter/package.json packages/reporter/package.json
COPY packages/cli/package.json packages/cli/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json
COPY examples/demo-api/package.json examples/demo-api/package.json

RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000
ENV SECUREAPI_DEMO_MODE=fixed
ENV USER_TOKEN=demo-user-token
ENV MANAGER_TOKEN=demo-manager-token
ENV ADMIN_TOKEN=demo-admin-token
ENV REVOKED_TOKEN=demo-revoked-token
ENV EXPIRED_TOKEN=demo-expired-token
ENV WEBHOOK_SECRET=demo-local-webhook-secret

COPY --from=build /app /app

EXPOSE 3000 5173

CMD ["npm", "run", "secureapi:score"]
