FROM node:lts-alpine3.22

WORKDIR /src

COPY package*.json /

RUN npm install

COPY . .

CMD ["npm", "start"]

