FROM node:lts-alpine

WORKDIR /usr/src

COPY package*.json .

RUN yarn install --frozen-lockfile

COPY . .

COPY entrypoint.sh .

ENTRYPOINT ["/usr/src/entrypoint.sh"]
