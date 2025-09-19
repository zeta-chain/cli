FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx -y @smithery/cli build -o .smithery/index.cjs