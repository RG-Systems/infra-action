FROM node:lts-alpine

# Copy package.json and install dependencies
COPY package*.json ./

RUN yarn install --frozen-lockfile

# Copy the rest of your action's code
COPY . .

# Run entrypoint.sh when the container launches
ENTRYPOINT ["./entrypoint.sh"]
