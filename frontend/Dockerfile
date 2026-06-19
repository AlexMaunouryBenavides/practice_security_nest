# STAGE 1--- build stage ---
FROM node:lts-alpine3.22 AS builder

WORKDIR /frontend

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- STAGE 2 (static files via nginx) ---
FROM nginx:alpine as production

COPY --from=builder /frontend/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
