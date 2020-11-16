FROM node:dubnium AS build
LABEL stage="BuildApp"
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn global add @nestjs/cli
RUN nest build notification
RUN rm -rf ./node_modules

FROM node:dubnium
WORKDIR /app
COPY --from=build ./app/dist/apps/notification ./dist
COPY package.json yarn.lock ./
RUN yarn install --production
CMD ["node", "dist/main.js"]
