FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start:backend"]
