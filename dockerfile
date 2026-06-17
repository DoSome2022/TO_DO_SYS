FROM node:22-alpine

WORKDIR /src/app

COPY package.json ./

RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retries 5

RUN npm install

COPY . .


RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD [ "npm", "start" ]
