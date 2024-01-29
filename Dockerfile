# Set the base image to use for subsequent instructions
FROM node:lts-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn all

ENTRYPOINT ["node", "/usr/src/app/dist/index.js"]
