FROM node:lts-alpine3.22

ENV NODE_ENV=production

WORKDIR /api

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Créer un utilisateur non-root
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

CMD ["npm", "start"]

