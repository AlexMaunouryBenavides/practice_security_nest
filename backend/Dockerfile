# Stage 1: Build the application
FROM node:lts-alpine3.22 AS builder

WORKDIR /backend

COPY package*.json ./

RUN npm ci 

COPY . .

# Créer un utilisateur non-root
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

RUN npm run build

# Stage 2: Create a smaller image for production
FROM node:lts-alpine3.22

ENV NODE_ENV=production

WORKDIR /backend

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]


