FROM node:lts-alpine3.22

WORKDIR /api

COPY package*.json /

RUN npm install

COPY . .

CMD ["npm", "start"]

