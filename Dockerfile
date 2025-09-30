FROM node:24

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate

CMD ["npm", "start"]
