FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY apps/api/package.json ./
COPY apps/api/prisma ./prisma
RUN npm install --ignore-scripts

COPY apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src
RUN npx prisma generate && npx nest build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
